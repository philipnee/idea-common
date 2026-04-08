# Idea Commons — Build Specification
# Version: v1.26
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.26 — 2026-04-07
- Added three homepage tabs: `All`, `Lit`, and `New`
- Made `All` the default landing page
- Clarified that `Lit` is the hot feed and `New` is the newest-first feed
- Clarified that `All` should mix hot ideas, fresh ideas, and a larger random slice so the homepage feels alive
- Clarified that the `All` feed should reshuffle on refresh but stay stable while the current browsing session paginates
- Clarified that the mixed `All` feed should be derived in memory from the current idea set using a request-scoped seed, without persistent database churn

### v1.25 — 2026-04-07
- Clarified that every idea detail page should include a persistent share control
- Clarified that the share control should include a copy icon and copy the canonical idea URL
- Kept the post-publish share state, but no longer limited sharing controls to newly created ideas

### v1.24 — 2026-04-07
- Rebranded the public product from `Go Frieda` to `Litboard`
- Changed the public domain from `gofrieda.org` to `litboard.net`
- Removed the Frieda/dog/paw brand direction and replaced it with a match/fire motif
- Clarified that reaction intensity should render as 0-5 fire emoji
- Clarified that the reaction control should be a fire-icon button with no visible status text
- Removed the Frieda image requirement from the about page and replaced it with editable text-only brand narrative
- Clarified that dev seed data should include mocked fire counts, not mocked Frieda counts

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Brand Direction

- Public-facing UI should use the name `Litboard`
- The public domain is `litboard.net`
- The first page and site header should feature a prominent brand mark
- The current brand mark should be a match or fire motif
- The mark should feel clean and integrated into the page surface, not boxed-in or photo-like
- Do not show the previous tagline under the title
- Do not show `litboard.net` as visible header copy
- In dev mode, the home header should read `Litboard Dev mode`
- Remove Frieda, dog, and paw references from the public product language

---

## 3. Runtime Config

The app should have a central config module for runtime parameters.

### AI Verification Config
- Provider
- Model
- API key
- Request endpoint base

### Heat Config
- Daily carry factor
- View-weight coefficient
- Re-fire cooldown window in hours
- Emoji thresholds for 1 through 5 fire icons

Default params:
- `daily_carry_factor = 0.3`
- `view_weight = 0.2`
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

## 4. Heat Algorithm

```text
heat(today) = 0.3 × heat(yesterday)
            + log2(1 + unique_fires_today)
            + view_weight × log2(1 + unique_views_today)
```

Default:
- `view_weight = 0.2`

### Interaction Meaning
- A fire is an active endorsement
- A view is passive curiosity
- Views should contribute to heat but should not dominate fires

### Unique Counts
- `unique_fires_today` counts unique viewers who fired that idea on that day
- `unique_views_today` counts unique viewers who opened that idea detail page on that day

### Interaction Rule
- The same viewer may react to the same idea once every 6 hours
- On the detail page, the reaction control should render as a fire-icon button with no visible status text
- If the current viewer cannot react yet, do not show the reaction button at all

---

## 5. Homepage Feed Modes

- The homepage should expose three tabs:
  - `All`
  - `Lit`
  - `New`
- `All` is the default landing page
- `Lit` is the hot feed, ordered by heat
- `New` is the newest-first feed, ordered by creation time

### All Feed Mix
- `All` should feel varied and alive, not strictly algorithmic
- A simple target mix is:
  - `10%` from `Lit`
  - `10%` from `New`
  - `80%` from a random slice of the current idea pool
- The `All` feed should lightly interleave those sources instead of rendering as separate blocks
- Refreshing the page should produce a different `All` mix
- Pagination within the same browsing session should stay stable, so scrolling does not reorder the already-seen feed
- The `All` ordering should be derived in memory from the current idea set using a request-scoped seed
- Do not persist reshuffles or cause write-side database churn just to vary the homepage

### Feed Loading
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
- Every idea detail page should expose a share control for the canonical idea URL
- The share control should include a copy icon and copy the idea link without requiring a fresh post action

---

## 11. About Page

- Add an `/about` page
- Do not link it from the main content navigation or homepage body
- It may be reached through a floating secondary affordance
- That affordance should be a floating hamburger icon
- On hover or focus, the affordance should reveal the label `About`
- Load the about-page story text from a standalone text file in the repo
- That text file should hold the editable headline and body copy for the page
- Keep the story short, warm, and slightly playful
- The page should explain the site's purpose without distracting from the core posting flow
- Do not depend on mascot image assets for the about page

---

## 12. Dev And Prod Launch

- Add `dev.sh`
- `dev.sh` should use the dev database
- The dev database should be prepopulated with 50 ideas
- The dev seed should include mocked timestamps, mocked fire counts, and mocked view activity so the feed looks active
- Add a visible reset control in dev mode that restores the original 50 seeded ideas
- Add `run.sh`
- `run.sh` should use the prod database
- The prod database should start empty and should not be seeded

---

## 13. Share Links

- Every idea should be reachable at `/ideas/[hash]`
- Every idea detail page should show a shareable `/ideas/[hash]` link control
- The detail-page share control should support one-click copying with a copy icon
- After an idea is created, the share link may still be highlighted and copied automatically

---

## 14. Definition Of Done

- [ ] Public-facing UI uses the name `Litboard`
- [ ] The first page and site header include a prominent match/fire brand mark
- [ ] No homepage/header tagline is shown under the title
- [ ] `litboard.net` is not shown as visible header copy
- [ ] In dev mode, the home header reads `Litboard Dev mode`
- [ ] Reaction intensity is shown as 0-5 fire emoji
- [ ] Heat uses the daily carry formula with unique fires and unique views
- [ ] The view-weight coefficient is configurable and defaults to `0.2`
- [ ] Opening an idea detail page records a unique daily view
- [ ] The detail page reaction control shows only a fire icon and no visible status text
- [ ] The detail page reaction control is hidden while the viewer is on cooldown
- [ ] Runtime config exists for AI verification, heat, and tagging parameters
- [ ] Gemini verification only runs when both model and API key are configured
- [ ] Gemini verification only evaluates the `idea` field
- [ ] Posting still works when Gemini verification is skipped
- [ ] Posting supports optional `external_link`
- [ ] The homepage exposes `All`, `Lit`, and `New` tabs
- [ ] `All` is the default homepage tab
- [ ] `All` mixes hot, fresh, and random ideas with a request-scoped reshuffle seed
- [ ] Refreshing `All` gives a different mix while lazy loading stays stable within that session
- [ ] The homepage loads 20 ideas first, then lazy loads 5 at a time
- [ ] Feed diagnostics are hidden in prod
- [ ] `dev.sh` uses a seeded dev database with 50 ideas, mocked timestamps, mocked fire counts, and mocked views
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
- [ ] Every idea detail page includes a share control with one-click copy
- [ ] A post-publish share state is shown for newly created ideas
- [ ] `/about` exists and reads its narrative from a text file without depending on mascot images

---

*End of build specification v1.26. Next amendment will be `build-v1-27.md`.*
