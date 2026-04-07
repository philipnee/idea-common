# Idea Commons — Build Specification
# Version: v1.04
# Created: 2026-04-07
# Status: ACTIVE

---

## Changelog

### v1.04 — 2026-04-07
- Reworked fire heat to decay fully over 24 hours
- Changed heat from carry-forward score to live rolling decay from recent fires
- Expanded fire display to five visible levels plus none
- Raised the first visible threshold so a single fire does not surface a label
- Updated UI and API expectations to use the new fire states

### v1.03 — 2026-04-06
- Changed posting to a single required short `idea` field
- Made long-form `details` optional instead of required
- Removed all other required user-supplied posting metadata
- Updated feed, detail, API, schema, and validation to match the shorter posting model

### v1.02 — 2026-04-06
- Kept V1 to the core browse/post/fire loop
- Added lightweight posting anti-abuse guardrails
- Added signed post token issued from `/new`
- Added honeypot field and minimum submit-time check
- Added posting rate limits using a server-derived submit key
- Added duplicate-content rejection using normalized content hash
- Added optional Turnstile only for suspicious posting attempts
- Explicitly kept direct publish with no preview step

---

## 1. Product Overview

**Idea Commons** is a public feed of startup ideas where people can post, browse, and "fire" ideas to signal interest.

### V1 Features — The Complete List
1. Public idea feed
2. Idea detail page
3. Fire button (anonymous, one per person per idea)
4. Post an idea anonymously
5. Hot/New sorting driven by fire-based heat

### Product Principles
- Browsing must be instant and public
- Firing must take one click
- Posting must happen in one form submit, no inbox detour
- There is no preview step before publish
- The post form should feel closer to a tweet than an application form
- There is exactly one required user input: the idea itself
- Engagement signal comes from fires only
- A single fire is a weak signal and should fade out within a day
- Visible fire states should represent accumulating interest, not the first click
- V1 should block dumb bot traffic without making real users solve a CAPTCHA by default

### Explicitly NOT in V1
- No user accounts, login, signup, or profiles
- No email collection or verification
- No dashboard
- No comments
- No search
- No SEO landing pages
- No admin panel
- No moderation tooling beyond manual database cleanup
- No tags or categories
- No markdown formatting
- No view tracking
- No edit/delete flow
- No seed data
- No about page
- No mandatory preview step
- No always-on CAPTCHA for every post

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | Full-stack, SSR, API routes |
| Language | TypeScript | Type safety |
| Database | Supabase (PostgreSQL) | Fast setup, hosted Postgres |
| Styling | Tailwind CSS | Fast implementation |
| Deployment | Vercel | Simple deploys |
| Cron | Vercel Cron | Periodic heat sync |
| Conditional Bot Challenge | Cloudflare Turnstile (optional) | Only used for suspicious posting attempts |

### Environment Variables

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
POST_TOKEN_SECRET=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://ideacommons.co
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

---

## 3. Database Schema

### Table: `ideas`

```sql
CREATE TABLE ideas (
  id VARCHAR(8) PRIMARY KEY,
  idea VARCHAR(100) NOT NULL,
  details TEXT,
  heat FLOAT DEFAULT 0,
  fire_count INTEGER DEFAULT 0,
  submit_key VARCHAR(16) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `fires`

```sql
CREATE TABLE fires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id VARCHAR(8) REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_fingerprint VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, user_fingerprint)
);
```

### Notes
- Ideas are anonymous in V1
- `idea` is the only required user-supplied content field
- `details` is optional and plain text only
- `fire_count` is stored for query performance but never shown in the UI
- `heat` stores the latest synced score, but live reads should recompute from recent fires
- `submit_key` is internal only and used for posting rate limits
- `content_hash` is internal only and used for duplicate-content checks

---

## 4. Fire Heat Algorithm

### Formula

Each fire contributes a value that linearly decays to zero over 24 hours:

```text
fire_contribution = max(0, 1 - age_in_hours / 24)

heat(now) = sum(fire_contribution for all unique fires on the idea)
```

### Heat Behavior

- A fresh fire contributes `1.0`
- After 12 hours that same fire contributes `0.5`
- After 24 hours that same fire contributes `0`
- A single fire should decay out within one day if no one else fires the idea
- Heat should be recalculated from live fire timestamps when the app reads or updates an idea

### Fire States

Users never see counts. They only see the state.

| Heat Range | Label | Visual |
|-----------|-------|--------|
| 0 - 1.5 | none | Show nothing |
| 1.5 - 2.5 | Ember | Small dim orange dot |
| 2.5 - 4 | Spark | Small flame icon |
| 4 - 6 | Flame | Bright orange-red flame |
| 6 - 9 | Blaze | Larger flame with glow |
| 9+ | Wildfire | Strong red flame with stronger glow |

### Rules
- Do not show fire counts anywhere in the product
- A new idea starts with no indicator
- A single fire should not surface a visible label
- The second or third close-together fire should be enough to make the idea visibly warm up
- Recalculate heat immediately on successful fire for that idea
- Cron exists to resync persisted heat, not to define the visible decay behavior

---

## 5. API Routes

### Public

```text
GET  /api/ideas
  Query: sort ("hot" | "new"), page (default 1), limit (default 30, max 50)
  Response: { ideas: Idea[], page: number, has_more: boolean }

GET  /api/ideas/[id]
  Response: { idea: IdeaDetail, viewer_has_fired: boolean }

POST /api/ideas/[id]/fire
  Body: none
  Process:
    1. Generate fingerprint from the request on the server
    2. Insert into fires with UNIQUE(idea_id, user_fingerprint)
    3. If inserted, increment ideas.fire_count
    4. Recalculate live heat for that idea
  Response: { success: boolean, already_fired: boolean, fire_state: FireState }
```

### Cron

```text
POST /api/cron/recalculate-heat
  Auth: CRON_SECRET header
  Process: recalculate and persist heat for all ideas from live fire timestamps
  Response: { updated: number }
```

---

## 6. Pages & Routes

```text
/           - Homepage feed
/idea/[id]  - Idea detail page
/new        - Post a new idea
```

---

## 7. UI Specifications

### Feed Layout Rules
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Use a simple CSS grid, not masonry
- Default sort is `hot`

### Idea Card
- Entire card is clickable
- Show fire state only when heat is above `1.5`
- Show the short `idea` text and relative timestamp
- Do not show counts
- Do not show tags
- Do not show author identity
- Keep cards visually compact

### Idea Detail Page
- Show the short `idea` text prominently
- Show fire state and relative timestamp
- If `details` exists, render it below the idea text as plain text
- If `details` is empty, do not show an empty section
- Show one primary CTA: `Fire this idea`
- After a successful fire, button changes to `Fired`
- If the viewer already fired, show the disabled fired state on page load

---

## 8. Posting Anti-Abuse Guardrails

- Signed post token
- Honeypot field
- Minimum submit time
- Posting rate limits
- Duplicate-content checks
- Optional Turnstile only for suspicious posting attempts

---

## 9. Request Fingerprinting

Generate the request key on the server from the request. Do not ask the client for it and do not trust a client-provided value.

Used for:
- Fire deduplication
- Posting rate limits
- Duplicate-attempt checks

---

## 10. Implementation Order

1. Scaffold app and core schema
2. Build public feed
3. Build idea detail and anonymous fire flow
4. Build anonymous posting with anti-abuse
5. Add heat sync and polish

---

## 11. Definition of Done

- [ ] Homepage loads in under 2 seconds on mobile
- [ ] Hot and New sorting work correctly
- [ ] Feed is readable and responsive on phone and desktop
- [ ] Idea detail page loads from `/idea/[8-char-id]`
- [ ] Fire button works without signup or email
- [ ] Fire button shows correct fired state on revisit
- [ ] A single fire is below the first visible fire label
- [ ] Fire heat decays out within 24 hours if no new fires arrive
- [ ] Posting requires only the short `idea` field
- [ ] `details` is optional
- [ ] Posting publishes immediately with no preview or verification step
- [ ] No engagement counts are shown anywhere

---

## 12. Git Workflow

- `main` is the primary branch
- Keep the app deployable after each step
- Commit every agent-authored change immediately, even if incomplete

### Commit Format

```text
[agent-name] type: short description
```

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

*End of build specification v1.04. Next amendment will be `build-v1-05.md`.*
