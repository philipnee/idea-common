# Idea Commons — Build Specification
# Version: v1.46
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.46 — 2026-04-11
- Removed hover-driven movement and shadow from home feed cards
- Removed hover-driven fill/text changes from the inline card fire button
- Kept the inline card fire button state change only after a successful click
- Changed the lowest heat indicator from smoke/ash wording to a wood-only `🪵` marker

### v1.45 — 2026-04-11
- Reworked the home feed toward the supplied Litboard feed mock
- Changed the home header to a compact fire-logo brand with `Post an idea. See if it catches fire.`
- Changed the feed to a masonry-style column layout with one, two, and three column breakpoints
- Updated idea cards with serif titles, mono body copy, heat badges, public tags, and an inline orange fire control
- Changed lazy loading from auto-scroll text to a centered `Load more` button
- Added DM Serif Display and DM Mono font loading for the mock direction

---

## 1. Home Feed Hover Behavior

The home feed should stay visually stable while users scan cards.

Do not use hover effects that make cards appear to flash:

- no card translate on hover
- no card shadow change on hover
- no inline fire button fill change on hover
- no inline fire button text color flip on hover

The inline card fire button should only visually change after a successful fire click, when it switches to `fired`.

---

## 2. Lowest Heat Indicator

The lowest visible heat indicator should not use the word `Ash`.

Use only:

```text
🪵
```

This represents wood without fire. The about-page copy should use the same direction.

---

*End of build specification v1.46. Next amendment will be `build-v1-47.md`.*
