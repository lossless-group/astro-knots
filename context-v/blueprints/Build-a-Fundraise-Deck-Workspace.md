---
title: "Build a Fundraise Deck Workspace"
lede: "Step-by-step playbook for standing up a private, gated, two-surface fundraise/teaser deck workspace from scratch. Captures the patterns proven on sites/calmstorm-decks during the week of 2026-04-30 → 2026-05-03, written as instructions for the next site rather than as a retrospective. Use this when initializing a new client deck site under astro-knots/sites/."
date_created: 2026-05-03
date_modified: 2026-05-03
status: Published
category: Blueprints
tags:
  - Fundraise-Deck-Workspace
  - Astro-Framework
  - Two-Surface-Architecture
  - Narrative-Driven-Composition
  - Polite-Gate
  - OpenGraph-SEO
  - Changelog-Surface
  - Pattern-Library
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7, 1M context)
---

## What This Blueprint Is

A canonical playbook for building a **private, gated, two-surface
fundraise/teaser deck workspace** in the astro-knots monorepo. The canonical
reference implementation is `sites/calmstorm-decks`. Every section below
points at concrete files in that site so a new build can lift the pattern
verbatim and adapt it.

Audience: a Claude Code session (or human collaborator) initializing a new
deck site for a different client. The user will have:

- A folder of source slides as PDFs and/or rough notes.
- A brand identity (colors, typography, voice) — at minimum, a wordmark and
  a couple of accent colors.
- A list of slide titles and an idea of what's on each slide.
- An audience that is small, named, and trusted (LPs, partners,
  prospects) — not the public web.

This spec assumes the parent `astro-knots/CLAUDE.md` has been read and
understood. It does **not** repeat material from there (workspace structure,
LFM consumption pattern, two-tier CSS tokens, design-system + brand-kit
maintenance motion, etc.). It captures only what's specific to the
fundraise-deck shape.

## The Two-Surface Architecture (the most important decision)

A fundraise deck workspace serves two distinct audiences, and trying to
serve both with one surface is the single most expensive mistake to avoid.

### Surface A — Slide-by-slide variant chooser (design research)

URLs: `/{slug}` (chooser) and `/drafts/{slug}/{slug}-vN` (individual variant).

Audience: the build team. Granular A/B comparison of single-slide layouts.
Each slug is one slide; each `vN` is one alternative composition for that
slide. Used during early design exploration and whenever a single slide
needs reinvention.

### Surface B — Scroll-deck (stakeholder reading)

URLs: `/thesis`, `/thesis/version-2`, `/thesis/version-N`.

Audience: stakeholders, prospective LPs, partners. The full deck composed
end-to-end as a single scrollable page with scroll-snap navigation. This
is the deliverable that gets shared. Each `version-N` is an entire
seventeen-slide composition with its own design voice.

### Why both

- The slide-by-slide surface is where compositional risk gets explored
  cheaply, one slide at a time. Without it, every layout decision
  contaminates seventeen other decisions.
- The scroll-deck surface is the actual stakeholder artifact. Variant
  choosers are research scaffolding; the scroll deck is the product.
- The two surfaces share the same source data, the same theme tokens, the
  same chrome. Only the composition strategy differs.

This was the most expensive lesson of the calmstorm-decks build week. The
first cut shipped only the slide-by-slide surface, on the assumption that
the deck would be assembled later from the chosen variants. In practice,
clients want the assembled artifact much sooner — and assembling it
turned out to be its own first-class design problem deserving its own
surface and its own variants. **Plan for both from the start.**

## Build Sequence

Ordered so each step's output is the input the next step needs. Skipping
ahead works but costs back-and-forth.

### Step 1 — Establish source content first (`context-v/narratives/`)

For every slide, write a markdown file at
`context-v/narratives/{NN}-{slug}.md` that contains:

- YAML frontmatter with the slide's structured fields (eyebrow, headline,
  subhead, key facts, etc.)
- A prose section: "What this slide is", "Why it's here", "What's most
  important to surface", "Visual hierarchy I'd suggest".

The reason this comes first: section components compose against this copy
later. Without the narrative files, layout iteration is contaminated by
copy iteration, and both move slower. **Sharpen the words before you
touch the layout.**

Reference: `sites/calmstorm-decks/context-v/narratives/01-disclaimer-confidential.md`
through `17-fund-terms.md`.

### Step 2 — Establish design tokens (`DESIGN.md` + `src/styles/theme.css`)

`DESIGN.md` at the site root documents the brand vocabulary in prose. Then
`src/styles/theme.css` implements it in two tiers per the astro-knots CSS
convention (full spec in parent `CLAUDE.md` → CSS Token Convention):

- Tier 1 — named palette: `--color__blue-azure`, `--font__lato`, etc.
- Tier 2 — semantic roles: `--color-primary`, `--color-on-surface-strong`,
  `--font-heading-1`, etc.

theme.css should also export the typographic utility classes that section
components compose: `.eyebrow`, `.headline`, `.section-title`, `.subtitle`,
`.statement`, `.stat-large`, `.badge`, `.card`, plus the `.slide` structure
and reveal-animation helpers.

Reference: `sites/calmstorm-decks/src/styles/theme.css`. Light-mode only;
no dark-mode work for v0.1.0.

### Step 3 — Initialize the Astro project

Standard astro-knots site setup (per parent CLAUDE.md "Adding a New Client
Site"). Confirm:

- `output: "static"`
- `adapter: vercel()`
- Astro 6 stable Fonts API entry for the display family
- `vite: { plugins: [tailwind()] }` for Tailwind 4
- A `site` URL placeholder in `astro.config.mjs` (env-overridable via
  `SITE_URL`) — needed for absolute OG/canonical URLs in Step 8

Add the standard `.npmrc` for workspace-standalone behavior.

Reference: `sites/calmstorm-decks/astro.config.mjs`.

### Step 4 — Build foundational chrome (`src/components/basics/`)

Per the astro-knots convention, headers / footers / nav primitives /
metadata components live under `components/basics/`. Build these four
before anything else:

- **`DeckHeader.astro`** — thin top header with a 3-column grid (wordmark
  · navigation · meta). Includes inline `<GateScript />` so every page
  that uses the header is gated automatically. The center nav surfaces
  the workspace's first-class surfaces (TOC · Scroll · Changelog) with
  active-state highlighting.
- **`DeckNav.astro`** — fixed bottom-right counter + ‹ › nav, plus an
  optional ← / → keyboard handler. Presentational; takes `counter`,
  `prev`, `next`, `cycling` props. Used by SlideLayout (variant cycling)
  and by every scroll-deck page (variant cycling between scroll decks).
- **`MetaTags.astro`** — comprehensive `<head>` metadata: title,
  description, robots, canonical, full OpenGraph block (image + width
  + height + alt + secure_url + type), Twitter card. Defaults to
  `noindex, nofollow, noarchive, nosnippet`.
- **`GateScript.astro`** — synchronous inline `<script is:inline>` that
  redirects to `/` when the unlock flag is missing from `localStorage`
  and the current path isn't already the cover. Imported once by
  `DeckHeader.astro` so it propagates to every gated page.

Reference: `sites/calmstorm-decks/src/components/basics/`.

### Step 5 — Build the first scroll-deck composition (`/thesis`)

Stand up `src/layouts/PageAsDeckWrapper.astro` (scroll-snap container with
keyboard nav, double-click nav, section indicator, reveal-on-intersect)
and the seventeen section components at
`src/layouts/sections/teaser/T01-…T17-…astro`. The page entry at
`src/pages/thesis/index.astro` imports them all and drops them into the
wrapper.

Each section component composes the theme.css vocabulary against the
narrative content. **Section components add their own scoped styles
only for unique flourishes.** The base look comes from theme.css.

Reference:
- `sites/calmstorm-decks/src/layouts/PageAsDeckWrapper.astro`
- `sites/calmstorm-decks/src/layouts/sections/teaser/`
- `sites/calmstorm-decks/src/pages/thesis/index.astro`

The wrapper hard-codes `height: 100vh` by default but accepts a CSS
variable override (`--deck-height`) so pages with chrome above the deck
can shrink it: e.g. `body.thesis-body { --deck-height: calc(100vh - 3rem); }`
when DeckHeader is present.

### Step 6 — Add a second scroll-deck variant (`/thesis/version-2`)

Copy `src/layouts/sections/teaser/` to `src/layouts/sections/teaser-v2/`
and reinvent every section's layout while preserving content. The
constraint: each slide in v2 must make a **substantially different layout
choice** from v1 — different information architecture, not a re-skin.

Then add the variant to the registry (Step 7) and create
`src/pages/thesis/version-2.astro`.

This is the moment where the value of the two-surface architecture
becomes obvious. Adding a second compositional voice costs ~one Claude
session because all the foundation work (narratives, tokens, wrapper,
chrome) is already paid for.

### Step 7 — Wire the scroll-deck registry (`src/lib/scroll-decks.ts`)

A registry is the single source of truth for what scroll-deck variants
exist. The header pill, the bottom-right `DeckNav`, the keyboard handler,
and the index-page CTA all read from it. Adding a new scroll deck is one
line of TypeScript:

```ts
export const SCROLL_DECKS: ScrollDeck[] = [
  { href: "/thesis",           label: "v1 · baseline",  variantNumber: 1 },
  { href: "/thesis/version-2", label: "v2 · alternate", variantNumber: 2 },
];
```

Plus exported helpers `isScrollDeckPath()` and `getScrollDeckCycle()` —
both used by DeckHeader and the per-page DeckNav.

Reference: `sites/calmstorm-decks/src/lib/scroll-decks.ts`.

### Step 8 — Wire OpenGraph + SEO

Three pieces:

1. **`src/lib/seo.ts`** — central registry of per-page metadata.
   Constants: `SITE_NAME`, `DEFAULT_OG_IMAGE` and its dimensions, alt text,
   `TITLE_SUFFIX`. Per-page entries: `SLIDE_SEO[slug]`, `SCROLL_DECK_SEO[href]`,
   `STATIC_SEO.root`, `STATIC_SEO.changelogIndex`.
2. **`src/components/basics/MetaTags.astro`** — already created in Step 4.
   Drop into the `<head>` of every page. Reads constants from `seo.ts` and
   overrides via props.
3. **`astro.config.mjs`** — set `site` URL (env-overridable) so absolute
   URLs compose correctly.

Plus one shared OG image at `public/og_image__{ClientName}-Deck-{Fund}.png`
for v1. Per-page custom images can be added later via the `ogImage` prop
on `MetaTags`.

References:
- `sites/calmstorm-decks/src/lib/seo.ts`
- `sites/calmstorm-decks/src/components/basics/MetaTags.astro`
- `sites/calmstorm-decks/astro.config.mjs`

### Step 9 — Add the polite access gate

Five files. Together they establish a closed-by-default posture for the
workspace before it goes anywhere meaningful audiences can find it.

1. **`public/robots.txt`** — `Disallow: /` for compliant crawlers.
2. **`vercel.json`** — global `X-Robots-Tag: noindex, nofollow, noarchive,
   nosnippet` header for crawlers that ignore robots.txt but parse
   headers.
3. **`.env`** — `PUBLIC_DECK_CODE=<the-shared-secret>` (gitignored).
   `.env.example` committed as the template.
4. **`src/lib/gate.ts`** — three constants: `GATE_STORAGE_KEY`,
   `GATE_UNLOCKED_CLASS`, `GATE_COVER_PATH`.
5. **`src/components/basics/GateScript.astro`** — already created in Step 4.

The cover at `/` is restructured into two panes (`.cover-pane` +
`.menu-pane`) with an inline `<script is:inline>` in `<head>` that
synchronously adds `html.cs-unlocked` if the localStorage flag is set,
so the wrong audience never sees a flash of the wrong pane.

**Be honest about what this is**: a politeness gate, not a security
boundary. The deck HTML still ships statically; anyone with `curl` and a
known URL bypasses everything. Acceptable for a brand-new URL with no
inbound links. When the audience grows or the URL leaks, escalate to
Astro middleware + Vercel SSR + cookie verification (option C in the
exploration doc below).

References:
- `sites/calmstorm-decks/src/lib/gate.ts`
- `sites/calmstorm-decks/src/components/basics/GateScript.astro`
- `sites/calmstorm-decks/src/pages/index.astro` (cover + menu structure)
- `sites/calmstorm-decks/context-v/explorations/Gate-Sensitive-Information-with-Simple-Code.md`
  (full threat model + path to a real gate when needed)

### Step 10 — Add the changelog surface

`context-v/changelogs/{YYYY-MM-DD}_{NN}.md` is the canonical location.
Each entry has structured frontmatter (`title`, `lede`, dates,
`at_semantic_version`, `status`, `category`, `tags`, `authors`,
`augmented_with`) and a body with `## Why Care?`, `## What Was Built`,
`## Open Items`, `## Reference` sections.

Render at:
- `/changelog` — list page with date · version · status · linked title ·
  lede · collapsible "Why Care?" excerpt rendered through LFM.
- `/changelog/[slug]` — detail page with full body via LFM, prev/next
  neighbor links.

Loader at `src/lib/changelog.ts` globs the markdown files at build,
parses frontmatter via gray-matter, derives the canonical date from the
filename prefix, and slices the "Why Care?" section out of the body.

References:
- `sites/calmstorm-decks/src/lib/changelog.ts`
- `sites/calmstorm-decks/src/pages/changelog/index.astro`
- `sites/calmstorm-decks/src/pages/changelog/[slug].astro`
- `sites/calmstorm-decks/context-v/changelogs/2026-05-01_01.md` (template)

LFM components copied per the parent CLAUDE.md "Implementing
@lossless-group/lfm" recipe — `AstroMarkdown.astro`, `Callout.astro`,
`CodeBlock.astro`, `MarkdownImage.astro` go under
`src/components/markdown/`.

## Directory Conventions

```
sites/{client}-decks/
├── astro.config.mjs                  # site URL (env-overridable), Fonts API, Tailwind
├── package.json                      # rich metadata — see "package.json metadata" below
├── public/
│   ├── og_image__*.png               # shared social-preview image
│   └── robots.txt                    # Disallow: /
├── vercel.json                       # X-Robots-Tag header
├── .env                              # PUBLIC_DECK_CODE (gitignored)
├── .env.example                      # template, committed
├── DESIGN.md                         # brand vocabulary in prose
├── context-v/
│   ├── narratives/                   # one .md per slide — source content
│   ├── specs/                        # site-specific specs (this file goes here)
│   ├── explorations/                 # threat models, design explorations
│   ├── changelogs/                   # YYYY-MM-DD_NN.md build notes
│   └── extra/private/                # source PDFs, gitignored
└── src/
    ├── styles/
    │   ├── global.css                # Tailwind import
    │   └── theme.css                 # token cascade + utility classes
    ├── lib/
    │   ├── slides.ts                 # slide registry (slug → number, title)
    │   ├── scroll-decks.ts           # scroll deck variant registry
    │   ├── seo.ts                    # per-page metadata registry
    │   ├── gate.ts                   # gate constants
    │   └── changelog.ts              # changelog loader
    ├── data/                         # shared content data (team, pillars, etc.)
    ├── components/
    │   ├── basics/                   # DeckHeader, DeckNav, MetaTags, GateScript
    │   └── markdown/                 # AstroMarkdown, Callout, CodeBlock, MarkdownImage
    ├── layouts/
    │   ├── PageAsDeckWrapper.astro   # scroll-snap deck container
    │   ├── SlideLayout.astro         # 16:9 letterbox + chrome for slide-by-slide
    │   └── sections/
    │       ├── teaser/               # v1 scroll-deck sections (T01-…T17-)
    │       ├── teaser-v2/            # v2 scroll-deck sections
    │       └── teaser-vN/            # additional variants
    └── pages/
        ├── index.astro               # cover + menu (gated)
        ├── thesis/
        │   ├── index.astro           # /thesis (v1 scroll deck)
        │   ├── version-2.astro       # /thesis/version-2
        │   └── version-N.astro       # additional scroll variants
        ├── {slug}/index.astro        # variant chooser per slide
        ├── drafts/{slug}/{slug}-vN.astro  # individual slide variants
        └── changelog/
            ├── index.astro           # changelog list
            └── [slug].astro          # changelog detail
```

## The Narrative-Driven Composition Recipe

The single biggest cost-collapse in this workspace pattern. Four ingredients
that, together, let you generate new full-deck variants in a single
session each instead of weeks each.

1. **Pre-extracted, pre-sharpened source copy** in
   `context-v/narratives/{n}-{slug}.md`. Done once. Section components
   compose against this copy — they don't extract it from PDFs at build
   time and they don't iterate on the copy alongside the layout.
2. **A defined typography + token vocabulary** in `theme.css`. The
   utility classes (`.eyebrow`, `.headline`, `.section-title`, `.subtitle`,
   `.statement`, `.stat-large`, `.badge`, `.card`, etc.) are the building
   blocks. Section components compose them; they don't reinvent typography
   per slide.
3. **A single rendering primitive** — `PageAsDeckWrapper.astro` with
   scroll-snap. Each section gets a `<section class="slide">` slot;
   the wrapper handles the rest.
4. **`@lossless-group/lfm` for any markdown surface** (changelogs,
   eventual narrative-driven slides). Don't roll a markdown renderer.

Together these are what allowed v2 (17 alternate-layout sections, ~3,400
lines) to ship in a single Claude session, and v3 (editorial print magazine
voice, also 17 sections) to do the same. The marginal cost of a new
full-deck variant approaches one session of work.

**The lesson is portable**: AI-assisted design and authoring works much
better when the model is composing against pre-decided vocabulary and
pre-written content, rather than inventing both alongside the layout.

## Pattern Catalog

Each entry: what it does, where the canonical implementation lives, and
the one thing future builders most often get wrong.

### `PageAsDeckWrapper`

Scroll-snap container with keyboard nav (↑ / ↓ / Home / End / Page Up /
Page Down), double-click nav (upper half = prev, lower half = next),
fixed section indicator, and `IntersectionObserver` reveal-on-intersect
for `.reveal-item` children with per-item `--delay`.

- Reference: `src/layouts/PageAsDeckWrapper.astro`
- **Common mistake:** hard-coding `height: 100vh` without an override
  variable. Always expose `--deck-height` so chrome can sit above.

### `DeckHeader`

3-column grid: wordmark · center nav (TOC · Scroll · Changelog with
active-state highlighting + variant toggle pill when on a scroll deck) ·
right-aligned meta. Includes `<GateScript />` so every page that uses
the header inherits the gate.

- Reference: `src/components/basics/DeckHeader.astro`
- **Common mistake:** putting nav state into props instead of deriving
  from `Astro.url.pathname`. Active-state highlighting is path-driven so
  the chrome stays declarative across surfaces.

### `DeckNav`

Fixed bottom-right counter + ‹ › nav. Presentational only — takes
`counter`, `prev`, `next`, `cycling`, optional aria labels and an
`enableKeyboard` flag. Used by SlideLayout (variant cycling) and the
scroll-deck pages.

- Reference: `src/components/basics/DeckNav.astro`
- **Common mistake:** trying to make this component decide what to nav
  to. It's a renderer; the page (or layout) computes prev/next from
  whatever registry it owns.

### `MetaTags`

Comprehensive head metadata. Title (with suffix), description, robots
(defaults to noindex), canonical URL (absolute), full OpenGraph block,
Twitter card. Reads from `lib/seo.ts` registry.

- Reference: `src/components/basics/MetaTags.astro`
- **Common mistake:** forgetting to set `site` in `astro.config.mjs`.
  Without it, OG image URLs are relative and most preview unfurlers reject
  them.

### `GateScript`

Inline `<script is:inline>` that redirects to `/` when the unlock flag
is missing and the current path isn't already the cover. Imported by
`DeckHeader` so propagation is automatic.

- Reference: `src/components/basics/GateScript.astro`
- **Common mistake:** placing the redirect script in `<body>` rather than
  in `<head>` (or as the first child of `<body>`). It needs to run before
  any deck content paints.

### Section components (`teaser/`, `teaser-vN/`)

One `.astro` file per slide per variant. Naming `T{NN}-{Slug}.astro`
where NN is the slide number (zero-padded) and Slug is PascalCase.

- Reference: `src/layouts/sections/teaser/T01-DisclaimerCover.astro`
  through `T17-FundTerms.astro`
- **Common mistake:** putting content data inside section components.
  Shared data (team rosters, identity pillars, etc.) lives in `src/data/`
  so all variants see the same content edits.

## `lib/` Registries

The pattern: every "set of things the chrome needs to know about" gets a
dedicated registry module under `src/lib/`. The chrome reads from the
registry; pages register themselves; new entries propagate everywhere
automatically.

- **`lib/slides.ts`** — ordered slide registry (slug, number, title) +
  `getSlideBySlug()` + `getNeighborHrefs()`.
- **`lib/scroll-decks.ts`** — scroll-deck variant registry (href, label,
  variantNumber) + `isScrollDeckPath()` + `getScrollDeckCycle()`.
- **`lib/seo.ts`** — per-page metadata + helpers.
- **`lib/gate.ts`** — gate constants.
- **`lib/changelog.ts`** — markdown loader for `context-v/changelogs/`.

When you add a new surface, ask first: "should this be a registry?" If
the answer is yes, the chrome will auto-discover entries and you'll touch
fewer files when the next entry shows up.

## OpenGraph + SEO System

Detail beyond Step 8 above.

- **Site URL** (`astro.config.mjs`): `site: process.env.SITE_URL ??
  "https://{vercel-preview}.vercel.app"`. Set `SITE_URL` in Vercel's env
  panel for production. Required for absolute canonical and OG URLs.
- **Default OG image** (`/public/og_image__{Client}-Deck-{Fund}.png`): one
  shared image referenced by `DEFAULT_OG_IMAGE` in `lib/seo.ts`. Provide
  exact pixel dimensions to the registry — preview platforms care.
- **MetaTags component** drops into every page's `<head>` first. Two
  required props (`title`, `description`); everything else has sensible
  defaults.
- **Per-page metadata** lives in `SLIDE_SEO`, `SCROLL_DECK_SEO`, and
  `STATIC_SEO` registries inside `lib/seo.ts`. Pages look up their entry
  by slug or path.

Test by pasting a deck URL into Slack, iMessage, LinkedIn DM, X DM. The
unfurl should show the brand image with the per-page title and
description. If it shows a generic preview, the `site` URL is missing or
the image path didn't resolve to absolute.

## Polite Gate Posture

Detail beyond Step 9 above.

The gate is **politeness, not security**. State this clearly when the
client asks how the gate works, and offer the escalation path (Astro
middleware + SSR + cookie verification) when the threat model warrants it.
Capture the option matrix in `context-v/explorations/Gate-Sensitive-Information-with-Simple-Code.md`
so future-you doesn't have to redo the analysis.

The five-piece gate stops:
- Search engines and compliant crawlers (robots.txt + meta + header)
- Casual lurkers ("I clicked the link in Slack out of curiosity")
- The client's anxiety about what's "just out there"

It does **not** stop:
- Anyone with a known URL using `curl` or a headless browser
- Determined scrapers with the URL list

For a brand-new Vercel preview URL with no inbound links, this is enough.
Tighten when you ship to a real domain or share with a wider audience.

## Changelog Hygiene

The frontmatter format that's worked well across many entries:

```yaml
---
title: "{Concise human title}"
lede: "{1-3 sentence summary that reads well at the top of /changelog}"
date_authored_initial_draft: YYYY-MM-DD
date_authored_current_draft: YYYY-MM-DD
date_first_published: YYYY-MM-DD
date_last_updated: YYYY-MM-DD
at_semantic_version: 0.X.Y.Z
status: Published
category: Changelog
tags:
  - Pattern-Names
  - With-Hyphens
authors:
  - Author Name
augmented_with: Claude Code (Opus 4.7, 1M context)
---
```

Body sections, in order:
- `## Why Care?` — the stake. Why this change matters to the project,
  the audience, or the broader posture. This section is what
  `/changelog` extracts as the excerpt.
- `## What Was Built` — the actual work. Subsection per pattern or per
  file group.
- `## Files Touched` — a tree of changed paths with a one-line note per
  file. Keeps the diff legible without reading every commit.
- `## Open Items` — known follow-ups, deferred decisions, things that
  surfaced during the work and are worth flagging.
- `## Reference` — pointers to related changelogs, specs,
  explorations, live URLs.

The `at_semantic_version` field is the workspace's narrative semver,
independent of npm's `package.json#version`. Bump minor for
substantive feature additions, patch for polish.

## `package.json` Metadata

Fill these standard fields generously — they're free documentation that
travels with the package and is read by IDEs, npm UIs, and future Claude
sessions:

- `description` — one-paragraph what-it-is
- `keywords` — 10-20 tags for searchability
- `license` — `UNLICENSED` for private workspaces
- `author` (object: name, url) and `contributors` (array)
- `homepage`, `repository`, `bugs`
- `engines` (`node`, `pnpm`)

Plus a custom namespace block (e.g. `"calmstorm": { ... }`) with
workspace-specific facts: fund / vehicle / domicile / audience, a
`siteSurfaces` map of every URL pattern to its purpose, deployment
notes, and pointers to canonical docs. npm/pnpm ignore unknown
top-level keys; nothing breaks.

Reference: `sites/calmstorm-decks/package.json`.

## Vercel Deploy Gotchas

- **Standalone lockfile.** After every `pnpm --filter <site> add ...`,
  cd into the site dir and run
  `pnpm install --ignore-workspace --lockfile-only` to regenerate the
  standalone `pnpm-lock.yaml` Vercel uses. Without this, Vercel builds
  with the workspace-root lockfile and errors out with missing
  dependencies.
- **`PUBLIC_DECK_CODE` env var.** Set in Vercel → Project Settings →
  Environment Variables. Without it, the gate falls back to the in-code
  default — works, but rotation requires a code change.
- **`SITE_URL` env var.** Set when the deck moves off the Vercel preview
  domain so canonical and OG URLs flip to the real domain on the next
  deploy.
- **Vercel adapter output dir.** `.vercel/` is gitignored.

## AI-Assisted Iteration Discipline

The patterns that proved out across the calmstorm-decks build week:

- **Brief Claude with the foundation, not just the task.** Before asking
  for a new variant or a new section, point Claude at theme.css, the
  narrative file for that slide, and an example existing section. The
  output quality is dramatically higher with the foundation in context.
- **One coherent voice per scroll-deck variant.** When inventing v2 or
  v3, decide on a single design language up front (e.g. "editorial
  print magazine") and apply it consistently across all 17 sections.
  Mixed voices feel incoherent in scroll mode.
- **Don't peek at prior variants when inventing a new one.** When asking
  Claude for variant N, instruct it to look only at the data files,
  narratives, and theme.css — not at variants 1..N-1. Otherwise the
  output drifts toward the existing variants instead of finding new
  territory.
- **Registry-driven propagation.** When you find yourself wiring the
  same surface into header + footer + nav + index page, stop and build
  a registry. The cost of the abstraction pays back on the second
  consumer.
- **Changelog as you go.** Write the changelog entry while the work is
  fresh, before committing. The "Why Care?" section forces you to name
  the stake, which often reveals when a change is bigger or smaller
  than you thought.
- **Honest dispatches.** When a pattern is theatrical (e.g. the polite
  gate), say so plainly in the changelog and exploration files. Future
  Claude sessions inherit the framing; clients trust documentation that
  doesn't oversell.

## Reference

- **Reference implementation:** `sites/calmstorm-decks/` — every pattern
  in this spec is implemented there.
- **Original spec:** `astro-knots/context-v/specs/Develop-a-Slides-only-Astro-Site-for-a-Fundraise-Process.md`
  (the ask that became calmstorm-decks).
- **Threat model for the gate:** `sites/calmstorm-decks/context-v/explorations/Gate-Sensitive-Information-with-Simple-Code.md`.
- **Audit trail for the build week:** `sites/calmstorm-decks/context-v/changelogs/`
  (April 30 → May 3, 2026).
- **Parent guidance:** `astro-knots/CLAUDE.md` — workspace structure,
  LFM consumption pattern, CSS token convention, design-system + brand-kit
  motion. Read first; this spec assumes that material.
