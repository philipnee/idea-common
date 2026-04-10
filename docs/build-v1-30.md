# Idea Commons — Build Specification
# Version: v1.30
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.30 — 2026-04-10
- Documented the production deployment path for Litboard on the local PC tower
- Clarified that the deployed app runs as a Docker Compose service beside the existing `pnee.uk` stack
- Clarified that the existing token-based Cloudflare Tunnel routes `litboard.net` and `www.litboard.net` to `litboard:3000`
- Captured the deployment fixes discovered during launch: Debian Node image, named `node_modules` volume, dev dependency install during build, higher build memory, and SQLite initialization before start
- Added the deployment runbook at `docs/deploy-cloudflare-docker.md`

### v1.29 — 2026-04-10
- Replaced the JSON runtime store with a SQLite runtime database
- Clarified that the app is deployed on a single machine with local persistent disk
- Clarified that SQLite is the intended production database for the current deployment model
- Clarified that dev and prod should use separate `.db` files
- Clarified that JSON template files may still be used as seed/import sources for dev reset and first-time bootstrap
- Clarified that the SQLite database should use WAL mode and remain out of git

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Production Deployment

The current production deployment is a single-machine Docker Compose deployment on the PC tower.

- Litboard runs as a `litboard` service in the existing `pnee.uk` Compose stack
- The app service uses `node:22-bookworm-slim`, not Alpine, because `better-sqlite3` needs glibc
- `node_modules` must be mounted as a Docker named volume so native modules compile for the container runtime
- The runtime SQLite database persists at `/home/philipnee/litboard.net/idea-common/data/prod-runtime-store.db`
- The existing `cloudflared` container routes Cloudflare Tunnel traffic to `litboard:3000`
- `www.litboard.net` and `litboard.net` should both route through the tunnel to the same service
- The detailed operational runbook is `docs/deploy-cloudflare-docker.md`

---

## 3. Runtime Config

Required production environment values:

- `NEXT_PUBLIC_SITE_URL=https://litboard.net`
- `POST_TOKEN_SECRET`
- `CRON_SECRET`
- `LITBOARD_APP_MODE=prod`
- `LITBOARD_STORE_PATH=/app/data/prod-runtime-store.db`
- `LITBOARD_STORE_TEMPLATE_PATH=/app/data/store.json`

Optional tagging values:

- `GEMINI_MODEL`
- `GEMINI_API_KEY`
- `LITBOARD_TAGGING_TAXONOMY_PATH=/app/content/tag-taxonomy.txt`
- `LITBOARD_TAGGING_TIMEOUT_MS=5000`
- `LITBOARD_TAGGING_KEYWORD_FALLBACK=true`

---

## 4. Storage Layer

- Use SQLite for runtime state
- Keep `.db`, `.db-shm`, and `.db-wal` files out of git
- Initialize the DB before starting Next with `scripts/init-sqlite-store.mjs`
- Back up the production SQLite file regularly

---

## 5. Operational Checks

Docker-internal health check:

```bash
docker exec deploy-nginx-1 wget -S -O - http://litboard:3000 2>&1 | head -20
```

Expected public checks:

```bash
curl -I https://litboard.net
curl -I https://www.litboard.net
```

---

*End of build specification v1.30. Next amendment will be `build-v1-31.md`.*
