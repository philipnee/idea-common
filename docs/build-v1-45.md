# Idea Commons — Build Specification
# Version: v1.45
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.45 — 2026-04-11
- Reworked the home feed toward the supplied Litboard feed mock
- Changed the home header to a compact fire-logo brand with `Post an idea. See if it catches fire.`
- Changed the feed to a masonry-style column layout with one, two, and three column breakpoints
- Updated idea cards with serif titles, mono body copy, heat badges, public tags, and an inline orange fire control
- Changed lazy loading from auto-scroll text to a centered `Load more` button
- Added DM Serif Display and DM Mono font loading for the mock direction

### v1.44 — 2026-04-11
- Centered the idea detail `Fire this idea` call-to-action
- Moved the external link below the fire call-to-action
- Changed visible copy from `Source` to `External link`

---

## 1. Home Feed Direction

The home page should follow the supplied HTML mock direction:

- off-white page background
- compact header with fire mark, Litboard wordmark, short tagline, and Post button
- simple `All`, `Lit`, `New` tabs
- masonry-style feed cards
- card top row with timestamp and heat badge when heat exists
- card title in a serif display style
- card excerpt in small mono copy, clamped to a few lines
- public tag chips based on generated metadata
- inline card fire action styled as orange outline

The first page should still load 20 ideas initially and subsequent loads should fetch 5 more ideas at a time.

---

## 2. Card Fire Action

The card fire action should call the existing fire endpoint:

```text
POST /api/ideas/[id]/fire
```

The card should switch to `fired` locally after a successful response and refresh the feed so heat can update.

The card fire action is intentionally compact and separate from the larger detail-page `Fire this idea` action.

---

*End of build specification v1.45. Next amendment will be `build-v1-46.md`.*
