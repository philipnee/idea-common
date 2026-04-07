# Idea Commons — Build Specification
# Version: v1.05
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.05 — 2026-04-07
- Kept the `v1.04` fire decay model and five visible fire levels
- Updated the visual direction to match the provided reference style
- Moved the interface toward an editorial desk / paper index feel
- Reduced rounded UI, bold hero styling, and glossy card treatment
- Switched to serif display typography with mono utility copy

### v1.04 — 2026-04-07
- Reworked fire heat to decay fully over 24 hours
- Changed heat from carry-forward score to live rolling decay from recent fires
- Expanded fire display to five visible levels plus none
- Raised the first visible threshold so a single fire does not surface a label

---

## 1. Product Overview

**Idea Commons** is a public feed of startup ideas where people can post, browse, and "fire" ideas to signal interest.

### V1 Features
1. Public idea feed
2. Idea detail page
3. Fire button
4. Anonymous posting
5. Fire-based hot/new ordering

### Product Principles
- Browsing must be instant and public
- Firing must take one click
- Posting must happen in one form submit
- One fire is weak signal and should fade out within one day
- Visible fire states should represent accumulating interest, not the first click
- The interface should feel like a calm paper workspace, not a glossy startup landing page

---

## 2. Fire Heat Algorithm

### Formula

```text
fire_contribution = max(0, 1 - age_in_hours / 24)

heat(now) = sum(fire_contribution for all unique fires on the idea)
```

### Behavior
- A fresh fire contributes `1.0`
- After 12 hours that same fire contributes `0.5`
- After 24 hours that same fire contributes `0`
- A single fire should decay out within one day if no one else fires the idea

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

## 3. Posting Model

- Required field: `idea` (10-100 chars)
- Optional field: `details` (0-2000 chars)
- No required contact info
- No preview step
- No email verification

---

## 4. Posting Anti-Abuse

- Signed post token
- Honeypot field
- Minimum submit time
- Posting rate limits
- Duplicate-content checks
- Optional Turnstile only for suspicious posting attempts

---

## 5. UI Direction

### Overall Feel
- Warm off-white page background
- Slightly darker paper cards
- Small mono utility labels
- Serif italic display heading
- Muted brown/stone text instead of hard black everywhere
- Black rectangular CTA for the primary action
- Minimal chrome, minimal border radius, almost no glossy effects

### Layout
- Narrow centered content column with generous whitespace
- Header should feel understated, almost like a section heading in a print layout
- Avoid large marketing hero blocks
- Feed should read like a neat board of paper slips

### Cards
- Square or lightly rounded corners, not pill-heavy
- Flat paper blocks with subtle border contrast
- Compact content density
- Small meta row at the bottom
- Fire state should read like a tag, not a glowing badge

### Typography
- Serif display for the main page heading
- Monospace for labels, timestamps, small metadata, and controls
- Sans or serif body is acceptable, but it should stay restrained and quiet

### Forms
- Textareas and inputs should feel utilitarian
- Optional details field should remain visually secondary
- Error states should stay muted and practical, not flashy

---

## 6. Definition of Done

- [ ] A single fire remains below the first visible fire level
- [ ] Fire heat decays out within 24 hours if no new fires arrive
- [ ] Feed and detail page use the five-level fire system
- [ ] The interface matches the paper/editorial tone of the reference image
- [ ] The page avoids glossy startup-landing visual patterns

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

function getFireState(heat: number): FireState {
  if (heat >= 9) return 'wildfire';
  if (heat >= 6) return 'blaze';
  if (heat >= 4) return 'flame';
  if (heat >= 2.5) return 'spark';
  if (heat >= 1.5) return 'ember';
  return 'none';
}
```

---

*End of build specification v1.05. Next amendment will be `build-v1-06.md`.*
