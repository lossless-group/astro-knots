---
date_created: 2026-04-28
date_modified: 2026-04-28
date_authored_initial_draft: 2025-04-28
date_authored_current_draft: 2026-04-28
date_authored_final_draft:
date_first_published: null
site_uuid: e9b53105-c5e3-4c4a-8bb9-e72d88764e0
publish: true
title: "Maintain an Interactive Polling System"
slug: maintain-an-interactive-polling-system
lede: "Implementation blueprint for embeddable, theme-aware interactive polls on Astro SSG sites — covering Session/Poll data model, Astro DB on Turso storage, DB→markdown materialization for archive, live-meeting authoring motions, and Svelte + GSAP UI contracts. v0.0.1 ships four templates and one live session."
at_semantic_version: 0.0.0.2
status: Draft
category: Blueprints
authors:
  - Michael Staton
augmented_with: "Oz on auto"
tags: [Polling, Interactive, Live-Meetings, Astro-Islands, Svelte, GSAP, Realtime, OAuth, Astro-DB, Turso, Content-Materialization]
image_prompt: "A small robot stands with a small projector on top of a computer desk, behind the monitor.  He is projecting like old movies were projected, but on the computer monitor is a Keynote slide deck."
banner_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_banner_image_1755815513881_vG9H27ZKx.webp"
portrait_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_portrait_image_1755815520946_NlMeL6qdl.webp"
square_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_square_image_1755815527652_HEYKVBKOm.webp"
---

# Blueprint for Developing and Maintaining Interactive Polling Systems

This blueprint codifies the contract for an **interactive polling system** that can be dropped into any Astro-Knots site without the site having to invent its own data model, real-time layer, or authoring motions. Components, tokens, and runtime utilities are stable across sites; **only the wiring and the content change**.

A poll is not just a UI widget. It is a small content type with a lifecycle, an integrity contract (one vote per identified user), a real-time presentation surface (the host's screen during a live meeting), and an archive afterlife (the durable URL where the meeting's poll results live forever as content). All four concerns have to be designed together or the system collapses into per-site one-offs.

This v2 reorganizes the v1 draft so the **v0.0.1 working spec sits at the top**, deferred-but-spec'd content sits in the middle, and wish-list / open-question content sits at the bottom.

---

# TOP — v0.0.1 Essentials (the working spec for tomorrow)

## 1. Goals
- **Embeddable anywhere.** A poll renders the same way on a marketing page, an article, a member dashboard, and a live-meeting projection surface.
- **Stack discipline.** Astro SSG by default; Svelte islands for interactivity; GSAP for transitions. No new framework dependency introduced by polling.
- **Identity-bound voting.** Every vote is attributed to an authenticated user (OAuth) and resolved against a person record. Anonymous polls are a *display* choice, not a data choice (anonymous *voting* is parked — see §21.1).
- **Live → Archive content materialization.** Live polls run on Astro DB (SSR). Once the session concludes, data is materialized into markdown content collections (SSG). One pattern, two phases.
- **Real-time without WebSockets unless required.** Default to short-interval HTTP polling (3–5s). SSE / WebSockets are deferred (§17).
- **Theme & mode aware.** Poll components consume `--color-*` and `--fx-*` tokens (see [Maintain Themes & Modes Across CSS and Tailwind](./Maintain-Themes-Mode-Across-CSS-Tailwind.md)) and render correctly in light / dark / vibrant.
- **Verifiable.** Every shipping template has an integration test covering open/close transitions, vote idempotency, and result reconciliation.

---

## 2. This Run of the Blueprint

We have developed a new website called [FullStack VC](https://fullstack-vc.com) and we want to introduce interactive polling. The FullStack VC community of venture professionals organizes around live web meetings, and we want to enable interactive polling during these meetings.

Our religious preference on our "stack" is defaulting to Astro SSG, but we use Svelte where it makes sense for interactivity and animations. On several projects, we have introduced GSAP to add sophisticated animations and transitions. So, there is no going outside of those boundaries.

### 2.1 Pre-development requirements (recap)
This blueprint requires:
1. OAuth-based user authentication. Authentication is set up through a homegrown, lean OAuth implementation, so authenticating or creating an account should be seamless and quick — friction-free enough that we don't need an anonymous-voting escape hatch in v0.0.1 (see §21.1 for the parked discussion).
2. User profile or people-data and collection management.

For FullStack VC we have both, though our user-profile system is nascent and may need an upgrade to a true database-backed user-profile system instead of using markdown and JSON files committed to the repository (see §3.1).

### 2.2 Why polling specifically, and why now
Live web meetings of venture professionals have a known failure mode: the panel speaks, the audience listens, and engagement falls off after ~12 minutes. Interactive polls re-anchor attention every 8–15 minutes and produce *durable* artifacts (results, quotes, follow-up questions) that can be re-published as content after the meeting. The meeting becomes a content engine, not a one-time event.

### 2.3 v0.0.1 Scope (Locked) — what ships tomorrow

The temptation is to commit to every named template and every motion at once. We're not doing that. **v0.0.1 ships exactly the minimum to support tomorrow's live meeting:**

- **One live `Session`** of `kind: 'live'`, containing 1–3 polls.
- **Four templates only:**
  1. `PollQuestionTemplate__Boolean.svelte` (§7.1)
  2. `PollQuestionTemplate__SingleSelect.svelte` (§7.2)
  3. `PollQuestionTemplate__MultiSelect.svelte` (§7.3)
  4. `PollQuestionTemplate__SlidingScale.svelte` (§7.4)
- **Astro DB on Turso** for live writes (§8).
- **Manual sync command only** for materialization (`pnpm sync:session <id>`); no auto-trigger, no cron (§9.4).
- **Tier 1 interval polling** for real-time updates; no SSE, no WebSockets (§10.1).
- **No admin panel.** Hosts open polls by direct DB action (seed file or simple CLI). Manual close button is deferred.
- **The wow factor:** participants see real-time data viz develop on screen as the room votes. That is the centerpiece of v0.0.1.

### 2.4 v0.0.2+ Scope (deferred)

Promoted out of v0.0.1, but already spec'd in this document so engineering can build toward them:

- `kind: 'time-bound'` sessions (async distribution via email / WhatsApp / Twitter / LinkedIn).
- Auto-trigger sync on grace-period expiry (§9.5).
- Manual close button on live sessions.
- Real admin/host console (§19).
- Additional templates per §16.
- Higher-tier real-time mechanics per §17.

**Why this scope size is right:** the riskiest work is *not* the question UI. It's the lifecycle, OAuth-bound vote integrity, the data materialization motion, and the real-time results loop. Those have to land regardless of how many templates ship. Four templates, one session, one manual sync command lets us prove that backbone with a real meeting.

---

## 3. Pre-Development Requirements

Do not start building polls until these are in place. Each one is a hard dependency.

1. **OAuth identity.** A reliable session with a stable, opaque user ID. Anything less and "one vote per user" is unenforceable. The user ID is the primary key for every vote row.
2. **Person/profile resolution.** A way to map a user ID to a person record (name, avatar, role, optional org). This will necessitate user profiles of some limited type to be created on the live production databse. Polls reference *people*, not raw OAuth tokens, in any presenter-facing UI.
3. **A meeting / session entity.** Even a thin one — `slug`, `starts_at`, `host_user_id` — is enough to gate session activation. (After this blueprint, `Session` is that entity; see §5.1.)
4. **A results endpoint pattern.** The site must already serve at least one JSON endpoint from an Astro server route. For FullStack VC and any future Astro-Knots site, this is satisfied by Astro DB on Turso (§8.2); polling is the forcing function that lands this stack if it isn't already in the site.
5. **Theme & mode contract.** `data-theme` / `data-mode` on `<html>` and the `--color-*` / `--fx-*` token system are present. Poll UI is built against those tokens, not bespoke CSS.

If any of these are missing, the right move is to land them as separate milestones first. Polling is the wrong place to also debut authentication.

### 3.1 The User Profile Upgrade Question
Flat-file user profiles (markdown/JSON committed to the repo) work for *editorial* people pages. They do **not** work for vote attribution, because:
- New attendees can't vote until a maintainer commits a profile and redeploys.
- Vote rows can't reference a user who doesn't yet exist in the repo.
- Polls become eventually-consistent in the worst possible way: results change after a redeploy.

The upgrade path: **OAuth-issued user IDs are the source of truth**; flat-file profiles become an *enrichment layer* keyed by user ID. A user can vote the moment they sign in; their profile is filled in lazily. Polling is the forcing function for this upgrade on most sites.

---

## 4. Architecture & Stack Boundaries

The stack is fixed. The boundaries below are not preferences, they are the contract.

### 4.1 Render boundary (SSG + SSR split)
- **Astro SSG** renders the static shell of any page that contains a poll: heading, prose, surrounding content. The page may server-render an *initial* poll snapshot via `astro:db` at request time when SSR is enabled for that route.
- **Svelte island** (`<PollEmbed client:load />` or `client:visible`) renders the poll itself. The island is the only piece that hydrates.
- **GSAP** handles transitions inside the island. GSAP is *never* loaded on pages without an active poll island.
- **SSR is opt-in per route.** Marketing pages, articles, and archived sessions stay SSG. Live session pages (`/sessions/[slug]`), host console (deferred), and the JSON API routes are SSR. See §8.1 for the rationale.

### 4.2 Data boundary
- **Read path (live session, SSR):** the page renders with an initial snapshot from `astro:db`; the Svelte island fetches `/api/polls/[id]/results.json` on an interval for live updates.
- **Read path (archived session, SSG):** the page renders entirely from markdown frontmatter; no client requests required.
- **Write path:** the island POSTs to `/api/polls/[id]/votes` with the OAuth session cookie. The server validates identity, idempotency, and poll state.

### 4.3 What does NOT belong in the polling system
> [!NOTE] These blueprints are not yet codified, some don't exist.  This is only to declare the scope of this discrete task we want to build now.
- Authentication (lives in the auth blueprint).
- Person/profile editing (lives in the people-data blueprint).
- Meeting/event scheduling beyond `Session` (lives in the events blueprint).
- Notifications/email (lives in the comms blueprint).

Polling consumes these, it does not own them.

### 4.4 Canonical URL routes
- **Live (SSR):** `/sessions/[slug]` — the session and its polls during the live meeting.
- **Archive (SSG):** `/sessions/archive/[slug]` — the materialized markdown archive.
- The live URL 301s to the archive URL once the session is `archived`.
- Pre-event marketing landing pages stay at `/webinars/[slug]` (different concern; out of scope here). For v0.0.1, the existing `/webinars` route is migrated to `/sessions` (same code, just a path rename).

---

## 5. Data Model

Five entities. `Session` is the outer container; `Poll` lives inside a session.

### 5.1 `Session` (outer entity)
- `id` — opaque ID.
- `slug` — URL-safe identifier (used in `/sessions/[slug]`).
- `title`, `description` — editorial metadata.
- `kind` — `'live'` | `'time-bound'`.
  - `'live'`: opened by admin, runs during a meeting, auto-archives after the session-level grace period (§9.3). v0.0.1 ships this only.
  - `'time-bound'`: requires `starts_at` and `ends_at`; auto-archives once `ends_at` is reached. **v0.0.2+.**
- `status` — `'draft'` | `'active'` | `'archived'`.
- `starts_at`, `ends_at` — ISO timestamps. Optional for `'live'`; required for `'time-bound'`.
- `last_activity_at` — bumped on every vote across any poll in the session. Drives the grace-period auto-trigger.
- `host_user_id` — the admin who opened the session.
- `created_at`, `updated_at`.

**One Session → Many Polls.** Typical N is 2–3; no hard cap.

### 5.2 `Poll`
- `id` — slug-ish, stable across the lifecycle.
- `session_id` — required FK to `Session.id`.
- `title`, `prompt` — the question shown to voters.
- `template` — see §7 (`'boolean'` | `'single-select'` | `'multi-select'` | `'sliding-scale'` for v0.0.1).
- `options[]` — for choice-based templates; each option has `id`, `label`, optional `description`, optional `image`.
- `status` — `'draft'` | `'scheduled'` | `'open'` | `'closed'`. (No standalone `'archived'` — polls are archived as part of their parent session.)
- `visibility` — `'public'` | `'members'` | `'session-attendees'`.
- `results_visibility` — `'live'` | `'on-close'` | `'host-only'`.
- `anonymous_display` — boolean. Vote is still attributed in storage; only the UI is anonymous.
- `last_vote_at` — bumped on every vote. Drives the poll-level grace period.
- `allow_revote` — boolean. Whether voters can change their answer while the poll is `open`.
- `created_by`, `created_at`, `updated_at`.

### 5.3 `Vote`
- `poll_id`, `user_id` — together form a unique constraint enforcing one-vote-per-user (§13.1).
- `option_ids[]` — single-element for `SingleSelect`; multi-element for `MultiSelect`; ordered for `RankedOrder` (v1.1+).
- `value` — scalar response for templates that produce a single primitive (`Boolean`, `SlidingScale`; later: `TextBox`, `StarRating`, `NPS`, `DatePick`).
- `response` — generic typed-JSON column for templates whose answer doesn't fit `option_ids` or `value` (matrix and area-board templates, v1.1+). Each `PollQuestionTemplate__*` component defines its own response shape (§7); the server validates against the active template's schema before write.
- `created_at`, `updated_at` — `updated_at` permits vote changes while the poll is open if `allow_revote` is true.
- `client_meta` — coarse, optional: `user_agent_class`, `is_presenter_view`. **No IP, no precise UA strings, no fingerprinting.**

### 5.4 `PollResult` (derived, never authoritative)
A cached projection of votes for fast reads:
- `poll_id`, `tallies` (option_id → count), `total_votes`, `last_aggregated_at`.
- Recomputed on vote write or on a short cadence; never written to from the client.

### 5.5 `PollEvent` (audit)
- `poll_id`, `actor_user_id`, `kind` (`'open'` | `'close'` | `'extend'` | `'reset'` | `'delete'`), `at`, `note`.

Required (not optional). The moment a host makes a mistake during a live meeting, you need this to tell whether a vote count spike was a bug or a re-open. Without it, host actions are unauditable.

---

## 6. Lifecycle States

The system has **two layers** of lifecycle: `Session` (outer) and `Poll` (inner, within an active session).

### 6.1 Session lifecycle

```
draft ──▶ active ──▶ archived
                       │
                       └─ triggered by manual sync (v0.0.1) OR
                          grace-period expiry (v0.0.2+);
                          materializes session+polls to markdown,
                          flips Poll rows to read-only.
```

- **draft** — admin is authoring. Invisible to participants.
- **active** — admin has opened the session. Polls within it can be opened/closed by the admin. Participants see the session at `/sessions/[slug]`.
- **archived** — sync has run. Markdown lives at `src/content/sessions/<slug>.md`. The DB row stays for retention; the markdown is canonical for the rendered archive.

### 6.2 Poll lifecycle (within an `active` session)

```
draft ──▶ scheduled ──▶ open ──▶ closed
                          ▲       │
                          └──┐    ▼
                            extend  (host can extend before grace expires)
```

- **draft** — editable, invisible to non-authors. No votes accepted.
- **scheduled** — visible as a teaser within the active session; voting disabled.
- **open** — accepting votes. Results visibility honors `results_visibility`.
- **closed** — no new votes. Reveal animation runs if `results_visibility = 'on-close'`.

In v0.0.1, hosts move polls from `scheduled` → `open` by direct DB action (seed file edit or short CLI). Auto-close on poll-level grace expiry is v0.0.2+.

### 6.3 The transition that materializes (`active` → `archived`)

This is the phase change at the heart of the system. When a session moves to `archived`:

1. Final aggregation runs on every poll in the session.
2. A single markdown file is written to `src/content/sessions/<slug>.md` containing all polls' final tallies as frontmatter (§9.6).
3. `Session.status` flips to `'archived'`.
4. Live URL `/sessions/[slug]` 301s to `/sessions/archive/[slug]`.
5. DB rows remain for the retention window; the markdown is canonical (§9.8).

In v0.0.1 this is triggered manually (§9.4). In v0.0.2+, the grace-period constants in §9.3 fire it automatically.

---

## 7. Poll Question Templates (v0.0.1 — four templates only)

Every question type is implemented as a dedicated Svelte component named `PollQuestionTemplate__<Type>.svelte`. The orchestrator component, `<PollEmbed />`, looks up the active poll's `template` and renders the matching component.

Each template owns three things:
1. **Authoring schema** — what an author fills in.
2. **Vote response schema** — the exact shape stored on `Vote` (see §5.3).
3. **Display / aggregation rule** — how the data is rendered live, on close, and in the archive.

Shared option type:

```ts path=null start=null
interface PollOption { id: string; label: string; description?: string; image?: string; }
```

Deferred templates (TextBox, MultiStringInput, MatrixSingleSelect, MatrixMultiSelect, AreaBoardOptionDrop, RankedOrder, StarRating, NPS, EmojiReaction, ImagePick, TwoAxisPlot, DatePick, etc.) are spec'd in §16 of the deferred section.

### 7.1 `PollQuestionTemplate__Boolean.svelte`

Yes/No or True/False. Common as quick gut-checks ("Is this team raising in the next 6 months?").

```ts path=null start=null
// Authoring
{ template: 'boolean'; prompt: string; labels?: { true: string; false: string } } // defaults: Yes / No
// Vote response
{ value: boolean }
```
Display: two-bar tally with percent each side; optional "consensus" badge when one side exceeds 80%.

### 7.2 `PollQuestionTemplate__SingleSelect.svelte`

Radio-style. Exactly one option.

```ts path=null start=null
// Authoring
{ template: 'single-select'; prompt: string; options: PollOption[] }
// Vote response
{ option_ids: [string] } // length-1 tuple
```
Display: bar chart sorted by tally; winner gets the `--fx-glow-*` reveal on close (§12.4).

### 7.3 `PollQuestionTemplate__MultiSelect.svelte`

Checkbox-style. Voter picks 1+ options, with optional bounds.

```ts path=null start=null
// Authoring
{
  template: 'multi-select';
  prompt: string;
  options: PollOption[];
  min_selections?: number; // default 1
  max_selections?: number; // default options.length
}
// Vote response
{ option_ids: string[] }
```
Display: horizontal stacked bars per option. Denominator is **respondents**, not total selections.

### 7.4 `PollQuestionTemplate__SlidingScale.svelte`

Numeric slider with bounds and step. The de-facto "how strongly" / "what's your estimate" template.

```ts path=null start=null
// Authoring
{
  template: 'sliding-scale';
  prompt: string;
  min: number;
  max: number;
  step?: number;            // default 1
  default_value?: number;
  labels?: { min?: string; mid?: string; max?: string };
  show_distribution?: boolean; // live histogram while open
}
// Vote response
{ value: number }
```
Display: histogram with median line and IQR bracket. In presenter mode, voter dots animate up into their bucket.

### 7.5 Cross-Template Contract

Every `PollQuestionTemplate__*.svelte` (shipping or deferred) MUST:
- Render the same **six visual states** as `<PollEmbed />` (§12.2): loading, unauthenticated, open-unvoted, open-voted, closed, errored.
- Read its colors and effects from the token contract in §12.3 — no template introduces hardcoded hex.
- Respect `prefers-reduced-motion` (§12.4) — every GSAP timeline collapses to instant.
- Provide a Vitest case in §14.1 covering authoring validation, vote payload validation, and a recompute-equals-sum check on its aggregator.
- Appear at least once on `/design-system/index.astro` so theme/mode regressions are visible (Design System blueprint §4).

This is the contract that makes "add a new template later" actually safe.

---

## 8. Storage Layer (Astro DB on Turso)

Polling is the forcing function for adopting a real database on Astro-Knots sites that have, until now, run as pure SSG. Live polls write to Astro DB; archived sessions live in markdown content collections (§9). Both feed the same Svelte component.

### 8.1 SSG vs SSR — why polling forces a database

The Astro-Knots default has been SSG: pages rendered as HTML/CSS at build, hydrated lightly on the client. This works beautifully for marketing pages, articles, brand kits, design systems, and people pages whose data updates on editorial cadence.

Where it breaks: surfaces that need to *write* user-generated data and reflect those writes back to other users in near-real time. The recent attempt to keep "everything-as-SSG" via GitHub-App-driven commits on every data change confirmed that the hack works but is slow, fragile around concurrent edits, and produces commit-history pollution that's painful to live with. **Polling is the cleanest "no, you actually need a database" forcing function we'll meet.** This blueprint locks in the architectural split:

- **SSG remains the default** for marketing, articles, archived sessions, brand kits, design systems, and editorial-cadence content.
- **SSR + database** for any surface that needs sub-build-cycle freshness: live sessions, live polls, host console, projection page.
- **No more GitHub-App write hacks** for time-sensitive data. If a feature wants near-real-time writes, it goes in the DB.

### 8.2 Database choice: Astro DB on Turso (Locked)

**Decision:** [Astro DB](https://docs.astro.build/en/guides/astro-db/) running against Turso in production, with a local libSQL file in development.

**Why:**
- **Astro-native.** `astro:db` exports a typed `db` client; tables live in `db/config.ts`; seed data in `db/seed.ts`. Astro DB wraps Drizzle internally; from the application's perspective there is **no separate ORM to install or configure**.
- **libSQL = SQLite-compatible.** Local development is a real database file in `.astro/content.db`, regenerated from `db/seed.ts` on every dev-server restart. Production is Turso (managed libSQL with edge replication).
- **Turso is already paid for.** We have an underutilized Turso account; per-poll write volume is tiny.
- **One choice for the whole monorepo.** Future Astro-Knots sites that hit the SSG-can't-do-this wall inherit this stack by default.

**What we're not doing:** Postgres, D1, self-hosted SQLite. All viable in isolation; none pay back the cost of diverging from the Astro DB default.

### 8.3 Schema definition (`db/config.ts`)

```ts path=null start=null
// db/config.ts
import { defineDb, defineTable, column } from 'astro:db';

const Session = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    slug: column.text({ unique: true }),
    title: column.text(),
    description: column.text({ optional: true }),
    kind: column.text(),                          // 'live' | 'time-bound'
    status: column.text(),                        // 'draft' | 'active' | 'archived'
    starts_at: column.date({ optional: true }),
    ends_at: column.date({ optional: true }),
    last_activity_at: column.date({ optional: true }),
    host_user_id: column.text(),
    created_at: column.date(),
    updated_at: column.date(),
  },
});

const Poll = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    session_id: column.text({ references: () => Session.columns.id }),
    title: column.text(),
    prompt: column.text(),
    template: column.text(),                      // 'boolean' | 'single-select' | 'multi-select' | 'sliding-scale'
    options: column.json({ optional: true }),     // PollOption[]
    status: column.text(),                        // 'draft' | 'scheduled' | 'open' | 'closed'
    visibility: column.text(),
    results_visibility: column.text(),
    anonymous_display: column.boolean(),
    allow_revote: column.boolean(),
    last_vote_at: column.date({ optional: true }),
    created_by: column.text(),
    created_at: column.date(),
    updated_at: column.date(),
  },
});

const Vote = defineTable({
  columns: {
    poll_id: column.text({ references: () => Poll.columns.id }),
    user_id: column.text(),
    option_ids: column.json({ optional: true }),  // string[]
    value: column.json({ optional: true }),       // primitive (boolean | number | string)
    response: column.json({ optional: true }),    // typed JSON for matrix / board templates (v1.1+)
    created_at: column.date(),
    updated_at: column.date(),
    client_meta: column.json({ optional: true }),
  },
  indexes: {
    poll_user_unique: { on: ['poll_id', 'user_id'], unique: true },  // §13.1 integrity contract
  },
});

const PollResult = defineTable({
  columns: {
    poll_id: column.text({ primaryKey: true, references: () => Poll.columns.id }),
    tallies: column.json(),
    total_votes: column.number(),
    last_aggregated_at: column.date(),
  },
});

const PollEvent = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    poll_id: column.text({ references: () => Poll.columns.id }),
    actor_user_id: column.text(),
    kind: column.text(),                          // 'open' | 'close' | 'extend' | 'reset' | 'delete'
    at: column.date(),
    note: column.text({ optional: true }),
  },
});

export default defineDb({ tables: { Session, Poll, Vote, PollResult, PollEvent } });
```

`Vote` uses a `unique` index on `(poll_id, user_id)` rather than a composite primary key because Astro DB's `primaryKey` option is per-column today; the unique index enforces the same integrity contract from §13.1.

### 8.4 Local dev + production wiring

End-to-end setup:

1. `pnpx astro add db` (one-time per site).
2. Define tables in `db/config.ts` (§8.3).
3. Add development seed data in `db/seed.ts` so the local DB is populated on every dev-server start (include a `Session` row for tomorrow's meeting and 3–4 `Poll` rows attached to it).
4. **Production (Turso):**
   - `turso db create fullstack-vc`
   - `turso db show fullstack-vc` → copy URL into `ASTRO_DB_REMOTE_URL`.
   - `turso db tokens create fullstack-vc` → copy into `ASTRO_DB_APP_TOKEN`.
   - Add both env vars to the deployment platform.
   - `astro db push --remote` to push the schema to Turso.
   - In `package.json`, set `"build": "astro build --remote"`.

Local dev is fully offline by default. Use `astro dev --remote` only when explicitly testing against production data.

### 8.5 Server-side queries via `astro:db`

```ts path=null start=null
// src/pages/api/polls/[id]/results.json.ts
import { db, PollResult, eq } from 'astro:db';

export async function GET({ params }) {
  const result = await db
    .select()
    .from(PollResult)
    .where(eq(PollResult.poll_id, params.id))
    .get();
  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  });
}
```

### 8.6 Svelte islands access pattern (important nuance)

Svelte islands hydrate in the browser. **They cannot import `astro:db` — that's a server-only module.** The integration pattern:

- **Svelte → fetch → Astro API route → `astro:db`.** Islands call `/api/polls/[id]/votes` (POST) and `/api/polls/[id]/results.json` (GET). The API routes do all the DB work.
- **Initial state via SSR.** Astro pages server-render `<PollEmbed pollId="..." initialState={...} />` by fetching the snapshot from `astro:db` in the page frontmatter and passing it as a prop. The island hydrates with no first-paint flash and falls back to interval polling (§10.1) for live updates.

This architecture is cleaner than letting Svelte components query a DB directly:
- Auth, rate-limiting, and validation live in one place.
- Same API surface serves SSR (initial state) and live updates.
- Replacing the storage layer later doesn't touch component code.

---

## 9. DB → Markdown Materialization (Live → Archive Sync)

This is the other half of the SSG/SSR split. Live data lives in Astro DB; once a session concludes, it's projected into markdown content collections, where it becomes versionable, queryable-by-Content-Collections, editable by humans (and AI agents), and durable beyond the database's lifetime.

This isn't polling-specific. The same motion will likely apply to live people-data updates, live commentary, live Q&A, and any other surface where "real-time during the moment, content forever after." For now we keep it inline; if it earns a second use-case, extract to its own blueprint.

### 9.1 The pattern

**Phase 1 (Live, SSR):** Session is `active`. Polls are open. Votes hit Astro DB. Results stream back to viewers via interval polling.

**Phase 2 (Materialization):** Session moves to `archived`. The materialization motion writes a single markdown file at `src/content/sessions/<slug>.md` containing all the session's polls and final tallies as frontmatter. The DB row stays for retention; the markdown is canonical for the archive.

**Phase 3 (Archive, SSG):** `/sessions/archive/<slug>` renders entirely from markdown. No client requests, no DB hits, full SSG benefits. Editorial / AI agents enrich the body of the markdown with discussion summary, video embed, etc. (§18).

### 9.2 Sync direction is one-way

DB → markdown only. Never the reverse. After a session is materialized:

- The markdown is canonical for the rendered archive.
- The DB row stays for a configurable retention window.
- Marketing / content teams may edit the markdown body or fix small frontmatter issues — those edits are the new truth, not divergence to be reconciled.
- **Single-source-of-truth is relaxed here on purpose.** The cost of bidirectional sync isn't worth its weight, and the polling feature is new enough that content teams will need to tweak rendered data for legitimate marketing reasons.

### 9.3 Grace-period constants (configurable)

Two named constants drive auto-archival in v0.0.2+. Declared at the top of `src/config/polling.ts` (or equivalent) so any admin can find and adjust them empirically:

```ts path=null start=null
// src/config/polling.ts
export const POLL_GRACE_MINUTES = 15;
export const SESSION_GRACE_MINUTES = 45;
```

- `POLL_GRACE_MINUTES = 15` — a single poll concludes 15 minutes after its `last_vote_at`.
- `SESSION_GRACE_MINUTES = 45` — a session concludes 45 minutes after its `last_activity_at` (last vote across any poll within it).

The session-level grace must be longer than the poll-level grace because a typical live web meeting opens one poll early and another at the end; the gap between can be 30–40 minutes of discussion with no polling activity. **45 minutes is the safe ceiling.**

These constants exist because humans are busy, distracted, and forgetful. The admin *can* run a manual sync to push results out faster (catching the post-meeting attention window), but the system shouldn't depend on them remembering.

In v0.0.1, the constants are advisory only — they're declared and used by the manual sync command for messaging ("This session has been quiet for 47 minutes; safe to sync"), but no auto-trigger fires. v0.0.2+ adds the cron.

### 9.4 v0.0.1: Manual sync command

The v0.0.1 implementation is a single CLI command:

```sh path=null start=null
pnpm sync:session <session_id_or_slug>
```

What it does:
1. Verify session status is `active`. If `archived`, fail loudly (re-sync forbidden by default; `--force` opt-in only).
2. For every poll in the session, run final aggregation; recompute `PollResult` rows.
3. Write `src/content/sessions/<slug>.md` with frontmatter per §9.6.
4. Flip `Session.status` to `archived` in the DB.
5. Print a one-line summary of what was archived and the local file path.

The next deploy materializes `/sessions/archive/<slug>` as SSG.

### 9.5 v0.0.2+: Auto-trigger

A small scheduled job (Astro scheduled action or external cron) runs every N minutes:
1. Find sessions in `active` status whose `last_activity_at` exceeds `SESSION_GRACE_MINUTES`.
2. For each, run the same sync logic as the manual command.

The manual command remains as the override for "I want results out *now*."

### 9.6 Markdown structure (frontmatter sync-owned, body human-owned)

This is the most important contract in §9.

`src/content/sessions/<slug>.md`:

```markdown
---
session_id: sess_2026-04-29-fullstack-vc-q2
slug: 2026-04-29-fullstack-vc-q2
title: "FullStack VC — Q2 2026 Operator Roundtable"
kind: live
host_user_id: usr_michael
session_started_at: 2026-04-29T18:00:00Z
session_concluded_at: 2026-04-29T19:14:00Z
synced_from_db_at: 2026-04-29T19:30:00Z
participant_count: 47
polls:
  - id: poll_q2-comfort
    template: sliding-scale
    prompt: "How comfortable is your fund's pacing for Q2?"
    final_tally:
      total_votes: 47
      median: 6
      iqr: [4, 8]
      histogram: { 1: 1, 2: 0, 3: 2, 4: 5, 5: 9, 6: 12, 7: 8, 8: 6, 9: 3, 10: 1 }
    audit:
      opened_at: 2026-04-29T18:04:00Z
      closed_at: 2026-04-29T18:09:00Z
      events: []
  - id: poll_q2-channels
    template: multi-select
    prompt: "Which channels did your portfolio companies double down on?"
    options:
      - { id: linkedin, label: "LinkedIn" }
      - { id: events, label: "Events" }
      - { id: pr, label: "PR" }
      - { id: content, label: "Content marketing" }
    final_tally:
      total_respondents: 44
      tallies: { linkedin: 31, events: 22, pr: 9, content: 27 }
---

<!-- Body is human-owned. Sync never touches anything below the closing --- -->

## Discussion summary

(filled in by an editor or AI agent processing the meeting transcript)

## Notable quotes

## Recording

```

**The contract:**
- The sync writes everything **above** the closing `---` (frontmatter only).
- The body remains untouched on re-syncs (when re-sync is allowed at all).
- An editor or AI agent can modify the body freely — the sync respects it.

### 9.7 What renders the archive page

`src/pages/sessions/archive/[slug].astro` is SSG, sources the markdown via Astro Content Collections, and renders:
- The session metadata (title, date, participant count) as a header.
- Each poll's final tally via `<PollEmbed pollId={poll.id} initialState={poll.final_tally} variant="archive" />`. The `archive` variant skips API fetches and renders directly from `initialState`.
- The body Markdown as the discussion summary section.

**The same `<PollEmbed />` component renders both live (SSR + interval polling) and archive (SSG + static initial state).** The only difference is the variant prop.

### 9.8 DB cleanup after sync

Once a session is `archived`, its data exists in two places (markdown + DB) for a retention window. v0.0.1 doesn't prune at all — we keep everything. v0.0.2+ adds optional pruning:
- `Vote` rows: prune after 90 days. Cheap to keep; markdown has the aggregate.
- `PollResult`, `PollEvent`: prune with `Vote`.
- `Poll`, `Session`: keep indefinitely as stubs.

### 9.9 Re-sync semantics

Default: re-syncing an already-archived session **fails loudly**. Snapshots are final. `--force` is allowed but only touches frontmatter — body preserved verbatim. Re-sync is an edge case we're not designing around for v0.0.1; if it happens, treat it as a bug to investigate before doing it again.

---

## 10. Real-Time Update Mechanics (v0.0.1 = Tier 1 only)

### 10.1 Tier 1 — Interval polling (the default, ships in v0.0.1)
- Client `GET /api/polls/[id]/results.json` every 3–5s while the poll island is in the viewport and the poll status is `open`.
- `ETag` / `Last-Modified` so the server can 304 most responses.
- Pause when tab is hidden (`document.visibilityState`).
- Stop entirely when the poll closes; one final fetch confirms the closed snapshot.

Sufficient for ≤500 concurrent viewers and a 3-second perceived latency budget. For tomorrow's 60-participant meeting this is more than enough.

### 10.2 Optimistic UI
On vote submission, the island updates the local tally immediately and animates with GSAP. The next results tick reconciles. If the server rejects (auth lapse, poll closed, rate limit), the island rolls back the optimistic update and surfaces the error inline.

Higher-tier mechanics (SSE, WebSockets) are deferred — see §17.

---

## 11. Authoring & Live-Meeting Motions

The motions are how the system stays alive.

### 11.1 v0.0.1 (tomorrow): the simplest path
1. **Author the session.** For tomorrow, this is a hand-edited row in `db/seed.ts` (kind: 'live', status: 'draft'). Three poll rows attached.
2. **Open the session.** Admin runs a one-line CLI (or directly updates `Session.status = 'active'` in the DB) when the meeting starts. This makes `/sessions/<slug>` accessible to participants.
3. **Open polls.** Admin flips `Poll.status = 'open'` for each poll as the meeting reaches it. Direct DB action; no admin UI.
4. **Participants vote.** Live data viz develops on screen — the wow factor.
5. **Close polls.** Admin flips `Poll.status = 'closed'` when ready. Reveal animation runs.
6. **End meeting, run sync.** Admin runs `pnpm sync:session <slug>`. Session archives; markdown lands; next deploy publishes `/sessions/archive/<slug>`.
7. **Editorial enrichment** (later, separate workflow) — body of the markdown gets discussion summary, video embed, etc. (§18).

### 11.2 v0.0.2+: the productionized path
Replace direct DB actions with a real admin/host console at `/admin/sessions/[slug]` and `/admin/polls/[id]`. Add scheduled sync trigger. Add `kind: 'time-bound'` sessions for async distribution.

---

## 12. UI Component Contract

One Svelte component family, one CSS contract. Every site uses the same.

### 12.1 `<PollEmbed />` props
```ts path=null start=null
interface Props {
  pollId: string;            // resolves both the metadata fetch and the results fetch
  variant?: 'inline' | 'card' | 'present' | 'archive'; // present = projection mode; archive = SSG render
  initialState?: PollSnapshot;   // optional SSR/SSG snapshot to avoid first-paint flash
  resultsVisibility?: 'live' | 'on-close' | 'host-only';
  onVote?: (payload: VotePayload) => void; // optional analytics hook
}
```

### 12.2 Required visual states
- **Loading** — skeleton matching final layout; no layout shift on hydrate.
- **Unauthenticated** — sign-in CTA inside the island. Never redirect away from the page mid-read.
- **Open, unvoted** — interactive controls.
- **Open, voted** — confirmation + tally (if `live`) or "results at close" message.
- **Closed** — final tally, optional winner highlight.
- **Errored** — inline message; retry button; never a silent failure.

### 12.3 CSS contract
The component reads only from semantic tokens. Required:
- `--color-primary`, `--color-primary-500`, `--color-secondary`, `--color-surface`, `--color-border`, `--color-foreground`.
- `--fx-card-bg`, `--fx-card-border`, `--fx-card-shadow`, `--fx-card-shadow-hover`.
- `--fx-glow-opacity`, `--fx-glow-spread` for the "winning option" reveal in vibrant mode.
- Tailwind utilities only via these tokens — no hardcoded hex.

### 12.4 GSAP usage rules
- Tally bars animate width with `gsap.to(...)` over 400–600ms `power2.out`.
- Vote-cast confirmation: 250ms scale pulse on the chosen option, then a small flourish.
- Reveal-on-close: stagger bars by 80ms with `power3.out`; the leading option gets `--fx-glow-*` for 1.2s.
- Presenter mode amplifies durations by ~1.5×.
- Respect `prefers-reduced-motion`: collapse all of the above to instant transitions.

### 12.5 Theme/Mode integration
The component must render correctly in light, dark, and vibrant. The Brand Kit and Design System pages (see [Maintain Design System and Brand Kit Motions](./Maintain-Design-System-and-Brandkit-Motions.md) §3 and §4) MUST include a live `<PollEmbed variant="card" />` example so regressions are visible.

---

## 13. Vote Integrity, Privacy & Anti-Abuse

### 13.1 Integrity contract
- **One vote per `(poll_id, user_id)`** for choice polls, enforced by the unique index in §8.3.
- **Vote changes** allowed only while `status = open` and only if `poll.allow_revote` is true; updates `Vote.option_ids` / `value` and bumps `updated_at`.
- **Server is authoritative** about poll state. The client may *believe* a poll is open and submit a vote; the server rejects with `409 poll_closed` if it isn't.
- **Rate limit** writes per user per poll (e.g., 10/min) to absorb double-clicks and small abuse.

### 13.2 Privacy posture
- `anonymous_display = true` hides the voter list in *every* UI, including host console. Storage still attributes; this is non-negotiable for integrity.
- Do **not** log IPs against votes. Do **not** store precise user agents. The `client_meta` field in §5.3 is intentionally coarse.

### 13.3 Host abuse surface
Hosts can `reset` a poll. This is logged to `PollEvent` and visible in the archive page. If a host resets a closed poll, the archive shows both runs; we never silently overwrite history.

---

## 14. Verification

### 14.1 Unit / integration (Vitest)
Required coverage for v0.0.1:
- **Lifecycle transitions** — every legal Session and Poll transition from §6, every illegal transition rejected.
- **One-vote-per-user** — second vote without `allow_revote` is `409`; with `allow_revote` updates the row.
- **Type-specific payload validation** — `single-select` rejects multiple option IDs; `sliding-scale` rejects out-of-range; `multi-select` honors min/max bounds; `boolean` accepts only true/false.
- **Anonymity** — `anonymous_display = true` strips voter identities from the API response shape.
- **Results aggregation** — recompute equals sum of votes; cache invalidation on write.
- **Materialization** — `pnpm sync:session` produces a markdown file matching the §9.6 schema, and re-running the command on an already-archived session fails loudly.
- **SSR safety** — component imports do not crash without `window`.

### 14.2 End-to-end (Playwright)
One scripted live-session rehearsal:
1. Author signs in, seeds a session and three polls.
2. Two voter sessions join `/sessions/[slug]`; both vote on each poll.
3. Host closes polls one at a time; reveal animation plays on both voter clients.
4. Admin runs `pnpm sync:session <slug>`.
5. Archive page renders the snapshot at the next build.

This is the canary. Run it on PRs that touch any polling code.

---

## 15. v0.0.1 Porting Checklist

When adding interactive polling to a new Astro-Knots site (or first-running it on FullStack VC):

- [ ] OAuth identity is live and a stable `user_id` is exposed to server routes (§3).
- [ ] User-profile resolution exists, even if minimal (§3.1).
- [ ] `data-theme` / `data-mode` and the `--color-*` / `--fx-*` token system are in place (theme blueprint §2, §9).
- [ ] Astro DB installed (`npx astro add db`); tables defined in `db/config.ts` per §8.3.
- [ ] Turso production database provisioned; `ASTRO_DB_REMOTE_URL` and `ASTRO_DB_APP_TOKEN` set on the deployment platform; `astro build --remote` configured in `package.json` (§8.4).
- [ ] `db/seed.ts` populates a usable local development dataset (one Session, three Polls).
- [ ] Implement `/api/polls/[id]/results.json` (GET) and `/api/polls/[id]/votes` (POST) using `astro:db` (§8.5).
- [ ] Confirm Svelte islands fetch via API routes (never import `astro:db` directly) (§8.6).
- [ ] Implement `pnpm sync:session <slug>` CLI script per §9.4.
- [ ] `src/config/polling.ts` declares `POLL_GRACE_MINUTES` and `SESSION_GRACE_MINUTES` (§9.3).
- [ ] Migrate existing `/webinars` route to `/sessions/[slug]` (live, SSR) and add `/sessions/archive/[slug]` (SSG).
- [ ] Drop in `<PollEmbed />` Svelte component family with the four v0.0.1 templates; verify the required tokens render correctly in all three modes (§12.3).
- [ ] Add a `<PollEmbed variant="card" />` example to the site's `/design-system/index.astro` (Design System blueprint §4).
- [ ] Wire the Vitest harness (§14.1); the Playwright run (§14.2).
- [ ] Document the local env vars and the Turso CLI bootstrap commands in the site's `README.md`.
- [ ] Confirm `prefers-reduced-motion` collapses all GSAP animations (§12.4).
- [ ] Confirm `anonymous_display` polls strip identities from every endpoint, including the host's (§13.2).

---

# MIDDLE — deferred but spec'd (v0.0.2 / v1.1+)

## 16. Deferred Poll Question Templates

These are spec'd here so engineering knows the contract and can build toward them. None ship in v0.0.1. Promote one out of this section when (a) the v0.0.1 four are stable through at least two live meetings, and (b) there's a concrete authored poll waiting for the new template.

### 16.1 `PollQuestionTemplate__TextBox.svelte`
Free-text input. Two sub-modes selected by `max_length`:
- Short mode (≤24 chars): aggregates into a sized word cloud or top-N bar.
- Long mode: each submission is a card; presenter view paginates.

```ts path=null start=null
// Authoring
{
  template: 'text-box';
  prompt: string;
  max_length?: number;        // default 24 (short mode threshold)
  min_length?: number;
  placeholder?: string;
  moderate?: 'auto' | 'host' | 'off';
}
// Vote response
{ value: string }
```

### 16.2 `PollQuestionTemplate__MultiStringInput.svelte`

A list-builder. The voter sees a single short input row, types a phrase, presses Enter or "Add", and it slots into their growing list as a chip. They can remove entries to revise, and submit when done. **Empty submissions are valid** — "I have nothing to share right now" is real data.

Distinct from `TextBox` (§16.1): TextBox encourages one paragraph-shaped blob that has to be parsed afterwards; MultiStringInput encourages many short atomic phrases. Each phrase becomes a separate analyzable unit on the data side, and the act of "press Enter, see it slotted in, hit again" provokes the voter to keep mining their memory for one more entry. The right shape for prompts like *"What are some hard-won wins with technology tools you'd be willing to share?"* or *"What are some challenges you've been facing where someone else has clearly already figured this out?"* — wins and pains are plural by nature; one-blob inputs lose them in commas and run-on sentences.

```ts path=null start=null
// Authoring
{
  template: 'multi-string-input';
  prompt: string;
  placeholder?: string;            // shown in the empty input row
  max_string_length?: number;      // per entry; default 200
  max_strings_per_voter?: number;  // soft cap shown in UI; server enforces if set
  moderate?: 'auto' | 'host' | 'off'; // matches TextBox §16.1
}
// Vote response (uses Vote.response, see §5.3)
{ values: string[] }               // empty array is valid; trims whitespace; dedupes within a single voter
```

#### Realtime visibility model

Unlike the choice and scale templates, this template's *content* is sensitive during a live meeting. Voters share half-formed wins, current pain points, even quiet admissions — content they may not want surfaced unless someone asks them to. So the realtime contract is split between **counts** (public) and **content** (host-controlled):

- **Counts** are public and update live: `total_strings` and `total_contributors` (e.g., "47 entries from 22 contributors"). These two scalars are what `/api/polls/[id]/results.json` returns to non-host clients while the poll is `open`.
- **Content** is host-only by default during the live phase. The host sees the growing list (de-duplicated across voters; each entry tagged with voter ID unless `anonymous_display = true`), so they can spot a gem and invite the voter to elaborate, lead a working group, or pair with someone struggling with the same thing.
- **Reveal** is governed by `results_visibility` (existing field, §5.2), interpreted for this template as:
  - `'live'` — entries appear publicly as they're added. Use sparingly; high social-pressure surface; appropriate for icebreakers and group brainstorms, **not** for "what are you struggling with?" prompts.
  - `'on-close'` — content private to host during live; full list revealed when the poll closes. Recommended default for wins / challenges prompts.
  - `'host-only'` — content stays private to the host even after close. For when the host plans to follow up offline and never publish the list (sensitive operational concerns, LP friction, etc.).

#### Display

- **Voter view (open, not yet submitted):**
  - One-line input + "Add" button. Pressing Enter equals click.
  - Below the input, the voter's current list as removable chips.
  - "Submit" button locks the list as their vote. Re-submission allowed only if `allow_revote = true`; button label reads "Update list" once a prior submission exists.
- **Voter view (open, post-submit, results=live):**
  - Voter's own list shown as theirs; other voters' entries shown anonymized (unless `anonymous_display = false`) and de-duplicated by `lower(trim())` matching with a small "× N" badge for multi-said phrases.
- **Voter view (open, post-submit, results=on-close):**
  - Voter's own list still visible to them. Aggregate = "47 entries from 22 contributors" only. No content from others.
- **Host view (open):**
  - Full content stream, attribution per `anonymous_display`. Optional "spotlight" hook (out of scope v0.0.1; reserve the prop) for promoting an entry to a presenter view.
- **Closed:**
  - All entries displayed per `results_visibility`. Light clustering UI (group near-duplicates) is presentation only — the underlying response array stays un-merged on the Vote row.

#### Aggregation rule

Two scalars derived live; full list materializes on close.

- `total_strings` = sum of `len(vote.response.values)` across all votes for the poll.
- `total_contributors` = count of distinct `vote.user_id` where `len(values) > 0`. (Voters who submitted an empty list count toward `total_votes` for completeness reporting but not toward `total_contributors`.)
- On close: dedupe across voters by `lower(trim())`; preserve original casing from first occurrence; keep counts per dedupe key (so the archive can render "5 people said 'shipping faster'").

These two scalars are what update on the Tier 1 polling cadence (§10.1) — the body of `/api/polls/[id]/results.json` stays small even when the actual content grows large.

#### Why this template is its own thing

It would be tempting to fold this into `TextBox` (§16.1) with a `multi: true` flag. Resist that. The privacy contract here (counts public, content host-controlled) is materially different from TextBox's "every submission is a card." Conflating them produces a template with two incompatible UI shapes and a confusing authoring schema. Keep them as siblings.

### 16.3 `PollQuestionTemplate__MatrixSingleSelect.svelte`
Rows × columns; each row gets exactly one column selected. Likert / rating grid.

```ts path=null start=null
// Authoring
{
  template: 'matrix-single-select';
  prompt: string;
  rows: { id: string; label: string }[];
  columns: { id: string; label: string }[];
  require_all_rows?: boolean; // default true
}
// Vote response (uses Vote.response)
{ matrix: Record<string, string> }  // row_id → column_id
```

### 16.4 `PollQuestionTemplate__MatrixMultiSelect.svelte`
Rows × columns; each row may have multiple columns selected.

```ts path=null start=null
// Authoring
{
  template: 'matrix-multi-select';
  prompt: string;
  rows: { id: string; label: string }[];
  columns: { id: string; label: string }[];
  min_per_row?: number;
  max_per_row?: number;
}
// Vote response
{ matrix: Record<string, string[]> }  // row_id → column_ids
```

### 16.5 `PollQuestionTemplate__AreaBoardOptionDrop.svelte`
A chip tray + matrix grid. Voter drags option chips into cells of a labeled grid. The grid's cells are deterministically generated from the cross-product of two ordered axis scales.

Canonical use case (skills self-assessment):
- Option chips: `Keyboard Shortcuts & Bindings`, `Terminal Commands & Bash`, `Extended Markdown Flavors`, `Data Analysis with Code`, `Data Visualizations with Code`, `Video Production & Editing`.
- Y-axis (proficiency): `Lagging, Undeveloped` → `Comfortable, Proficient` → `Ninja, Advanced`.
- X-axis (sentiment): `Drudgework, Avoid` → `Fine, Routine` → `Love it, Want More`.

Each chip ends up in one of the nine cells, encoding both *how good they are* and *how they feel about it* in a single drop.

```ts path=null start=null
// Authoring
{
  template: 'area-board-option-drop';
  prompt: string;
  options: PollOption[];
  axes: {
    x: { label: string; scale: string[] }; // ordered left → right
    y: { label: string; scale: string[] }; // ordered bottom → top
  };
  require_all_options_placed?: boolean; // default true
  cell_capacity?: number;
  allow_revisit?: boolean; // default true while open
}
// Vote response (uses Vote.response)
{
  placements: Record<string, { x: number; y: number }>;
  // option_id → indices into axes.x.scale and axes.y.scale
}
```

Display:
- Per-respondent view: grid with the voter's chips in their cells.
- Aggregate view: heatmap with count badges and top-K most-frequently-placed options per cell.
- Optional drilldown: click an option to highlight its distribution across the grid.

Touch / drag-and-drop UX needs its own design pass before this ships.

### 16.6 Recommended additions (high-confidence, post-v0.0.1)

These surface within the first ~3 meetings of running polls and resist being faked with the four shipping templates.

#### 16.6.1 `PollQuestionTemplate__RankedOrder.svelte`
Drag-to-rank list.
```ts path=null start=null
{ template: 'ranked-order'; prompt: string; options: PollOption[]; max_rank?: number }
// Vote: { ranking: string[] }
```
Aggregation: Borda count or median rank.

#### 16.6.2 `PollQuestionTemplate__StarRating.svelte`
1–N stars (typically 1–5).
```ts path=null start=null
{ template: 'star-rating'; prompt: string; max: number; allow_half?: boolean }
// Vote: { value: number }
```

#### 16.6.3 `PollQuestionTemplate__NPS.svelte`
0–10 with auto-bucketing (Detractors 0–6 / Passives 7–8 / Promoters 9–10).
```ts path=null start=null
{ template: 'nps'; prompt: string }
// Vote: { value: number }
```

#### 16.6.4 `PollQuestionTemplate__EmojiReaction.svelte`
Single-tap emoji bar — live-meeting "heartbeat."
```ts path=null start=null
{ template: 'emoji-reaction'; prompt: string; options: PollOption[] }
// Vote: { option_ids: [string] }
```

#### 16.6.5 `PollQuestionTemplate__ImagePick.svelte`
Visual single-select where each option *is* an image.
```ts path=null start=null
{ template: 'image-pick'; prompt: string; options: PollOption[] }
// Vote: { option_ids: [string] }
```

#### 16.6.6 `PollQuestionTemplate__TwoAxisPlot.svelte`
Voter places themselves at one point on a labeled 2D plane.
```ts path=null start=null
{
  template: 'two-axis-plot';
  prompt: string;
  axes: {
    x: { label: string; min_label: string; max_label: string };
    y: { label: string; min_label: string; max_label: string };
  };
}
// Vote: { value: { x: number; y: number } }  // each in 0..1
```

#### 16.6.7 `PollQuestionTemplate__DatePick.svelte`
Pick a date or time slot from a constrained range.
```ts path=null start=null
{ template: 'date-pick'; prompt: string; min?: string; max?: string; granularity?: 'day' | 'hour' | 'slot'; slots?: string[] }
// Vote: { value: string }  // ISO 8601
```

### 16.7 Open for discussion (schema not locked)

- `PollQuestionTemplate__PinDropOnImage.svelte` — click to drop a pin on an image; heatmap of click locations.
- `PollQuestionTemplate__CardSort.svelte` — sort N cards into M buckets. Adjacent to MatrixMultiSelect / AreaBoardOptionDrop.
- `PollQuestionTemplate__TierList.svelte` — explicit S/A/B/C/D lanes. Now clearly a 1-axis specialization of `AreaBoardOptionDrop`.
- `PollQuestionTemplate__BudgetAllocate.svelte` — distribute a fixed total across N options.
- `PollQuestionTemplate__ConjointPair.svelte` — repeated A-vs-B preference comparisons.

---

## 17. Higher-Tier Real-Time Mechanics (deferred)

### 17.1 Tier 2 — Server-Sent Events (SSE)
Reach for SSE when:
- Concurrent viewers exceed ~500, or
- Perceived latency must be sub-second (presenter projection during a high-stakes panel).

One `GET /api/polls/[id]/stream` endpoint, server pushes `result` events on each aggregation tick. Same JSON shape. Falls back to interval polling on connection error.

### 17.2 Tier 3 — WebSockets
Only when bidirectional low-latency is required (e.g., presenter pushing reveal cues to all clients). Overkill for most use cases.

---

## 18. Editorial Enrichment After Archive

The body of `src/content/sessions/<slug>.md` is human-owned. The sync never touches it. Typical enrichments after a session archives:

- **Discussion summary** — narrative recap of what was discussed alongside each poll's result. Likely produced by an AI agent processing the meeting transcript.
- **Notable quotes** — pull quotes from participants.
- **Video embed** — recording link or embed code.
- **Follow-up links** — articles the meeting prompted, related sessions, etc.

This work is tracked separately from polling. The polling system's responsibility ends at the frontmatter; everything below the closing `---` is editorial / content-team / AI-agent territory.

---

## 19. Why Not a SaaS Polling Tool (Slido, Mentimeter, Polly)?

We tried. The honest tradeoff:

- **What SaaS gives you:** zero implementation, presenter-tested UI, instant visual polish, no infra.
- **What it costs:** a third-party brand sits inside your meeting; results live outside your content system; no theme/mode parity (your dark vibrant brand renders as their default light); attendees authenticate twice; archive URLs are theirs, not yours; the panel's content engine ends at the meeting boundary.
- **What an in-site polling system gives you:** results are first-class content with your URLs; voters use the same OAuth session they already have; the projection screen renders in your brand; results re-publish as articles trivially via the materialization motion (§9); AI assistants can author, modify, and archive sessions in the same change as the surrounding content.
- **What you give up:** the SaaS's polish on day one, and a few features (live Q&A, multi-room moderation) that polling-as-content doesn't try to solve.

For venture-meeting-scale events with our content motion, the in-site system wins. If a site ever needs >2,000 concurrent voters or live multi-room moderation, revisit.

---

# BOTTOM — wish list, edge cases, references

## 20. Next-Step Considerations

Reasonable next iterations of the system, post-v0.0.1:

- **Real admin/host console** at `/admin/sessions/[slug]` and `/admin/polls/[id]` — replaces the direct-DB authoring path in v0.0.1.
- **Scheduled materialization cron** (§9.5) — autopilot for grace-period sync.
- **`kind: 'time-bound'` sessions** — async distribution via email, WhatsApp, Twitter, LinkedIn.
- **Cross-session narratives** — bind multiple sessions into a series so cumulative polls render as a coherent results page.
- **Presenter cues** — a small DSL (`@cue open poll-3`, `@cue reveal poll-3`) embedded in meeting agendas so the host console can advance the lifecycle in lockstep with the agenda.
- **Result embedding API** — `<poll-result id="..." />` web component that lets editorial articles inline a final tally at build time.
- **Accessibility audit** — keyboard-only ranking for `RankedOrder` is the hardest interaction; commission a focused a11y pass before promoting that template to GA.

---

## 21. Future Ideas & Wish List

Ideas raised during design that are *deliberately* not in scope for v0.0.1 or any near-term iteration. Parked here so they aren't lost. Promote an item out when it earns a real user need + an owner.

### 21.1 Anonymous (unauthenticated) voting

Open question: should we allow voters who haven't signed in via OAuth, to maximize participation on public-facing polls?

**Deferred.** The homegrown OAuth flow is fast enough that v0.0.1 doesn't need an anonymous escape hatch, and admitting unauthenticated voters introduces a hard contradiction with the integrity contract in §13.1. When we revisit, the design space:

- **(a) Browser-cookie identity** — issue an opaque cookie ID; treat as `user_id`. Cheap; trivially defeated. OK for low-stakes engagement polls.
- **(b) Magic-link ephemeral identity** — voter enters an email, gets a one-time link that mints a temporary identity. Friction sits between cookie and OAuth.
- **(c) Per-meeting access code** — host hands out a short code; the code mints a per-meeting identity. Best for member meetings.
- **(d) Accept ballot stuffing and document it** — explicitly mark the poll as "directional, not authoritative." Cheapest. Honest.

When this comes back: pick one (or a per-poll selector), add `Poll.identity_mode`, update §13.1.

### 21.2 Other parked ideas

- **Cross-meeting longitudinal polling.** Same prompt asked across N sessions; results display as a time series. Requires a `SessionSeries` entity above `Session`.
- **Voter-submitted options.** Author seeds N options; voters can append their own (subject to moderation). Materially changes the data model and moderation UX.
- **Multi-step / branched polls.** Voter's answer to Q1 routes them to Q2a vs. Q2b. Solves "surveys" — re-implementing Typeform. Probably belongs in a separate `Maintain-an-Embedded-Survey-System.md` blueprint.
- **Live commentary alongside results.** A small chat or reaction stream pinned next to the projection view.
- **Predictive market mode.** Voters stake "points" on outcomes; results weighted by stake and resolved against ground truth later.
- **Export to slide.** A session's archive page renders as an embeddable slide for the [Maintain Embeddable Slides](./Maintain-Embeddable-Slides.md) system.
- **Generalize content materialization.** §9 is a polling-shaped instance of a general pattern. If we use it twice (e.g., for live people-data, live Q&A), extract to its own blueprint: `Maintain-DB-to-Content-Materialization.md`. Don't pre-extract.

---

## 22. References
- [Maintain Themes & Modes Across CSS and Tailwind](./Maintain-Themes-Mode-Across-CSS-Tailwind.md) — the token system every poll component consumes.
- [Maintain Design System and Brand Kit Motions](./Maintain-Design-System-and-Brandkit-Motions.md) — the Design System index must include a live `<PollEmbed />` example so theme/mode regressions are visible.
- [Maintain Embeddable Slides](./Maintain-Embeddable-Slides.md) — sister blueprint for live-meeting content; sessions and slides often share a meeting and a presenter URL pattern.
- [Astro DB documentation](https://docs.astro.build/en/guides/astro-db/) — the storage layer for live polling.
- **Reference implementation (target):** `sites/fullstack-vc/` — first site to land the polling system end-to-end.
- **External prior art studied (and rejected as primary tooling):** Slido, Mentimeter, Polly. Useful for UX inspiration; not used in production.
