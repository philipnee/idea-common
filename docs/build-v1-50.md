# Idea Commons — Build Specification
# Version: v1.50
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.50 — 2026-04-11
- Renamed the detail-page active fire CTA from `Fire this idea` to `Lit this idea`
- Renamed the cooldown button state from `Fired` to `Lit`
- Updated matching accessibility/title copy for the same action

### v1.49 — 2026-04-11
- Kept the detail-page fire CTA visible during cooldown
- Changed the cooldown state from disappearing UI to a disabled `Fired` button
- Added an availability note so users can tell when they can fire again

---

## 1. Detail Fire CTA Copy

The idea detail page remains the only place where users can fire/lit an idea.

CTA states:

- Can fire: enabled `Lit this idea`
- Recently fired: disabled `Lit`
- Cooldown note: show when the idea can be fired again, if known

Avoid the visible button label `Fire this idea` on the detail page.

---

*End of build specification v1.50. Next amendment will be `build-v1-51.md`.*
