# Idea Commons — Build Specification
# Version: v1.06
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.06 — 2026-04-07
- Allowed the same person to fire the same idea again after 6 hours
- Replaced the awkward `Fired` copy with emoji-first fire controls
- Added fire-state color coding to idea cards
- Kept the `v1.05` editorial paper-style direction
- Kept the `v1.04` 24-hour linear fire decay model

### v1.05 — 2026-04-07
- Updated the visual direction to match the provided reference style
- Moved the interface toward an editorial desk / paper index feel

---

## 1. Product Overview

**Idea Commons** is a public feed of startup ideas where people can post, browse, and fire ideas to signal interest.

### Product Principles
- Browsing must be instant and public
- Firing must take one click
- A fire is a lightweight nudge, not a permanent badge from one person
- The same person can re-fire the same idea after enough time has passed
- The interface should feel like a calm paper workspace, not a glossy startup landing page

---

## 2. Fire Heat Algorithm

### Formula

```text
fire_contribution = max(0, 1 - age_in_hours / 24)

heat(now) = sum(fire_contribution for all fire events on the idea)
```

### Behavior
- A fresh fire contributes `1.0`
- After 12 hours that same fire contributes `0.5`
- After 24 hours that same fire contributes `0`
- A single fire should decay out within one day if no one else fires the idea
- The same person may add a new fire event to the same idea once every 6 hours

### Fire Cooldown

- A person can fire the same idea once every 6 hours
- Before 6 hours have elapsed, the fire control should show a cooldown state
- After 6 hours have elapsed, that person may fire the idea again

### Fire States

| Heat Range | Label |
|-----------|-------|
| 0 - 1.5 | none |
| 1.5 - 2.5 | Ember |
| 2.5 - 4 | Spark |
| 4 - 6 | Flame |
| 6 - 9 | Blaze |
| 9+ | Wildfire |

### Rules
- Do not show fire counts anywhere
- A single fire should not surface a visible label
- Heat should be recomputed from live fire timestamps on reads and writes

---

## 3. Fire UI

### Button Copy
- Do not use `Fired`
- Use emoji-first copy instead

### Recommended States
- Ready: `🔥 Fire`
- Pending: `🔥 ...`
- Cooldown: `🔥 Cooling`

### Detail Page Behavior
- If the viewer can fire now, show the active fire button
- If the viewer is inside the 6-hour cooldown, show the cooldown state instead of a permanent disabled `Fired`

---

## 4. Card Styling

### Color Coding
- Idea cards should tint based on fire state
- `none`: neutral paper
- `ember`: slightly warmer paper
- `spark`: warmer orange tint
- `flame`: stronger warm tint
- `blaze`: deeper warm tint
- `wildfire`: strongest warm tint

### Card Rules
- Fire state should influence the full card subtly, not just the pill
- Tints should stay muted and paper-like
- Avoid bright saturated app colors

---

## 5. Posting Model

- Required field: `idea` (10-100 chars)
- Optional field: `details` (0-2000 chars)
- No required contact info
- No preview step
- No email verification

---

## 6. Definition of Done

- [ ] A single fire remains below the first visible fire level
- [ ] Fire heat decays out within 24 hours if no new fires arrive
- [ ] The same person can fire the same idea again after 6 hours
- [ ] The UI does not use the word `Fired`
- [ ] Idea cards are color coded by fire state
- [ ] The interface still matches the paper/editorial tone of the reference image

---

## Appendix: Type Definitions

```typescript
type FireState =
  | 'none'
  | 'ember'
  | 'spark'
  | 'flame'
  | 'blaze'
  | 'wildfire';
```

---

*End of build specification v1.06. Next amendment will be `build-v1-07.md`.*
