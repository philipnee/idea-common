import { randomUUID } from "node:crypto";
import { customAlphabet } from "nanoid";
import { appConfig } from "@/lib/config";
import { isTurnstileConfigured } from "@/lib/env";
import { extractIdeaExcerpt } from "@/lib/format";
import { verifyIdeaInput } from "@/lib/idea-verification";
import { tagIdeaById } from "@/lib/tagging";
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
  FireLevel,
  IdeaDetail,
  IdeaRecord,
  IdeaSort,
  IdeaSummary,
  PostAttemptRecord,
  StoreShape
} from "@/lib/types";

const generateIdeaId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const TEN_MINUTES_MS = 10 * 60 * 1_000;
const ONE_HOUR_MS = 60 * 60 * 1_000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const FIRE_COOLDOWN_MS = appConfig.fire.refireCooldownHours * ONE_HOUR_MS;
const DAILY_CARRY_FACTOR = appConfig.heat.dailyCarryFactor;
const VIEW_WEIGHT = appConfig.heat.viewWeight;
const FIRE_STARTER_COUNT = appConfig.heat.fireStarterCount;

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

function normalizeExternalLink(externalLink: string | null) {
  if (!externalLink) {
    return null;
  }

  try {
    const url = new URL(externalLink.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function roundHeat(value: number) {
  return Number(value.toFixed(4));
}

function getDayKey(value: string | number | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDayKey(dayKey: string, days = 1) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getTodayKey(now = Date.now()) {
  return getDayKey(now);
}

function getUniqueDailyAudience(
  records: Array<{ ideaId: string; userFingerprint: string; createdAt: string }>,
  ideaId: string,
  dayKey: string
) {
  const viewers = new Set<string>();

  for (const record of records) {
    if (record.ideaId !== ideaId) {
      continue;
    }

    if (getDayKey(record.createdAt) !== dayKey) {
      continue;
    }

    viewers.add(record.userFingerprint);
  }

  return viewers;
}

function getDailyContribution(store: StoreShape, ideaId: string, dayKey: string) {
  const uniqueFires = getUniqueDailyAudience(store.fires, ideaId, dayKey).size;
  const uniqueViews = getUniqueDailyAudience(store.views, ideaId, dayKey).size;

  return roundHeat(
    getFireContribution(uniqueFires) + VIEW_WEIGHT * Math.log2(1 + uniqueViews)
  );
}

function computeIdeaHeatFromScratch(
  idea: IdeaRecord,
  store: StoreShape,
  targetDayKey: string
) {
  const startDayKey = getDayKey(idea.createdAt);

  if (startDayKey > targetDayKey) {
    return 0;
  }

  let dayKey = startDayKey;
  let heat = 0;

  while (dayKey <= targetDayKey) {
    heat =
      (dayKey === startDayKey ? 0 : DAILY_CARRY_FACTOR * heat) +
      getDailyContribution(store, idea.id, dayKey);

    if (dayKey === targetDayKey) {
      return roundHeat(heat);
    }

    dayKey = addDayKey(dayKey);
  }

  return roundHeat(heat);
}

function computeIdeaHeatForDay(
  idea: IdeaRecord,
  store: StoreShape,
  targetDayKey: string
) {
  if (!idea.heatDate) {
    return computeIdeaHeatFromScratch(idea, store, targetDayKey);
  }

  if (idea.heatDate >= targetDayKey) {
    return roundHeat(idea.heat);
  }

  let dayKey = idea.heatDate;
  let heat = idea.heat;

  while (dayKey < targetDayKey) {
    dayKey = addDayKey(dayKey);
    heat = DAILY_CARRY_FACTOR * heat + getDailyContribution(store, idea.id, dayKey);
  }

  return roundHeat(heat);
}

function syncIdeaHeat(idea: IdeaRecord, store: StoreShape, targetDayKey: string) {
  const heat = computeIdeaHeatForDay(idea, store, targetDayKey);
  idea.heat = heat;
  idea.heatDate = targetDayKey;
  return heat;
}

function getFireContribution(uniqueFireCount: number) {
  const countedFires = Math.max(0, uniqueFireCount - FIRE_STARTER_COUNT);
  return Math.log2(1 + countedFires);
}

function getLogContributionDelta(previousCount: number, nextCount: number, weight = 1) {
  if (nextCount <= previousCount) {
    return 0;
  }

  return roundHeat(
    weight * (Math.log2(1 + nextCount) - Math.log2(1 + previousCount))
  );
}

function getFireContributionDelta(previousCount: number, nextCount: number) {
  if (nextCount <= previousCount) {
    return 0;
  }

  return roundHeat(
    getFireContribution(nextCount) - getFireContribution(previousCount)
  );
}

function compareIdeasByHot(
  a: { idea: IdeaRecord; heat: number },
  b: { idea: IdeaRecord; heat: number }
) {
  if (b.heat !== a.heat) {
    return b.heat - a.heat;
  }

  return Date.parse(b.idea.createdAt) - Date.parse(a.idea.createdAt);
}

function compareIdeasByNew(
  a: { idea: IdeaRecord; heat: number },
  b: { idea: IdeaRecord; heat: number }
) {
  return Date.parse(b.idea.createdAt) - Date.parse(a.idea.createdAt);
}

function hashSeed(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed) || 0x9e3779b9;

  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: string) {
  const shuffled = [...items];
  const random = createSeededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function buildMixedIdeaOrder(
  ideasWithHeat: Array<{ idea: IdeaRecord; heat: number }>,
  seed: string
) {
  const hotQueue = [...ideasWithHeat].sort(compareIdeasByHot);
  const newQueue = [...ideasWithHeat].sort(compareIdeasByNew);
  const randomQueue = shuffleWithSeed(ideasWithHeat, `${seed}:random`);
  const pattern = shuffleWithSeed(
    ["hot", "new", "random", "random", "random", "random", "random", "random", "random", "random"] as const,
    `${seed}:pattern`
  );
  const queues = {
    hot: hotQueue,
    new: newQueue,
    random: randomQueue
  };
  const cursors = {
    hot: 0,
    new: 0,
    random: 0
  };
  const seen = new Set<string>();
  const mixed: Array<{ idea: IdeaRecord; heat: number }> = [];

  function takeNext(source: keyof typeof queues) {
    const queue = queues[source];
    let cursor = cursors[source];

    while (cursor < queue.length) {
      const candidate = queue[cursor];
      cursor += 1;

      if (seen.has(candidate.idea.id)) {
        continue;
      }

      cursors[source] = cursor;
      seen.add(candidate.idea.id);
      return candidate;
    }

    cursors[source] = cursor;
    return null;
  }

  while (mixed.length < ideasWithHeat.length) {
    const preferred = pattern[mixed.length % pattern.length] ?? "random";
    const candidate =
      takeNext(preferred) ??
      takeNext("random") ??
      takeNext("hot") ??
      takeNext("new");

    if (!candidate) {
      break;
    }

    mixed.push(candidate);
  }

  return mixed;
}

export function getFireLevel(heat: number): FireLevel {
  const [one, two, three, four, five] = appConfig.fire.emojiThresholds;

  if (heat >= five) {
    return 5;
  }

  if (heat >= four) {
    return 4;
  }

  if (heat >= three) {
    return 3;
  }

  if (heat >= two) {
    return 2;
  }

  if (heat >= one) {
    return 1;
  }

  return 0;
}

function projectIdea(idea: IdeaRecord, heat: number): IdeaSummary {
  return {
    id: idea.id,
    idea: idea.idea,
    excerpt: extractIdeaExcerpt(idea.details),
    heat,
    fireLevel: getFireLevel(heat),
    createdAt: idea.createdAt,
    externalLink: idea.externalLink,
    kind: idea.kind,
    topic: idea.topic,
    tagSource: idea.tagSource
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

function getRecentSuccessfulPosts(
  store: StoreShape,
  submitKey: string,
  windowMs: number
) {
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
  sort?: IdeaSort | string;
  page?: number;
  offset?: number;
  limit?: number;
  seed?: string;
}) {
  const store = await readStore();
  const todayKey = getTodayKey();
  const sort = getIdeaSort(typeof input.sort === "string" ? input.sort : null);
  const seed = sort === "all" ? input.seed?.trim() || randomUUID() : null;
  const page = Math.max(Math.floor(input.page ?? 1), 1);
  const offset = Number.isFinite(input.offset) ? Math.max(Math.floor(input.offset ?? 0), 0) : null;
  const limit = clampLimit(input.limit ?? 30);
  const ideasWithHeat = store.ideas.map((idea) => ({
    idea,
    heat: computeIdeaHeatForDay(idea, store, todayKey)
  }));
  const ordered =
    sort === "all"
      ? buildMixedIdeaOrder(ideasWithHeat, seed ?? randomUUID())
      : [...ideasWithHeat].sort(sort === "new" ? compareIdeasByNew : compareIdeasByHot);
  const start = offset ?? (page - 1) * limit;
  const ideas = ordered
    .slice(start, start + limit)
    .map(({ idea, heat }) => projectIdea(idea, heat));

  return {
    ideas,
    offset: start,
    page,
    hasMore: start + limit < ordered.length,
    seed
  };
}

export async function getIdeaById(
  id: string,
  viewerKey: string,
  options?: { recordView?: boolean }
) {
  if (options?.recordView) {
    return withStoreMutation((store) => {
      const idea = store.ideas.find((entry) => entry.id === id);

      if (!idea) {
        return null;
      }

      const now = Date.now();
      const todayKey = getTodayKey(now);
      syncIdeaHeat(idea, store, todayKey);

      const uniqueViewsToday = getUniqueDailyAudience(store.views, id, todayKey);

      if (!uniqueViewsToday.has(viewerKey)) {
        const previousViews = uniqueViewsToday.size;
        store.views.push({
          id: randomUUID(),
          ideaId: id,
          userFingerprint: viewerKey,
          createdAt: nowIso()
        });
        idea.heat = roundHeat(
          idea.heat + getLogContributionDelta(previousViews, previousViews + 1, VIEW_WEIGHT)
        );
        idea.heatDate = todayKey;
      }

      const fireAccess = getViewerFireAccess(store, id, viewerKey, now);

      return projectIdeaDetail(
        idea,
        fireAccess.viewerCanFire,
        fireAccess.nextFireAt,
        idea.heat
      );
    });
  }

  const store = await readStore();
  const idea = store.ideas.find((entry) => entry.id === id);

  if (!idea) {
    return null;
  }

  const now = Date.now();
  const heat = computeIdeaHeatForDay(idea, store, getTodayKey(now));
  const fireAccess = getViewerFireAccess(store, id, viewerKey, now);

  return projectIdeaDetail(idea, fireAccess.viewerCanFire, fireAccess.nextFireAt, heat);
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
  const externalLinkInput = input.externalLink?.trim() || null;
  const normalizedExternalLink = normalizeExternalLink(externalLinkInput);
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

  if (externalLinkInput && !normalizedExternalLink) {
    return {
      ok: false,
      status: 400,
      message: "External link must be a valid http or https URL."
    };
  }

  const qualityMessage = await verifyIdeaInput(idea);

  if (qualityMessage) {
    return {
      ok: false,
      status: 400,
      message: qualityMessage
    };
  }

  const contentHash = createContentHash({ idea, details });
  const tokenCheck = verifyPostToken(input.postToken);

  const result = await withStoreMutation(async (store) => {
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
    const inOneDay = getRecentSuccessfulPosts(store, submitKey, ONE_DAY_MS);

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
      externalLink: normalizedExternalLink,
      kind: null,
      topic: null,
      tagSource: null,
      taggedAt: null,
      heat: 0,
      heatDate: getDayKey(timestamp),
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

  if (result.ok && result.id) {
    void tagIdeaById(result.id).catch(() => undefined);
  }

  return result;
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
    const todayKey = getTodayKey(now);
    syncIdeaHeat(idea, store, todayKey);
    const fireAccess = getViewerFireAccess(store, id, viewerKey, now);

    if (!fireAccess.viewerCanFire) {
      return {
        ok: true,
        status: 200,
        cooldownActive: true,
        fireLevel: getFireLevel(idea.heat),
        nextFireAt: fireAccess.nextFireAt
      };
    }

    const nextFireAt = new Date(now + FIRE_COOLDOWN_MS).toISOString();
    const uniqueFiresToday = getUniqueDailyAudience(store.fires, id, todayKey);
    const previousUniqueFireCount = uniqueFiresToday.size;
    const alreadyCountedToday = uniqueFiresToday.has(viewerKey);

    store.fires.push({
      id: randomUUID(),
      ideaId: id,
      userFingerprint: viewerKey,
      createdAt: nowIso()
    });

    idea.fireCount += 1;
    idea.updatedAt = nowIso();
    if (!alreadyCountedToday) {
      idea.heat = roundHeat(
        idea.heat + getFireContributionDelta(previousUniqueFireCount, previousUniqueFireCount + 1)
      );
    }
    idea.heatDate = todayKey;

    return {
      ok: true,
      status: 200,
      cooldownActive: false,
      fireLevel: getFireLevel(idea.heat),
      nextFireAt
    };
  });
}

export async function recalculateHeat() {
  return withStoreMutation((store) => {
    const todayKey = getTodayKey();

    for (const idea of store.ideas) {
      syncIdeaHeat(idea, store, todayKey);
    }

    return {
      updated: store.ideas.length
    };
  });
}

export function getCreateIdeaInput(payload: Record<string, FormDataEntryValue | null>) {
  const idea = String(payload.idea ?? "");
  const details = payload.details ? String(payload.details) : null;
  const externalLink =
    (payload.external_link && String(payload.external_link)) ||
    (payload.externalLink && String(payload.externalLink)) ||
    null;
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
    externalLink,
    postToken,
    website,
    turnstileToken
  };
}

export function getRemoteIpFromHeaders(headers: Headers) {
  return getRemoteIp(headers);
}

export function getIdeaSort(sortValue: string | null): IdeaSort {
  if (sortValue === "new") {
    return "new";
  }

  if (sortValue === "lit" || sortValue === "hot") {
    return "hot";
  }

  return "all";
}

export function getIdeaPagination(value: string | null, fallback: number) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(Math.floor(numeric), 1);
}

export function getIdeaOffset(value: string | null) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return undefined;
  }

  return Math.max(Math.floor(numeric), 0);
}

export function getNormalizedIdeaContent(input: { idea: string; details?: string | null }) {
  return normalizeIdeaContent(input);
}
