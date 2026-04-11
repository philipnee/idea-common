# Idea Commons — Build Specification
# Version: v1.55
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.55 — 2026-04-11
- Removed the top header `Post` button from feed pages
- Kept the inline composer as the only posting entry point on the feed
- Left non-feed page navigation unchanged

### v1.54 — 2026-04-11
- Simplified the post-success share panel copy to `Share your idea`
- Removed auto-copy status text from the share panel
- Removed visible `Copy failed` messaging from the post-success path

---

## 1. Feed Posting Entry Point

Feed pages should not show a duplicate top-level `Post` button.

The inline composer is the posting entry point on the feed. Keeping a second header post button creates visual duplication and makes the page feel heavier.

Non-feed pages may keep their existing navigation buttons, including the `/new` fallback route and back navigation.

---

*End of build specification v1.55. Next amendment will be `build-v1-56.md`.*
