# Idea Commons — Build Specification
# Version: v1.43
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.43 — 2026-04-11
- Updated the idea detail fire action to follow the supplied orange-outline mock
- Changed the visible label to `Fire this idea`
- Switched the control from a square stacked button to a horizontal call-to-action
- Made the detail footer responsive so the wider fire action does not collide with source text

### v1.42 — 2026-04-11
- Restyled the idea detail fire action away from a harsh black block
- Changed the active fire action to a warm orange surface with a softer border
- Reduced `fire!` letter spacing so the label centers more naturally under the emoji

---

## 1. Fire Call-To-Action

The idea detail fire action should use the orange-outline treatment from the supplied mock:

```text
🔥 Fire this idea
```

Visual direction:

- transparent background by default
- orange border
- orange label
- orange fill on hover
- light text on hover
- slight lift and warm shadow on hover

The control can be wider than the earlier square button, but it should remain capped so it does not dominate the card.

The source/fire footer should stack on small screens and use a two-column bottom row on wider screens.

---

*End of build specification v1.43. Next amendment will be `build-v1-44.md`.*
