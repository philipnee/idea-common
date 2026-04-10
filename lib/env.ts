import path from "node:path";

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
  appMode: process.env.LITBOARD_APP_MODE?.trim() === "prod" ? "prod" : "dev",
  cronSecret: readEnv("CRON_SECRET", "dev-cron-secret"),
  postTokenSecret: readEnv("POST_TOKEN_SECRET", "dev-post-token-secret"),
  siteUrl: readEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  storePath:
    process.env.LITBOARD_STORE_PATH?.trim() ||
    path.join(process.cwd(), "data", "runtime-store.db"),
  storeTemplatePath:
    process.env.LITBOARD_STORE_TEMPLATE_PATH?.trim() ||
    path.join(process.cwd(), "data", "store.json"),
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""
};

export function isTurnstileConfigured() {
  return Boolean(env.turnstileSecretKey && env.turnstileSiteKey);
}

export function isDevAppMode() {
  return env.appMode === "dev";
}
