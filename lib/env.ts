const isProduction = process.env.NODE_ENV === "production";

function readEnv(name: string, fallback?: string) {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (!isProduction && fallback) {
    return fallback;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export const env = {
  cronSecret: readEnv("CRON_SECRET", "dev-cron-secret"),
  postTokenSecret: readEnv("POST_TOKEN_SECRET", "dev-post-token-secret"),
  siteUrl: readEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""
};

export function isTurnstileConfigured() {
  return Boolean(env.turnstileSecretKey && env.turnstileSiteKey);
}

