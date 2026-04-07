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
  if (heat >= 5) {
    return "on_fire";
  }

  if (heat >= 2) {
    return "hot";
  }

  if (heat >= 0.5) {
    return "warm";
  }

  return "none";
}

function recentFiresCount(store: StoreShape, ideaId: string, now: number) {
  const cutoff = now - TWENTY_FOUR_HOURS_MS;

  return store.fires.filter((fire) => {
    return fire.ideaId === ideaId && Date.parse(fire.createdAt) >= cutoff;
  }).length;
}

function projectIdea(idea: IdeaRecord): IdeaSummary {
  return {
    id: idea.id,
    idea: idea.idea,
    heat: idea.heat,
    fireState: getFireState(idea.heat),
    createdAt: idea.createdAt
  };
}

function projectIdeaDetail(
  idea: IdeaRecord,
  viewerHasFired: boolean
): IdeaDetail {
  return {
    ...projectIdea(idea),
    details: idea.details,
    viewerHasFired
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
  const sort = input.sort === "new" ? "new" : "hot";
  const page = Math.max(Math.floor(input.page ?? 1), 1);
  const limit = clampLimit(input.limit ?? 30);
  const ordered = [...store.ideas].sort((a, b) => {
    if (sort === "new") {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }

    if (b.heat !== a.heat) {
      return b.heat - a.heat;
    }

    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
  const start = (page - 1) * limit;
  const ideas = ordered.slice(start, start + limit).map(projectIdea);

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

  const viewerHasFired = store.fires.some((fire) => {
    return fire.ideaId === id && fire.userFingerprint === viewerKey;
  });

  return projectIdeaDetail(idea, viewerHasFired);
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

    const existingFire = store.fires.find((fire) => {
      return fire.ideaId === id && fire.userFingerprint === viewerKey;
    });

    if (existingFire) {
      return {
        ok: true,
        status: 200,
        alreadyFired: true,
        fireState: getFireState(idea.heat)
      };
    }

    store.fires.push({
      id: randomUUID(),
      ideaId: id,
      userFingerprint: viewerKey,
      createdAt: nowIso()
    });

    idea.fireCount += 1;
    idea.updatedAt = nowIso();

    const recentCount = recentFiresCount(store, id, Date.now());
    idea.heat = Math.max(idea.heat, Math.log2(1 + recentCount));

    return {
      ok: true,
      status: 200,
      alreadyFired: false,
      fireState: getFireState(idea.heat)
    };
  });
}

export async function recalculateHeat() {
  return withStoreMutation((store) => {
    const now = Date.now();

    for (const idea of store.ideas) {
      const recentCount = recentFiresCount(store, idea.id, now);
      idea.heat = Number((0.3 * idea.heat + Math.log2(1 + recentCount)).toFixed(4));
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

