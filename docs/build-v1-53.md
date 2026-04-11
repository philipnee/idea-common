# Idea Commons — Build Specification
# Version: v1.53
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.53 — 2026-04-11
- Collapsed the inline post composer to a small one-line input by default
- Changed the collapsed input placeholder to `Got an idea?`
- Hid `Post` and `+ Description` until the user focuses the idea box
- Kept description optional and expanded only on demand

### v1.52 — 2026-04-11
- Added the post composer inline on the home feed
- Simplified posting to one primary idea textarea and a collapsed `+ Description` control
- Removed the separate external-link field from the posting UI
- Kept `/new` functional with the same simplified composer

---

## 1. Compact Inline Composer

The home feed composer should be visually small by default.

Collapsed state:

```text
[ Got an idea? ]
```

The collapsed box should be one line tall and should not show the `Post` button.

Active state begins when the user clicks/focuses the idea box. Active state may reveal:

- `+ Description`
- `Post`
- validation/challenge messages if needed

The description box should remain hidden unless the user explicitly clicks `+ Description`.

---

*End of build specification v1.53. Next amendment will be `build-v1-54.md`.*
