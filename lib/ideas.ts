import { randomUUID } from "node:crypto";
import { customAlphabet } from "nanoid";
import { isTurnstileConfigured } from "@/lib/env";
import {
  createContentHash,
  getRemoteIp,
  normalizeIdeaContent,
  verifyPostToken,
  verifyTurnstileToken
} from "@/lib/security";
import { readStore, withStoreMutation } from "@/lib/store";
import type {
  CreateIdeaInput,
  CreateIdeaResult,
  FireIdeaResult,
  FireState,
  IdeaDetail,
  IdeaRecord,
  IdeaSummary,
  PostAttemptRecord,
  StoreShape
} from "@/lib/types";

const generateIdeaId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const TEN_MINUTES_MS = 10 * 60 * 1_000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1_000;
const FIRE_COOLDOWN_MS = 6 * 60 * 60 * 1_000;
const ONE_HOUR_MS = 60 * 60 * 1_000;

function clampLimit(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 30;
  }

  return Math.min(Math.max(Math.floor(value), 1), 50);
}

function ensureIdeaLength(idea: string) {
  return idea.trim().length >= 10 && idea.trim().length <= 100;
}

function ensureDetailsLength(details: string | null) {
  if (!details) {
    return true;
  }

  return details.trim().length <= 2_000;
}

function nowIso() {
  return new Date().toISOString();
}

export function getFireState(heat: number): FireState {
  if (heat >= 9) {
    return "wildfire";
  }

  if (heat >= 6) {
    return "blaze";
  }

  if (heat >= 4) {
    return "flame";
  }

  if (heat >= 2.5) {
    return "spark";
  }

  if (heat >= 1.5) {
    return "ember";
  }

  return "none";
}

function calculateLiveHeat(store: StoreShape, ideaId: string, now: number) {
  let heat = 0;

  for (const fire of store.fires) {
    if (fire.ideaId !== ideaId) {
      continue;
    }

    const ageMs = now - Date.parse(fire.createdAt);

    if (ageMs < 0 || ageMs >= TWENTY_FOUR_HOURS_MS) {
      continue;
    }

    heat += 1 - ageMs / TWENTY_FOUR_HOURS_MS;
  }

  return Number(heat.toFixed(4));
}

function projectIdea(idea: IdeaRecord, heat: number): IdeaSummary {
  return {
    id: idea.id,
    idea: idea.idea,
    heat,
    fireState: getFireState(heat),
    createdAt: idea.createdAt
  };
}

function projectIdeaDetail(
  idea: IdeaRecord,
  viewerCanFire: boolean,
  nextFireAt: string | null,
  heat: number
): IdeaDetail {
  return {
    ...projectIdea(idea, heat),
    details: idea.details,
    viewerCanFire,
    nextFireAt
  };
}

function getLatestViewerFire(
  store: StoreShape,
  ideaId: string,
  viewerKey: string
) {
  const matchingFires = store.fires
    .filter((fire) => {
      return fire.ideaId === ideaId && fire.userFingerprint === viewerKey;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return matchingFires[0] ?? null;
}

function getViewerFireAccess(
  store: StoreShape,
  ideaId: string,
  viewerKey: string,
  now: number
) {
  const latestFire = getLatestViewerFire(store, ideaId, viewerKey);

  if (!latestFire) {
    return {
      viewerCanFire: true,
      nextFireAt: null
    };
  }

  const nextFireAtMs = Date.parse(latestFire.createdAt) + FIRE_COOLDOWN_MS;

  if (nextFireAtMs <= now) {
    return {
      viewerCanFire: true,
      nextFireAt: null
    };
  }

  return {
    viewerCanFire: false,
    nextFireAt: new Date(nextFireAtMs).toISOString()
  };
}

function recordAttempt(
  store: StoreShape,
  submitKey: string,
  contentHash: string | null,
  outcome: PostAttemptRecord["outcome"]
) {
  store.postAttempts.push({
    id: randomUUID(),
    submitKey,
    contentHash,
    outcome,
    createdAt: nowIso()
  });
}

function getRecentSuccessfulPosts(store: StoreShape, submitKey: string, windowMs: number) {
  const cutoff = Date.now() - windowMs;

  return store.ideas.filter((idea) => {
    return idea.submitKey === submitKey && Date.parse(idea.createdAt) >= cutoff;
  }).length;
}

function isSuspiciousSubmitter(store: StoreShape, submitKey: string) {
  const cutoff = Date.now() - ONE_HOUR_MS;
  const failedAttempts = store.postAttempts.filter((attempt) => {
    return (
      attempt.submitKey === submitKey &&
      attempt.outcome !== "success" &&
      Date.parse(attempt.createdAt) >= cutoff
    );
  }).length;

  const recentSuccesses = getRecentSuccessfulPosts(store, submitKey, ONE_HOUR_MS);

  return failedAttempts >= 2 || recentSuccesses >= 2;
}

export async function listIdeas(input: {
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const store = await readStore();
  const now = Date.now();
  const sort = input.sort === "new" ? "new" : "hot";
  const page = Math.max(Math.floor(input.page ?? 1), 1);
  const limit = clampLimit(input.limit ?? 30);
  const ideasWithHeat = store.ideas.map((idea) => ({
    idea,
    heat: calculateLiveHeat(store, idea.id, now)
  }));
  const ordered = ideasWithHeat.sort((a, b) => {
    if (sort === "new") {
      return Date.parse(b.idea.createdAt) - Date.parse(a.idea.createdAt);
    }

    if (b.heat !== a.heat) {
      return b.heat - a.heat;
    }

    return Date.parse(b.idea.createdAt) - Date.parse(a.idea.createdAt);
  });
  const start = (page - 1) * limit;
  const ideas = ordered
    .slice(start, start + limit)
    .map(({ idea, heat }) => projectIdea(idea, heat));

  return {
    ideas,
    page,
    hasMore: start + limit < ordered.length
  };
}

export async function getIdeaById(id: string, viewerKey: string) {
  const store = await readStore();
  const idea = store.ideas.find((entry) => entry.id === id);

  if (!idea) {
    return null;
  }

  const now = Date.now();
  const heat = calculateLiveHeat(store, id, now);
  const fireAccess = getViewerFireAccess(store, id, viewerKey, now);

  return projectIdeaDetail(
    idea,
    fireAccess.viewerCanFire,
    fireAccess.nextFireAt,
    heat
  );
}

export async function getPostingContext(submitKey: string) {
  const store = await readStore();

  return {
    requiresChallenge: isTurnstileConfigured() && isSuspiciousSubmitter(store, submitKey)
  };
}

export async function createIdea(
  input: CreateIdeaInput,
  submitKey: string,
  remoteIp: string | null
): Promise<CreateIdeaResult> {
  const idea = input.idea.trim();
  const details = input.details?.trim() || null;
  const website = input.website?.trim() || "";
  const turnstileToken = input.turnstileToken?.trim() || "";

  if (!ensureIdeaLength(idea)) {
    return {
      ok: false,
      status: 400,
      message: "Idea must be between 10 and 100 characters."
    };
  }

  if (!ensureDetailsLength(details)) {
    return {
      ok: false,
      status: 400,
      message: "Details must be 2000 characters or fewer."
    };
  }

  const contentHash = createContentHash({ idea, details });
  const tokenCheck = verifyPostToken(input.postToken);

  return withStoreMutation(async (store) => {
    if (website) {
      recordAttempt(store, submitKey, contentHash, "honeypot");
      return {
        ok: false,
        status: 400,
        message: "Invalid submission."
      };
    }

    if (!tokenCheck.ok) {
      recordAttempt(store, submitKey, contentHash, tokenCheck.reason);

      return {
        ok: false,
        status: 400,
        message:
          tokenCheck.reason === "too_fast"
            ? "Take a second before posting."
            : tokenCheck.reason === "expired_token"
              ? "Form expired. Refresh and try again."
              : "Invalid post token."
      };
    }

    const inTenMinutes = getRecentSuccessfulPosts(store, submitKey, TEN_MINUTES_MS);
    const inOneDay = getRecentSuccessfulPosts(store, submitKey, TWENTY_FOUR_HOURS_MS);

    if (inTenMinutes >= 3 || inOneDay >= 10) {
      recordAttempt(store, submitKey, contentHash, "rate_limited");
      return {
        ok: false,
        status: 429,
        message: "Posting rate limit reached. Try again later."
      };
    }

    const duplicate = store.ideas.some((existing) => existing.contentHash === contentHash);

    if (duplicate) {
      recordAttempt(store, submitKey, contentHash, "duplicate");
      return {
        ok: false,
        status: 400,
        message: "That idea has already been posted."
      };
    }

    const needsChallenge = isTurnstileConfigured() && isSuspiciousSubmitter(store, submitKey);

    if (needsChallenge) {
      if (!turnstileToken) {
        recordAttempt(store, submitKey, contentHash, "challenge_required");
        return {
          ok: false,
          status: 400,
          message: "Complete the anti-bot check and try again.",
          challengeRequired: true
        };
      }

      const verified = await verifyTurnstileToken(turnstileToken, remoteIp);

      if (!verified) {
        recordAttempt(store, submitKey, contentHash, "challenge_failed");
        return {
          ok: false,
          status: 400,
          message: "Anti-bot check failed. Try again.",
          challengeRequired: true
        };
      }
    }

    const id = generateIdeaId();
    const timestamp = nowIso();

    store.ideas.push({
      id,
      idea,
      details,
      heat: 0,
      fireCount: 0,
      submitKey,
      contentHash,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    recordAttempt(store, submitKey, contentHash, "success");

    return {
      ok: true,
      status: 201,
      id
    };
  });
}

export async function fireIdea(id: string, viewerKey: string): Promise<FireIdeaResult> {
  return withStoreMutation((store) => {
    const idea = store.ideas.find((entry) => entry.id === id);

    if (!idea) {
      return {
        ok: false,
        status: 404
      };
    }

    const now = Date.now();
    const fireAccess = getViewerFireAccess(store, id, viewerKey, now);

    if (!fireAccess.viewerCanFire) {
      const heat = calculateLiveHeat(store, id, now);
      idea.heat = heat;

      return {
        ok: true,
        status: 200,
        cooldownActive: true,
        fireState: getFireState(heat),
        nextFireAt: fireAccess.nextFireAt
      };
    }

    const nextFireAt = new Date(now + FIRE_COOLDOWN_MS).toISOString();

    store.fires.push({
      id: randomUUID(),
      ideaId: id,
      userFingerprint: viewerKey,
      createdAt: nowIso()
    });

    idea.fireCount += 1;
    idea.updatedAt = nowIso();
    idea.heat = calculateLiveHeat(store, id, now);

    return {
      ok: true,
      status: 200,
      cooldownActive: false,
      fireState: getFireState(idea.heat),
      nextFireAt
    };
  });
}

export async function recalculateHeat() {
  return withStoreMutation((store) => {
    const now = Date.now();

    for (const idea of store.ideas) {
      idea.heat = calculateLiveHeat(store, idea.id, now);
      idea.updatedAt = nowIso();
    }

    return {
      updated: store.ideas.length
    };
  });
}

export function getCreateIdeaInput(payload: Record<string, FormDataEntryValue | null>) {
  const idea = String(payload.idea ?? "");
  const details = payload.details ? String(payload.details) : null;
  const postToken = String(payload.post_token ?? payload.postToken ?? "");
  const website = payload.website ? String(payload.website) : null;
  const turnstileToken =
    (payload.turnstile_token && String(payload.turnstile_token)) ||
    (payload["cf-turnstile-response"] &&
      String(payload["cf-turnstile-response"])) ||
    null;

  return {
    idea,
    details,
    postToken,
    website,
    turnstileToken
  };
}

export function getRemoteIpFromHeaders(headers: Headers) {
  return getRemoteIp(headers);
}

export function getIdeaSort(sortValue: string | null) {
  return sortValue === "new" ? "new" : "hot";
}

export function getIdeaPagination(value: string | null, fallback: number) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(Math.floor(numeric), 1);
}

export function getNormalizedIdeaContent(input: { idea: string; details?: string | null }) {
  return normalizeIdeaContent(input);
}
