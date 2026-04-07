# Idea Commons — Build Specification
# Version: v1.14
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.14 — 2026-04-07
- Removed the homepage/header tagline `Put your ideas out there`
- Replaced public reaction emoji from fire to dog: `🐶`
- Added a hidden `/about` page using Frieda's image and a short site-origin narrative
- Clarified that the about page should not be linked in the primary UI

### v1.13 — 2026-04-07
- Replaced the public header mascot image with a paw-print mark
- Clarified that the brand mark can be typographic or emoji-based instead of image-based
- Kept the mark prominent, but smaller and cleaner than the prior photo treatment

---

## 1. Product Overview

**Go Frieda** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Brand Direction

- Public-facing UI should use the name `Go Frieda`
- The public domain is `gofrieda.org`
- The first page and site header should feature a prominent brand mark
- The current brand mark should be a paw print: `🐾`
- The mark should feel clean and integrated into the page surface, not boxed-in or photo-like
- Do not show the previous tagline under the title

---

## 3. Runtime Config

The app should have a central config module for runtime parameters.

### AI Verification Config
- Provider
- Model
- API key
- Request endpoint base

### Reaction Config
- Decay window in hours
- Re-fire cooldown window in hours
- Emoji thresholds for 1 through 5 dog icons

Default params:
- `decay_window_hours = 24`
- `refire_cooldown_hours = 6`
- `emoji_thresholds = [0.5, 1.5, 3, 5, 8]`

---

## 4. Reaction Algorithm

```text
reaction_contribution = max(0, 1 - age_in_hours / decay_window_hours)

heat(now) = sum(reaction_contribution for all reaction events on the idea)
```

### Dog Emoji Scale

| Heat Range | Dog Icons |
|-----------|------------|
| 0 - 0.5 | 0 |
| 0.5 - 1.5 | 1 |
| 1.5 - 3 | 2 |
| 3 - 5 | 3 |
| 5 - 8 | 4 |
| 8+ | 5 |

### Interaction Rule
- The same viewer may react to the same idea once every 6 hours
- On the detail page, the reaction control should render as a dog-icon button with no visible status text

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

## 7. About Page

- Add an `/about` page
- Do not link it from the primary navigation or homepage
- Use Frieda's image in the intro
- Explain that Frieda is the creator's sister's golden retriever
- Keep the story short, warm, and slightly playful
- The page should explain the site's purpose without distracting from the core posting flow

---

## 8. Share Links

- Every idea should be reachable at `/ideas/[hash]`
- After an idea is created, show the shareable `/ideas/[hash]` link
- Automatically copy the link to the clipboard when possible
- Also provide an explicit copy button

---

## 9. Definition of Done

- [ ] Public-facing UI uses the name `Go Frieda`
- [ ] The first page and site header include a prominent paw-print brand mark
- [ ] No homepage/header tagline is shown under the title
- [ ] Reaction intensity is shown as 0-5 dog emoji
- [ ] The detail page reaction control shows only a dog icon and no visible status text
- [ ] Runtime config exists for AI verification and reaction-decay parameters
- [ ] Gemini verification only runs when both model and API key are configured
- [ ] Gemini verification only evaluates the `idea` field
- [ ] Posting still works when Gemini verification is skipped
- [ ] Posting supports optional `external_link`
- [ ] Every idea is reachable at `/ideas/[hash]`
- [ ] A share link is shown and copied after posting
- [ ] `/about` exists, uses Frieda's image, and is not linked in the main UI

---

*End of build specification v1.14. Next amendment will be `build-v1-15.md`.*
