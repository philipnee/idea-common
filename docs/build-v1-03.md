# Idea Commons — Build Specification
# Version: v1.03
# Created: 2026-04-06
# Status: ACTIVE

---

## Changelog

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

### v1.01 — 2026-04-06
- Tightened V1 to the core browse/post/fire loop
- Removed email collection and email verification
- Removed view tracking and view-weighted heat
- Removed tags, markdown rendering, and masonry layout
- Removed the about page and other non-core pages
- Fire fingerprint is generated server-side only
- Simplified the fire spectrum to three visible states

### v1 — 2026-04-06
- Initial V1 specification draft

---

## 1. Product Overview

**Idea Commons** is a public feed of startup ideas where people can post, browse, and "fire" ideas to signal interest.

### V1 Features — The Complete List
1. Public idea feed
2. Idea detail page
3. Fire button (anonymous, one per person per idea)
4. Post an idea anonymously
5. Hot/New sorting driven by fire-based heat

**That is the whole V1. No extra product surfaces around it.**

### Product Principles
- Browsing must be instant and public
- Firing must take one click
- Posting must happen in one form submit, no inbox detour
- There is no preview step before publish
- The post form should feel closer to a tweet than an application form
- There is exactly one required user input: the idea itself
- Engagement signal comes from fires only
- V1 should block dumb bot traffic without making real users solve a CAPTCHA by default
- V1 is allowed to be imperfect as long as friction stays low for the first 1,000 posts

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
| Cron | Vercel Cron | Daily heat decay recalculation |
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

### Environment Rules
- `POST_TOKEN_SECRET` is required
- `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are optional in V1
- If Turnstile keys are missing, keep the rest of the anti-abuse flow active and skip challenge escalation

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

CREATE INDEX idx_ideas_heat ON ideas(heat DESC);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX idx_ideas_submit_key_created ON ideas(submit_key, created_at DESC);
CREATE INDEX idx_ideas_content_hash ON ideas(content_hash);
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

CREATE INDEX idx_fires_idea ON fires(idea_id);
CREATE INDEX idx_fires_created ON fires(created_at DESC);
```

### Short ID Generation

```typescript
import { customAlphabet } from 'nanoid';

const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);
```

### Notes
- Ideas are anonymous in V1
- `idea` is the only required user-supplied content field
- `details` is optional and plain text only
- `fire_count` is stored for query performance but never shown in the UI
- `submit_key` is internal only and used for posting rate limits
- `content_hash` is internal only and used for duplicate-content checks
- No `views` table
- No `daily_heat_log` table
- No email or verification fields

---

## 4. Fire Heat Algorithm

### Formula

```text
heat(today) = 0.3 * heat(yesterday) + log2(1 + unique_fires_today)
```

Where:
- `unique_fires_today` = distinct fingerprints that fired the idea in the last 24 hours
- Fires are the only engagement signal in V1

### Fire States

Users never see counts. They only see the state.

| Heat Range | Label | Visual |
|-----------|-------|--------|
| 0 - 0.5 | none | Show nothing |
| 0.5 - 2 | Warm | Small orange dot |
| 2 - 5 | Hot | Flame icon |
| 5+ | On Fire | Bright flame with subtle glow |

### Rules
- Do not show fire counts anywhere in the product
- A new idea starts with no indicator
- The first successful fire should update the state immediately
- Recalculate heat immediately on successful fire for that idea
- Run a daily cron to apply decay across all ideas

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
    4. Recalculate heat for that idea
  Response: { success: boolean, already_fired: boolean, fire_state: FireState }

POST /api/ideas
  Body: { idea, details?, post_token, website?, turnstile_token? }
  Process:
    1. Validate input fields
    2. Reject if honeypot `website` is non-empty
    3. Validate signed `post_token`
    4. Reject if token age is below 2 seconds
    5. Reject if token age is above 1 hour
    6. Derive `submit_key` from the request on the server
    7. Enforce posting rate limits for that `submit_key`
    8. Compute normalized `content_hash`
    9. Reject exact duplicates and obvious repeat submissions
    10. If suspicious mode is active and Turnstile is configured, verify `turnstile_token`
    11. Generate 8-char ID
    12. Insert idea directly as public
  Response: { id: string }
```

### Cron

```text
POST /api/cron/recalculate-heat
  Auth: CRON_SECRET header
  Process: recalculate heat for all ideas using fire-only formula
  Response: { updated: number }
```

### API Rules
- Never accept `fingerprint` from the client
- `GET /api/ideas/[id]` has no write side effects
- Return `404` for unknown idea IDs
- Return `400` for invalid anti-abuse checks
- Return `429` for posting rate limits
- Keep error copy plain and short

---

## 6. Pages & Routes

```text
/           - Homepage feed
/idea/[id]  - Idea detail page
/new        - Post a new idea
```

**No other visible pages in V1.**

### `/new` Page Rules
- Render the form server-side
- Include a hidden signed `post_token`
- Include a hidden honeypot field named `website`
- Do not show a preview step
- Do not show Turnstile by default
- Only reveal Turnstile if the server decides the request is suspicious and the feature is configured

---

## 7. UI Specifications

### Design Principles
- Dense and fast, not decorative
- No hero section
- No sidebars
- No masonry
- The feed should be easy to scan in seconds
- One primary action: `Post Idea`

### Homepage Layout

```text
+------------------------------------------------------+
| Idea Commons                           [Post Idea]   |
+------------------------------------------------------+
| [Hot] [New]                                           |
+------------------------------------------------------+
|                                                      |
| +------------------+  +------------------+           |
| | Hot              |  |                  |           |
| | AI for invoices  |  | Warm             |           |
| | 4 hours ago      |  | Birdsong ID app  |           |
| |                  |  | 2 days ago       |           |
| +------------------+  +------------------+           |
|                                                      |
| +------------------+  +------------------+           |
| |                  |  | On Fire          |           |
| | Tiny home swap   |  | Freelancer CRM   |           |
| | 1 hour ago       |  | 6 hours ago      |           |
| +------------------+  +------------------+           |
|                                                      |
|                  [Load more]                         |
+------------------------------------------------------+
```

### Feed Layout Rules
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Use a simple CSS grid, not masonry
- Default sort is `hot`

### Idea Card
- Entire card is clickable
- Show fire state only when heat is above `0.5`
- Show the short `idea` text and relative timestamp
- Do not show counts
- Do not show tags
- Do not show author identity
- Keep cards visually compact
- Cards should still scan well when the idea text is close to 100 characters

### Idea Detail Page
- Show the short `idea` text prominently
- Show fire state and relative timestamp
- If `details` exists, render it below the idea text as plain text
- If `details` is empty, do not show an empty section
- Show one primary CTA: `Fire this idea`
- After a successful fire, button changes to `Fired`
- If the viewer already fired, show the disabled fired state on page load
- Keep the URL short: `/idea/[id]`

### Post Page (`/new`)

Required field:
- `idea`

Optional field:
- `details`

Hidden fields:
- `post_token`
- `website`

Optional anti-abuse field:
- `turnstile_token`

Validation:
- Idea: required, 10-100 chars
- Details: optional, 0-2000 chars

Submission behavior:
1. User submits the form
2. Anti-abuse checks run on the server
3. If accepted, idea is created immediately
4. User is redirected to `/idea/[id]?posted=true`
5. Detail page may show a brief success banner: `Your idea is live`

### Posting Copy
- Primary placeholder: `A startup idea in 100 characters`
- Secondary helper text: `Keep it short. Add details only if they matter.`
- `details` should be collapsed or visually secondary so the short idea stays primary

---

## 8. Posting Anti-Abuse Guardrails

### Goal

Block simple scripted posting abuse while keeping normal posting friction close to zero.

### Guardrail 1: Signed Post Token

- `/new` must issue a signed `post_token` from the server
- The token should include:
  - issued-at timestamp
  - random nonce
  - signature using `POST_TOKEN_SECRET`
- `POST /api/ideas` must reject missing, invalid, expired, or malformed tokens

### Guardrail 2: Honeypot

- Include a hidden field named `website`
- Normal users never interact with it
- If it is non-empty on submit, reject the request

### Guardrail 3: Minimum Submit Time

- Measure form age from signed token issuance time
- Reject submissions faster than 2 seconds
- Accept that some false negatives may occur for bots that wait
- This is only meant to stop low-effort automation

### Guardrail 4: Posting Rate Limits

Use the derived `submit_key` and enforce:
- Max 3 successful posts per 10 minutes
- Max 10 successful posts per 24 hours

These limits are intentionally simple and conservative for V1.

### Guardrail 5: Duplicate-Content Checks

- Compute a normalized `content_hash` from lowercased, whitespace-collapsed `idea + details`
- Reject exact duplicates
- Also reject obvious repeat submissions of the same normalized content from the same `submit_key`

### Guardrail 6: Conditional Turnstile

- Do not show Turnstile by default
- Only require Turnstile after suspicious behavior, such as:
  - repeated anti-abuse failures
  - repeated duplicate attempts
  - exceeded soft posting thresholds
- If Turnstile is not configured, continue with the other guardrails and return a normal rejection

### Non-Goals

- This is not enterprise-grade abuse prevention
- This is not meant to stop determined attackers
- This is enough for the first 1,000 posts if friction stays low

---

## 9. Request Fingerprinting

Generate the request key on the server from the request. Do not ask the client for it and do not trust a client-provided value.

```typescript
import { createHash } from 'crypto';

function getRequestKey(request: Request): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  return createHash('sha256')
    .update(`${ip}::${ua}`)
    .digest('hex')
    .substring(0, 16);
}
```

Used for:
- Fire deduplication
- Posting rate limits
- Duplicate-attempt checks

Accepted V1 limitations:
- Different browsers/devices can look like different users
- Shared IP/User-Agent patterns can collide
- This is acceptable for the first 1,000 posts

---

## 10. Implementation Order

Five steps. Each step should leave the app deployable.

### Step 1: Project scaffold + core schema
- Initialize Next.js with TypeScript + Tailwind
- Set up Supabase
- Create `ideas` and `fires` tables
- Include `submit_key` and `content_hash` in `ideas`
- Set up environment variables
- Deploy empty app to Vercel
- **Commit example:** `[agent-name] feat: scaffold app and create core idea schema`

### Step 2: Public feed
- Build homepage
- Implement `GET /api/ideas`
- Add Hot/New sorting
- Build compact idea cards using the short `idea` field
- Add pagination with `Load more`
- **Commit example:** `[agent-name] feat: add public idea feed with hot and new sorting`

### Step 3: Idea detail + fire
- Build `/idea/[id]`
- Implement `GET /api/ideas/[id]`
- Implement `POST /api/ideas/[id]/fire`
- Add server-side request fingerprinting
- Add fire state UI and optimistic button behavior
- Add immediate per-idea heat recalculation
- **Commit example:** `[agent-name] feat: add idea detail page and anonymous fire flow`

### Step 4: Anonymous posting + anti-abuse
- Build `/new`
- Make `idea` the only required field
- Keep `details` optional
- Issue signed `post_token` from the server
- Add hidden honeypot field
- Implement `POST /api/ideas`
- Validate token age and signature
- Enforce posting rate limits
- Add duplicate-content checks
- Add conditional Turnstile path only if configured
- Redirect directly to the live idea page after create
- **Commit example:** `[agent-name] feat: add one-field posting with lightweight anti-abuse guards`

### Step 5: Heat cron + polish
- Build cron endpoint for daily heat decay
- Add loading and error states
- Add a basic 404 page
- Verify mobile layouts
- Run performance pass on the feed
- **Commit example:** `[agent-name] feat: add heat cron and launch polish`

---

## 11. Definition of Done

V1 is launch-ready when all of the following are true:

- [ ] Homepage loads in under 2 seconds on mobile
- [ ] Hot and New sorting work correctly
- [ ] Feed is readable and responsive on phone and desktop
- [ ] Idea detail page loads from `/idea/[8-char-id]`
- [ ] Fire button works without signup or email
- [ ] Fire button shows correct fired state on revisit
- [ ] Posting requires only the short `idea` field
- [ ] `details` is optional
- [ ] Posting publishes immediately with no preview or verification step
- [ ] `/new` issues a valid signed `post_token`
- [ ] Posting rejects missing, invalid, expired, or too-fast tokens
- [ ] Honeypot field rejects simple bot submissions
- [ ] Posting rate limits work for repeated attempts from the same `submit_key`
- [ ] Exact duplicate posts are rejected
- [ ] Turnstile is never shown to normal users by default
- [ ] No engagement counts are shown anywhere
- [ ] No console errors in production

---

## 12. Git Workflow

- `main` is the primary branch
- Keep the app deployable after each step
- Commit every agent-authored change immediately, even if incomplete

### Commit Format

```text
[agent-name] type: short description
```

Examples:
- `[codex] feat: add fire endpoint`
- `[claude] docs: tighten build spec`

---

## Appendix: Type Definitions

```typescript
interface Idea {
  id: string;
  idea: string;
  heat: number;
  created_at: string;
}

interface IdeaDetail extends Idea {
  details: string | null;
  fire_count: number; // internal only, never displayed
  updated_at: string;
}

type FireState = 'none' | 'warm' | 'hot' | 'on_fire';

function getFireState(heat: number): FireState {
  if (heat >= 5) return 'on_fire';
  if (heat >= 2) return 'hot';
  if (heat >= 0.5) return 'warm';
  return 'none';
}

function normalizeIdeaContent(input: {
  idea: string;
  details?: string | null;
}): string {
  return `${input.idea} ${input.details || ''}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

*End of build specification v1.03. Next amendment will be `build-v1-04.md`.*
