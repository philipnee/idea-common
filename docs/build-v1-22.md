# Idea Commons — Build Specification
# Version: v1.22
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.22 — 2026-04-07
- Clarified that feed cards should show a short excerpt from the idea details as the main hook beneath the title
- Removed the redundant `IDEA` card label from the product direction
- Clarified that the feed should show stronger visual heat differentiation across card temperatures
- Clarified that `loaded` feed diagnostics should not appear in prod
- Clarified that dev tags on cards should be visually subdued and should not add repetitive filler labels
- Clarified that the detail page should give multi-paragraph idea details more visual breathing room
- Clarified that external links on the detail page should render as explicit clickable source links only when present

### v1.21 — 2026-04-07
- Moved the internal tagging taxonomy into a standalone text file so it can be edited without changing code
- Added config for the taxonomy file path
- Added config for tagging timeout with a default of `5000ms`
- Clarified that keyword fallback matching should be configurable and optional

### v1.20 — 2026-04-07
- Added hidden metadata tagging for ideas using two internal labels: `kind` and `topic`
- Clarified that tags are for future search and filtering only and are not part of the public UI
- Added best-effort Gemini tagging with deterministic fallback and no posting failure when tagging fails
- Added dev-only tag visibility so the generated metadata can be inspected locally
- Added a nightly tag-backfill route for untagged ideas

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
- In dev mode, the home header should read `Go Frieda Dev mode`

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

### Store Config
- Dev mode and prod mode should use separate database files
- The active store path should be configurable so scripts can choose the correct database
- Generated dev and prod database files are runtime artifacts and should not be committed

### Tagging Config
- Taxonomy file path
- Tagging timeout in milliseconds
- Gemini-on-create enabled behavior
- Keyword fallback enabled behavior

Default params:
- `tagging_timeout_ms = 5000`
- `keyword_fallback_enabled = true`

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

## 5. Feed Loading

- Show 20 ideas on the first homepage render
- After that, lazy load 5 additional ideas at a time
- Lazy loading may be triggered by scroll visibility instead of a page navigation link
- Feed diagnostics like `loaded` are dev-only and should not appear in prod

---

## 6. Posting Model

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

## 7. Input Verification

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

## 8. Hidden Metadata Tags

- Each idea may carry two internal labels:
  - `kind`
  - `topic`
- These labels are hidden metadata for future search and filtering
- These labels should not be shown in the normal public UI
- In dev mode only, the generated labels should be visible so the metadata can be inspected
- Dev-mode feed cards should keep tag rendering visually subdued and avoid repetitive filler labels like `untagged` on every card

### Taxonomy Source
- The internal taxonomy must live in a standalone text file in the repo
- The app config should point to the taxonomy file path
- The taxonomy file should be easy to edit by hand
- Gemini and keyword fallback should both read from the same taxonomy source

### Tagging Behavior
- Tagging should be best-effort only
- Posting must still succeed if tag generation fails
- If Gemini config is present, Gemini should try to classify the idea into one `kind` and one `topic`
- Gemini must choose from the fixed vocabulary loaded from the taxonomy file
- Gemini tagging should use a configurable timeout
- If Gemini is unavailable, times out, or returns invalid output, use the keyword matcher only when keyword fallback is enabled
- If keyword fallback is disabled or cannot confidently classify the idea, save it without tags

### Nightly Backfill
- Add a cron route that tags untagged ideas
- This route should only backfill missing tags
- This route should not block or affect normal posting

---

## 9. Feed Card Presentation

- Feed cards should not all feel visually identical
- Card temperature should be easy to scan from the feed at a glance
- Different heat levels should use meaningfully different borders, surfaces, and emphasis
- Cards should show the idea title and a short excerpt from `details`
- The excerpt should be the first non-empty paragraph or line from `details`, trimmed for feed length
- Do not show a redundant `IDEA` label on every card

---

## 10. Idea Detail Presentation

- Longer idea details should have enough visual breathing room for two or three paragraphs
- Preserve paragraph breaks cleanly
- If `external_link` is present, show it as an explicit clickable source link
- Do not show an external-link badge when no link exists

---

## 11. About Page

- Add an `/about` page
- Do not link it from the main content navigation or homepage body
- It may be reached through a floating secondary affordance
- That affordance should be a floating hamburger icon
- On hover or focus, the affordance should reveal the label `About`
- Use Frieda's image in the intro
- Load the about-page story text from a standalone text file in the repo
- That text file should hold the editable headline and body copy for the page
- Keep the story short, warm, and slightly playful
- The page should explain the site's purpose without distracting from the core posting flow

---

## 12. Dev And Prod Launch

- Add `dev.sh`
- `dev.sh` should use the dev database
- The dev database should be prepopulated with 50 ideas
- The dev seed should include mocked timestamps and mocked Frieda counts so the feed looks active
- Add a visible reset control in dev mode that restores the original 50 seeded ideas
- Add `run.sh`
- `run.sh` should use the prod database
- The prod database should start empty and should not be seeded

---

## 13. Share Links

- Every idea should be reachable at `/ideas/[hash]`
- After an idea is created, show the shareable `/ideas/[hash]` link
- Automatically copy the link to the clipboard when possible
- Also provide an explicit copy button

---

## 14. Definition Of Done

- [ ] Public-facing UI uses the name `Go Frieda`
- [ ] The first page and site header include a prominent paw-print brand mark
- [ ] No homepage/header tagline is shown under the title
- [ ] `gofrieda.org` is not shown as visible header copy
- [ ] In dev mode, the home header reads `Go Frieda Dev mode`
- [ ] Reaction intensity is shown as 0-5 dog emoji
- [ ] The detail page reaction control shows only a dog icon and no visible status text
- [ ] The detail page reaction control is hidden while the viewer is on cooldown
- [ ] Runtime config exists for AI verification and reaction-decay parameters
- [ ] Gemini verification only runs when both model and API key are configured
- [ ] Gemini verification only evaluates the `idea` field
- [ ] Posting still works when Gemini verification is skipped
- [ ] Posting supports optional `external_link`
- [ ] The homepage loads 20 ideas first, then lazy loads 5 at a time
- [ ] Feed diagnostics are hidden in prod
- [ ] `dev.sh` uses a seeded dev database with 50 ideas, mocked timestamps, and mocked Frieda counts
- [ ] Dev mode has a reset control that restores the seeded dataset
- [ ] `run.sh` uses a separate empty prod database
- [ ] Generated dev and prod database files are treated as runtime artifacts
- [ ] Each idea can carry hidden `kind` and `topic` metadata
- [ ] Hidden metadata tags are only shown in dev mode
- [ ] The tagging taxonomy lives in a standalone text file
- [ ] The taxonomy file path is configurable
- [ ] Gemini tagging is best-effort and never blocks posting
- [ ] Gemini tagging timeout is configurable and defaults to `5000ms`
- [ ] Keyword fallback is configurable
- [ ] A nightly cron route can backfill missing tags
- [ ] Feed cards show a short `details` excerpt
- [ ] Feed cards have clear visual temperature variation by heat level
- [ ] Feed cards do not show the redundant `IDEA` label
- [ ] Detail page gives longer details clean paragraph spacing
- [ ] External links render as explicit clickable source links only when present
- [ ] Every idea is reachable at `/ideas/[hash]`
- [ ] A share link is shown and copied after posting
- [ ] `/about` exists, uses Frieda's image, and reads its narrative from a text file

---

*End of build specification v1.22. Next amendment will be `build-v1-23.md`.*
