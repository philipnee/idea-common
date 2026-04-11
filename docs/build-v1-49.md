# Idea Commons — Build Specification
# Version: v1.49
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.49 — 2026-04-11
- Kept the detail-page fire CTA visible during cooldown
- Changed the cooldown state from disappearing UI to a disabled `Fired` button
- Added an availability note so users can tell when they can fire again

### v1.48 — 2026-04-11
- Removed the inline fire button from home feed idea cards
- Made idea detail pages the only place where users can fire an idea
- Kept feed cards focused on scanning, opening, and reading ideas

---

## 1. Detail Fire Cooldown

The idea detail page is the only place where users can fire an idea.

The fire CTA should remain visible even when the viewer is in cooldown. Do not hide the CTA after a successful fire or when the viewer opens an idea they already fired recently.

States:

- Can fire: enabled `Fire this idea`
- Recently fired: disabled `Fired`
- Cooldown note: show when the idea can be fired again, if known

This prevents the detail page from looking broken when cooldown rules are active.

---

*End of build specification v1.49. Next amendment will be `build-v1-50.md`.*
