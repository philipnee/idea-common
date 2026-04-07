# Idea Commons — Build Specification
# Version: v1.01
# Created: 2026-04-06
# Status: ACTIVE

---

## Changelog

### v1.01 — 2026-04-06
- Tightened V1 to the core browse/post/fire loop
- Removed email collection and email verification
- Removed view tracking and view-weighted heat
- Removed tags, markdown rendering, and masonry layout
- Removed the about page and other non-core pages
- Fire fingerprint is generated server-side only
- Simplified the fire spectrum to three visible states
- Assumption for V1: accept lightweight abuse risk for the first 1,000 posts

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

**That is the whole V1. No extra systems around it.**

### Product Principles
- Browsing must be instant and public
- Firing must take one click
- Posting must happen in one form submit, no inbox detour
- Engagement signal should come from fires only
- V1 optimizes for speed and clarity, not abuse prevention

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

### Environment Variables

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://ideacommons.co
```

---

## 3. Database Schema

### Table: `ideas`

```sql
CREATE TABLE ideas (
  id VARCHAR(8) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  one_liner VARCHAR(200) NOT NULL,
  pitch TEXT NOT NULL,
  heat FLOAT DEFAULT 0,
  fire_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ideas_heat ON ideas(heat DESC);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
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
- `pitch` is plain text, not markdown
- `fire_count` is stored for query performance but never shown in the UI
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
  Body: { title, one_liner, pitch }
  Process:
    1. Validate input
    2. Generate 8-char ID
    3. Insert idea directly as public
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

---

## 6. Pages & Routes

```text
/           - Homepage feed
/idea/[id]  - Idea detail page
/new        - Post a new idea
```

**No other visible pages in V1.**

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
| | AI scheduler...  |  | Warm             |           |
| | Never double...  |  | Bird song app... |           |
| | 4 hours ago      |  | 2 days ago       |           |
| +------------------+  +------------------+           |
|                                                      |
| +------------------+  +------------------+           |
| |                  |  | On Fire          |           |
| | Tiny homes...    |  | Invoice tool...  |           |
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
- Show title, one-liner, and relative timestamp
- Do not show counts
- Do not show tags
- Do not show author identity
- Keep cards visually compact

### Idea Detail Page
- Show title, one-liner, fire state, pitch, and relative timestamp
- Render `pitch` as plain text with paragraph breaks preserved
- Show one primary CTA: `Fire this idea`
- After a successful fire, button changes to `Fired`
- If the viewer already fired, show the disabled fired state on page load
- Keep the URL short: `/idea/[id]`

### Post Page (`/new`)

Fields:
- `title`
- `one_liner`
- `pitch`

Validation:
- Title: required, 3-100 chars
- One-liner: required, 10-200 chars
- Pitch: required, 30-5000 chars

Submission behavior:
1. User submits the form
2. Idea is created immediately
3. User is redirected to `/idea/[id]?posted=true`
4. Detail page may show a brief success banner: `Your idea is live`

---

## 8. Fingerprinting

Generate the fingerprint on the server from the request. Do not ask the client for it and do not trust a client-provided value.

```typescript
import { createHash } from 'crypto';

function getFingerprint(request: Request): string {
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
- Determining `viewer_has_fired` on the idea detail page

Accepted V1 limitations:
- Different browsers/devices can fire the same idea separately
- Shared IP/User-Agent patterns can collide
- This is acceptable for the first 1,000 posts

---

## 9. Implementation Order

Five steps. Each step should leave the app deployable.

### Step 1: Project scaffold + core schema
- Initialize Next.js with TypeScript + Tailwind
- Set up Supabase
- Create `ideas` and `fires` tables
- Set up environment variables
- Deploy empty app to Vercel
- **Commit example:** `[agent-name] feat: scaffold app and create core idea schema`

### Step 2: Public feed
- Build homepage
- Implement `GET /api/ideas`
- Add Hot/New sorting
- Build compact idea cards
- Add pagination with `Load more`
- **Commit example:** `[agent-name] feat: add public idea feed with hot and new sorting`

### Step 3: Idea detail + fire
- Build `/idea/[id]`
- Implement `GET /api/ideas/[id]`
- Implement `POST /api/ideas/[id]/fire`
- Add server-side fingerprinting
- Add fire state UI and optimistic button behavior
- Add immediate per-idea heat recalculation
- **Commit example:** `[agent-name] feat: add idea detail page and anonymous fire flow`

### Step 4: Anonymous posting
- Build `/new`
- Implement `POST /api/ideas`
- Validate inputs on client and server
- Redirect directly to the live idea page after create
- **Commit example:** `[agent-name] feat: add anonymous idea posting flow`

### Step 5: Heat cron + polish
- Build cron endpoint for daily heat decay
- Add loading and error states
- Add a basic 404 page
- Verify mobile layouts
- Run performance pass on the feed
- **Commit example:** `[agent-name] feat: add heat cron and launch polish`

---

## 10. Definition of Done

V1 is launch-ready when all of the following are true:

- [ ] Homepage loads in under 2 seconds on mobile
- [ ] Hot and New sorting work correctly
- [ ] Feed is readable and responsive on phone and desktop
- [ ] Idea detail page loads from `/idea/[8-char-id]`
- [ ] Fire button works without signup or email
- [ ] Fire button shows correct fired state on revisit
- [ ] Posting requires only title, one-liner, and pitch
- [ ] Posting publishes immediately with no verification step
- [ ] No engagement counts are shown anywhere
- [ ] No console errors in production

---

## 11. Git Workflow

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
  title: string;
  one_liner: string;
  heat: number;
  created_at: string;
}

interface IdeaDetail extends Idea {
  pitch: string;
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
```

---

*End of build specification v1.01. Next amendment will be `build-v1-02.md`.*
