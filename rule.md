# Repo Rules

All coding agents must read this file first before making any repo change.

This file is the only root entry point for agent instructions.

After reading this file, read the latest relevant spec in `docs/build-*.md` before implementation work. The current baseline spec is `docs/build-v1-40.md`.

## 1. Commit Rule

- Every change made by a coding agent must be committed immediately.
- Commit even if the change is incomplete or broken.
- Every agent-authored commit message must start with that agent's name in brackets.
- Examples: `[codex] add repo rules`, `[claude] update login flow`

## 2. Spec Rule

- `docs/build-*.md` files are the product spec and build-history source of truth.
- Keep `rule.md` as the only instruction entry point at the repo root.
- Do not replace an existing spec snapshot when the spec changes.
- When the spec changes, create a new `docs/build-*.md` file instead of rewriting the old one.
- Follow the naming/versioning direction recorded in the current spec file.
- `docs/build-v1-40.md` says the next amendment should be `build-v1-41.md`, so the next spec file path should be `docs/build-v1-41.md`.
- Each new spec file should carry its own version metadata and changelog entry so prior specs remain intact.

## 3. Required Order

1. Read `rule.md`.
2. Read the latest applicable `docs/build-*.md`.
3. Make the change.
4. Commit the change with a `[agent-name] ...` message.
