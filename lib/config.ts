import path from "node:path";
import { env } from "@/lib/env";

interface HeaderBag {
  get(name: string): string | null;
}

function readPositiveNumber(name: string, fallback: number) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const numeric = Number(raw);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }

  return numeric;
}

function readNonNegativeNumber(name: string, fallback: number) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const numeric = Number(raw);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }

  return numeric;
}

function readBoolean(name: string, fallback: boolean) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const normalized = raw.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function readOrderedThresholds(defaults: readonly number[]) {
  const ordered: number[] = [];

  defaults.forEach((fallback, index) => {
    const value = readPositiveNumber(`FIRE_EMOJI_THRESHOLD_${index + 1}`, fallback);
    const previous = ordered[index - 1];
    ordered.push(index === 0 ? value : Math.max(value, previous + 0.001));
  });

  return [
    ordered[0] ?? defaults[0],
    ordered[1] ?? defaults[1],
    ordered[2] ?? defaults[2],
    ordered[3] ?? defaults[3],
    ordered[4] ?? defaults[4]
  ] as const;
}

export const appConfig = {
  aiVerification: {
    provider: "gemini" as const,
    model: process.env.GEMINI_MODEL?.trim() ?? "",
    apiKey: process.env.GEMINI_API_KEY?.trim() ?? "",
    endpointBase:
      process.env.GEMINI_BASE_URL?.trim() ||
      "https://generativelanguage.googleapis.com/v1beta"
  },
  heat: {
    dailyCarryFactor: readNonNegativeNumber("HEAT_DAILY_CARRY_FACTOR", 0.3),
    viewWeight: readNonNegativeNumber("HEAT_VIEW_WEIGHT", 0.2)
  },
  tagging: {
    taxonomyPath:
      process.env.LITBOARD_TAGGING_TAXONOMY_PATH?.trim() ||
      path.join(process.cwd(), "content", "tag-taxonomy.txt"),
    timeoutMs: readPositiveNumber("LITBOARD_TAGGING_TIMEOUT_MS", 5_000),
    keywordFallbackEnabled: readBoolean(
      "LITBOARD_TAGGING_KEYWORD_FALLBACK",
      true
    )
  },
  fire: {
    refireCooldownHours: readPositiveNumber("FIRE_REFIRE_COOLDOWN_HOURS", 6),
    emojiThresholds: readOrderedThresholds([0.6, 2.4, 4.5, 7, 10] as const)
  }
};

export function isGeminiVerificationConfigured() {
  return Boolean(
    appConfig.aiVerification.model && appConfig.aiVerification.apiKey
  );
}

function getDefaultProtocol(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
}

export function getRequestOrigin(headers?: HeaderBag) {
  if (!headers) {
    return env.siteUrl;
  }

  const forwardedHost =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headers.get("host")?.trim();

  if (!forwardedHost) {
    return env.siteUrl;
  }

  const forwardedProto =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    getDefaultProtocol(forwardedHost);

  return `${forwardedProto}://${forwardedHost}`;
}

export function getPublicIdeaUrl(id: string, headers?: HeaderBag) {
  return new URL(`/ideas/${id}`, getRequestOrigin(headers)).toString();
}
