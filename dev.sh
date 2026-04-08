#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

export LITBOARD_APP_MODE=dev
export LITBOARD_STORE_TEMPLATE_PATH="$ROOT_DIR/data/dev-template-store.json"
export LITBOARD_STORE_PATH="$ROOT_DIR/data/dev-runtime-store.json"

node "$ROOT_DIR/scripts/seed-dev-store.mjs" "$LITBOARD_STORE_TEMPLATE_PATH"

if [ ! -f "$LITBOARD_STORE_PATH" ]; then
  cp "$LITBOARD_STORE_TEMPLATE_PATH" "$LITBOARD_STORE_PATH"
elif node "$ROOT_DIR/scripts/should-refresh-dev-store.mjs" "$LITBOARD_STORE_PATH"; then
  cp "$LITBOARD_STORE_TEMPLATE_PATH" "$LITBOARD_STORE_PATH"
fi

exec npm run dev
