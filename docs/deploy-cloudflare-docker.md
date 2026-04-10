# Litboard Docker + Cloudflare Tunnel Deploy Runbook

This runbook documents the current production setup for `litboard.net`.

## Deployment Shape

- Litboard runs as a Docker Compose service inside the existing `pnee.uk` Compose stack.
- The existing `cloudflared` container routes public traffic through Cloudflare Tunnel.
- Cloudflare routes `litboard.net` and `www.litboard.net` to the Docker service `litboard:3000`.
- SQLite persists inside the bind-mounted Litboard repo at `data/prod-runtime-store.db`.
- `node_modules` must be a Docker named volume so native modules are built for the container, not the host.

## Compose Service

Add this service to `~/pnee.uk/deploy/docker-compose.yml` under `services:`.

```yaml
  litboard:
    image: node:22-bookworm-slim
    restart: unless-stopped
    working_dir: /app
    command: sh -c "npm install --include=dev && npm run build && node scripts/init-sqlite-store.mjs /app/data/prod-runtime-store.db /app/data/store.json && npx next start -H 0.0.0.0 -p 3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_SITE_URL: https://litboard.net
      POST_TOKEN_SECRET: ${LITBOARD_POST_TOKEN_SECRET}
      CRON_SECRET: ${LITBOARD_CRON_SECRET}
      LITBOARD_APP_MODE: prod
      LITBOARD_STORE_PATH: /app/data/prod-runtime-store.db
      LITBOARD_STORE_TEMPLATE_PATH: /app/data/store.json
      LITBOARD_TAGGING_TAXONOMY_PATH: /app/content/tag-taxonomy.txt
      LITBOARD_IDEA_VERIFICATION_PROMPT_PATH: /app/content/idea-verification-prompt.txt
      LITBOARD_TAGGING_TIMEOUT_MS: "5000"
      LITBOARD_TAGGING_KEYWORD_FALLBACK: "true"
      GEMINI_MODEL: ${GEMINI_MODEL:-}
      GEMINI_API_KEY: ${GEMINI_API_KEY:-}
    volumes:
      - /home/philipnee/litboard.net/idea-common:/app
      - litboard_node_modules:/app/node_modules
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 4G
```

Add this at the bottom of the Compose file, top-level:

```yaml
volumes:
  litboard_node_modules:
```

`cloudflared` may keep the existing token-based setup. It is useful, but not required, to make it depend on Litboard:

```yaml
  cloudflared:
    depends_on:
      - nginx
      - litboard
```

## Required Environment

Add these to `~/pnee.uk/.env`.

```bash
LITBOARD_POST_TOKEN_SECRET=<random hex secret>
LITBOARD_CRON_SECRET=<random hex secret>
```

Generate secrets with:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Optional Gemini tagging:

```bash
GEMINI_MODEL=gemini-2.0-flash-lite
GEMINI_API_KEY=<api key>
```

Optional editable verification prompt path:

```bash
LITBOARD_IDEA_VERIFICATION_PROMPT_PATH=/app/content/idea-verification-prompt.txt
```

## Start Or Restart

Pull latest app code:

```bash
cd ~/litboard.net/idea-common
git pull origin main
```

Start or recreate the service:

```bash
cd ~/pnee.uk
docker compose -f deploy/docker-compose.yml --env-file .env up -d litboard
docker compose -f deploy/docker-compose.yml --env-file .env logs -f litboard
```

Expected healthy log:

```text
Ready - started server on 0.0.0.0:3000
```

## Verify Docker Routing

From an existing container in the same Compose network:

```bash
docker exec deploy-nginx-1 wget -S -O - http://litboard:3000 2>&1 | head -20
```

Expected:

```text
HTTP/1.1 200 OK
X-Powered-By: Next.js
```

If this works, the app is healthy inside Docker.

## Cloudflare Tunnel

The existing `cloudflared` container is token-based, so hostname routing is managed in the Cloudflare Zero Trust dashboard.

Go to:

```text
Cloudflare Zero Trust -> Networks -> Tunnels -> existing tunnel -> Public Hostnames
```

Add or verify:

```text
litboard.net -> HTTP -> litboard:3000
www.litboard.net -> HTTP -> litboard:3000
```

If the dashboard has separate fields, use:

```text
Type: HTTP
URL: litboard:3000
```

Restart the tunnel container after changing Compose:

```bash
cd ~/pnee.uk
docker compose -f deploy/docker-compose.yml --env-file .env up -d cloudflared
```

Public checks:

```bash
curl -I https://litboard.net
curl -I https://www.litboard.net
```

## Root Domain DNS

If `www.litboard.net` works but `litboard.net` fails with DNS resolution:

- Add the apex hostname `litboard.net` to the tunnel public hostnames.
- Let Cloudflare create the tunnel DNS record.
- Ensure there is no stale A/CNAME record for `@`.

## Common Failures

### `Module not found: Can't resolve '@/...'`

The repo now pins the webpack alias in `next.config.mjs` and `baseUrl` in `tsconfig.json`.

Fix:

```bash
cd ~/litboard.net/idea-common
git pull origin main
```

### `Cannot find module 'tailwindcss'`

`next build` needs dev dependencies. Use:

```yaml
command: sh -c "npm install --include=dev && npm run build && ..."
```

### Container exits with code `137`

The build was OOM-killed. Increase the Litboard memory limit. `4G` worked during setup.

### `ld-linux-x86-64.so.2` missing

Do not use `node:22-alpine`; `better-sqlite3` needs glibc. Use:

```yaml
image: node:22-bookworm-slim
```

### `better-sqlite3` compiled against a different Node version

The container reused host `node_modules`. Use a named volume:

```yaml
volumes:
  - /home/philipnee/litboard.net/idea-common:/app
  - litboard_node_modules:/app/node_modules
```

If needed, reset it:

```bash
docker volume rm deploy_litboard_node_modules
docker compose -f deploy/docker-compose.yml --env-file .env up -d litboard
```

### `wget: bad address 'litboard:3000'`

The Litboard container is not running or not attached to the Compose network.

Check:

```bash
docker compose -f deploy/docker-compose.yml --env-file .env ps -a
docker compose -f deploy/docker-compose.yml --env-file .env up -d litboard
```

### `HTTP/1.1 500 Internal Server Error`

Routing works, but the app has a runtime error. Check:

```bash
docker compose -f deploy/docker-compose.yml --env-file .env logs litboard --tail 120
```

## Data And Backups

Production SQLite file:

```text
/home/philipnee/litboard.net/idea-common/data/prod-runtime-store.db
```

Back this file up regularly. Do not commit `.db`, `.db-shm`, or `.db-wal` files.
