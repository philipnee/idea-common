# Idea Commons — Build Specification
# Version: v1.39
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.39 — 2026-04-11
- Moved the idea detail source link to the card footer
- Moved the fire action to the card footer lower-right
- Kept only timestamp and share in the idea detail header

### v1.38 — 2026-04-11
- Cleaned up the idea detail action cluster
- Placed the timestamp in the upper-left of the idea card header
- Placed the share control in the upper-right of the idea card header
- Placed the source link in the lower-left action row when a source exists
- Placed the fire action in the lower-right action row
- Removed the passive fire-level pill from the crowded detail header

---

## 1. Idea Detail Footer

The idea detail header should contain only:

```text
upper-left:  relative timestamp
upper-right: share control
```

The card footer should contain:

```text
lower-left:  source link, only when present
lower-right: fire action button, only when currently available
```

This keeps source attribution close to the bottom metadata and prevents the fire button from visually hanging under the share button.

---

*End of build specification v1.39. Next amendment will be `build-v1-40.md`.*
