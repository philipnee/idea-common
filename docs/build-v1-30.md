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
- Added launch notes for apex DNS, Cloudflare Tunnel public hostnames, and verification commands

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

## 6. Launch Notes From First Deploy

### Working Docker Shape

- Litboard should run inside the existing `pnee.uk` Docker Compose network
- Cloudflare Tunnel should route to the Compose service name, not a host gateway IP
- Working internal target:
  - `http://litboard:3000`
- The app must bind to `0.0.0.0:3000` inside the container
- `node:22-bookworm-slim` works with `better-sqlite3`
- `node:22-alpine` fails because it does not provide the expected glibc loader
- Container `node_modules` must be isolated with a named volume because host-built native modules can mismatch the container Node ABI
- `next build` needs dev dependencies, so the deploy command must install with `npm install --include=dev`
- Building inside the container needed more than `512M`; `4G` worked during launch

### Working Cloudflare Tunnel Config

The existing token-based tunnel is the right tunnel to use because it is already running as `deploy-cloudflared-1`.

Observed tunnel ID:

```text
6c33addb-6b84-4b5a-8a05-20b5961c5f8d
```

Tunnel public hostnames should be:

```text
litboard.net -> HTTP -> litboard:3000
www.litboard.net -> HTTP -> litboard:3000
```

Cloudflare DNS records should be:

```text
CNAME @   6c33addb-6b84-4b5a-8a05-20b5961c5f8d.cfargotunnel.com  Proxied
CNAME www 6c33addb-6b84-4b5a-8a05-20b5961c5f8d.cfargotunnel.com  Proxied
```

Cloudflare may expose proxied CNAMEs as A records when queried:

```bash
dig @1.1.1.1 litboard.net A
dig @1.1.1.1 www.litboard.net A
```

Expected result is Cloudflare IPs, not the raw `cfargotunnel.com` target.

### Debugging Sequence

Use this order when production looks broken:

```bash
docker compose -f deploy/docker-compose.yml --env-file .env ps -a
docker compose -f deploy/docker-compose.yml --env-file .env logs litboard --tail 120
docker exec deploy-nginx-1 wget -S -O - http://litboard:3000 2>&1 | head -20
docker compose -f deploy/docker-compose.yml --env-file .env logs cloudflared --tail 120
dig @1.1.1.1 litboard.net A
dig @1.1.1.1 www.litboard.net A
curl -I https://litboard.net
curl -I https://www.litboard.net
```

Interpretation:

- If `wget http://litboard:3000` fails, fix Docker/app first
- If `wget` works but public `curl` fails, fix Cloudflare Tunnel or DNS
- If `dig` returns only SOA with no answers, the DNS record is missing
- If forced Cloudflare IPs work with `curl --resolve`, but normal `curl` fails, local resolver/browser cache is stale
- If one hostname works and the other does not, the failing hostname needs its own Tunnel public hostname and DNS record

### Browser And Resolver Notes

- Chrome and Safari may cache bad DNS or route state after several Cloudflare changes
- Use private/incognito windows and hard reloads while verifying
- Chrome cache tools:
  - `chrome://net-internals/#dns`
  - `chrome://net-internals/#sockets`
- WSL may show inconsistent resolver behavior while DNS is changing; `dig @1.1.1.1 ...` is the cleaner source of truth

---

*End of build specification v1.30. Next amendment will be `build-v1-31.md`.*
