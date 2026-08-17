---
title: Build Section-Composed Decks Alongside Reveal — with Live Theme + Mode as a Hard Constraint
lede: Reveal.js stays. It works fine for the decks it works fine for. But fullstack-vc also needs a second deck paradigm — narrative markdown per slide, composed as <section> components under a PageAsDeckWrapper, with multiple variants from one narrative source — that produces designs with real elegance and inherits the site's three-mode theme system (light / dark / vibrant) live and always. The first concrete deck under this paradigm ports data displays from prior session surveys (April 29 launch JSON, May 27 LP-pulse counts, breakouts roster) as content blocks the section components compose against.
date_authored_initial_draft: 2026-05-27
date_authored_current_draft: 2026-05-27
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-05-27
at_semantic_version: 0.0.2.0
status: Draft
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Specification
tags:
  - Slide-Decks
  - Decks-as-Code
  - Section-Composed
  - Narrative-First
  - Coexists-with-Reveal
  - Multiple-Variants
  - Keyboard-Nav
  - Live-Theme-Mode
  - Two-Tier-Tokens
  - Three-Mode-Contract
  - Survey-Data-as-Content
  - Calmstorm-Pattern
  - Dididecks-AI
authors:
  - Michael Staton
date_created: 2026-05-27
date_modified: 2026-05-27
publish: false
from: fullstack-vc
from_path: specs/Build-Section-Composed-Decks-with-Live-Theme-Mode.md
---
<!-- Rolled up from fullstack-vc/context-v/specs/Build-Section-Composed-Decks-with-Live-Theme-Mode.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Build Section-Composed Decks Alongside Reveal — with Live Theme + Mode as a Hard Constraint

## What this spec is

A specification for adding a **second slide-deck paradigm** to fullstack-vc, alongside the existing Reveal.js layouts (`src/layouts/MarkdownSlideDeck.astro`, `OneSlideDeck.astro`, and the Reveal-runtime pages under `src/pages/slides/`). The new paradigm is the **narrative-first, section-composed** pattern that proved out across [[calmstorm-decks]] and was generalized in the dididecks-ai system.

**Reveal stays.** No sunset. No deprecation. Reveal-based decks continue to work; new decks that need Reveal can continue to use it. This spec is purely *additive* — it gives fullstack-vc a second tool for decks where Reveal's design ceiling becomes the bottleneck.

The deliverable that proves the paradigm is **one new deck**, built section-composed, that:

- Carries narrative content extracted as markdown per slide (one file per slide, frontmatter + prose).
- Renders as a single Astro page composed of `<section>` components under `PageAsDeckWrapper`.
- Supports keyboard pagination (↑ / ↓ for sections, ← / → for variants).
- **Renders in all three site modes — light, dark, vibrant — live, always.** This is a hard constraint, not a v0.2 deferral.
- **Ports data displays from prior session surveys** (April 29 launch JSON, the May 27 LP-syndication conundrum counts, the pre-survey roster, the breakouts framework) as content blocks the deck composes.

Pattern reuse beyond this first deck, taxonomy expansion, and migration of existing Reveal pages are explicitly out of scope.

## Why care

### What Reveal.js gets right (and why it stays)

Reveal is conventional. A markdown file becomes a deck. Arrow keys work. There's a printable view. Fragments animate in. For an internal deck or a quick read-along, the cost-of-entry is low and the result is acceptable. **fullstack-vc has Reveal-based decks that work fine and don't need replacing.** This spec doesn't touch them.

### Where Reveal becomes the bottleneck

Reveal's design ceiling is real. The same fights have lost time across every deck shipped through it in the monorepo:

1. **Sizing is rigid.** Reveal enforces `transform: scale()` against a fixed canvas. Designs that want to breathe into the viewport, or sit gracefully inside an Astro layout with chrome above, fight the transform.
2. **Animations are stuck in Reveal's mental model.** Fragments are linear, opaque, globally configured. They don't compose with scroll-driven motion, `IntersectionObserver`, or modern CSS-only animation patterns.
3. **Styling is sandboxed.** Reveal injects its own CSS, fights with Tailwind, and the cascade ends up unreadable. Custom design language is technically possible and practically painful.
4. **Theme-mode integration is awkward.** Reveal's theme system is parallel to fullstack-vc's two-tier `theme.css` token system + the `theme-switcher.js` / `mode-switcher.js` runtime. Live light/dark/vibrant toggling either bypasses Reveal or fights it. **This is the load-bearing problem for the next deck** — see *The hard constraint* below.
5. **Authoring is collapsed.** Slide content, layout, and visual treatment all live in the same markdown chunk. Iterating on words disturbs layout; iterating on layout disturbs words.

For decks where any of those become the bottleneck — and especially when live theme/mode is on the table — Reveal is the wrong tool. The section-composed paradigm is the right tool. **Both belong in the toolbox.**

### What calmstorm-decks proved

The calmstorm-decks pattern — section components composed under `PageAsDeckWrapper`, one variant per `src/layouts/sections/teaser-v{N}/` directory, narrative content extracted to `context-v/narratives/{slug}.md` before any layout work — shipped **three full-deck variants of seventeen slides each in three Claude-augmented sessions** across one build week. Each variant has its own coherent design voice. The marginal cost of a new variant approaches one session because every dependency (narratives, tokens, wrapper, chrome) is paid for once.

That's the pattern fullstack-vc adopts here.

## The four pillars

### 1. Narrative first — words before pixels

Every deck starts with a markdown file per slide at `context-v/narratives/{deck-slug}/{NN}-{slide-slug}.md`. The file has YAML frontmatter for structured fields (eyebrow, headline, subhead, key facts, sources) and a prose section answering:

- *What is this slide?*
- *Why is it here?*
- *What's most important to surface?*
- *What visual hierarchy would I suggest?*

**Do this fully before touching any layout.** Sharpen the words once, then compose the layout against locked content. Variant invention later becomes a *layout* problem (cheap, fun) instead of a *copy + layout* problem (slow, exhausting). This is the single biggest cost-collapse in the calmstorm pattern.

### 2. Section composed — one Astro page, many `<section>` components

A deck is a single Astro page like `src/pages/slides/{deck-slug}/index.astro` that imports and renders an ordered list of `<section>` components from `src/layouts/sections/{deck-slug}/teaser/T01-…T{N}-…astro`. Each section is one slide.

The page composes the sections inside `PageAsDeckWrapper.astro` — a scroll-snap container that handles:

- Scroll-snap navigation (each section snaps to viewport)
- Keyboard nav (↑ / ↓ / Home / End / PageUp / PageDown)
- Double-click nav (upper half = prev, lower half = next)
- `IntersectionObserver` reveal-on-intersect for `.reveal-item` children with per-item `--delay`
- Section indicator (current N / total)

Each section component renders against its narrative file's frontmatter + body and composes typography utility classes from `theme.css` (`.eyebrow`, `.headline`, `.section-title`, `.subtitle`, `.statement`, `.stat-large`, `.badge`, `.card`). Section components add their own scoped styles only for unique flourishes.

### 3. Several variants — one narrative, many compositional voices

A deck has multiple full compositions. Each lives in its own sections directory under `src/layouts/sections/{deck-slug}/` and its own page route:

```
src/layouts/sections/{deck-slug}/
├── teaser/            ← v1 — first cut
├── teaser-v2/         ← v2 — alternate IA
└── teaser-v3/         ← v3 — different design voice

src/pages/slides/{deck-slug}/
├── index.astro        ← /slides/{deck-slug} — v1 scroll deck
├── version-2.astro    ← /slides/{deck-slug}/version-2
└── version-3.astro    ← /slides/{deck-slug}/version-3
```

All variants share the same narrative files, the same `theme.css` tokens, the same `PageAsDeckWrapper`. They diverge only in *composition* — what each section's layout choice is. Each variant must make a **substantively different layout choice** from the others, not a re-skin.

A variant registry at `src/lib/scroll-decks.ts` is the single source of truth for what decks and variants exist. The header chrome, the bottom-right `DeckNav` (variant cycling), and the variant chooser CTA read from it. Adding a new variant is one line of TypeScript.

### 4. Live theme + mode is a hard constraint — three modes, always

This pillar is non-negotiable. **The deck renders correctly in all three site modes — `light`, `dark`, `vibrant` — live, always.** No mode-specific branch. No "v0.2 will add dark." No mode toggle hidden behind a feature flag.

What that means in practice:

- **The deck uses fullstack-vc's existing two-tier token system** ([[../../../../astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]]). Section components read semantic tokens (`--color-primary`, `--color-text`, `--color-text-muted`, `--color-border`, `--fx-card-bg`, etc.) from `theme.css`. Named tokens (`--color__blue-azure`) stay private to `theme.css`.
- **The deck inherits the site's mode-switcher runtime** (`src/utils/mode-switcher.js`). Toggling mode at the site level instantly retints the open deck — no reload, no parallel theme.
- **The deck's chrome exposes the existing `ModeSwitcher` and `ThemeSwitcher`** (per hypernova-site's canonical pattern, per [[../../../../astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]] §3). The audience can flip mode while reading; the deck stays legible in all three.
- **No Reveal-style sandbox CSS.** No `transform: scale()` shenanigans that override tokens at runtime. Section components paint with the same primitives every other page on the site uses.

### Tailwind v4 + improvisation policy

Per the user direction codified here: **Tailwind v4 + scoped `<style>` blocks are the working materials.** When a section needs something the existing semantic tokens don't expose, the order of escalation is:

1. **Compose the existing semantic tokens** in a scoped style or Tailwind utility. First-line answer for ~90% of section work.
2. **Improvise in Tailwind** with arbitrary values or new utility combinations. If it works on the first pass *and renders correctly in all three modes*, ship it.
3. **If the improvisation doesn't render in all three modes** — and it won't, if it bakes a hex code or hardcodes a color — then *the improvisation reveals the real token gap.* The follow-up is to: add a named token to `theme.css`, point a semantic token at it (or create a new semantic token), and refactor the section to use the semantic token. Tailwind v4's CSS-token-aware utility generation makes this clean.
4. **Convert to scoped CSS** when Tailwind utility syntax becomes unreadable, when a section needs scroll-snap children or `IntersectionObserver` hooks, or when the rule is component-specific and reads better as CSS than as a class soup.

This is the same discipline already in use across the site (per the existing `theme.css` tier convention). The deck is not an exception; it is one more consumer of the system.

**The hard rule:** before merging a section to `main`, manually verify it in all three modes via the site's existing `ModeSwitcher`. If it breaks in any mode, it doesn't ship.

## The keyboard + pagination contract

| Key | Action |
|---|---|
| `↓` / `Space` / `PageDown` | Next section |
| `↑` / `Shift+Space` / `PageUp` | Previous section |
| `Home` | First section |
| `End` | Last section |
| `→` | Next variant (cycle through SCROLL_DECKS entries) |
| `←` | Previous variant |
| `F` | Toggle fullscreen |
| `C` | Toggle chrome (hide / show nav header) |
| `Esc` | Exit fullscreen / show chrome |

The `↑↓` vs `←→` distinction is load-bearing: **vertical keys move within a deck; horizontal keys move between decks (variants).** Reveal collapses these into a single grid; this paradigm deliberately separates them.

## Porting data displays from prior surveys as content

The first deck shipped under this paradigm doesn't need live `PollEmbed` islands or runtime DB queries. But **the prior survey data is part of the content** — section components compose against it the same way they compose against narrative copy.

Three concrete data sources to draw from:

### 1. April 29 launch session JSON (`src/data/webinar-survey/2026-04-29_agentic-vc-dojo-launch.json`)

Rich pre-built dataset:
- `totals` — registered (60), surveyed (40), firms (37), active rate (73%), attended (6)
- `experience` — distribution across 10 levels of AI/agentic workflow experience
- `toolStack` — three rows (native LLM apps / local workspaces / agent workflow builders) × three skill levels
- `firms` — 37 named firms with domain
- `wants` — 14 free-text "what I most want from this session" responses
- `quotes` — 9 anonymized persona quotes ("An emerging-manager GP / A LATAM seed investor / …")
- `quotesWanted` — 4 anonymized "what I'm hoping to take home" quotes

The site already has section components that render this JSON: `Section__WebinarSurveyStats`, `Section__WebinarSurveyPolls`, `Section__WebinarFirmsRepresented`, `Section__WebinarSurveyVoices`, `Section__WebinarReflection`. **A deck slide that wants to show "what the room looked like going in" can import these directly** — the visual treatment is already there. The deck section just wraps the existing component with the deck's typography hierarchy and any extra framing.

### 2. May 27 LP-syndication conundrum counts (Turso `PollResult` table)

Three Boolean polls + one sliding-scale poll, the seeded baseline frozen by the time of the deck:

- *Engage LPs as co-investors?* 3 Yes / 3 No (seeded)
- *Run SPV / campaign-style process?* 1 Yes / 5 No (seeded)
- *LPs want more direct opportunities?* 4 Yes / 1 No (seeded)
- *LP syndication frequency* (sliding-scale 1–4) — median + IQR after live votes layer in

For the deck, snapshot these as static numbers in a narrative file's frontmatter, **OR** export the post-meeting tallies via a one-off script that reads from Turso and writes a JSON sibling to the April 29 file. Static snapshot is simpler for v0.1.

### 3. The breakouts framework

The three breakout tracks from `src/data/breakouts/from-yes-to-win.ts` (Internal Conviction → IC / Syndicate to VCs / Offer to LPs) plus the five-question rail and the one-pager artifact template. A deck slide describing "what we did" can compose `Section__BreakoutsTeaser` directly, or render a static summary card per track.

### Composition pattern

Each data-display section is a thin wrapper:

```astro
---
// src/layouts/sections/{deck-slug}/teaser/T05-PreSurveySignals.astro
import surveyData from '../../../../data/webinar-survey/2026-04-29_agentic-vc-dojo-launch.json';
import Section__WebinarSurveyStats from '../../../../components/sections/Section__WebinarSurveyStats.astro';
---
<section class="slide">
  <p class="eyebrow">Pre-Session Signals</p>
  <h2 class="section-title">Who showed up for the April 29 launch</h2>
  <p class="subtitle">40 of 60 registrants surveyed — 67% response rate, 37 firms represented.</p>

  <div class="reveal-item" data-reveal style="--delay: 150ms;">
    <Section__WebinarSurveyStats totals={surveyData.totals} />
  </div>
</section>
```

That's the whole technique: deck section components don't re-render the data, they compose the already-built `Section__*` components and surround them with deck-grade typography. **The data displays the site already ships are first-class content blocks for the deck.**

## Directory conventions

```
sites/fullstack-vc/
├── context-v/
│   └── narratives/
│       └── {deck-slug}/
│           ├── 01-{slide-slug}.md                     # one narrative per slide
│           ├── 02-{slide-slug}.md
│           └── …
├── src/
│   ├── components/
│   │   └── slides/                                    # NEW; deck-specific chrome + primitives
│   │       ├── basics/
│   │       │   ├── DeckHeader.astro                   # wordmark · variant pill · ModeSwitcher · ThemeSwitcher
│   │       │   ├── DeckNav.astro                      # bottom-right ‹ N/Total ›
│   │       │   └── MetaTags.astro                     # OG + canonical (per-deck overrides)
│   │       ├── primitives/                            # Eyebrow, SectionTitle, Subtitle, Chip, Card, RevealItem
│   │       └── patterns/                              # SlideHeader, KpiRow, TeamCard, etc. (≥2 uses)
│   ├── components/sections/                           # EXISTING; survey/breakouts sections used by deck slides
│   ├── layouts/
│   │   ├── PageAsDeckWrapper.astro                    # NEW — scroll-snap + kbd + reveal
│   │   ├── MarkdownSlideDeck.astro                    # UNCHANGED — Reveal layout for existing decks
│   │   ├── OneSlideDeck.astro                         # UNCHANGED — Reveal one-pager
│   │   └── sections/
│   │       └── {deck-slug}/
│   │           ├── teaser/T01-…T{N}-{Slide-Slug}.astro    # v1 sections
│   │           └── teaser-v2/…                            # v2 sections (when v2 is built)
│   ├── lib/
│   │   └── scroll-decks.ts                            # variant registry (deck + variant tuples)
│   └── pages/
│       └── slides/
│           ├── agentic-vc-dojo-launch.astro           # UNCHANGED — Reveal page
│           ├── the-future-of-cpg.astro                # UNCHANGED — Reveal page
│           ├── global-cvc-for-multinationals.astro    # UNCHANGED — Reveal page
│           ├── [...slug].astro                        # UNCHANGED — Reveal dynamic route
│           └── {deck-slug}/                           # NEW — section-composed deck
│               ├── index.astro                        # v1
│               └── version-2.astro                    # v2 (when built)
```

Existing Reveal-based decks **stay exactly where they are.** They use `MarkdownSlideDeck.astro` / `OneSlideDeck.astro` and the `[...slug].astro` route. The new paradigm lives at `src/pages/slides/{deck-slug}/` as a nested directory — the routing namespace doesn't collide.

## Build sequence — minimum path to shipping the next deck

### Step 1 — Write the narrative files

For every slide in the next deck, write `context-v/narratives/{deck-slug}/{NN}-{slide-slug}.md`. Frontmatter for structured fields (eyebrow, headline, subhead, key data points, source references). Body for prose ("what this slide is", "why it's here", "what to surface", "visual hierarchy suggestion").

**Do this fully before touching any layout.** If the deck has 10 slides, that's 10 narrative files. Each is short — 30 minutes of writing each, max. Total time before layout: ~1 focused session.

If a slide ports data from a prior survey, note which dataset + which section component in the frontmatter (`data_source: webinar-survey/2026-04-29` and `compose: Section__WebinarSurveyStats`) so the section author knows the wiring.

### Step 2 — Stand up `PageAsDeckWrapper.astro`

Lift from `client-sites/calmstorm-decks/src/layouts/PageAsDeckWrapper.astro` into `src/layouts/PageAsDeckWrapper.astro`. Adjust class names if needed. Keep the scroll-snap, keyboard handler, double-click nav, `IntersectionObserver` reveal, and `--deck-height` CSS variable for chrome override.

**Verify it renders in all three modes** before composing any sections. The wrapper itself should be mode-transparent (it shouldn't paint anything that breaks mode).

### Step 3 — Build the deck chrome (`components/slides/basics/`)

Lift these three from calmstorm with adaptation:

- **`DeckHeader.astro`** — wordmark · variant pill · **ModeSwitcher · ThemeSwitcher**. The mode + theme switchers come from the site's existing components (per hypernova-site canonical pattern). Live mode toggling is non-negotiable.
- **`DeckNav.astro`** — fixed bottom-right `‹ N / Total ›`. Presentational; takes `counter`, `prev`, `next`, `cycling` props.
- **`MetaTags.astro`** — head meta with `noindex, nofollow` default (since these are internal decks, not LP-facing yet).

The deck routes do NOT use `BaseThemeLayout` / the site `Header` / the site `Footer`. The point of a deck is to fill the viewport; site chrome doesn't belong on deck routes. The deck has its own chrome.

### Step 4 — Build the variant registry

`src/lib/scroll-decks.ts` — registry of decks and variants. Function signatures match calmstorm's `getScrollDeckCycle()` and `isScrollDeckPath()`. Add the first deck as one entry with `variantNumber: 1`.

### Step 5 — Compose the first variant (`teaser/`)

Create `src/layouts/sections/{deck-slug}/teaser/T01-…T{N}-{Slide-Slug}.astro` — one Astro file per slide. Each section:

1. Imports its narrative file's frontmatter + body.
2. Composes `theme.css` typography utility classes for the base look.
3. If the slide ports prior survey data, imports the corresponding `Section__*` component and the JSON dataset.
4. Adds scoped styles only for slide-unique flourishes.
5. Verifies in all three modes before committing.

Then `src/pages/slides/{deck-slug}/index.astro` imports all section components in order and drops them into `PageAsDeckWrapper`.

### Step 6 — Verify dev + build + three modes

`pnpm dev` → `localhost:4324/slides/{deck-slug}` → scroll, arrow-key nav, fullscreen, reveal animations. Toggle through light / dark / vibrant via `ModeSwitcher`. Each section should render legibly in all three. **If a section breaks in any mode, fix it before moving on** — that's the moment to either rewire to semantic tokens or escalate to scoped CSS, per the improvisation policy in Pillar 4.

`pnpm build` → confirm the new pages compile cleanly. Confirm no regression on existing Reveal-based pages.

### Step 7 — Compose v2 (optional for first deck)

Copy `teaser/` to `teaser-v2/`. Reinvent every section's layout. Register in `SCROLL_DECKS`. Page route at `version-2.astro`. The constraint: each slide in v2 makes a substantively different layout choice from v1.

For the first deck, v1 is sufficient. v2 is muscle for the deck after.

### Step 8 — Changelog the work

Write `changelog/{YYYY-MM-DD}_{NN}.md` per the changelog-conventions skill and this site's content-schema (single `date` field, `summary` not `lede`, `files_modified` not `files_changed`, `augmented_with` as string, `category: Feature`). Title: something like *"First section-composed deck shipped — narrative-first, three modes live."*

## What's reused from prior work

### From calmstorm-decks (the most direct lift)

- `PageAsDeckWrapper.astro` — scroll-snap + kbd + reveal. Battle-tested across 51+ slide variants.
- The `DeckHeader` / `DeckNav` / `MetaTags` chrome shape.
- The `lib/scroll-decks.ts` registry pattern.
- The narrative file shape (`context-v/narratives/{NN}-{slide-slug}.md`, frontmatter + prose).
- The `teaser/` → `teaser-v2/` → `teaser-v3/` directory pattern.

### From fullstack-vc (already shipped, composed by the deck)

- The two-tier `theme.css` token system. The three-mode contract. The `ModeSwitcher` / `ThemeSwitcher` runtime.
- `Section__WebinarSurveyStats`, `Section__WebinarSurveyPolls`, `Section__WebinarFirmsRepresented`, `Section__WebinarSurveyVoices`, `Section__WebinarReflection` — composed by deck slides showing prior session data.
- `Section__BreakoutsTeaser` — composed by deck slides referencing the breakouts framework.
- The `webinar-survey` and `breakouts` JSON / TS data files — direct content sources for the deck.

### From dididecks-ai (architectural framing only)

- The keyboard contract conventions (Decision E in [[../../../../ai-labs/dididecks-ai/context-v/plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]).
- The narrative-first / section-composed framing from [[../../../../ai-labs/dididecks-ai/context-v/specs/Dididecks-AI-Slide-Decks-as-Code]].

## Coexistence with Reveal.js

Explicit: **Reveal stays. No sunset.**

- The Reveal layouts (`src/layouts/MarkdownSlideDeck.astro`, `OneSlideDeck.astro`) remain unchanged.
- Existing Reveal-based pages (`agentic-vc-dojo-launch.astro`, `the-future-of-cpg.astro`, `global-cvc-for-multinationals.astro`, `[...slug].astro`) remain unchanged.
- The Reveal-based markdown content under `src/content/slides/` (e.g. `markdown-slides-primer.md`, `secure/*`) remains unchanged.
- Existing decks shipped via Reveal keep working. They don't get migrated until or unless one of them needs a substantial redesign — at which point the section-composed paradigm becomes an option for that specific deck.

The two paradigms live in parallel. Which one a deck uses is per-deck, not site-wide.

## Phasing

| Phase | Scope |
|---|---|
| **v0.1.0** | Narrative files + `PageAsDeckWrapper` + chrome + variant registry + first deck composed as v1, all three modes verified. |
| v0.2.0 | Second deck under the same pattern, OR v2 variant of the first deck. Proves variant-cost-collapse on a fullstack-vc deck. |
| v0.3.0 | Slide-by-slide variant chooser route (the calmstorm "Surface B"), if/when iterating on individual slide layouts becomes a bottleneck. |

Migration of Reveal decks, PDF export, and the dididecks publishable shell are **not in this spec's roadmap.** They're available patterns we can lift later if and when needed.

## Open questions (small, scoped)

1. **Narratives location.** `context-v/narratives/{deck-slug}/` follows the calmstorm precedent. Alternative: `src/content/decks/{deck-slug}/narratives/` as an Astro content collection with schema validation. The content-collection version gives typed frontmatter; the context-v version keeps narratives outside the build pipeline (useful if Claude is iterating heavily on them). **Default: `context-v/narratives/{deck-slug}/`. Revisit before the second deck.**
2. **Deck-slug naming.** Date-prefixed (`2026-05-27_monthly-all-hands-recap`) or topic-named (`agentic-vc-dojo-may-recap`)? Date-prefixed sorts naturally and disambiguates per-meeting recap decks; topic-named reads better in URLs. **Default: date-prefixed, since this site's session content already uses that convention.**
3. **Where the deck-specific chrome lives.** `src/components/slides/basics/` (new namespace, deck-isolated) vs. extending the existing `src/components/basics/` with deck-specific subfiles. **Default: new namespace at `src/components/slides/basics/`, so deck chrome stays separate from site chrome.**

## Cross-references

### Direct prior art (the recipes this spec lifts)

- [[../../../../astro-knots/context-v/blueprints/Build-a-Fundraise-Deck-Workspace]] — the canonical calmstorm-decks playbook. Steps 1–10 are the foundation; this spec is a fullstack-vc-adapted subset.
- `client-sites/calmstorm-decks/src/layouts/PageAsDeckWrapper.astro` — the scroll-snap + keyboard primitive being lifted.
- `client-sites/calmstorm-decks/src/layouts/sections/teaser/` (and `teaser-v2/`, `teaser-v3/`) — the section composition shape and variant pattern.
- `client-sites/calmstorm-decks/context-v/narratives/01-disclaimer-confidential.md` … `17-fund-terms.md` — the narrative file shape.

### Existing fullstack-vc surfaces composed by the deck

- `src/data/webinar-survey/2026-04-29_agentic-vc-dojo-launch.json` — April 29 launch session data.
- `src/data/breakouts/from-yes-to-win.ts` — May 27 breakouts framework.
- `src/components/sections/Section__WebinarSurveyStats.astro` and siblings — survey-data section components.
- `src/components/sections/Section__BreakoutsTeaser.astro` — breakouts teaser, reusable as a deck slide.
- `src/styles/theme.css` — two-tier token system + three-mode contract.
- `src/utils/mode-switcher.js` and `src/utils/theme-switcher.js` — the live runtime the deck inherits.

### Dididecks framework parentage

- [[../../../../ai-labs/dididecks-ai/context-v/specs/Dididecks-AI-Slide-Decks-as-Code]] — the broader north star.
- [[../../../../ai-labs/dididecks-ai/context-v/plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — the keyboard contract (Decision E).
- [[../../../../ai-labs/dididecks-ai/context-v/plans/Componentize-Slides-and-Establish-Component-Library]] — the taxonomy alignment.

### Site conventions

- [[../../../../astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]] — two-tier token convention + three-mode contract. **Pillar 4 is built on this.**
- [[../../../../astro-knots/context-v/blueprints/Slides-System-for-Astro-and-Markdown]] — earlier slides-system blueprint; this spec is a complementary second paradigm, not a supersession.
- [[../../../../astro-knots/context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions]] — design-system maintenance discipline that applies to the new deck chrome and primitives.

### Skills loaded

- `deck-iteration-workflow` — the rhythm.
- `astro-knots` — framework rules and prohibitions.
- `theme-system` — the two-tier token + three-mode discipline Pillar 4 requires.
- `context-vigilance` — `context-v/` document conventions.

## Status / next step

**Status:** Draft, ready for execution against the next deck.

**Immediate next step on approval:** Pick the first deck (slug + slide list), then begin Step 1 — write the narrative files. Sharpen copy fully before any layout work.

**Estimated effort to v0.1.0:**
- Step 1 (narratives, ~10 slides): ~1 focused session.
- Steps 2–4 (lift `PageAsDeckWrapper` + chrome + registry): ~1 focused session.
- Step 5 (compose v1 sections, mode-verifying each): ~2 focused sessions.
- Step 6–8 (verify + commit + changelog): ~1 focused session.

Total: ~4–5 Claude-augmented sessions to ship the first deck under this paradigm.

Subsequent decks under the same pattern: 2–3 sessions each. v2 variants of a shipped deck: ~1 session.
