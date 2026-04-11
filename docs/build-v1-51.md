# Idea Commons — Build Specification
# Version: v1.51
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.51 — 2026-04-11
- Removed the visible ash/wood marker from home feed cards
- Made `fireLevel === 0` render no heat badge on cards
- Kept higher heat levels visible as card badges

### v1.50 — 2026-04-11
- Renamed the detail-page active fire CTA from `Fire this idea` to `Lit this idea`
- Renamed the cooldown button state from `Fired` to `Lit`
- Updated matching accessibility/title copy for the same action

---

## 1. Feed Card Low Heat State

Home feed cards should not show a marker for the lowest/ash heat state.

If an idea has `fireLevel === 0`, the card should render no heat badge, even when the underlying heat score is slightly above zero.

Visible card heat starts at level 1:

- `Ember`
- `Spark`
- `Flame`
- `Blaze`
- `Supernova`

This keeps low-activity cards visually quiet and reserves badges for ideas with clearer momentum.

---

*End of build specification v1.51. Next amendment will be `build-v1-52.md`.*
