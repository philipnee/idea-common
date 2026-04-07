# Idea Commons — Build Specification
# Version: v1.08
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.08 — 2026-04-07
- Replaced named fire tiers with a 0-5 fire-emoji scale
- Added a shareable public route at `/ideas/[hash]`
- Added automatic copy affordance after posting
- Kept central runtime config for AI verification and fire parameters
- Kept AI-assisted junk screening and optional external link support

### v1.07 — 2026-04-07
- Added a central config file for AI verification and fire decay parameters
- Added lightweight AI-assisted input screening for obviously bad submissions
- Added an optional `external_link` field to ideas

---

## 1. Product Overview

**Idea Commons** is a public feed of ideas where people can post, browse, and fire ideas to signal interest.

### Product Principles
- Browsing must be instant and public
- Firing must take one click
- Posting must happen in one form submit
- The product should support any kind of idea, not just startup ideas
- Basic verification should block obvious junk without over-policing weird but real ideas
- Heat should read as simple fire intensity, not taxonomy

---

## 2. Config

The app should have a central config module for runtime parameters.

### AI Verification Config
- Provider
- Model
- API key
- Request endpoint base
- Fallback behavior when the key is missing

### Fire Config
- Decay window in hours
- Re-fire cooldown window in hours
- Emoji thresholds for 1 through 5 fire icons

Default params:
- `decay_window_hours = 24`
- `refire_cooldown_hours = 6`

---

## 3. Fire Heat Algorithm

### Formula

```text
fire_contribution = max(0, 1 - age_in_hours / decay_window_hours)

heat(now) = sum(fire_contribution for all fire events on the idea)
```

### Behavior
- A fresh fire contributes `1.0`
- After 12 hours that same fire contributes `0.5`
- After 24 hours that same fire contributes `0`
- A single fire should decay out within one day if no one else fires the idea
- The same person may add a new fire event to the same idea once every 6 hours

### Fire Emoji Scale

| Heat Range | Fire Icons |
|-----------|------------|
| 0 - 0.5 | 0 |
| 0.5 - 1.5 | 1 |
| 1.5 - 3 | 2 |
| 3 - 5 | 3 |
| 5 - 8 | 4 |
| 8+ | 5 |

### Rules
- Show no fire icons when nobody is clicking the idea
- Show between 1 and 5 fire icons when heat is present
- Five fire icons should feel like a real surge
- Do not show fire counts anywhere

---

## 4. Fire UI

### Detail Page
- Fire control should be icon-only
- No `Fired`
- No `Back at ...`
- No cooldown text next to the fire control
- A muted icon-only cooldown state is enough

### Feed and Detail Display
- Replace labels like `Ember` or `Blaze` with repeated fire emoji display
- Cards may still tint based on fire intensity, but the primary signal is the emoji count

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

The model should only answer:
- Is this obviously junk, gibberish, or meaningless placeholder text?

It should not judge whether the idea is good.

---

## 7. Share Links

### Public Route
- Every idea should be reachable at `/ideas/[hash]`
- The short hash may reuse the existing idea identifier

### Post-Create Flow
- After an idea is created, show the shareable `/ideas/[hash]` link
- Automatically copy the link to the clipboard when possible
- Also provide an explicit copy button

---

## 8. Definition of Done

- [ ] Runtime config for AI verification and fire params lives in one place
- [ ] Posting supports `idea`, `details`, and `external_link`
- [ ] Invalid external links are rejected
- [ ] Obvious junk input is rejected by basic verification
- [ ] Fire intensity is shown as 0-5 fire emoji
- [ ] The fire button is icon-only on the detail page
- [ ] No cooldown text is shown next to the fire button
- [ ] Every idea is reachable at `/ideas/[hash]`
- [ ] A share link is shown and copied after posting
- [ ] `POST` is the submit button label

---

*End of build specification v1.08. Next amendment will be `build-v1-09.md`.*
