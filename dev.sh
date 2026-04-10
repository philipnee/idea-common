#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

export LITBOARD_APP_MODE=dev
export LITBOARD_STORE_TEMPLATE_PATH="$ROOT_DIR/data/dev-template-store.json"
export LITBOARD_STORE_PATH="$ROOT_DIR/data/dev-runtime-store.db"

node "$ROOT_DIR/scripts/seed-dev-store.mjs" "$LITBOARD_STORE_TEMPLATE_PATH"

exec npm run dev
