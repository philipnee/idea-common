# Idea Commons — Build Specification
# Version: v1.47
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.47 — 2026-04-11
- Removed flame icons from home feed cards
- Kept card heat labels as text-only for Ember, Spark, Flame, and Blaze
- Kept the lowest heat marker as emoji-only `🪵`
- Removed the flame icon from the inline card fire action

### v1.46 — 2026-04-11
- Removed hover-driven movement and shadow from home feed cards
- Removed hover-driven fill/text changes from the inline card fire button
- Kept the inline card fire button state change only after a successful click
- Changed the lowest heat indicator from smoke/ash wording to a wood-only `🪵` marker

---

## 1. Home Card Icons

Home feed cards should not show the flame icon.

Card heat indicators:

- `🪵` for the lowest visible heat state
- `Ember`, `Spark`, `Flame`, and `Blaze` as text-only badges
- `Supernova` may keep its distinct non-fire symbol

Inline card fire action:

```text
fire
```

After successful click:

```text
fired
```

Do not prefix either state with a flame icon on feed cards.

---

*End of build specification v1.47. Next amendment will be `build-v1-48.md`.*
