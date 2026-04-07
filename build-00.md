# Idea Commons — Build Specification v1
# Version: v1.0.0
# Created: 2026-04-06
# Status: INITIAL SPEC

---

## Changelog

### v1.0.0 — 2026-04-06
- Initial V1 specification
- Core features: idea feed, idea cards, fire mechanic, posting flow, email auth
- Fire heat algorithm defined
- Database schema defined
- API routes defined
- UI/UX requirements defined

---

## 1. Product Overview

**Idea Commons** is a public feed of startup ideas where people can post, browse, and "fire" ideas to signal interest. It is Craigslist for startup ideas — radically simple, zero-friction, and alive.

### Core Thesis
- Posting an idea should take 60 seconds
- People should feel their idea entered circulation
- Lightweight social signal (fire) matters more than comments
- No signup required to browse or fire
- Posting requires email authentication

### V1 Scope — What We Build
- Public idea feed (homepage)
- Idea detail page
- Fire button with heat algorithm
- Post an idea flow (email auth required)
- Semantic search ("What's your problem?")
- Basic creator dashboard (my ideas + fire stats)
- Email notification: "Your idea just got fired"
- SEO category pages

### V1 Scope — What We Do NOT Build
- Comments
- User profiles / public profiles
- Follow / unfollow
- Direct messaging
- "Remix this idea" / "Propose a better idea"
- "I'd build this" / "I'd pay for this" signals
- Admin dashboard
- Moderation AI (manual moderation in V1)
- Mobile app

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | Full-stack, SSR for SEO, API routes built-in |
| Language | TypeScript | Type safety across stack |
| Database | Supabase (PostgreSQL) | Free tier, built-in auth, pgvector for search |
| Auth | Supabase Auth (magic link email) | Zero-password, minimal friction |
| Vector Search | pgvector (via Supabase) | Semantic search without separate service |
| Embeddings | OpenAI text-embedding-3-small | Cost-effective, high quality |
| Email | Resend | Transactional emails (fire notifications, magic links) |
| Styling | Tailwind CSS | Rapid UI development |
| Deployment | Vercel | Free tier, automatic deploys from git |
| Analytics | Plausible or Umami (self-hosted) | Privacy-friendly, simple |
| Cron Jobs | Vercel Cron or GitHub Actions | Daily heat recalculation |

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
```

---

## 3. Database Schema

### Table: `ideas`

```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  one_liner VARCHAR(200) NOT NULL,
  pitch TEXT NOT NULL,
  category VARCHAR(50),
  author_id UUID REFERENCES users(id),
  is_seed BOOLEAN DEFAULT false,
  heat FLOAT DEFAULT 0,
  fire_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ideas_heat ON ideas(heat DESC);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_embedding ON ideas USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Table: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `fires`

```sql
CREATE TABLE fires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_fingerprint VARCHAR(64) NOT NULL,
  user_id UUID REFERENCES users(id),
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
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  unique_fires INTEGER DEFAULT 0,
  heat_value FLOAT DEFAULT 0,
  UNIQUE(idea_id, date)
);

CREATE INDEX idx_heat_log_idea_date ON daily_heat_log(idea_id, date DESC);
```

### Notes on Schema
- `user_fingerprint`: SHA-256 hash of IP + User-Agent for anonymous fire tracking. This prevents duplicate fires from the same browser without requiring login.
- `is_seed`: Marks AI-generated seed ideas so they can be labeled differently in the UI.
- `embedding`: 1536-dimension vector from OpenAI text-embedding-3-small, generated from concatenation of title + one_liner + pitch.
- `heat`: Recalculated daily by cron job using the fire formula.

---

## 4. Fire Heat Algorithm

### Formula

```
heat(today) = α × heat(yesterday) + log2(1 + unique_fires_today)
```

Where:
- `α = 0.3` (decay factor — aggressive, rewards freshness)
- `unique_fires_today` = count of distinct `user_fingerprint` values that fired this idea today

### Cron Job: `recalculate-heat`

Runs daily at 00:00 UTC.

```
For each idea:
  1. Count unique fires from the past 24 hours
  2. new_heat = 0.3 * current_heat + log2(1 + unique_fires_today)
  3. Update ideas.heat = new_heat
  4. Insert row into daily_heat_log for historical tracking
  5. Update ideas.fire_count = total fires for this idea (all time)
```

### Heat-to-Label Mapping

| Heat Range | Label | CSS Class | Visual |
|-----------|-------|-----------|--------|
| 0 – 0.5 | (none) | `heat-none` | No indicator shown |
| 0.5 – 2 | Ember | `heat-ember` | Small dim orange dot |
| 2 – 4 | Spark | `heat-spark` | Small flame icon, warm orange |
| 4 – 7 | Flame | `heat-flame` | Bright flame icon, orange-red |
| 7 – 10 | Burn | `heat-burn` | Flame with outer glow effect |
| 10+ | Wildfire | `heat-wildfire` | Animated flame, red-orange pulse |

### Rules
- New ideas start with heat = 0 and show NO fire indicator (no "0 fires" shame)
- First fire on any idea triggers the "Ember" state immediately (don't wait for cron)
- One user_fingerprint can only fire an idea once (UNIQUE constraint)
- Real-time fire count displayed on cards updates via optimistic UI (increment on click, revalidate on next page load)

---

## 5. API Routes

### Public (no auth required)

```
GET    /api/ideas                    — List ideas (paginated, sorted by heat or recency)
  Query params:
    sort: "hot" | "new" (default: "hot")
    category: string (optional filter)
    page: number (default: 1)
    limit: number (default: 20, max: 50)
  Returns: { ideas: Idea[], total: number, page: number }

GET    /api/ideas/[id]               — Get single idea with full pitch
  Returns: { idea: IdeaDetail }

POST   /api/ideas/[id]/fire          — Fire an idea
  Body: { fingerprint: string }
  Returns: { success: boolean, fire_count: number }
  Rules:
    - Check UNIQUE(idea_id, fingerprint)
    - If duplicate, return { success: false, already_fired: true }
    - On success, increment ideas.fire_count
    - On success, trigger notification to idea author (async)

GET    /api/search                   — Semantic search
  Query params:
    q: string (natural language query)
    limit: number (default: 5, max: 10)
  Process:
    1. Generate embedding from query using OpenAI
    2. Query pgvector for nearest neighbors by cosine similarity
    3. If top result similarity < 0.5, flag as "weak match"
    4. Return results with similarity scores
  Returns: { results: SearchResult[], has_strong_match: boolean }

GET    /api/ideas/categories         — List all categories with idea counts
  Returns: { categories: { name: string, count: number }[] }
```

### Protected (auth required)

```
POST   /api/ideas                    — Create a new idea
  Body: {
    title: string (max 100 chars),
    one_liner: string (max 200 chars),
    pitch: string (max 5000 chars),
    category: string (optional)
  }
  Process:
    1. Validate input
    2. Generate embedding from title + one_liner + pitch
    3. Insert into ideas table
    4. Return created idea
  Returns: { idea: IdeaDetail }

GET    /api/me/ideas                 — Get current user's ideas with fire stats
  Returns: { ideas: IdeaWithStats[] }

GET    /api/me/stats                 — Get current user's aggregate stats
  Returns: { total_ideas: number, total_fires: number, hottest_idea: Idea | null }
```

### Cron / Internal

```
POST   /api/cron/recalculate-heat    — Daily heat recalculation
  Auth: Vercel cron secret or API key
  Process: Run heat algorithm for all ideas
  Returns: { updated: number }
```

---

## 6. Pages & Routes

### Public Pages

```
/                           — Homepage: idea feed
/idea/[id]                  — Idea detail page
/idea/[id]/[slug]           — Idea detail with SEO-friendly slug
/search                     — Search results page
/ideas/[category]           — Category landing page (SEO)
/login                      — Magic link login
/about                      — Simple about page
```

### Protected Pages

```
/dashboard                  — Creator dashboard (my ideas + stats)
/new                        — Post a new idea form
```

---

## 7. UI Specifications

### Design Principles
- Craigslist energy: functional, not pretty. But not ugly — clean and legible.
- No hero sections, no gradients, no stock photos
- Monospace or distinctive font for headings (personality)
- System font stack for body (speed)
- Warm color palette: cream/off-white background, dark text, orange-red fire accents
- Dense feed — show 10+ ideas above the fold on desktop
- Mobile-first: most users will browse on phones

### Color Palette

```css
:root {
  --bg-primary: #FDFBF7;        /* warm off-white */
  --bg-card: #FFFFFF;            /* white cards */
  --text-primary: #1A1A1A;      /* near-black */
  --text-secondary: #6B6B6B;    /* muted gray */
  --fire-ember: #D97706;        /* amber-600 */
  --fire-spark: #EA580C;        /* orange-600 */
  --fire-flame: #DC2626;        /* red-600 */
  --fire-burn: #B91C1C;         /* red-700 */
  --fire-wildfire: #991B1B;     /* red-800 */
  --accent: #EA580C;            /* orange-600, CTAs */
  --border: #E5E5E5;            /* light gray borders */
}
```

### Homepage Layout

```
┌─────────────────────────────────────────────┐
│ 🔥 Idea Commons          [🔍] [Post Idea]  │
├─────────────────────────────────────────────┤
│  [Hot] [New]                                │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 🔥🔥 Spark                              │ │
│ │ AI-powered scheduling for freelancers   │ │
│ │ Never double-book a client again.       │ │
│ │ 23 fires · Posted 4 hours ago           │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 🟠 Ember                                │ │
│ │ Shazam but for bird songs               │ │
│ │ Point your phone at any bird sound...   │ │
│ │ 7 fires · Posted 2 days ago             │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │ Tiny homes rental marketplace           │ │
│ │ Airbnb specifically for tiny homes...   │ │
│ │ Posted 1 hour ago                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│          [Load more ideas]                  │
└─────────────────────────────────────────────┘
```

**Card Rules:**
- Fire indicator only shows if heat > 0.5 (no empty states)
- Fire count only shows if > 0 ("23 fires")
- If fire count is 0, show only "Posted X ago" (no "0 fires" text)
- Seed ideas show a subtle "💡 Seed" badge (small, not prominent)
- Cards are clickable — entire card is a link to detail page
- On hover: subtle elevation/shadow change

### Search UX

Default state: magnifying glass icon in header, compact.

On click/focus: expands to input field with placeholder text:
```
What's your problem?
```

User types natural language (e.g., "how do I stop wasting time on scheduling").

Results page shows:
- Matching ideas ranked by relevance
- Each result shows: title, one-liner, fire state, similarity indicator
- If no strong matches: "We don't have anything for that yet. Want to post it as an idea?" with CTA to /new, pre-filled with their search query as a starting point.

### Idea Detail Page

```
┌─────────────────────────────────────────────┐
│ ← Back to feed                              │
├─────────────────────────────────────────────┤
│                                             │
│ AI-powered scheduling for freelancers       │
│ Never double-book a client again.           │
│                                             │
│ 🔥🔥 Spark · 23 fires                       │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │ [Full pitch text here, rendered as      │ │
│ │  markdown. Can include paragraphs,      │ │
│ │  bullet points, etc. Max 5000 chars.]   │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Posted by anon_user · 4 hours ago           │
│ Category: SaaS                              │
│                                             │
│        [ 🔥 Fire this idea ]                │
│                                             │
└─────────────────────────────────────────────┘
```

**Fire Button Behavior:**
1. User clicks "🔥 Fire this idea"
2. Button immediately changes to "🔥 Fired!" (optimistic UI)
3. Fire count increments by 1 visually
4. POST /api/ideas/[id]/fire in background
5. If user already fired, button shows "🔥 Fired" (disabled state) on page load
6. Subtle animation on fire: button briefly scales up + flame icon pulses
7. No login required — tracked by fingerprint (IP + UA hash)

### Post Idea Page (`/new`)

```
┌─────────────────────────────────────────────┐
│ Post your idea                              │
├─────────────────────────────────────────────┤
│                                             │
│ Title (max 100 characters)                  │
│ ┌─────────────────────────────────────────┐ │
│ │ e.g. "Shazam for bird songs"            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ One-liner (max 200 characters)              │
│ ┌─────────────────────────────────────────┐ │
│ │ e.g. "Point your phone at any bird..."  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Full pitch (max 5000 characters)            │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │ Describe the problem, the solution,     │ │
│ │ and why this could work.                │ │
│ │                                         │ │
│ │                                    0/5k │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Category (optional)                         │
│ [ SaaS ▼ ]                                  │
│                                             │
│         [ Post idea ]                       │
│                                             │
└─────────────────────────────────────────────┘
```

**Categories (predefined list):**
- SaaS
- Consumer
- AI / ML
- Fintech
- Health
- Education
- Developer Tools
- E-commerce
- Marketplace
- Social
- Hardware
- Climate / Energy
- Other

**Validation Rules:**
- Title: required, 3-100 characters
- One-liner: required, 10-200 characters
- Pitch: required, 50-5000 characters
- Category: optional, must be from predefined list
- User must be authenticated (redirect to /login if not)

### Creator Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────┐
│ Your Ideas                                  │
├─────────────────────────────────────────────┤
│                                             │
│ Total ideas: 5  ·  Total fires: 47          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔥🔥 Spark                              │ │
│ │ AI scheduling for freelancers           │ │
│ │ 23 fires · 142 views · Posted 4 days    │ │
│ │ ▁▂▃▅▇ (fire trend mini-chart)          │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 🟠 Ember                                │ │
│ │ Shazam for bird songs                   │ │
│ │ 7 fires · 34 views · Posted 2 days      │ │
│ │ ▁▁▂▂▃ (fire trend mini-chart)          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│           [ Post new idea ]                 │
└─────────────────────────────────────────────┘
```

**Fire trend mini-chart:** A tiny sparkline showing daily fire count for the past 7 days. Use the `daily_heat_log` table data. Can be rendered as a simple SVG or CSS bar chart — does not need a charting library.

---

## 8. Email Notifications

### Fire Notification

**Trigger:** When someone fires an idea, send email to the idea's author.

**Debounce rule:** Do NOT send per-fire. Batch notifications:
- First fire ever on an idea: send immediately ("Your idea just got its first fire! 🔥")
- Subsequent fires: batch and send max once per hour ("Your idea got 5 new fires in the last hour")
- Max 3 notification emails per day per user

**Subject lines:**
- First fire: "🔥 Your idea just got its first fire"
- Batched: "🔥 Your idea '[title]' got [N] new fires"
- Milestone: "🔥🔥 Your idea hit [Spark/Flame/Burn/Wildfire]!"

**Email body (plain, minimal):**

```
Hey,

Your idea "[title]" just got fired.

[N] people have now fired this idea. It's currently at [heat label] status.

See how it's doing: [link to idea detail page]

— Idea Commons
```

### Magic Link Email

**Subject:** "Sign in to Idea Commons"

**Body:**
```
Click here to sign in:

[magic link button]

This link expires in 10 minutes.

— Idea Commons
```

---

## 9. SEO Category Pages

Generate static pages at build time (or ISR) for each category:

```
/ideas/saas           → "SaaS Startup Ideas Catching Fire"
/ideas/ai             → "AI Startup Ideas People Want Built"
/ideas/fintech        → "Fintech Startup Ideas With Real Demand"
/ideas/consumer       → "Consumer Startup Ideas Trending Now"
/ideas/developer-tools → "Developer Tool Ideas Gaining Traction"
... (one per category)
```

Each page shows:
- SEO-optimized title and meta description
- Filtered feed of ideas in that category, sorted by heat
- "Post an idea in [category]" CTA
- Total idea count and total fires in category

**Meta tags per page:**
```html
<title>[Category] Startup Ideas Catching Fire | Idea Commons</title>
<meta name="description" content="Browse [N] [category] startup ideas ranked by real interest. See which ideas people actually want built." />
<meta property="og:title" content="[Category] Startup Ideas | Idea Commons" />
<meta property="og:description" content="[N] ideas, [M] total fires. See what's trending." />
```

---

## 10. Fingerprinting Strategy

For anonymous fire tracking without requiring login:

```typescript
function generateFingerprint(req: Request): string {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  const raw = `${ip}::${ua}`;
  return sha256(raw);
}
```

**Rules:**
- Fingerprint is a SHA-256 hash — we never store raw IP or UA
- One fingerprint can fire each idea only once (UNIQUE constraint in DB)
- If a logged-in user fires, store BOTH fingerprint AND user_id
- On login, do NOT retroactively merge anonymous fires to user account (V1 simplicity — merge is a V2 feature)

**Limitations accepted in V1:**
- Different browsers/devices = different fingerprints = can fire twice (acceptable)
- VPN/proxy users may share fingerprints (acceptable, log compression helps)
- This is "good enough" anti-abuse for V1, not bulletproof

---

## 11. Seed Data

Before launch, seed the database with 200+ ideas marked `is_seed = true`.

**Sources for seed ideas:**
- r/startupideas top posts
- r/SideProject top posts
- My First Million podcast episode ideas
- Greg Isenberg tweets
- YC Requests for Startups
- Personal brainstorming

**Seed idea requirements:**
- Must feel like a real pitch (not filler)
- Title: clear, specific, catchy
- One-liner: explains the value prop in one sentence
- Pitch: 100-300 words explaining problem, solution, why now
- Must span all categories (aim for 15-20 per category)
- Generate embeddings for all seed ideas at load time

**Seed ideas display rule:**
- Show a subtle "💡 Seed" badge on the card
- Seed ideas participate in the same heat algorithm as real ideas
- As real ideas accumulate, deprioritize seeds in the "Hot" sort (multiply seed heat by 0.7)

---

## 12. Implementation Order

Build in this exact sequence. Each step should be a deployable, working state.

### Step 1: Project scaffold + database
- Initialize Next.js project with TypeScript + Tailwind
- Set up Supabase project
- Run all CREATE TABLE migrations
- Set up environment variables
- Deploy empty app to Vercel
- **Commit message:** `feat: initialize project with Next.js, Supabase, and database schema`

### Step 2: Idea feed (read-only)
- Build homepage with idea card components
- Implement GET /api/ideas with pagination
- Sort tabs: "Hot" (by heat) and "New" (by created_at)
- Responsive layout (mobile-first)
- Load seed data into database
- **Commit message:** `feat: implement public idea feed with hot/new sorting and pagination`

### Step 3: Idea detail page
- Build /idea/[id] page
- Display full pitch (rendered as markdown)
- Show fire state, fire count, category, timestamp
- Back-to-feed navigation
- SEO meta tags per idea
- **Commit message:** `feat: add idea detail page with full pitch and metadata`

### Step 4: Fire button
- Build fire API endpoint (POST /api/ideas/[id]/fire)
- Implement fingerprinting
- Add fire button component with optimistic UI
- Animate on click (scale + pulse)
- Show "Fired!" disabled state if already fired
- Heat label display on cards and detail page
- **Commit message:** `feat: implement fire button with fingerprinting, optimistic UI, and heat labels`

### Step 5: Authentication
- Set up Supabase magic link auth
- Build /login page
- Auth state management (context/provider)
- Protected route wrapper for /new and /dashboard
- **Commit message:** `feat: add magic link email authentication with protected routes`

### Step 6: Post an idea
- Build /new page with form
- Input validation (client + server)
- Generate embedding on submission via OpenAI API
- Insert idea into database
- Redirect to new idea's detail page after posting
- **Commit message:** `feat: add idea submission form with validation and embedding generation`

### Step 7: Heat algorithm cron
- Build /api/cron/recalculate-heat endpoint
- Implement the heat formula
- Log to daily_heat_log table
- Set up Vercel cron schedule (daily 00:00 UTC)
- Also run immediate mini-recalc on first fire (so new ideas don't wait 24hrs)
- **Commit message:** `feat: implement daily heat recalculation cron with decay algorithm`

### Step 8: Creator dashboard
- Build /dashboard page
- List user's ideas with fire counts and view counts
- Show fire trend sparklines (past 7 days from daily_heat_log)
- Show aggregate stats (total ideas, total fires)
- **Commit message:** `feat: add creator dashboard with idea stats and fire trend sparklines`

### Step 9: Email notifications
- Set up Resend integration
- Fire notification emails (first fire + batched)
- Heat milestone emails (Spark, Flame, Burn, Wildfire)
- Debounce logic (max 3 emails/day/user)
- **Commit message:** `feat: add fire notification emails with debouncing and milestone alerts`

### Step 10: Semantic search
- Build search UI (expandable search bar in header)
- Build GET /api/search endpoint
- Query pgvector for cosine similarity matches
- Results page with relevance ranking
- Empty state: "No match found — post this as an idea?" with pre-filled form
- **Commit message:** `feat: implement semantic search with pgvector and empty-state idea creation CTA`

### Step 11: SEO category pages
- Build /ideas/[category] pages
- Static generation or ISR for each category
- SEO meta tags, open graph tags
- Category index at /ideas showing all categories with counts
- **Commit message:** `feat: add SEO-optimized category landing pages with meta tags`

### Step 12: Polish + launch prep
- Add view counting (increment on idea detail page load)
- Add "Posted X ago" relative timestamps
- Add favicon, og:image, site metadata
- Error handling and loading states on all pages
- 404 page
- /about page (simple: what is this, how it works, link to post)
- Performance audit (Core Web Vitals)
- **Commit message:** `feat: add view tracking, polish UI, error handling, and launch-ready metadata`

---

## 13. Git Workflow

### Branch Strategy
- `main` — production, always deployable
- `dev` — active development branch
- Feature branches off `dev`: `feat/fire-button`, `feat/search`, etc.

### Commit Message Format

```
type: short description

Detailed explanation of what changed and why.

Refs: #issue (if applicable)
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`

### After Each Step
1. Complete the implementation
2. Test locally
3. Commit with the specified commit message
4. Push to dev
5. Verify deployment on Vercel preview
6. Merge to main when stable

---

## 14. Definition of Done (V1 Launch Ready)

V1 is launch-ready when ALL of the following are true:

- [ ] Homepage loads in < 2 seconds on mobile
- [ ] Feed displays ideas sorted by hot and new
- [ ] Fire button works without login
- [ ] Fire button shows correct state on reload (fired/not fired)
- [ ] Posting requires email auth and works end-to-end
- [ ] Heat labels display correctly for all tiers
- [ ] Search returns relevant results for natural language queries
- [ ] Search empty state offers to create an idea
- [ ] Creator dashboard shows ideas with fire stats
- [ ] Email notifications send on first fire
- [ ] At least 200 seed ideas loaded across all categories
- [ ] All SEO category pages render with correct meta tags
- [ ] Site works on mobile (responsive)
- [ ] No console errors in production
- [ ] Deployed to production domain on Vercel

---

## 15. Post-Launch Immediate Tasks (not part of V1 build)

Once V1 is live and stable, these are the first priorities:

1. Submit to Google Search Console for indexing
2. Write Show HN post
3. Create Indie Hackers product page
4. Set up Plausible/Umami analytics
5. Monitor error logs for first 48 hours
6. Personally DM 30 people with their ideas pre-loaded
7. Track day-2 retention as primary metric

---

## Appendix A: Type Definitions

```typescript
interface Idea {
  id: string;
  title: string;
  one_liner: string;
  category: string | null;
  is_seed: boolean;
  heat: number;
  fire_count: number;
  created_at: string;
}

interface IdeaDetail extends Idea {
  pitch: string;
  author_id: string | null;
  view_count: number;
  updated_at: string;
}

interface IdeaWithStats extends IdeaDetail {
  daily_fires: { date: string; count: number }[];
}

interface SearchResult {
  idea: Idea;
  similarity: number;
}

interface FireResponse {
  success: boolean;
  already_fired?: boolean;
  fire_count: number;
}

type HeatLabel = 'none' | 'ember' | 'spark' | 'flame' | 'burn' | 'wildfire';

function getHeatLabel(heat: number): HeatLabel {
  if (heat >= 10) return 'wildfire';
  if (heat >= 7) return 'burn';
  if (heat >= 4) return 'flame';
  if (heat >= 2) return 'spark';
  if (heat >= 0.5) return 'ember';
  return 'none';
}
```

---

*End of build specification. Next amendment will be `build-v1-01.md`.*
