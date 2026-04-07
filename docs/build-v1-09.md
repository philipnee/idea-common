# Idea Commons — Build Specification
# Version: v1.09
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.09 — 2026-04-07
- Narrowed Gemini verification to the main `idea` field only
- Gemini verification now runs only when both model and API key are configured
- If either config value is missing, AI verification is skipped entirely

### v1.08 — 2026-04-07
- Replaced named fire tiers with a 0-5 fire-emoji scale
- Added a shareable public route at `/ideas/[hash]`
- Added automatic copy affordance after posting

---

## 1. Product Overview

**Idea Commons** is a public feed of ideas where people can post, browse, and fire ideas to signal interest.

---

## 2. Config

The app should have a central config module for runtime parameters.

### AI Verification Config
- Provider
- Model
- API key
- Request endpoint base

### AI Verification Rule
- If both Gemini model and API key are configured, run Gemini verification
- If either value is missing, skip Gemini verification
- Gemini verification should inspect only the main `idea` field

### Fire Config
- Decay window in hours
- Re-fire cooldown window in hours
- Emoji thresholds for 1 through 5 fire icons

Default params:
- `decay_window_hours = 24`
- `refire_cooldown_hours = 6`

---

## 3. Fire Heat Algorithm

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

---

## 4. Posting Model

### Fields
- `idea` required, 10-100 chars
- `details` optional, 0-2000 chars
- `external_link` optional, valid `http` or `https` URL only

### Copy
- Primary field label should be general, for example `What is this idea?`
- Primary button label should be `POST`

---

## 5. Input Verification

### Deterministic Checks
- length
- basic word count
- valid optional URL
- duplicate-content check

### Gemini Check
- Only run on the `idea` field
- Only run when Gemini model and API key are both configured
- If Gemini is skipped, posting should continue using deterministic checks only

The model should only answer:
- Is this obviously junk, gibberish, or meaningless placeholder text?

---

## 6. Share Links

- Every idea should be reachable at `/ideas/[hash]`
- After an idea is created, show the shareable `/ideas/[hash]` link
- Automatically copy the link to the clipboard when possible
- Also provide an explicit copy button

---

## 7. Definition of Done

- [ ] Gemini verification only runs when both model and API key are configured
- [ ] Gemini verification only evaluates the `idea` field
- [ ] Posting still works when Gemini verification is skipped
- [ ] Fire intensity is shown as 0-5 fire emoji
- [ ] Every idea is reachable at `/ideas/[hash]`
- [ ] A share link is shown and copied after posting

---

*End of build specification v1.09. Next amendment will be `build-v1-10.md`.*
