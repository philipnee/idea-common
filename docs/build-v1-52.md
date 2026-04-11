# Idea Commons — Build Specification
# Version: v1.52
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.52 — 2026-04-11
- Added the post composer inline on the home feed
- Simplified posting to one primary idea textarea and a collapsed `+ Description` control
- Removed the separate external-link field from the posting UI
- Kept `/new` functional with the same simplified composer

### v1.51 — 2026-04-11
- Removed the visible ash/wood marker from home feed cards
- Made `fireLevel === 0` render no heat badge on cards
- Kept higher heat levels visible as card badges

---

## 1. Inline Posting

The primary posting flow should live inline on the home feed.

The composer should feel like:

```text
Got an idea? Just type it.
[ idea textarea ]
                         [ Post ]
```

There should be a collapsed `+ Description` affordance. When expanded, users can add optional context, examples, links, or source URLs in the description text.

Do not show a separate external-link field in the posting UI. Links can be pasted into the description.

The `/new` route may remain as a direct fallback, but it should use the same simplified composer rather than a separate full-page posting layout.

---

*End of build specification v1.52. Next amendment will be `build-v1-53.md`.*
