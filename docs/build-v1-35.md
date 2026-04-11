# Idea Commons — Build Specification
# Version: v1.35
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.35 — 2026-04-10
- Added an admin stats utility for idea view and fire counts
- Added `scripts/admin.sh stats` to list all ideas with total views, unique views, total fires, unique fires, heat, and idea text
- Added `scripts/admin.sh stats <idea-url-or-id>` to inspect one idea by share URL or id
- Kept the stats utility readonly so it can be safely used against the production SQLite database

### v1.34 — 2026-04-10
- Moved the Gemini idea-verification prompt into editable content
- Added `LITBOARD_IDEA_VERIFICATION_PROMPT_PATH` so production can point at the prompt file inside the container
- Clarified that Litboard should allow useful shares and cool things, not only startup/product ideas
- Clarified that verification should block unconstructive junk, profanity, gibberish, and throwaway reactions without judging idea quality too aggressively

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Admin Stats

Production admin tooling should support quick read-only inspection of idea engagement.

The main wrapper command is:

```bash
scripts/admin.sh stats
```

It should print a tab-separated list of ideas with:

- idea id
- total views
- unique views
- total fires
- unique fires
- heat
- idea text

For one idea:

```bash
scripts/admin.sh stats https://www.litboard.net/ideas/<id>
scripts/admin.sh stats <id>
```

The single-idea view should include the same engagement counters plus stored fire count, tags, link, and timestamps.

---

*End of build specification v1.35. Next amendment will be `build-v1-36.md`.*
