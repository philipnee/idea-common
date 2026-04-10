#!/usr/bin/env bash
set -euo pipefail

COMPOSE_DIR="${LITBOARD_COMPOSE_DIR:-$HOME/pnee.uk}"
COMPOSE_FILE="${LITBOARD_COMPOSE_FILE:-deploy/docker-compose.yml}"
ENV_FILE="${LITBOARD_COMPOSE_ENV_FILE:-.env}"
DB_PATH="${LITBOARD_CONTAINER_DB_PATH:-/app/data/prod-runtime-store.db}"
SERVICE="${LITBOARD_COMPOSE_SERVICE:-litboard}"

compose() {
  docker compose -f "$COMPOSE_DIR/$COMPOSE_FILE" --env-file "$COMPOSE_DIR/$ENV_FILE" "$@"
}

run_in_litboard() {
  compose exec -T "$SERVICE" "$@"
}

usage() {
  cat <<EOF
Usage:
  scripts/admin.sh delete <idea-url-or-id>
  scripts/admin.sh delete --dry-run <idea-url-or-id>
  scripts/admin.sh rekey
  scripts/admin.sh rekey --dry-run
  scripts/admin.sh logs [litboard|cloudflared|all]
  scripts/admin.sh restart
  scripts/admin.sh ps

Defaults:
  compose dir:  $COMPOSE_DIR
  compose file: $COMPOSE_FILE
  env file:     $ENV_FILE
  service:      $SERVICE
  db path:      $DB_PATH

Override with:
  LITBOARD_COMPOSE_DIR
  LITBOARD_COMPOSE_FILE
  LITBOARD_COMPOSE_ENV_FILE
  LITBOARD_COMPOSE_SERVICE
  LITBOARD_CONTAINER_DB_PATH
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

command="$1"
shift

case "$command" in
  delete)
    if [[ $# -lt 1 ]]; then
      usage
      exit 1
    fi

    if [[ "${1:-}" == "--dry-run" ]]; then
      shift
      run_in_litboard node scripts/delete-idea.mjs --dry-run "$1" "$DB_PATH"
    else
      run_in_litboard node scripts/delete-idea.mjs "$1" "$DB_PATH"
    fi
    ;;
  rekey)
    if [[ "${1:-}" == "--dry-run" ]]; then
      run_in_litboard node scripts/rekey-readable-idea-ids.mjs --dry-run "$DB_PATH"
    else
      run_in_litboard node scripts/rekey-readable-idea-ids.mjs "$DB_PATH"
    fi
    ;;
  logs)
    target="${1:-litboard}"

    case "$target" in
      litboard)
        compose logs -f litboard
        ;;
      cloudflared)
        compose logs -f cloudflared
        ;;
      all)
        compose logs -f
        ;;
      *)
        echo "Unknown logs target: $target"
        usage
        exit 1
        ;;
    esac
    ;;
  restart)
    compose up -d --force-recreate litboard
    ;;
  ps)
    compose ps -a
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo "Unknown command: $command"
    usage
    exit 1
    ;;
esac
