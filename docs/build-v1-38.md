# Idea Commons — Build Specification
# Version: v1.38
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.38 — 2026-04-11
- Cleaned up the idea detail action cluster
- Placed the timestamp in the upper-left of the idea card header
- Placed the share control in the upper-right of the idea card header
- Placed the source link in the lower-left action row when a source exists
- Placed the fire action in the lower-right action row
- Removed the passive fire-level pill from the crowded detail header

### v1.37 — 2026-04-10
- Clarified that heat should be recomputed from source fire and view rows on reads and writes
- Avoided trusting stale same-day cached heat when the heat algorithm changes
- Ensured existing ideas adopt the starter-fire algorithm immediately after deploy
- Added client-side whitespace cleanup for the post form fields before submit

---

## 1. Idea Detail Layout

The idea detail card header should not collapse timestamp, source, share, and fire into one crowded row.

Use this structure:

```text
upper-left:  relative timestamp
upper-right: share control
lower-left:  source link, only when present
lower-right: fire action button, only when currently available
```

The fire action remains icon-only.

The passive heat/fire-level pill should not appear in this header; the user should not have to parse two fire affordances in the same action cluster.

---

*End of build specification v1.38. Next amendment will be `build-v1-39.md`.*
