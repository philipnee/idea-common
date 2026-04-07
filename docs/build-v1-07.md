# Idea Commons — Build Specification
# Version: v1.07
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.07 — 2026-04-07
- Added a central config file for AI verification and fire decay parameters
- Added lightweight AI-assisted input screening for obviously bad submissions
- Added an optional `external_link` field to ideas
- Updated the post form language from startup-specific copy to general idea language
- Changed the fire control to icon-only with no cooldown text on the detail page
- Kept the 6-hour re-fire window and state-based card tinting

### v1.06 — 2026-04-07
- Allowed the same person to fire the same idea again after 6 hours
- Replaced awkward `Fired` copy with emoji-first fire controls
- Added fire-state color coding to idea cards

---

## 1. Product Overview

**Idea Commons** is a public feed of ideas where people can post, browse, and fire ideas to signal interest.

### Product Principles
- Browsing must be instant and public
- Firing must take one click
- Posting must happen in one form submit
- The product should support any kind of idea, not just startup ideas
- Basic verification should block obvious junk without over-policing weird but real ideas

---

## 2. Config

The app should have a central config module for runtime parameters.

### AI Verification Config
- Provider
- Model
- API key
- Request endpoint base
- Toggle or fallback behavior when the key is missing

### Fire Config
- Decay window in hours
- Re-fire cooldown window in hours
- Fire-state thresholds

These values should be read from one config file and consumed by the heat and verification logic.

---

## 3. Fire Heat Algorithm

### Formula

```text
fire_contribution = max(0, 1 - age_in_hours / decay_window_hours)

heat(now) = sum(fire_contribution for all fire events on the idea)
```

### Default Params
- `decay_window_hours = 24`
- `refire_cooldown_hours = 6`

### Fire States

| Heat Range | Label |
|-----------|-------|
| 0 - 1.5 | none |
| 1.5 - 2.5 | Ember |
| 2.5 - 4 | Spark |
| 4 - 6 | Flame |
| 6 - 9 | Blaze |
| 9+ | Wildfire |

---

## 4. Fire UI

### Detail Page
- Fire control should be icon-only
- No `Fired`
- No `Back at ...`
- No cooldown text next to the fire control
- A disabled or muted icon state is enough during cooldown

### Recommended Icon
- `🔥`

---

## 5. Posting Model

### Fields
- `idea` required, 10-100 chars
- `details` optional, 0-2000 chars
- `external_link` optional, valid `http` or `https` URL only

### Copy
- Primary field label should be general, for example `What is this idea?`
- Do not describe it as a startup idea
- Primary button label should be `POST`
- Do not show contact-related warning copy if there is no contact field

---

## 6. Input Verification

### Goal

Reject obvious junk such as keyboard mash, repeated placeholder text, or empty-value spam while allowing terse but real ideas.

### Method

Use a lightweight model such as Gemini Flash Lite when configured.

### Rules
- Run deterministic checks first:
  - length
  - basic word count
  - valid optional URL
  - duplicate-content check
- Then run a lightweight AI screening pass when configured
- If the model is unavailable, fall back to deterministic checks instead of breaking posting

### AI Screening Contract

The model should answer a narrow question:
- Is this obviously junk, gibberish, or meaningless placeholder text?

It should not try to judge whether the idea is good.

---

## 7. Definition of Done

- [ ] Runtime config for AI verification and fire params lives in one place
- [ ] Posting supports `idea`, `details`, and `external_link`
- [ ] Invalid external links are rejected
- [ ] Obvious junk input is rejected by basic verification
- [ ] The fire button is icon-only on the detail page
- [ ] No `Back at ...` cooldown text is shown
- [ ] `POST` is the submit button label

---

*End of build specification v1.07. Next amendment will be `build-v1-08.md`.*
