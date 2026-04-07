#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

export GOFRIEDA_APP_MODE=dev
export GOFRIEDA_STORE_TEMPLATE_PATH="$ROOT_DIR/data/dev-template-store.json"
export GOFRIEDA_STORE_PATH="$ROOT_DIR/data/dev-runtime-store.json"

node "$ROOT_DIR/scripts/seed-dev-store.mjs" "$GOFRIEDA_STORE_TEMPLATE_PATH"

if [ ! -f "$GOFRIEDA_STORE_PATH" ]; then
  cp "$GOFRIEDA_STORE_TEMPLATE_PATH" "$GOFRIEDA_STORE_PATH"
fi

exec npm run dev
