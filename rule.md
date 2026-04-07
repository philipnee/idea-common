# Repo Rules

All coding agents must read this file before making any repo change.

After reading this file, read the latest relevant `build-*.md` spec before implementation work. The current baseline spec is `build-00.md`.

## 1. Commit Rule

- Every change made by a coding agent must be committed immediately.
- Commit even if the change is incomplete or broken.
- Every agent-authored commit message must start with `[codex]`.
- Example: `[codex] add repo rules`

## 2. Spec Rule

- `build-*.md` files are the product spec and build-history source of truth.
- Do not replace an existing spec snapshot when the spec changes.
- When the spec changes, create a new `build-*.md` file instead of rewriting the old one.
- Follow the naming/versioning direction recorded in the current spec file.
- `build-00.md` explicitly says the next amendment should be `build-v1-01.md`.
- Each new spec file should carry its own version metadata and changelog entry so prior specs remain intact.

## 3. Required Order

1. Read `rule.md`.
2. Read the latest applicable `build-*.md`.
3. Make the change.
4. Commit the change with a `[codex] ...` message.
