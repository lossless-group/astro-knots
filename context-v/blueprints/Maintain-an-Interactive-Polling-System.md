---
date_created: 2026-04-28
date_modified: 2026-04-28
date_authored_initial_draft: 2025-04-28
date_authored_current_draft: 2025-04-28
date_authored_final_draft:
date_first_published: null
site_uuid: e9b53105-c5e3-4c4a-8bb9-e72d88764e0
publish: true
title: "Maintain an Interactive Polling System"
slug: maintain-an-interactive-polling-system
lede: "Implementation blueprint for embeddable, theme-aware interactive polls on Astro SSG sites — covering data model, storage progression from flat-file to database, real-time mechanics, live-meeting authoring motions, vote integrity, and Svelte + GSAP UI contracts."
at_semantic_version: 0.0.0.1
status: Draft
category: Blueprints
authors:
  - Michael Staton
augmented_with: "Oz on auto"
tags: [Polling, Interactive, Live-Meetings, Astro-Islands, Svelte, GSAP, Realtime, OAuth, User-Profiles]
image_prompt: "A small robot stands with a small projector on top of a computer desk, behind the monitor.  He is projecting like old movies were projected, but on the computer monitor is a Keynote slide deck."
banner_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_banner_image_1755815513881_vG9H27ZKx.webp"
portrait_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_portrait_image_1755815520946_NlMeL6qdl.webp"
square_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_square_image_1755815527652_HEYKVBKOm.webp"
---

# Blueprint for Developing and Maintaining Interactive Polling Systems

This blueprint codifies the contract for an **interactive polling system** that can be dropped into any Astro-Knots site without the site having to invent its own data model, real-time layer, or authoring motions. The goal is the same as the Brand Kit / Design System and Themes & Modes blueprints: components, tokens, and runtime utilities are stable across sites; **only the wiring and the content change**.

A poll is not just a UI widget. It is a small content type with a lifecycle (draft → open → closed → archived), an integrity contract (one vote per identified user), and a real-time presentation surface (the host's screen during a live meeting). All three concerns have to be designed together or the system collapses into per-site one-offs.

---

## 1. Goals
- **Embeddable anywhere.** A poll renders the same way on a marketing page, an article, a member dashboard, and a live-meeting projection surface.
- **Stack discipline.** Astro SSG by default; Svelte islands for interactivity; GSAP for transitions. No new framework dependency introduced by polling.
- **Identity-bound voting.** Every vote is attributed to an authenticated user (OAuth) and resolved against a person record. Anonymous polls are a *display* choice, not a data choice.
- **Two-tier storage progression.** Start with flat-file polls (markdown/JSON in the repo) and graduate to a database-backed store the moment live, real-time tallying is required. Both modes share one Svelte component contract.
- **Real-time without WebSockets unless required.** Default to short-interval HTTP polling (3–5s) against a small results endpoint; reach for SSE or WebSockets only when concurrency or latency demand it.
- **Theme & mode aware.** Poll components consume `--color-*` and `--fx-*` tokens (see [Maintain Themes & Modes Across CSS and Tailwind](./Maintain-Themes-Mode-Across-CSS-Tailwind.md)) and render correctly in light / dark / vibrant.
- **Verifiable.** Every poll type has an integration test covering open/close transitions, vote idempotency, and result reconciliation.

---

## 2. This Run of the Blueprint

We have developed a new website called [FullStack VC](https://fullstack-vc.com) and we want to introduce interactive polling.  The FullStack VC community of venture professionals organizes around live web meetings, and we want to enable interactive polling during these meetings.

Our religious preference on our "stack" is defaulting to Astro SSG, but we use Svelte where it makes sense for interactivity and animations. On several projects, we have introduced GSAP to add sophisticated animations and transitions. So, there is no going outside of those boundaries.

### 2.1 Overview
This blueprint defines how we should develop and maintain an interactive polling system. It requires pre-development milestones including:
1. OAuth based user authentication. Authentication is set up through a homegrown, lean OAuth implementation, so authenticating or creating an account should be seamless and quick — friction-free enough that we don't need an anonymous-voting escape hatch in v1 (see §17 for the parked discussion).
2. User profile or people data and collection management.

For FullStack VC we have both of these, though our user profile system is nascent and may need an upgrade to a true database-backed user profile system instead of using markdown and json files that must be committed to the repository before rendering live on the site.

### 2.2 Why polling specifically, and why now
Live web meetings of venture professionals have a known failure mode: the panel speaks, the audience listens, and engagement falls off after ~12 minutes. Interactive polls re-anchor attention every 8–15 minutes and produce *durable* artifacts (results, quotes, follow-up questions) that can be re-published as content after the meeting. The meeting becomes a content engine, not a one-time event.

### 2.3 v1 Scope (Locked)

The temptation in §7 is to commit to every named template at once. We're not doing that. **v1 ships exactly four templates** behind the full lifecycle, with one rehearsed live meeting:

1. `PollQuestionTemplate__Boolean.svelte` (§7.1)
2. `PollQuestionTemplate__SingleSelect.svelte` (§7.4)
3. `PollQuestionTemplate__MultiSelect.svelte` (§7.3)
4. `PollQuestionTemplate__SlidingScale.svelte` (§7.5)

These four cover ~80% of live-meeting polling needs (gut-checks, opinion polls, multi-pick, scale ratings) without dragging in drag-and-drop UX, matrix grids, or word-cloud aggregation. They're also independent enough that each one's failure mode doesn't poison the others.

Everything else in §7 — `TextBox`, the matrix templates, `AreaBoardOptionDrop`, all of §7.9, and all of §7.10 — is **v1.1+**. Fully spec'd here so engineering knows the contract and can build toward it, but not in v1 scope. We promote a template out of v1.1+ when (a) the v1 four are stable through at least two live meetings, and (b) there's a concrete authored poll waiting for the new template.

**Why this scope is the right size:** the riskiest work in v1 is *not* the question UI. It's the lifecycle, the OAuth-bound vote integrity contract, the host console, the projection page, and the real-time results loop. Those have to land regardless of how many templates we ship. Four templates lets us prove that backbone without burning the budget on chip-drop UX or matrix heatmaps.

---

## 3. Pre-Development Requirements

Do not start building polls until these are in place. Each one is a hard dependency.

1. **OAuth identity.** A reliable session with a stable, opaque user ID. Anything less and "one vote per user" is unenforceable. The user ID is the primary key for every vote row.
2. **Person/profile resolution.** A way to map a user ID to a person record (name, avatar, role, optional org). Polls reference *people*, not raw OAuth tokens, in any presenter-facing UI.
3. **A meeting / event entity** (when polls are scoped to live meetings). Even a thin one — `meeting_id`, `starts_at`, `host_user_id` — is enough to gate poll activation.
4. **A results endpoint pattern.** The site must already serve at least one JSON endpoint from an Astro server route. For FullStack VC and any future Astro-Knots site, this is satisfied by Astro DB on Turso (§8.2); polling is the forcing function that lands this stack if it isn't already in the site.
5. **Theme & mode contract.** `data-theme` / `data-mode` on `<html>` and the `--color-*` / `--fx-*` token system are present. Poll UI is built against those tokens, not bespoke CSS.

If any of these are missing, the right move is to land them as separate milestones first. Polling is the wrong place to also debut authentication.

### 3.1 The User Profile Upgrade Question
Flat-file user profiles (markdown/JSON committed to the repo) work for *editorial* people pages. They do **not** work for vote attribution, because:
- New attendees can't vote until a maintainer commits a profile and redeploys.
- Vote rows can't reference a user who doesn't yet exist in the repo.
- Polls become eventually-consistent in the worst possible way: results change after a redeploy.

The upgrade path: **OAuth-issued user IDs are the source of truth**; flat-file profiles become an *enrichment layer* keyed by user ID. A user can vote the moment they sign in; their profile is filled in lazily (display name pulled from the OAuth provider, avatar default-generated, full bio added later by an editor). Polling is the forcing function for this upgrade on most sites.

---

## 4. Architecture & Stack Boundaries

The stack is fixed. The boundaries below are not preferences, they are the contract.

### 4.1 Render boundary
- **Astro SSG** renders the static shell of any page that contains a poll: heading, prose, surrounding content. The page may server-render an *initial* poll snapshot via `astro:db` at request time when SSR is enabled for that route (see §8.6).
- **Svelte island** (`<PollEmbed client:load />` or `client:visible`) renders the poll itself. The island is the only piece that hydrates.
- **GSAP** handles transitions inside the island (bar growth, count-up, vote-confirmation flourish, presenter mode reveal). GSAP is *never* loaded on pages without an active poll island.
- **SSR is opt-in per route.** Marketing pages, articles, and archived poll pages stay SSG. The host console (`/host/meetings/[id]`), projection page (`/present/polls/[id]`), and the JSON API routes are SSR. See §8.1 for the rationale.

### 4.2 Data boundary
- **Read path (anonymous viewers, closed polls):** the static page may inline a snapshot of results at build time when the poll is closed. No client requests required.
- **Read path (open polls):** the Svelte island fetches `/api/polls/[id]/results.json` on an interval.
- **Write path:** the island POSTs to `/api/polls/[id]/votes` with the OAuth session cookie. The server validates identity, idempotency, and poll state.

### 4.3 What does *not* belong in the polling system
- Authentication (lives in the auth blueprint).
- Person/profile editing (lives in the people-data blueprint).
- Meeting scheduling (lives in the events blueprint).
- Notifications/email (lives in the comms blueprint).
Polling consumes these, it does not own them.

---

## 5. Data Model

Four entities. Keep them small.

### 5.1 `Poll`
- `id` — slug-ish, stable across the lifecycle.
- `title`, `prompt` — the question shown to voters.
- `type` — see §7 (`single-choice`, `multi-choice`, `ranked`, `slider`, `word-cloud`, `quick-reaction`).
- `options[]` — for choice-based polls; each option has `id`, `label`, optional `description`, optional `image`.
- `status` — `draft` | `scheduled` | `open` | `closed` | `archived` (see §6).
- `meeting_id` — optional; binds the poll to a live event.
- `visibility` — `public` | `members` | `meeting-attendees`.
- `results_visibility` — `live` | `on-close` | `host-only`.
- `anonymous_display` — boolean. Vote is still attributed in storage; only the UI is anonymous.
- `opens_at`, `closes_at` — optional schedule.
- `created_by`, `created_at`, `updated_at`.

### 5.2 `Vote`
- `poll_id`, `user_id` (composite primary key for choice polls — enforces one-vote-per-user at the storage layer).
- `option_ids[]` — single-element for `SingleSelect`; multi-element for `MultiSelect`; ordered for `RankedOrder`.
- `value` — scalar response for templates that produce a single primitive (`Boolean`, `TextBox`, `SlidingScale`, `StarRating`, `NPS`, `DatePick`).
- `response` — generic typed-JSON column for templates whose answer doesn't fit `option_ids` or `value` (matrix templates, area-board placements, two-axis points). Each `PollQuestionTemplate__*` component defines its own response shape (see §7); the server validates against the active template's schema before write.
- `created_at`, `updated_at` — `updated_at` permits vote changes while the poll is open if `allow_revote` is true.
- `client_meta` — coarse, optional: `user_agent_class`, `is_presenter_view`. **No IP, no precise UA strings, no fingerprinting.**

### 5.3 `PollResult` (derived, never authoritative)
A cached projection of votes for fast reads:
- `poll_id`, `tallies` (option_id → count), `total_votes`, `last_aggregated_at`.
- Recomputed on vote write or on a short cadence; never written to from the client.

### 5.4 `PollEvent` (audit, optional but recommended)
- `poll_id`, `actor_user_id`, `kind` (`open`, `close`, `extend`, `reset`, `delete`), `at`, `note`.
Needed the moment a host makes a mistake during a live meeting. Without it, you can't tell whether a vote count spike was a bug or a re-open.

---

## 6. Lifecycle States

```
draft ──▶ scheduled ──▶ open ──▶ closed ──▶ archived
                          ▲       │
                          └──┐    ▼
                            extend  (host can re-open within a grace window)
```

- **draft** — editable, invisible to non-authors. No votes accepted.
- **scheduled** — pinned to an `opens_at` (often the meeting start). Visible as a teaser; voting disabled.
- **open** — accepting votes. Results visibility honors `results_visibility`.
- **closed** — no new votes. If `results_visibility = on-close`, the result reveal animation runs (this is where GSAP earns its keep).
- **archived** — read-only, removed from active listings; results inlined statically at next build.

Hosts can `extend` (push `closes_at`) or `reset` (zero the votes — guarded behind a confirmation; logged in `PollEvent`). Both are common during live meetings and must be one click.

---

## 7. Poll Question Templates (Svelte Components)

Every question type is implemented as a dedicated Svelte component named `PollQuestionTemplate__<Type>.svelte`. The orchestrator component, `<PollEmbed />`, looks up the active poll's `type` and renders the matching template; the templates never know about each other. This mirrors the BEM-style named-token convention in the Themes blueprint (§2.1) — the `__` is a deliberate visual cue that says *"concrete template, not abstract orchestrator."*

Each template owns three things:
1. **Authoring schema** — what a poll author fills in (markdown frontmatter or admin form).
2. **Vote response schema** — the exact shape stored on `Vote` (see §5.2). This is the contract between client UI and server validator.
3. **Display / aggregation rule** — how the same data is rendered live, on close, and in the static archive.

Adding a new template is cheap *because* of this contract: drop in a new `.svelte` file, register its schema, add a Vitest case that exercises authoring + voting + aggregation. No edits required in `PollEmbed`'s render path beyond the lookup map. With "vibe coding" / context engineering this can land mid-meeting if needed.

### v1 Scope vs v1.1+ Scope

Per §2.3, **v1 ships exactly four templates**:

- §7.1 `Boolean`
- §7.3 `MultiSelect`
- §7.4 `SingleSelect`
- §7.5 `SlidingScale`

Every other template in this section (§7.2 `TextBox`, §7.6–7.7 matrix templates, §7.8 `AreaBoardOptionDrop`, all of §7.9, all of §7.10) is **v1.1+**. Each subsection below carries an explicit `**Scope:**` marker so there's no ambiguity. The cross-template contract in §7.11 applies to every template regardless of scope tier.

The `PollOption` type referenced below is shared:

```ts
interface PollOption { id: string; label: string; description?: string; image?: string; }
```

### 7.1 `PollQuestionTemplate__Boolean.svelte`
**Scope:** v1 — ships in initial release.

Yes/No or True/False. The simplest type. Common as quick gut-checks during meetings ("Is this team raising in the next 6 months?").

```ts
// Authoring
{ type: 'boolean'; prompt: string; labels?: { true: string; false: string } } // defaults: Yes / No
// Vote response
{ value: boolean }
```
Display: two-bar tally with percent each side; optional "consensus" badge when one side exceeds 80%.

### 7.2 `PollQuestionTemplate__TextBox.svelte`
**Scope:** v1.1+ — deferred. Spec'd for contract clarity, not in v1.

Free-text input. Operates in two sub-modes selected by `max_length`:
- **Short mode** (≤24 chars) — aggregates into a sized word cloud or top-N bar.
- **Long mode** — each submission is a card; presenter view paginates through them.

```ts
// Authoring
{
  type: 'text-box';
  prompt: string;
  max_length?: number;        // default 24 (short mode threshold)
  min_length?: number;
  placeholder?: string;
  moderate?: 'auto' | 'host' | 'off'; // server-side normalization & profanity filter
}
// Vote response
{ value: string }
```
Display: sized word cloud in short mode; scrollable card stack in long mode. Server normalizes (trim + lowercase for short mode) **before** storage — stored content is moderated content (§12.2).

### 7.3 `PollQuestionTemplate__MultiSelect.svelte`
**Scope:** v1 — ships in initial release.

Checkbox-style. Voter picks 1+ options, with optional bounds.

```ts
// Authoring
{
  type: 'multi-select';
  prompt: string;
  options: PollOption[];
  min_selections?: number; // default 1
  max_selections?: number; // default options.length
}
// Vote response
{ option_ids: string[] }
```
Display: horizontal stacked bars per option. Denominator is **respondents**, not total selections — otherwise percentages are nonsensical.

### 7.4 `PollQuestionTemplate__SingleSelect.svelte`
**Scope:** v1 — ships in initial release.

Radio-style. Exactly one option.

```ts
// Authoring
{ type: 'single-select'; prompt: string; options: PollOption[] }
// Vote response
{ option_ids: [string] } // length-1 tuple
```
Display: bar chart sorted by tally; winner gets the `--fx-glow-*` reveal on close (§11.4).

### 7.5 `PollQuestionTemplate__SlidingScale.svelte`
**Scope:** v1 — ships in initial release.

Numeric slider with bounds and step. The de-facto "how strongly" / "what's your estimate" template.

```ts
// Authoring
{
  type: 'sliding-scale';
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

### 7.6 `PollQuestionTemplate__MatrixSingleSelect.svelte`
**Scope:** v1.1+ — deferred. Spec'd for contract clarity, not in v1.

Rows × columns; each row gets **exactly one** column selected. Classic Likert / rating grid ("Rate each of these companies — Avoid / Watch / Lean In / Term sheet today").

```ts
// Authoring
{
  type: 'matrix-single-select';
  prompt: string;
  rows: { id: string; label: string }[];
  columns: { id: string; label: string }[];
  require_all_rows?: boolean; // default true
}
// Vote response (uses Vote.response, §5.2)
{ matrix: Record<string /* row_id */, string /* column_id */> }
```
Display: heatmap (rows × columns), cell darkness proportional to selection count; per-row mini-bar to the right.

### 7.7 `PollQuestionTemplate__MatrixMultiSelect.svelte`
**Scope:** v1.1+ — deferred. Spec'd for contract clarity, not in v1.

Rows × columns; each row may have **multiple** columns selected. ("Which of these channels apply to each portfolio company?")

```ts
// Authoring
{
  type: 'matrix-multi-select';
  prompt: string;
  rows: { id: string; label: string }[];
  columns: { id: string; label: string }[];
  min_per_row?: number;
  max_per_row?: number;
}
// Vote response
{ matrix: Record<string /* row_id */, string[] /* column_ids */> }
```
Display: same heatmap as §7.6, but each cell's intensity is selection-count over respondents (rather than over rows).

### 7.8 `PollQuestionTemplate__AreaBoardOptionDrop.svelte`
**Scope:** v1.1+ — deferred. Drag-and-drop UX (especially on touch) needs its own design pass before this ships.

A **chip tray + matrix grid**. The voter is presented with a set of option chips on one side and a labeled grid (typically 2×2 or 3×3, but any size) on the other. They drag each chip into exactly one cell of the grid; the chip persists in that cell as the response. The grid's cells are deterministically generated from the cross-product of two ordered axis scales — the author defines the scales, not the cells directly.

**Canonical use case** (skills self-assessment):

- Option chips: `Keyboard Shortcuts & Bindings`, `Terminal Commands & Bash`, `Extended Markdown Flavors`, `Data Analysis with Code`, `Data Visualizations with Code`, `Video Production & Editing`.
- Y-axis (proficiency): `Lagging, Undeveloped` → `Comfortable, Proficient` → `Ninja, Advanced`.
- X-axis (sentiment): `Drudgework, Avoid` → `Fine, Routine` → `Love it, Want More`.

Each chip ends up in one of the nine cells, encoding both *how good they are* and *how they feel about it* in a single drop. The aggregate across respondents reveals which skills the room collectively under-invests in (high love, low proficiency) vs. over-invests in (high proficiency, drudgework).

This is distinct from:
- `MatrixSingleSelect` (§7.6) — there each *row is a question*; the voter answers per-row. Here the voter places each option once anywhere on the 2D grid.
- `TwoAxisPlot` (§7.9.6) — there the voter places *themselves* as a single point. Here the voter places *multiple options*.
- `MatrixMultiSelect` (§7.7) — a checkbox grid; no chips, no "each option exactly once" constraint.

```ts
// Authoring
{
  type: 'area-board-option-drop';
  prompt: string;
  options: PollOption[];      // chips the voter drags
  axes: {
    x: { label: string; scale: string[] }; // ordered left → right
    y: { label: string; scale: string[] }; // ordered bottom → top
  };
  require_all_options_placed?: boolean; // default true
  cell_capacity?: number;     // optional global cap per cell (e.g., "max 2 chips per quadrant")
  allow_revisit?: boolean;    // can a chip be moved after first drop? default true while open
}
// Vote response (uses Vote.response, §5.2)
{
  placements: Record<
    string /* option_id */,
    { x: number /* index into axes.x.scale */; y: number /* index into axes.y.scale */ }
  >;
}
```

**Display:**
- **Per-respondent view** (host console, individual review): the grid with the voter's chips in their cells, axis labels along the edges.
- **Aggregate view** (presenter mode): a heatmap. Each cell shows a count badge and the top-K most-frequently-placed options for that cell. GSAP staggers chip-fly-in on reveal; the cell with the highest density gets the `--fx-glow-*` halo on close.
- **Optional drilldown:** click an option chip in the legend to highlight just that option's distribution across the grid (a per-option heatmap).

**Naming note:** `AreaBoardOptionDrop` is fine but a touch obscure. Alternative names if you want to rename later: `PollQuestionTemplate__GridSort.svelte`, `PollQuestionTemplate__MatrixDrop.svelte`, `PollQuestionTemplate__TwoAxisGridSort.svelte`. I'm keeping your original name in the file unless you say otherwise.

### 7.9 Templates I'd Recommend Adding Soon (post-v1)
**Scope:** all v1.1+ — none of these ship in v1, but each is high-confidence enough to spec now so we don't relitigate them later.

These aren't on your original list but they surface within the first ~3 meetings of running polls and resist being faked with the eight above. Flagging now so we commit or defer deliberately, not by accident.

#### 7.9.1 `PollQuestionTemplate__RankedOrder.svelte`
Drag-to-rank list. Distinct from `MultiSelect` because order matters.

```ts
// Authoring
{ type: 'ranked-order'; prompt: string; options: PollOption[]; max_rank?: number; }
// Vote response
{ ranking: string[] } // option_ids ordered best → worst
```
Aggregation: Borda count or median rank. Display: sorted list with average-rank badges; GSAP handles the reorder animation on each results tick.

#### 7.9.2 `PollQuestionTemplate__StarRating.svelte`
1–N stars (typically 1–5). Could be implemented as `SlidingScale` with `step: 1`, but the star affordance is so common it deserves its own template so authors don't reconfigure it every time.

```ts
// Authoring
{ type: 'star-rating'; prompt: string; max: number; /* default 5 */ allow_half?: boolean }
// Vote response
{ value: number }
```
Display: average + per-star distribution histogram.

#### 7.9.3 `PollQuestionTemplate__NPS.svelte`
0–10 with auto-bucketing into Detractors (0–6) / Passives (7–8) / Promoters (9–10). VC audiences ask for this constantly.

```ts
// Authoring
{ type: 'nps'; prompt: string; }
// Vote response
{ value: number } // 0–10 integer
```
Display: NPS score (promoters% − detractors%) plus the three-bucket bar. One-line presenter call-out.

#### 7.9.4 `PollQuestionTemplate__EmojiReaction.svelte`
Single-tap emoji bar — the live-meeting "heartbeat." Re-tap allowed to change.

```ts
// Authoring
{ type: 'emoji-reaction'; prompt: string; options: PollOption[]; /* options[].label is the emoji */ }
// Vote response
{ option_ids: [string] }
```
Display: live count per emoji with bouncy GSAP increments. Lowest friction of any template; ideal for the first few minutes of a meeting.

#### 7.9.5 `PollQuestionTemplate__ImagePick.svelte`
Visual single-select where each option *is* an image (logos, product screenshots, brand directions). Same response shape as `SingleSelect`; the differences are authoring (image required, label optional) and display (image grid with winner overlay).

```ts
// Authoring
{ type: 'image-pick'; prompt: string; options: PollOption[] /* image required */ }
// Vote response
{ option_ids: [string] }
```

#### 7.9.6 `PollQuestionTemplate__TwoAxisPlot.svelte`
The voter places **themselves** (one point) on a labeled 2D plane (e.g., Risk × Reward, Comfort × Curiosity). Distinct from `AreaBoardOptionDrop` — one vote = one point, no chips.

```ts
// Authoring
{
  type: 'two-axis-plot';
  prompt: string;
  axes: {
    x: { label: string; min_label: string; max_label: string };
    y: { label: string; min_label: string; max_label: string };
  };
}
// Vote response
{ value: { x: number; y: number } } // each in 0..1
```
Display: scatter cloud + centroid marker. Excellent for "where does this room sit on…" framing.

#### 7.9.7 `PollQuestionTemplate__DatePick.svelte`
Pick a date (or time slot) from a constrained range. Trivial schema, but keeps people from abusing `TextBox` to gather scheduling input.

```ts
// Authoring
{ type: 'date-pick'; prompt: string; min?: string /* ISO */; max?: string; granularity?: 'day' | 'hour' | 'slot'; slots?: string[]; }
// Vote response
{ value: string } // ISO 8601
```
Display: stacked bar / calendar heatmap of selected dates.

### 7.10 Templates Left Open for Discussion
**Scope:** all v1.1+ at earliest — schemas not locked, decision pending per-template.

The following I won't pre-spec — I either don't have enough conviction on the shape, or they overlap enough with the above that we should decide whether to fold them in or skip. Listing for completeness; schemas left blank intentionally.

- `PollQuestionTemplate__PinDropOnImage.svelte` — click/drop a pin on an image (heatmap of click locations). Schema depends on whether we want raw `(x, y)` or quantized regions.
- `PollQuestionTemplate__CardSort.svelte` — sort N cards into M user-named or pre-named buckets. Adjacent to `MatrixMultiSelect` and `AreaBoardOptionDrop`; need to decide whether it's a third primitive or a variant.
- `PollQuestionTemplate__TierList.svelte` — explicit S/A/B/C/D lanes. Now clearly a **1-axis specialization of `AreaBoardOptionDrop`** (set `axes.y.scale = ['S','A','B','C','D']` and omit the X axis, or render with a single column). We can either ship it as syntactic sugar over `AreaBoardOptionDrop` or skip it entirely and let authors configure the parent template.
- `PollQuestionTemplate__BudgetAllocate.svelte` — distribute a fixed total (100 points, $1M) across N options. Distinct from sliders because the constraint is the *sum*. Worth its own template if the audience is investors.
- `PollQuestionTemplate__ConjointPair.svelte` — repeated A-vs-B comparisons; the pairs are sampled to elicit preference. Powerful but heavy; defer until there's a real ask.

Let me know which (if any) of §7.10 you want me to flesh out, and confirm the §7.8 interpretation, and I'll fill those in.

### 7.11 Cross-Template Contract

Regardless of which templates ship, every `PollQuestionTemplate__*.svelte` MUST:
- Render the same **six visual states** as `<PollEmbed />` (§11.2): loading, unauthenticated, open-unvoted, open-voted, closed, errored.
- Read its colors and effects from the token contract in §11.3 — no template introduces hardcoded hex.
- Respect `prefers-reduced-motion` (§11.4) — every GSAP timeline collapses to instant.
- Provide a Vitest case in §13.1 covering authoring validation, vote payload validation, and a recompute-equals-sum check on its aggregator.
- Appear at least once on `/design-system/index.astro` so theme/mode regressions are visible (Design System blueprint §4).

This is the contract that makes "add a new template mid-meeting" actually safe.

---

## 8. Storage Layer

Polling is the forcing function for adopting a real database on Astro-Knots sites that have, until now, run as pure SSG. Two regimes coexist after this change: a **database regime** (Astro DB on Turso) for everything live, and a **flat-file regime** (markdown in the repo) for archived polls. Both feed the same Svelte component and the same JSON shape from `/api/polls/[id]/results.json`.

### 8.1 SSG vs SSR — why polling forces a database

The Astro-Knots default has been SSG: pages rendered as HTML/CSS at build, hydrated lightly on the client. This works beautifully for marketing pages, articles, brand kits, design systems, and people pages whose data updates on editorial cadence.

Where it breaks: surfaces that need to *write* user-generated data and reflect those writes back to other users in near-real time. The recent attempt to keep "everything-as-SSG" via GitHub-App-driven commits on every data change confirmed that the hack works but is slow, fragile around concurrent edits, and produces commit-history pollution that's painful to live with. **Polling is the cleanest "no, you actually need a database" forcing function we'll meet.** Rather than relitigate this per feature, this blueprint locks in the architectural split:

- **SSG remains the default** for marketing, articles, archived polls, brand kits, design systems, and editorial-cadence content.
- **SSR + database** for any surface that needs sub-build-cycle freshness: live polls, live results, host console, projection page. The Svelte island calls Astro server routes; those routes query the DB.
- **No more GitHub-App write hacks** for time-sensitive data. If a feature wants near-real-time writes, it goes in the DB.

### 8.2 Database choice: Astro DB on Turso (Locked)

**Decision:** [Astro DB](https://docs.astro.build/en/guides/astro-db/) running against Turso in production, with a local libSQL file in development.

**Why:**
- **Astro-native.** `astro:db` exports a typed `db` client, table definitions live in `db/config.ts`, seed data in `db/seed.ts`. Astro DB wraps Drizzle internally; from the application's perspective there is **no separate ORM to install or configure** — no Prisma, no hand-rolled Drizzle setup. One toolchain, one type system, one mental model for schema + queries.
- **libSQL = SQLite-compatible.** Local development is a real database file in `.astro/content.db`, regenerated from `db/seed.ts` on every dev-server restart. Production is Turso (managed libSQL with edge replication). Same SQL, same query interface, no per-environment branching.
- **Turso is already paid for.** We have an underutilized Turso account; per-poll write volume is tiny; this is the cheapest path to production.
- **One choice for the whole monorepo.** Future Astro-Knots sites that hit the SSG-can't-do-this wall (live commenting, live people-data updates, etc.) inherit this stack by default. The decision is made once.

**What we're not doing:** Postgres (heavyweight, no Astro DB integration, would mean a separate ORM), D1 (Cloudflare-only, less portable), self-hosted SQLite (no edge replication). All viable in isolation; none pay back the cost of diverging from the Astro DB default.

### 8.3 Schema definition (`db/config.ts`)

Tables defined once, types generated automatically. Skeleton matching §5:

```ts
// db/config.ts
import { defineDb, defineTable, column } from 'astro:db';

const Poll = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    title: column.text(),
    prompt: column.text(),
    type: column.text(),                 // 'boolean' | 'single-select' | 'multi-select' | 'sliding-scale' | ...
    options: column.json({ optional: true }),    // PollOption[] for choice templates
    status: column.text(),               // 'draft' | 'scheduled' | 'open' | 'closed' | 'archived'
    meeting_id: column.text({ optional: true }),
    visibility: column.text(),
    results_visibility: column.text(),
    anonymous_display: column.boolean(),
    opens_at: column.date({ optional: true }),
    closes_at: column.date({ optional: true }),
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
    value: column.json({ optional: true }),       // primitive depending on template (boolean | number | string)
    response: column.json({ optional: true }),    // typed JSON for matrix / area-board templates
    created_at: column.date(),
    updated_at: column.date(),
    client_meta: column.json({ optional: true }),
  },
  indexes: {
    poll_user_unique: { on: ['poll_id', 'user_id'], unique: true },  // §12.1 integrity contract
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
    kind: column.text(),  // 'open' | 'close' | 'extend' | 'reset' | 'delete'
    at: column.date(),
    note: column.text({ optional: true }),
  },
});

export default defineDb({ tables: { Poll, Vote, PollResult, PollEvent } });
```

`Vote` uses a `unique` index on `(poll_id, user_id)` rather than a composite primary key because Astro DB's `primaryKey` option is per-column today; the unique index enforces the same integrity contract from §12.1. Engineering: verify against the latest Astro DB version in case composite-PK syntax has landed.

### 8.4 Local dev + production wiring

End-to-end setup:

1. `npx astro add db` (one-time per site).
2. Define tables in `db/config.ts` (§8.3).
3. Add development seed data in `db/seed.ts` so the local DB is populated on every dev-server start.
4. **Production (Turso):**
   - `turso db create fullstack-vc` (one-time).
   - `turso db show fullstack-vc` → copy the libSQL URL into `ASTRO_DB_REMOTE_URL`.
   - `turso db tokens create fullstack-vc` → copy into `ASTRO_DB_APP_TOKEN`.
   - Add both env vars to the deployment platform.
   - `astro db push --remote` to push the schema to Turso.
   - In `package.json`, set `"build": "astro build --remote"` so production builds connect to the remote DB.

Local dev is fully offline by default — no Turso connection required. Use `astro dev --remote` only when explicitly testing against production data.

### 8.5 Server-side queries via `astro:db`

All DB access happens server-side. Astro API routes (`src/pages/api/polls/[id]/*.ts`) and Astro Actions import directly:

```ts
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

Queries are typed end-to-end thanks to the schema in `db/config.ts`. No separate ORM setup, no migration framework required for v1 (Astro DB handles schema-push on `astro db push --remote`).

### 8.6 Svelte islands access pattern (important nuance)

Svelte islands hydrate in the browser. **They cannot import `astro:db` — that's a server-only module.** The integration pattern is:

- **Svelte → fetch → Astro API route → `astro:db`.** Islands call `/api/polls/[id]/votes` (POST) and `/api/polls/[id]/results.json` (GET). The API routes do all the DB work via the typed `astro:db` client.
- **Initial state via SSR.** When an Astro page server-renders `<PollEmbed pollId="..." initialState={...} />`, the page-level frontmatter fetches the snapshot at render time using `astro:db` directly and passes it as a prop. The island hydrates with no first-paint flash, no client fetch on mount, and falls back to interval polling (§9.1) for live updates.

This architecture is cleaner than letting Svelte components query a DB directly:
- Auth, rate-limiting, and validation live in one place (the API routes), not duplicated on the client.
- The same API surface serves both SSR (initial state) and live updates.
- Replacing or augmenting the storage layer later (e.g., a Redis cache in front of the DB) doesn't touch component code.

### 8.7 Flat-file regime (still useful, for archives)

The markdown regime survives — reframed.

- Polls live as `src/content/polls/*.md` with frontmatter matching the `Poll` schema (§5.1).
- Used **for archived polls only.** Once a poll closes and the post-meeting archive job (§10.6) runs, results snapshot to markdown. This is what powers durable, SSG-rendered archive URLs.
- No vote writes. No live updates. Pure SSG.
- Astro Content Collections validates the schema at build time.

This is the same pattern as the people-profile upgrade in §3.1: flat files become the editorial enrichment / archive layer downstream of the DB; Astro DB owns time-sensitive truth.

### 8.8 The graduation motion

When a site adopts polling for the first time:

1. **Bootstrap Astro DB.** `npx astro add db`; define the four tables from §8.3 in `db/config.ts`.
2. **Stand up Turso.** Create the DB, set env vars, push schema (§8.4).
3. **Implement server routes.** `/api/polls/[id]/results.json` (GET) and `/api/polls/[id]/votes` (POST), using `astro:db` queries (§8.5).
4. **Backfill any pre-existing polls** from markdown into the DB (read-only seeding) so historical archive URLs continue to resolve.
5. **Switch the build** to source `Poll` records from the DB for `open`/`scheduled` polls and from the filesystem for `archived` polls. Both feed the same Svelte component.

---

## 9. Real-Time Update Mechanics

Default to the simplest mechanism that meets the meeting's tempo. Escalate only when needed.

### 9.1 Tier 1 — Interval polling (the default)
- Client `GET /api/polls/[id]/results.json` every 3–5s while the poll island is in the viewport and the poll status is `open`.
- `ETag` / `Last-Modified` so the server can 304 most responses.
- Pause when tab is hidden (`document.visibilityState`).
- Stop entirely when the poll closes; one final fetch confirms the closed snapshot.

This is sufficient for ≤500 concurrent viewers and a 3-second perceived latency budget. It is also vastly easier to reason about and test.

### 9.2 Tier 2 — Server-Sent Events (SSE)
Reach for SSE when:
- Concurrent viewers exceed ~500, or
- Perceived latency must be sub-second (presenter projection during a high-stakes panel).

One `GET /api/polls/[id]/stream` endpoint, server pushes `result` events on each aggregation tick. Same JSON shape. Falls back to interval polling automatically on connection error.

### 9.3 Tier 3 — WebSockets
Only when bidirectional low-latency is required (e.g., presenter is also the host pushing reveal cues to all clients). For most polls this is overkill and adds infrastructure burden.

### 9.4 Optimistic UI
On vote submission, the island updates the local tally immediately and animates with GSAP. The next results tick reconciles. If the server rejects (auth lapse, poll closed, rate limit), the island rolls back the optimistic update and surfaces the error inline.

---

## 10. Authoring & Live-Meeting Motions

The motions are how the system stays alive. Without them you ship one poll and then nothing.

1. **Author a poll** — markdown frontmatter or an admin form (DB regime). Schema validation rejects unknown types and missing required fields at the input boundary.
2. **Schedule against a meeting** — set `meeting_id` and `opens_at`. The poll auto-opens on the meeting's start tick (a small server cron or just a status-derived check).
3. **Run the live cue** — host opens `/host/meetings/[id]` in a second tab and sees a *host console*: open/close/extend/reset buttons, raw and projected views, and a one-click "Push to projection screen."
4. **Project results** — `/present/polls/[id]` is the projection URL: full-bleed, large type, GSAP-driven reveals, no chrome. This URL is opened on the meeting host's shared screen.
5. **Close & reveal** — host clicks Close. If `results_visibility = on-close`, the reveal animation plays on every connected client simultaneously (this is the moment SSE earns its complexity, when used).
6. **Post-meeting archive** — within 24h, an automated job (or a one-line script) snapshots results into `src/content/polls/[id].md` so the static archive becomes the durable URL. The DB row stays as the authoritative source until then.
7. **Re-publish as content** — results pages are first-class. A poll's archive page is a normal Astro page that other content can link to and embed (e.g., a follow-up article quoting the result).

---

## 11. UI Component Contract

One Svelte component family, one CSS contract. Every site uses the same.

### 11.1 `<PollEmbed />` props
```ts
interface Props {
  pollId: string;            // resolves both the metadata fetch and the results fetch
  variant?: 'inline' | 'card' | 'present'; // present = projection mode
  initialState?: PollSnapshot;   // optional SSR snapshot to avoid first-paint flash
  resultsVisibility?: 'live' | 'on-close' | 'host-only';
  onVote?: (payload: VotePayload) => void; // optional analytics hook
}
```

### 11.2 Required visual states
- **Loading** — skeleton matching final layout; no layout shift on hydrate.
- **Unauthenticated** — sign-in CTA inside the island. Never redirect away from the page mid-read.
- **Open, unvoted** — interactive controls.
- **Open, voted** — confirmation + tally (if `live`) or "results at close" message.
- **Closed** — final tally, optional winner highlight.
- **Errored** — inline message; retry button; never a silent failure.

### 11.3 CSS contract
The component reads only from semantic tokens. Required:
- `--color-primary`, `--color-primary-500`, `--color-secondary`, `--color-surface`, `--color-border`, `--color-foreground`.
- `--fx-card-bg`, `--fx-card-border`, `--fx-card-shadow`, `--fx-card-shadow-hover` for card surfaces.
- `--fx-glow-opacity`, `--fx-glow-spread` for the "winning option" reveal in vibrant mode.
- Tailwind utilities only via these tokens — no hardcoded hex.

### 11.4 GSAP usage rules
- Tally bars animate width with `gsap.to(...)` over 400–600ms `power2.out`.
- Vote-cast confirmation: 250ms scale pulse on the chosen option, then a small flourish (one shot, not a loop).
- Reveal-on-close: stagger bars by 80ms with `power3.out`; the leading option gets `--fx-glow-*` applied for 1.2s.
- Presenter mode amplifies durations by ~1.5×; nothing else changes.
- Respect `prefers-reduced-motion`: collapse all of the above to instant transitions.

### 11.5 Theme/Mode integration
The component must render correctly in light, dark, and vibrant. The Brand Kit and Design System pages (see [Maintain Design System and Brand Kit Motions](./Maintain-Design-System-and-Brandkit-Motions.md) §3 and §4) MUST include a live `<PollEmbed variant="card" />` example so regressions are visible.

---

## 12. Vote Integrity, Privacy & Anti-Abuse

### 12.1 Integrity contract
- **One vote per `(poll_id, user_id)`** for choice polls, enforced by composite PK in the DB.
- **Vote changes** allowed only while `status = open` and only if `poll.allow_revote` is true; updates `Vote.option_ids` and bumps `updated_at`.
- **Server is authoritative** about poll state. The client may *believe* a poll is open and submit a vote; the server rejects with `409 poll_closed` if it isn't.
- **Rate limit** writes per user per poll (e.g., 10/min) to absorb double-clicks and small abuse.

### 12.2 Privacy posture
- `anonymous_display = true` hides the voter list in *every* UI, including host console. Storage still attributes; this is non-negotiable for integrity.
- Word-cloud submissions are server-normalized and profanity-filtered before being stored, not at display time. Stored content is the moderated content.
- Do **not** log IPs against votes. Do **not** store precise user agents. The `client_meta` field in §5.2 is intentionally coarse.

### 12.3 Host abuse surface
Hosts can `reset` a poll. This is logged to `PollEvent` and visible in the archive page. If a host resets a closed poll, the archive shows both runs; we never silently overwrite history.

---

## 13. Verification

A Vitest suite per regime, plus a small Playwright run for the live-meeting flow.

### 13.1 Unit / integration (Vitest)
Required coverage:
- **Lifecycle transitions** — every legal transition from §6, every illegal transition rejected.
- **One-vote-per-user** — second vote without `allow_revote` is `409`; with `allow_revote` updates the row.
- **Type-specific payload validation** — `single-choice` rejects multiple option IDs; `slider` rejects out-of-range; `word-cloud` rejects oversize.
- **Anonymity** — `anonymous_display = true` strips voter identities from the API response shape, even for the host endpoint.
- **Results aggregation** — recompute equals sum of votes; cache invalidation on write.
- **SSR safety** — component imports do not crash without `window` (mirrors the theme/mode test harness).

### 13.2 End-to-end (Playwright)
One scripted live-meeting rehearsal:
1. Author signs in, creates a poll, schedules it.
2. Two voter sessions join; both vote.
3. Host extends, then closes.
4. Reveal animation plays on both voter clients.
5. Archive page renders the snapshot at the next build.

This run is the canary that the whole system still works end-to-end. Run it on PRs that touch any polling code.

---

## 14. Why Not a SaaS Polling Tool (Slido, Mentimeter, Polly)?

We tried. The honest tradeoff:
- **What SaaS gives you:** zero implementation, presenter-tested UI, instant visual polish, no infra.
- **What it costs:** a third-party brand sits inside your meeting; results live outside your content system; no theme/mode parity (your dark vibrant brand renders as their default light); attendees authenticate twice; archive URLs are theirs, not yours; the panel's content engine ends at the meeting boundary.
- **What an in-site polling system gives you:** results are first-class content with your URLs; voters use the same OAuth session they already have; the projection screen renders in your brand; results re-publish as articles trivially; AI assistants can author, modify, and archive polls in the same change as the surrounding content.
- **What you give up:** the SaaS's polish on day one, and a few features (live Q&A, multi-room moderation) that polling-as-content doesn't try to solve.

For venture-meeting-scale events with our content motion, the in-site system wins. If a site ever needs >2,000 concurrent voters or live multi-room moderation, revisit.

---

## 15. Porting Checklist

When adding interactive polling to a new Astro-Knots site:

- [ ] OAuth identity is live and a stable `user_id` is exposed to server routes (§3).
- [ ] User-profile resolution exists, even if minimal (§3.1).
- [ ] `data-theme` / `data-mode` and the `--color-*` / `--fx-*` token system are in place (theme blueprint §2, §9).
- [ ] Astro DB installed (`npx astro add db`) and tables defined in `db/config.ts` per §8.3.
- [ ] Turso production database provisioned; `ASTRO_DB_REMOTE_URL` and `ASTRO_DB_APP_TOKEN` set in the deployment platform; `astro build --remote` configured in `package.json` (§8.4).
- [ ] `db/seed.ts` populates a usable local development dataset.
- [ ] Implement `/api/polls/[id]/results.json` and `/api/polls/[id]/votes` server routes using `astro:db` (§8.5).
- [ ] Confirm Svelte islands fetch via API routes (never import `astro:db` directly) (§8.6).
- [ ] Drop in `<PollEmbed />` Svelte component family; verify the required tokens render correctly in all three modes (§11.3).
- [ ] Add a `<PollEmbed variant="card" />` example to the site's `/design-system/index.astro` (Design System blueprint §4).
- [ ] Add the host console at `/host/meetings/[id]` and the projection page at `/present/polls/[id]` as SSR routes (§10, §4.1).
- [ ] Wire the Vitest harness from §13.1; the Playwright run from §13.2.
- [ ] Document the local env vars and the Turso CLI bootstrap commands in the site's `README.md`.
- [ ] Confirm `prefers-reduced-motion` collapses all GSAP animations (§11.4).
- [ ] Confirm `anonymous_display` polls strip identities from every endpoint, including the host's (§12.2).

---

## 16. Next-Step Considerations

- **Meeting-aware auto-archive.** A scheduled job that snapshots polls to markdown N hours after `closes_at`. Today this is manual.
- **Cross-poll narratives.** The ability to bind multiple polls into a single "session" so a meeting's polls render as a coherent results page after the fact.
- **Presenter cues.** A small DSL (`@cue open poll-3`, `@cue reveal poll-3`) embedded in meeting agendas so the host console can advance the poll lifecycle in lockstep with the agenda.
- **Federated identity beyond OAuth.** Magic-link voting for one-off public polls where requiring OAuth is friction.
- **Result embedding API.** A short snippet (`<poll-result id="..." />`) that lets editorial articles inline a final tally without re-fetching, similar to the build-time inline pattern in §8.1.
- **Accessibility audit.** Keyboard-only ranking for `ranked` polls is the hardest interaction; commission a focused a11y pass before promoting that type to GA.

---

## 17. Future Ideas & Wish List

Ideas raised during design that are *deliberately* not in scope for v1 (or any near-term iteration). Parked here so they aren't lost and so we don't relitigate them in PR review. Promote an item out of this section when it earns a real user need + an owner.

### 17.1 Anonymous (unauthenticated) voting

Open question: should we allow voters who haven't signed in via OAuth, to maximize participation — e.g., on public-facing polls embedded in marketing pages or in meetings where forcing sign-in would suppress turnout?

This is **deferred**. The homegrown OAuth flow is fast enough that v1 doesn't need an anonymous escape hatch, and admitting unauthenticated voters introduces a hard contradiction with the integrity contract in §12.1 (one vote per `(poll_id, user_id)`). When we revisit, the design space looks like:

- **(a) Browser-cookie identity** — issue an opaque cookie ID on first visit and treat it as `user_id`. Cheap; trivially defeated by clearing cookies or using incognito. Acceptable for low-stakes engagement polls.
- **(b) Magic-link ephemeral identity** — voter enters an email, gets a one-time link that mints a temporary identity good for the poll's lifetime. Friction sits between cookie and OAuth. Best for public polls where we want some accountability without a full account.
- **(c) Per-meeting access code** — host hands out a short code at meeting start; the code mints a per-meeting identity. Best for member meetings where the room is already gated socially.
- **(d) Accept ballot stuffing and document it** — explicitly mark the poll as "directional, not authoritative" in the UI. Cheapest. Honest. Sometimes the right answer.

When this comes back: pick one (or a per-poll selector among them), add `Poll.identity_mode`, and update §12.1's enforcement story.

### 17.2 Other parked ideas

- **Cross-meeting longitudinal polling.** Same prompt asked across N meetings; results display as a time series. Requires a `PollSeries` entity above `Poll`.
- **Voter-submitted options.** Author seeds the poll with N options; voters can append their own (subject to moderation). Materially changes the data model and the moderation UX — large enough to warrant its own blueprint.
- **Multi-step / branched polls.** Voter's answer to Q1 routes them to Q2a vs. Q2b. Solves "surveys" really, not polls; we'd be re-implementing Typeform. Probably belongs in a separate `Maintain-an-Embedded-Survey-System.md` blueprint.
- **Live commentary alongside results.** A small chat or reaction stream pinned next to the projection view. Adjacent to polling but it's its own product surface.
- **Predictive market mode.** Voters stake "points" on outcomes; results weighted by stake and resolved against ground truth later. Distinct enough from polling to deserve its own blueprint when it becomes real.
- **Export to slide.** A poll's archive page renders as an embeddable slide for the [Maintain Embeddable Slides](./Maintain-Embeddable-Slides.md) system. Lightweight integration but needs the slides blueprint to be live first.

---

## 18. References
- [Maintain Themes & Modes Across CSS and Tailwind](./Maintain-Themes-Mode-Across-CSS-Tailwind.md) — the token system every poll component consumes.
- [Maintain Design System and Brand Kit Motions](./Maintain-Design-System-and-Brandkit-Motions.md) — the Design System index must include a live `<PollEmbed />` example so theme/mode regressions are visible.
- [Maintain Embeddable Slides](./Maintain-Embeddable-Slides.md) — sister blueprint for live-meeting content; polls and slides often share a meeting and a presenter URL pattern.
- **Reference implementation (target):** `sites/fullstack-vc/` — first site to land the polling system end-to-end.
- **External prior art studied (and rejected as primary tooling):** Slido, Mentimeter, Polly. Useful for UX inspiration; not used in production.

