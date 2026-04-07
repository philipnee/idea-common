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
  fire: {
    decayWindowHours: readPositiveNumber("FIRE_DECAY_WINDOW_HOURS", 24),
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
