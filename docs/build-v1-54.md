# Idea Commons — Build Specification
# Version: v1.54
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.54 — 2026-04-11
- Simplified the post-success share panel copy to `Share your idea`
- Removed auto-copy status text from the share panel
- Removed visible `Copy failed` messaging from the post-success path

### v1.53 — 2026-04-11
- Collapsed the inline post composer to a small one-line input by default
- Changed the collapsed input placeholder to `Got an idea?`
- Hid `Post` and `+ Description` until the user focuses the idea box
- Kept description optional and expanded only on demand

---

## 1. Post Success Share Panel

After creating an idea, the success panel should be simple and low-friction.

Use this label:

```text
Share your idea
```

Do not show auto-copy status text such as:

- `Your idea is live`
- `Copying`
- `Link copied`
- `Copy failed`

The share URL should remain visible and manually copyable. Clipboard failures should not create noisy UI.

---

*End of build specification v1.54. Next amendment will be `build-v1-55.md`.*
