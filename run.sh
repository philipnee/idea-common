#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

export LITBOARD_APP_MODE=prod
export LITBOARD_STORE_TEMPLATE_PATH="$ROOT_DIR/data/store.json"
export LITBOARD_STORE_PATH="$ROOT_DIR/data/prod-runtime-store.db"

node "$ROOT_DIR/scripts/init-sqlite-store.mjs" "$LITBOARD_STORE_PATH" "$LITBOARD_STORE_TEMPLATE_PATH"
npm run build
exec npm run start
