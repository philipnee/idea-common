#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

export GOFRIEDA_APP_MODE=prod
export GOFRIEDA_STORE_TEMPLATE_PATH="$ROOT_DIR/data/store.json"
export GOFRIEDA_STORE_PATH="$ROOT_DIR/data/prod-runtime-store.json"

npm run build
exec npm run start
