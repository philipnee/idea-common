# Idea Commons — Build Specification
# Version: v1.48
# Created: 2026-04-11
# Status: ACTIVE

---

## Changelog

### v1.48 — 2026-04-11
- Removed the inline fire button from home feed idea cards
- Made idea detail pages the only place where users can fire an idea
- Kept feed cards focused on scanning, opening, and reading ideas

### v1.47 — 2026-04-11
- Removed flame icons from home feed cards
- Kept card heat labels as text-only for Ember, Spark, Flame, and Blaze
- Kept the lowest heat marker as emoji-only `🪵`
- Removed the flame icon from the inline card fire action

---

## 1. Feed Card Actions

Home feed cards should not expose a fire action.

Users must click into an idea detail page before they can fire it. This keeps the feed as a discovery surface and makes firing require reading at least the idea detail view.

Feed cards may show:

- age
- heat badge
- title
- one-liner/excerpt
- generated tags when available

Feed cards must not show:

- inline fire button
- fired state
- card-level voting affordance

The detail page remains the canonical place for the fire CTA.

---

*End of build specification v1.48. Next amendment will be `build-v1-49.md`.*
