# Idea Commons — Build Specification
# Version: v1.16
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.16 — 2026-04-07
- Removed the visible `gofrieda.org` text from the site header
- Added a floating hamburger affordance that reveals `About` on hover
- Clarified that the about page should stay out of the main content flow, but may be reached through the floating secondary affordance

### v1.15 — 2026-04-07
- Hid the reaction button whenever the current viewer is still on cooldown
- Tightened the default dog-emoji thresholds so 2 dogs takes more support

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
- Do not show `gofrieda.org` as visible header copy

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
- `emoji_thresholds = [0.6, 2.4, 4.5, 7, 10]`

---

## 4. Reaction Algorithm

```text
reaction_contribution = max(0, 1 - age_in_hours / decay_window_hours)

heat(now) = sum(reaction_contribution for all reaction events on the idea)
```

### Dog Emoji Scale

| Heat Range | Dog Icons |
|-----------|------------|
| 0 - 0.6 | 0 |
| 0.6 - 2.4 | 1 |
| 2.4 - 4.5 | 2 |
| 4.5 - 7 | 3 |
| 7 - 10 | 4 |
| 10+ | 5 |

### Interaction Rule
- The same viewer may react to the same idea once every 6 hours
- On the detail page, the reaction control should render as a dog-icon button with no visible status text
- If the current viewer cannot react yet, do not show the reaction button at all

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
- Do not link it from the main content navigation or homepage body
- It may be reached through a floating secondary affordance
- That affordance should be a floating hamburger icon
- On hover or focus, the affordance should reveal the label `About`
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
- [ ] `gofrieda.org` is not shown as visible header copy
- [ ] Reaction intensity is shown as 0-5 dog emoji
- [ ] The detail page reaction control shows only a dog icon and no visible status text
- [ ] The detail page reaction control is hidden while the viewer is on cooldown
- [ ] Runtime config exists for AI verification and reaction-decay parameters
- [ ] Gemini verification only runs when both model and API key are configured
- [ ] Gemini verification only evaluates the `idea` field
- [ ] Posting still works when Gemini verification is skipped
- [ ] Posting supports optional `external_link`
- [ ] Every idea is reachable at `/ideas/[hash]`
- [ ] A share link is shown and copied after posting
- [ ] `/about` exists, uses Frieda's image, and is reachable through a floating hamburger affordance

---

*End of build specification v1.16. Next amendment will be `build-v1-17.md`.*
