# Idea Commons — Build Specification
# Version: v1
# Created: 2026-04-06
# Status

---

## Changelog

### v1 — 2026-04-06
- Initial V1 specification
- Core features: idea feed (masonry grid), fire mechanic (spectrum, no counts), posting with email verification
- No accounts, no dashboard, no notifications, no SEO pages, no semantic search, no seed data
- Views contribute to heat formula
- Free-form tags, markdown pitch, 8-char short URLs

---

## 1. Product Overview

**Idea Commons** is a public feed of startup ideas where people can post, browse, and "fire" ideas to signal interest.

### V1 Features — The Complete List
1. Public idea feed (dynamic grid homepage)
2. Idea detail page (with markdown pitch)
3. Fire button (anonymous, one per person per idea)
4. Post an idea (email verification required, no account)
5. Heat algorithm (fires + views → spectrum label)

**That's it. Five features. Nothing else.**

### Explicitly NOT in V1
- No user accounts, no login, no signup
- No dashboard
- No email notifications
- No comments
- No profiles
- No SEO landing pages
- No admin panel
- No "remix" or "improve" features
- No categories page
- No semantic search (future feature)
- No seed data / AI-generated ideas

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | Full-stack, SSR, API routes |
| Language | TypeScript | Type safety |
| Database | Supabase (PostgreSQL) | Free tier, built-in auth not used but DB is solid |
| Email Verification | Resend | Send one verification email per post |
| Styling | Tailwind CSS | Fast |
| Deployment | Vercel | Free tier |
| Cron | Vercel Cron | Daily heat recalculation |

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
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
  tags TEXT[],
  author_email VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(64),
  heat FLOAT DEFAULT 0,
  fire_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ideas_heat ON ideas(heat DESC);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX idx_ideas_verified ON ideas(is_verified) WHERE is_verified = true;
```

### Table: `fires`

```sql
CREATE TABLE fires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id VARCHAR(8) REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_fingerprint VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, user_fingerprint)
);

CREATE INDEX idx_fires_idea ON fires(idea_id);
CREATE INDEX idx_fires_created ON fires(created_at);
```

### Table: `daily_heat_log`

```sql
CREATE TABLE daily_heat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id VARCHAR(8) REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  unique_fires INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  heat_value FLOAT DEFAULT 0,
  UNIQUE(idea_id, date)
);

CREATE INDEX idx_heat_log_idea_date ON daily_heat_log(idea_id, date DESC);
```

### Table: `views`

```sql
CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id VARCHAR(8) REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_fingerprint VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, user_fingerprint)
);

CREATE INDEX idx_views_idea ON views(idea_id);
```

### Short ID Generation

```typescript
// Generate 8-character alphanumeric ID
// Uses lowercase + digits for URL friendliness
// Collision check on insert, regenerate if exists

import { customAlphabet } from 'nanoid';

const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

// Example output: "a1b2c3d4"
// URL: ideacommons.co/idea/a1b2c3d4
```

### Notes
- `id` is 8 chars, no dashes, lowercase alphanumeric (36^8 = 2.8 trillion possible IDs)
- `author_email` is stored but NEVER displayed publicly
- `is_verified` defaults to false; flips to true when verification link is clicked
- `verification_token` is a random 64-char hex string, cleared after verification
- `tags` is a PostgreSQL text array, stored from comma-separated input
- `fire_count` and `view_count` are denormalized counters for query performance
- Views are deduplicated by fingerprint (one view per person per idea)

---

## 4. Fire Heat Algorithm

### Updated Formula (fires + views)

```
heat(today) = α × heat(yesterday) + log2(1 + unique_fires_today) + 0.3 × log2(1 + unique_views_today)
```

Where:
- `α = 0.3` (decay factor)
- `unique_fires_today` = distinct fingerprints that fired today
- `unique_views_today` = distinct fingerprints that viewed the detail page today
- Views contribute at 0.3x weight of fires (seeing is weaker signal than firing)

### Fire Spectrum

Seven tiers. Users NEVER see numbers. Only the label and visual.

| Heat Range | Label | Visual Treatment |
|-----------|-------|-----------------|
| 0 – 0.3 | — | Nothing shown. Invisible. No indicator at all. |
| 0.3 – 1.0 | Ash | Faint gray smoke wisp. Barely visible. |
| 1.0 – 2.5 | Ember | Dim warm orange dot. Quiet glow. |
| 2.5 – 4.5 | Spark | Small flame icon, warm orange. |
| 4.5 – 7.0 | Flame | Bright flame, orange-red. Confident. |
| 7.0 – 10.0 | Blaze | Large flame with outer glow. Hot. |
| 10.0 – 15.0 | Inferno | Intense red-orange flame, pulsing glow. |
| 15.0+ | Wildfire | Animated fire, spreading flames effect. Unmissable. |

### Display Rules
- NEVER show fire count (no "23 fires" anywhere)
- NEVER show view count
- NEVER show any number related to engagement
- Only show the fire spectrum label + visual indicator
- New ideas with zero activity show NOTHING (no "Ash" label, no empty state)
- The first view or fire moves it to "Ash" — even that tiny signal is something
- On the idea detail page, show the spectrum label prominently but still no count

### Immediate Heat Update (don't wait for cron)

When someone fires an idea:
1. Increment `fire_count` in DB
2. Recalculate heat for ONLY that idea in real-time (lightweight)
3. This ensures the spectrum label updates immediately, not after 24hrs

The daily cron still runs for global recalculation and decay.

---

## 5. API Routes

### Public

```
GET  /api/ideas
  Query: sort ("hot" | "new"), page (default 1), limit (default 30)
  Returns only verified ideas (is_verified = true)
  Response: { ideas: Idea[], total: number, page: number }

GET  /api/ideas/[id]
  Returns single idea (must be verified)
  Side effect: record view (insert into views table, deduplicated by fingerprint)
  Side effect: increment view_count on idea
  Side effect: recalculate heat for this idea
  Response: { idea: IdeaDetail }

POST /api/ideas/[id]/fire
  Body: { fingerprint: string }
  Side effect: insert fire (deduplicated)
  Side effect: increment fire_count
  Side effect: recalculate heat for this idea
  Response: { success: boolean, already_fired: boolean }

POST /api/ideas
  Body: { title, one_liner, pitch, tags, email }
  Process:
    1. Validate all fields
    2. Generate 8-char ID (check for collision)
    3. Parse tags (comma split, lowercase, trim, max 5)
    4. Generate verification_token (random 64-char hex)
    5. Insert idea with is_verified = false
    6. Send verification email via Resend
    7. Return idea ID and "check your email" message
  Response: { id: string, message: "Check your email to publish" }

GET  /api/verify/[token]
  Process:
    1. Find idea with matching verification_token
    2. Set is_verified = true
    3. Clear verification_token
    4. Redirect to /idea/[id] with success message
```

### Cron

```
POST /api/cron/recalculate-heat
  Auth: CRON_SECRET header
  Process: recalculate heat for all verified ideas using formula
  Log results to daily_heat_log
  Response: { updated: number }
```

---

## 6. Pages & Routes

```
/                    — Homepage: dynamic grid of ideas
/idea/[id]           — Idea detail page (8-char ID)
/new                 — Post a new idea form
/about               — What is Idea Commons (simple, one page)
/api/verify/[token]  — Email verification redirect (not a visible page)
```

**No login page. No dashboard. No settings. No profile. No search page.**

---

## 7. UI Specifications

### Design Principles
- Clean, warm, alive — not corporate, not ugly
- The grid of idea cards IS the product. Make it feel like browsing a bazaar.
- Fire spectrum is visual and felt, not numerical
- Mobile: single column, full-width cards
- Tablet: 2 columns
- Desktop: 3-4 columns, dynamic masonry layout
- Cards have varying heights based on content length → masonry fills gaps

### Color Palette

```css
:root {
  --bg-primary: #FDFBF7;
  --bg-card: #FFFFFF;
  --text-primary: #1A1A1A;
  --text-secondary: #6B6B6B;
  --text-muted: #9CA3AF;
  --border: #E5E5E5;
  --accent: #EA580C;

  /* Fire spectrum colors */
  --fire-ash: #9CA3AF;
  --fire-ember: #D97706;
  --fire-spark: #EA580C;
  --fire-flame: #DC2626;
  --fire-blaze: #B91C1C;
  --fire-inferno: #991B1B;
  --fire-wildfire: #7F1D1D;
}
```

### Homepage Layout

```
┌──────────────────────────────────────────────────────────┐
│  🔥 idea commons                          [post idea]  │
├──────────────────────────────────────────────────────────┤
│  [hot]  [new]                                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐ ┌───────────────┐ ┌──────────┐            │
│  │ 🔥 Spark │ │               │ │ Ash      │            │
│  │          │ │ 🔥🔥 Blaze    │ │          │            │
│  │ AI sched │ │               │ │ Tiny     │            │
│  │ for free │ │ Shazam but    │ │ homes    │            │
│  │ lancers  │ │ for bird      │ │ rental   │            │
│  │          │ │ songs — point │ │ market   │            │
│  │ Never    │ │ your phone    │ │          │            │
│  │ double.. │ │ at any bird   │ │ Airbnb.. │            │
│  │          │ │ sound and     │ │          │            │
│  │ #saas    │ │ instantly     │ │ #market  │            │
│  │ #tools   │ │ identify the  │ │ #housing │            │
│  └──────────┘ │ species       │ └──────────┘            │
│               │               │ ┌──────────┐            │
│  ┌──────────┐ │ #consumer     │ │          │            │
│  │          │ │ #nature #ai   │ │ Invoic.. │            │
│  │ 🔥 Flame │ └───────────────┘ │          │            │
│  │ ...      │                   │ #fintech │            │
│  └──────────┘                   └──────────┘            │
│                                                          │
│               [ load more ]                              │
└──────────────────────────────────────────────────────────┘
```

**Masonry Grid Implementation:**
- Use CSS `columns` property (simplest, no JS needed) OR
- Use CSS Grid with `grid-auto-rows: 1px` + JS to measure card heights OR
- Use a lightweight masonry library (e.g., react-masonry-css — 2KB)
- Recommended: CSS columns approach for V1 (simplest, good enough)

```css
.idea-grid {
  columns: 1;
  column-gap: 1rem;
}

@media (min-width: 640px) {
  .idea-grid { columns: 2; }
}

@media (min-width: 1024px) {
  .idea-grid { columns: 3; }
}

@media (min-width: 1280px) {
  .idea-grid { columns: 4; }
}

.idea-card {
  break-inside: avoid;
  margin-bottom: 1rem;
}
```

### Idea Card

```
┌──────────────────────┐
│ 🔥 Spark             │  ← fire spectrum label + icon (or nothing if below threshold)
│                      │
│ AI scheduling for    │  ← title (bold, prominent)
│ freelancers          │
│                      │
│ Never double-book    │  ← one-liner (muted color)
│ a client again.      │
│                      │
│ #saas #scheduling    │  ← tags (small, muted)
│ 4 hours ago          │  ← relative timestamp
└──────────────────────┘
```

**Card Rules:**
- Entire card is clickable → links to /idea/[id]
- Fire spectrum label: only show if heat > 0.3 (otherwise nothing)
- NO fire count. NO view count. NO numbers of any kind.
- Tags shown as small muted text with # prefix
- Timestamp as relative ("4 hours ago", "2 days ago")
- Card height varies naturally based on title/one-liner length → masonry fills gaps
- Hover: subtle shadow lift

### Idea Detail Page

```
┌──────────────────────────────────────────────┐
│ ← back                                       │
├──────────────────────────────────────────────┤
│                                              │
│  AI scheduling for freelancers               │  ← title (large)
│  Never double-book a client again.           │  ← one-liner
│                                              │
│  🔥🔥 Spark                                  │  ← spectrum label, prominent
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │                                          ││
│  │  Freelancers waste an average of 4       ││  ← pitch (markdown rendered)
│  │  hours per week on scheduling.           ││
│  │                                          ││
│  │  **The problem:**                        ││
│  │  Calendly doesn't understand project     ││
│  │  context. You end up with back-to-back   ││
│  │  calls that leave no time for deep work. ││
│  │                                          ││
│  │  **The idea:**                           ││
│  │  An AI scheduler that understands your   ││
│  │  work patterns and protects focus time.  ││
│  │                                          ││
│  └──────────────────────────────────────────┘│
│                                              │
│  #saas  #scheduling  #ai                     │  ← tags
│  Posted 4 hours ago                          │  ← timestamp
│                                              │
│          [ 🔥 Fire this idea ]               │  ← fire button
│                                              │
│  ─────────────────────────────────────────── │
│  Share this idea: ideacommons.co/idea/a1b2c3 │  ← permanent short link
│                                              │
└──────────────────────────────────────────────┘
```

**Fire Button States:**
1. Default: `[ 🔥 Fire this idea ]` — clickable
2. After click: `[ 🔥 Fired! ]` — disabled, warm background, brief scale animation
3. On revisit (already fired): `[ 🔥 Fired ]` — disabled state

**Markdown Rendering:**
- Use `react-markdown` with `remark-gfm` for GitHub-flavored markdown
- Allowed: headings, bold, italic, lists, links, code blocks, blockquotes
- Disallowed: images, HTML, iframes (sanitize)
- Style markdown content with Tailwind Typography plugin (`prose` class)

### Post Idea Page (`/new`)

```
┌──────────────────────────────────────────────┐
│ Post your idea                               │
├──────────────────────────────────────────────┤
│                                              │
│ Title                                        │
│ ┌──────────────────────────────────────────┐ │
│ │ e.g. "Shazam for bird songs"             │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ One-liner                                    │
│ ┌──────────────────────────────────────────┐ │
│ │ e.g. "Point your phone at any bird..."   │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Full pitch (supports markdown)               │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │ Describe the problem, the solution,      │ │
│ │ and why this could work.                 │ │
│ │                                          │ │
│ │ You can use **bold**, *italic*,          │ │
│ │ - bullet lists                           │ │
│ │ and other markdown formatting.           │ │
│ │                                     0/5k │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Tags (comma separated)                       │
│ ┌──────────────────────────────────────────┐ │
│ │ e.g. saas, scheduling, ai               │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Your email (for verification only — never    │
│ shown publicly)                              │
│ ┌──────────────────────────────────────────┐ │
│ │ you@example.com                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│         [ Submit idea ]                      │
│                                              │
└──────────────────────────────────────────────┘
```

**After submit (success page / state):**
```
┌──────────────────────────────────────────────┐
│                                              │
│  ✓ Almost there!                             │
│                                              │
│  We sent a verification link to              │
│  you@example.com                             │
│                                              │
│  Click the link in the email to make         │
│  your idea public.                           │
│                                              │
│  Your idea will live at:                     │
│  ideacommons.co/idea/a1b2c3d4                │
│                                              │
│  [ ← Back to ideas ]                        │
│                                              │
└──────────────────────────────────────────────┘
```

**Validation Rules:**
- Title: required, 3-100 characters
- One-liner: required, 10-200 characters
- Pitch: required, 50-5000 characters
- Tags: optional, comma-separated, each tag 2-30 chars, max 5 tags, auto-lowercase, trim whitespace
- Email: required, valid email format

### Email Verification Flow

**Service: Resend** (https://resend.com)
- Free tier: 100 emails/day, 3000/month
- Simple API: one POST request to send
- No account system needed — just transactional email

**Verification email:**

```
From: ideas@ideacommons.co
Subject: Verify your idea on Idea Commons

Hey,

Click below to publish your idea:

  "[idea title]"

[Verify and publish →]
(links to: https://ideacommons.co/api/verify/[token])

This link expires in 24 hours.

If you didn't submit this idea, ignore this email.

— Idea Commons
```

**Verification flow:**
1. User submits idea → idea saved with `is_verified = false`
2. Verification email sent with unique token
3. User clicks link → hits `/api/verify/[token]`
4. API sets `is_verified = true`, clears token
5. Redirects to `/idea/[id]` with query param `?verified=true`
6. Idea detail page shows brief success banner: "Your idea is now live! 🔥"
7. Token expires after 24 hours (cron cleans up unverified ideas older than 24h)

**Unverified ideas:**
- Never shown in feed
- Never returned by search
- Never accessible via direct URL (return 404)
- Cleaned up by cron after 24 hours

---

## 8. Fingerprinting

Same as v1.0.0 — SHA-256 of IP + User-Agent.

```typescript
import { createHash } from 'crypto';

function getFingerprint(request: Request): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return createHash('sha256').update(`${ip}::${ua}`).digest('hex').substring(0, 16);
}
```

Note: truncate to 16 chars (still 16^16 = 18 quintillion possibilities, plenty unique).

Used for:
- Fire deduplication (one fire per fingerprint per idea)
- View deduplication (one view per fingerprint per idea)
- Never stored as raw IP/UA — only the hash

---

## 9. About Page (`/about`)

Simple, one-page, no frills.

```
# Idea Commons

A public feed of startup ideas.

**Browse** ideas freely. No signup needed.
**Fire** the ones worth building.
**Post** your own idea — takes 60 seconds.

The fire indicator shows how much interest an idea is getting.
It's not a like count — it's a heat signal based on
sustained attention from real people over time.

Ideas start invisible. As people notice them, they warm up:
ash → ember → spark → flame → blaze → inferno → wildfire.

That's it. No comments, no profiles, no noise.
Just ideas and signal.

Built by [your name/handle].
```

---

## 10. Implementation Order

Six steps. Each one is a deployable state.

### Step 1: Project scaffold + database
- Initialize Next.js with TypeScript + Tailwind
- Set up Supabase project
- Run all CREATE TABLE migrations
- Install dependencies: nanoid, react-markdown, remark-gfm
- Deploy empty app to Vercel
- **Commit:** `feat: scaffold Next.js project with Supabase schema and dependencies`

### Step 2: Idea feed with masonry grid
- Build homepage with dynamic masonry grid layout
- Build idea card component (title, one-liner, tags, timestamp, fire spectrum)
- Implement GET /api/ideas with pagination and sorting (hot/new)
- Sort tabs: hot (by heat desc) and new (by created_at desc)
- Only return verified ideas
- Mobile: 1 col, tablet: 2 col, desktop: 3-4 col
- "Load more" button for pagination
- **Commit:** `feat: implement masonry idea feed with hot/new sorting and responsive grid`

### Step 3: Idea detail page + view tracking
- Build /idea/[id] page
- Render pitch as markdown (react-markdown + remark-gfm)
- Display fire spectrum label (no counts)
- Display tags, relative timestamp
- Show permanent short link (ideacommons.co/idea/[id])
- Record view on page load (deduplicated by fingerprint)
- Increment view_count
- Return 404 for unverified or non-existent ideas
- **Commit:** `feat: add idea detail page with markdown rendering and view tracking`

### Step 4: Fire button + heat algorithm
- Build fire API endpoint (POST /api/ideas/[id]/fire)
- Fingerprint-based deduplication
- Fire button component with optimistic UI and animation
- Implement heat formula (fires + views weighted)
- Real-time heat recalculation on fire and view
- Heat-to-spectrum label mapping
- Fire spectrum visual indicators on cards and detail page
- Build cron endpoint for daily global heat recalculation
- Set up Vercel cron schedule
- **Commit:** `feat: implement fire mechanic with heat algorithm and spectrum display`

### Step 5: Post an idea + email verification
- Build /new page with form (title, one-liner, pitch, tags, email)
- Client-side validation
- Server-side validation + sanitization
- 8-char ID generation with collision check
- Tag parsing (comma split, lowercase, trim, max 5)
- Generate verification token
- Save idea as unverified
- Send verification email via Resend
- Build /api/verify/[token] endpoint
- Redirect to idea page on successful verification
- Success banner on idea page when ?verified=true
- Post-submit confirmation page ("check your email")
- Cron: clean up unverified ideas older than 24 hours
- **Commit:** `feat: add idea posting with email verification`

### Step 6: Polish + launch prep
- About page
- Proper 404 page
- Loading states and error handling on all pages
- Favicon and og:image
- Site-wide meta tags (title, description, og tags)
- Validate all pages on mobile
- Performance check (< 2s load time)
- **Commit:** `feat: add about page, error handling, meta tags, and launch polish`

---

## 11. Definition of Done (V1 Launch Ready)

- [ ] Homepage loads masonry grid in < 2 seconds on mobile
- [ ] Grid is responsive: 1 col mobile, 2 tablet, 3-4 desktop
- [ ] Hot and New sort tabs work correctly
- [ ] Fire spectrum labels display correctly for all 7 tiers
- [ ] No engagement numbers shown anywhere (no counts, no stats)
- [ ] Fire button works without any account
- [ ] Fire button shows fired state on revisit (fingerprint check)
- [ ] Posting requires email and sends verification email
- [ ] Verification email link makes idea public
- [ ] Unverified ideas are never visible
- [ ] Pitch renders markdown correctly
- [ ] Tags are free-form, comma-separated, stored as array
- [ ] Short URLs work (ideacommons.co/idea/[8chars])
- [ ] About page exists
- [ ] No console errors in production
- [ ] Works on mobile Safari and Chrome

---

## 12. Git Workflow

- `main` — production
- `dev` — active development
- Feature branches: `feat/fire-button`, `feat/posting`, etc.

**Commit format:**
```
type: short description

What changed and why.
```

**After each step:** commit, push, verify Vercel preview, merge to main.

---

## Appendix: Type Definitions

```typescript
interface Idea {
  id: string;                    // 8-char alphanumeric
  title: string;
  one_liner: string;
  tags: string[];
  heat: number;
  created_at: string;
}

interface IdeaDetail extends Idea {
  pitch: string;                 // raw markdown
  view_count: number;            // internal only, never displayed
  fire_count: number;            // internal only, never displayed
  updated_at: string;
}

interface FireResponse {
  success: boolean;
  already_fired: boolean;
}

interface CreateIdeaInput {
  title: string;
  one_liner: string;
  pitch: string;
  tags: string;                  // raw comma-separated string from form
  email: string;
}

type FireSpectrum =
  | 'none'       // heat < 0.3
  | 'ash'        // 0.3 – 1.0
  | 'ember'      // 1.0 – 2.5
  | 'spark'      // 2.5 – 4.5
  | 'flame'      // 4.5 – 7.0
  | 'blaze'      // 7.0 – 10.0
  | 'inferno'    // 10.0 – 15.0
  | 'wildfire';  // 15.0+

function getFireSpectrum(heat: number): FireSpectrum {
  if (heat >= 15) return 'wildfire';
  if (heat >= 10) return 'inferno';
  if (heat >= 7) return 'blaze';
  if (heat >= 4.5) return 'flame';
  if (heat >= 2.5) return 'spark';
  if (heat >= 1) return 'ember';
  if (heat >= 0.3) return 'ash';
  return 'none';
}
```

---

*End of build specification v1 (DRAFT). Next amendment will be `build-v1-01.md`.*
