# Idea Commons — Build Specification
# Version: v1.33
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.33 — 2026-04-10
- Added a Docker Compose-aware admin wrapper for production operations
- Wrapped delete-by-url and readable-id rekey commands so they run inside the Litboard container
- Added wrapper helpers for Litboard logs, Cloudflare Tunnel logs, service restart, and Compose status

### v1.32 — 2026-04-10
- Added an admin script to delete an idea by full URL or raw id
- Added an admin script to rekey readable idea ids into opaque hash-like ids
- Clarified that public idea URLs should use opaque ids, not human-readable seed names
- Clarified that delete operations must remove related fire and view rows

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Production Admin Wrapper

Use `scripts/admin.sh` from the Litboard repo on the production desk/tower.

Default deployment assumptions:

- Compose directory: `~/pnee.uk`
- Compose file: `deploy/docker-compose.yml`
- Compose env file: `.env`
- Litboard service: `litboard`
- Container DB path: `/app/data/prod-runtime-store.db`

Delete by URL:

```bash
scripts/admin.sh delete https://www.litboard.net/ideas/seed_agent_native_internet
```

Dry run:

```bash
scripts/admin.sh delete --dry-run https://www.litboard.net/ideas/seed_agent_native_internet
```

Rekey readable ids:

```bash
scripts/admin.sh rekey --dry-run
scripts/admin.sh rekey
```

Operational helpers:

```bash
scripts/admin.sh logs litboard
scripts/admin.sh logs cloudflared
scripts/admin.sh logs all
scripts/admin.sh restart
scripts/admin.sh ps
```

The wrapper should call `docker compose exec -T litboard ...` instead of hard-coding the container name, so it continues working after the container is recreated.

---

## 3. Overrides

The wrapper should allow env var overrides for future deployment changes:

- `LITBOARD_COMPOSE_DIR`
- `LITBOARD_COMPOSE_FILE`
- `LITBOARD_COMPOSE_ENV_FILE`
- `LITBOARD_COMPOSE_SERVICE`
- `LITBOARD_CONTAINER_DB_PATH`

---

*End of build specification v1.33. Next amendment will be `build-v1-34.md`.*
