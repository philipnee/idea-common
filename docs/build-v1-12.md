# Idea Commons — Build Specification
# Version: v1.12
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.12 — 2026-04-07
- Changed the public product name from `Freeda` to `Go Frieda`
- Added the public domain context `gofrieda.org`
- Made the mascot mark a primary, larger homepage/header element
- Added homepage/header supporting copy: `Put your ideas out there`

### v1.11 — 2026-04-07
- Changed the public product name from `Idea Commons` to `Freeda`
- Added a dog mascot icon on the first page and site chrome
- Kept `Idea Commons` as the internal code name only

---

## 1. Product Overview

**Go Frieda** is a public feed of ideas where people can post, browse, and fire ideas to signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Brand Direction

- Public-facing UI should use the name `Go Frieda`
- The public domain is `gofrieda.org`
- The first page and site header should feature the dog mascot prominently
- The mascot should feel like a recognizable brand mark, not generic clip art
- The header should include supporting copy under the main title: `Put your ideas out there`

---

## 3. Runtime Config

The app should have a central config module for runtime parameters.

### AI Verification Config
- Provider
- Model
- API key
- Request endpoint base

### Fire Config
- Decay window in hours
- Re-fire cooldown window in hours
- Emoji thresholds for 1 through 5 fire icons

Default params:
- `decay_window_hours = 24`
- `refire_cooldown_hours = 6`
- `emoji_thresholds = [0.5, 1.5, 3, 5, 8]`

---

## 4. Fire Heat Algorithm

```text
fire_contribution = max(0, 1 - age_in_hours / decay_window_hours)

heat(now) = sum(fire_contribution for all fire events on the idea)
```

### Fire Emoji Scale

| Heat Range | Fire Icons |
|-----------|------------|
| 0 - 0.5 | 0 |
| 0.5 - 1.5 | 1 |
| 1.5 - 3 | 2 |
| 3 - 5 | 3 |
| 5 - 8 | 4 |
| 8+ | 5 |

### Interaction Rule
- The same viewer may fire the same idea once every 6 hours
- On the detail page, the fire control should render as a fire-icon button with no visible status text

---

## 5. Posting Model

### Fields
- `idea` required, 10-100 chars
- `details` optional, 0-2000 chars
- `external_link` optional, valid `http` or `https` URL only

### Copy
- Primary field label should be `What is this idea?`
- Primary submit button label should be `POST`
- Do not mention startup-specific framing
- Do not show contact-info warning copy, since there is no contact field in V1

---

## 6. Input Verification

### Deterministic Checks
- length
- basic word count
- valid optional URL
- duplicate-content check
- obvious placeholder or gibberish rejection

### Gemini Check
- Only run on the `idea` field
- Only run when Gemini model and API key are both configured
- If the config is missing, invalid, or the verification call fails, skip Gemini verification
- If Gemini is skipped, posting should continue using deterministic checks only

The model should only answer:
- Is this obviously junk, gibberish, or meaningless placeholder text?

---

## 7. Share Links

- Every idea should be reachable at `/ideas/[hash]`
- After an idea is created, show the shareable `/ideas/[hash]` link
- Automatically copy the link to the clipboard when possible
- Also provide an explicit copy button

---

## 8. Definition of Done

- [ ] Public-facing UI uses the name `Go Frieda`
- [ ] The first page and site header include a large dog mascot mark
- [ ] Header supporting copy reads `Put your ideas out there`
- [ ] Runtime config exists for AI verification and fire-decay parameters
- [ ] Gemini verification only runs when both model and API key are configured
- [ ] Gemini verification only evaluates the `idea` field
- [ ] Posting still works when Gemini verification is skipped
- [ ] Posting supports optional `external_link`
- [ ] Fire intensity is shown as 0-5 fire emoji
- [ ] Idea cards are tinted by fire intensity
- [ ] Every idea is reachable at `/ideas/[hash]`
- [ ] A share link is shown and copied after posting
- [ ] The detail page fire control shows only a fire icon and no visible status text

---

*End of build specification v1.12. Next amendment will be `build-v1-13.md`.*
