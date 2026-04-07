import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual
} from "node:crypto";
import { env, isTurnstileConfigured } from "@/lib/env";

interface HeaderBag {
  get(name: string): string | null;
}

const MIN_POST_AGE_MS = 2_000;
const MAX_POST_AGE_MS = 60 * 60 * 1_000;

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function getRequestKey(headers: HeaderBag) {
  const ip =
    headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "unknown";
  const ua = headers.get("user-agent") || "unknown";

  return sha256(`${ip}::${ua}`).slice(0, 16);
}

function sign(payload: string) {
  return createHmac("sha256", env.postTokenSecret).update(payload).digest("hex");
}

export function issuePostToken() {
  const issuedAt = Date.now();
  const nonce = randomUUID().replaceAll("-", "");
  const payload = `${issuedAt}.${nonce}`;
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyPostToken(token: string) {
  const [issuedAtValue, nonce, signature] = token.split(".");

  if (!issuedAtValue || !nonce || !signature) {
    return { ok: false as const, reason: "invalid_token" as const };
  }

  const payload = `${issuedAtValue}.${nonce}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false as const, reason: "invalid_token" as const };
  }

  const issuedAt = Number(issuedAtValue);

  if (!Number.isFinite(issuedAt)) {
    return { ok: false as const, reason: "invalid_token" as const };
  }

  const ageMs = Date.now() - issuedAt;

  if (ageMs < MIN_POST_AGE_MS) {
    return { ok: false as const, reason: "too_fast" as const };
  }

  if (ageMs > MAX_POST_AGE_MS) {
    return { ok: false as const, reason: "expired_token" as const };
  }

  return {
    ok: true as const,
    issuedAt,
    ageMs
  };
}

export function normalizeIdeaContent(input: {
  idea: string;
  details?: string | null;
}) {
  return `${input.idea} ${input.details ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function createContentHash(input: { idea: string; details?: string | null }) {
  return sha256(normalizeIdeaContent(input));
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string | null
) {
  if (!isTurnstileConfigured()) {
    return true;
  }

  const body = new URLSearchParams({
    secret: env.turnstileSecretKey,
    response: token
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as { success?: boolean };
  return Boolean(payload.success);
}

export function getRemoteIp(headers: HeaderBag) {
  return headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim() || null;
}

