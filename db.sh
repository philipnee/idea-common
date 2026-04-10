#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-dev}"

case "$TARGET" in
  dev)
    DB_PATH="$ROOT_DIR/data/dev-runtime-store.db"
    TEMPLATE_PATH="$ROOT_DIR/data/dev-template-store.json"
    ;;
  prod)
    DB_PATH="$ROOT_DIR/data/prod-runtime-store.db"
    TEMPLATE_PATH="$ROOT_DIR/data/store.json"
    ;;
  *)
    echo "Usage: ./db.sh [dev|prod]"
    exit 1
    ;;
esac

node "$ROOT_DIR/scripts/init-sqlite-store.mjs" "$DB_PATH" "$TEMPLATE_PATH"
exec sqlite3 "$DB_PATH"
