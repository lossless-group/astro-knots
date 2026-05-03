---
title: "Build a Promotion Surface for Investment Opportunities"
lede: "Architecture for a hard-gated, multi-opportunity promotion surface inside mpstaton-site. Each opportunity gets a hub page that conditionally surfaces deck and memo materials behind real authentication, optimised for AI-assisted variant iteration in 3-5 minute cycles."
date_created: 2026-05-03
date_modified: 2026-05-03
status: Draft
category: Blueprints
tags:
  - Promotion-Surface
  - Hard-Gate
  - Scroll-Deck
  - Variant-Iteration
  - Investment-Memo
  - Multi-Material-Hub
  - mpstaton-site
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7, 1M context)
---

## What This Blueprint Is

Written to be abstracted and reused across `astro-knots` projects, an
architecture for a `/promote` surface on `sites/mpstaton-site` that hosts
investment opportunities being shared with other VCs and prospective
syndicate members. Each opportunity is a private hub gated behind real
authentication, and the materials behind the gate are typically a
**deck** and an **investment memo** — though the setup chooser must
generalise to any number of materials.

Mixed goals over time: 
1. First prioirity: enable rapid iteration towards a quality, but limited deck. Unembarassed, usable, playable. Meets basic need. The `scroll-deck` will likely be the first playable `promote` material.
2. Second priority: enable slide format/style selection from multiple (2-10) options. Likely in `static-deck` functionality, base HTML/Tailwind.
3. Third priority: `static-decks` are copied into another version, introducing more interactivity, dynamic animations, and other advanced features. Let's call these `animated-decks`. Here we may convert files to Svelte, introduce GSAP, D3.js, Vega-Lite, etc.

Note: the user will need a PDF download somehow. Our experience is that out-of-the-box libraries/packages don't make clean and colorfol PDF Exports. We'll need to build our own solution, it could be screenshotting the deck and converting to PDF.

This blueprint differs from its two siblings in important ways:

- `Build-a-Fundraise-Deck-Workspace.md` describes a **standalone client
  site** for one fund's teaser deck, with a **polite gate**. This blueprint
  describes **multi-tenant opportunity hosting inside an existing personal
  site**, with a **hard gate**.
- `Maintain-Embeddable-Slides.md` and `Slides-System-for-Astro-and-Markdown.md`
  describe **Reveal.js** slides embedded in or rendered from markdown.
  This blueprint adopts the **scroll-deck** composition as the initial step, because the technique has proven on
  `sites/calmstorm-decks` and `darkmatter-site` instead, because Claude generates higher-quality
  layouts when composing Astro section components against narrative copy
  than when authoring Reveal-flavoured markdown.

This spec assumes the parent `astro-knots/CLAUDE.md` and the two reference
blueprints above have been read. It captures only what's specific to the
multi-tenant promotion shape and the hard gate.

## The Three Surfaces

```
/promote                                       Surface 1 — public index of currently-promoted opportunities
/promote/[slug]                                Surface 2 — opportunity hub (locked-state until unlocked)
/promote/[slug]/deck/scroll                    Surface 3a — scroll-deck, default version (gated)
/promote/[slug]/deck/scroll/version-N          Surface 3a — scroll-deck, explicit version (gated)
/promote/[slug]/memo                           Surface 3b — investment memo, default version (gated)
/promote/[slug]/memo/version-N                 Surface 3b — investment memo, explicit version (gated)
/promote/[slug]/{material}                     Surface 3 — additional material types as they emerge
```

Anticipate the steps towards more design-forward, component-driven advanced feature decks:

```
/promote/[slug]/deck/static                    Surface 3a — static deck, default version (gated)
/promote/[slug]/deck/static/version-N          Surface 3a — static deck, explicit version (gated)
/promote/[slug]/deck/interactive               Surface 3a — animated deck, default version (gated)
/promote/[slug]/deck/interactive/version-N     Surface 3a — animated deck, explicit version (gated)
```

### URL grammar (the rule that drives the rest)

A material URL has up to three segments after `[slug]`:

```
/promote/[slug]/{type}/{format?}/{version?}
                 ↑       ↑          ↑
                 │       │          └─ `version-N`, optional; omitted = default version
                 │       └─────────── `scroll | static | interactive`, present for decks only
                 └─────────────────── `deck | memo | data-room | video | ...`
```

- **Deck** has both `format` and `version` dimensions. The format is required in
  the URL; the version is optional (omitted = default).
- **Memo** has only a `version` dimension (a memo is just an HTML page; there is
  no scroll/static/interactive progression for memos).
- **Future material types** follow the same rule: declare in the type record
  whether the type carries a format dimension, and the URL builder + chooser
  follow.

### Surface 1 — Index (`/promote`)

A **public** index of currently-promoted opportunities. Each entry is a card
anchored on a small symbolic mark (the company's appIcon or the symbolic
fragment of their wordmark — never the full logo) plus the codename /
company name, a one-line teaser, and a status pill. Lives at
`src/pages/promote/index.astro` and reads from the `promote` content
collection.

The index is public because the primary distribution channel is iMessage
and WhatsApp DMs from MP — the URL needs to unfurl compellingly when
pasted into a thread. Configure OpenGraph + Twitter card metadata for the
index and for each `/promote/[slug]` hub so the unfurl renders the brand
image, headline, and one-line description.

**Status pills** on each card:
- `Active` — the default; visible without scrolling.
- `Closing soon` — emphasised treatment to create urgency.
- `Closed` — kept on the index (below active opportunities) so prospects
  can see what they missed. Looks good and reinforces that opportunities
  move quickly.

### Surface 2 — Opportunity Hub (`/promote/[slug]`)

One page per opportunity. Renders in two modes depending on auth state:

- **Locked state** — a lean, fancy teaser header showing
  `Promoting {companyName}` (or codename) plus a one-line eyebrow and the
  passcode field. The OpenGraph image (used when the URL is shared) may
  carry the full company logo + name; the locked teaser header on the
  page itself uses the appIcon / symbolic mark + name only. Nothing else
  from the opportunity content is on the page in this state.
- **Unlocked state** — the materials chooser. Conditional on how many
  materials the opportunity declares:
  - **0 materials** — the opportunity should not be listed; treat as a
    config error in dev, return 404 in prod.
  - **1 material** — **auto-redirect** to that material's URL on hub load.
    The hub becomes a router; prospects never see it.
  - **2+ materials** — render a chooser (cards or vertical list) with
    each material's title, type icon (deck / memo / data room / video),
    short description, and a CTA.

The hub is **never the long-form artifact itself**. With one material it's
a redirect; with several it's a chooser. Long-form content always lives at
`/promote/[slug]/{type}/...`.

### Surface 3 — Materials (`/promote/[slug]/{type}/...`)

Each material is its own page with its own renderer:

- **Deck (`.../deck/{format}` and `.../deck/{format}/version-N`)** —
  composition lifted directly from the `calmstorm-decks` and
  `dark-matter` patterns (`PageAsDeckWrapper` + `src/layouts/sections/`).
  Three formats anticipated:
  - `scroll` — scroll-snap deck, the default and the rapid-iteration
    target. Tiny `{n} / {N}` counter at bottom-right via the `DeckNav`
    component. Versions live as sibling section directories
    (`deck/scroll/v1/`, `deck/scroll/v2/`, …).
  - `static` — base HTML/Tailwind, conventional pitch-deck composition,
    higher polish ceiling. Same versioning shape.
  - `interactive` — Svelte + GSAP / D3.js / Vega-Lite for animations,
    transitions, and live data. Highest polish; built last by copying a
    `static` version and progressively enhancing.
- **Memo (`.../memo` and `.../memo/version-N`)** — markdown rendered
  through `@lossless-group/lfm` using `mpstaton-site`'s existing
  `AstroMarkdown.astro` and `Sources.astro`. Memos have **no format
  dimension** — a memo is just an HTML page. Versions are sibling
  markdown files (`memo.md`, `memo.v2.md`, or `memo/v1.md`,
  `memo/v2.md`).
- **Future material types** — data room manifest, recorded video walkthrough,
  Q&A log. The chooser surfaces them once they're declared in the
  opportunity's content entry; no chooser code changes per type.

#### PDF export

Out-of-the-box libraries don't produce clean, colourful PDF exports of
component-rendered decks. Build a **dedicated export pipeline** rather
than try to make `print` CSS do the job. Likely shape: a Playwright (or
Puppeteer) script that loads each slide URL with a query flag
(`?pdf=true` to suppress chrome and animation), screenshots at deck
aspect ratio, and stitches the images into a PDF. Run on demand against
the deployed URL with the unlock cookie pre-set. Out of scope for v1; flag
in the changelog when a deal needs it.

## The Hard Gate

The gate here is a **real boundary**, not a politeness gate. The threat
model is: a prospect shared a link with a colleague, the URL ended up in
a chat log, a search engine crawled it. Static HTML behind a JS redirect
(the calmstorm pattern) does not protect against any of those.

### Mechanism (Tier 1.5, escalation-ready)

Build on the patterns already proven across astro-knots — full menu in
`context-v/blueprints/Confidential-Content-Access-Control-Blueprint.md`
(implemented at Tier 1 in `hypernova-site`, Tier 1.5 in `dark-matter`).
For `/promote`, target Tier 1.5 from day one:

Can use Svelte for SSR pages, layouts that provide necessary continued auth tokens/realtime auth checks.

- **Astro middleware** at `src/middleware.ts` reads the `promote_session`
  cookie and sets `Astro.locals.unlocked`. The middleware does **not** gate
  `/promote` itself (the index is public). It does gate every path matching
  `^/promote/[^/]+/.+$` — i.e. anything inside an opportunity beyond the
  hub. Locked requests are rewritten to the hub's locked-state render so
  the deck or memo content is never assembled. The hub at
  `/promote/[slug]` is always reachable; it picks its own render branch
  based on `Astro.locals.unlocked`.
- **Server-validated passcode**, not client-side. POST to
  `/api/promote/unlock` with `{ slug, code }`. The endpoint compares
  against environment-stored hashes (one master code, optionally with
  per-opportunity overrides), and on success sets an **HttpOnly, Secure,
  SameSite=Lax** cookie scoped to `/promote`.
- **Cookie shape** — single `promote_session` cookie holding a signed
  token (HMAC-SHA256 over `{ unlocked: true, exp, scope }`) so the server
  can validate without a session store. **TTL: 7 days, sliding** (renewed
  on each authenticated request). Signing secret in
  `PROMOTE_SESSION_SECRET` env var. On unlock, surface a small,
  professional toast: *"You're signed in for 7 days on this device."* —
  the alert reinforces that the session is real and time-bounded rather
  than perpetual.
- **Deployment requirement** — the `/promote` routes must be SSR
  (`export const prerender = false` per route file, or set the route
  group to dynamic in `astro.config.mjs`). Vercel adapter already in use
  by `mpstaton-site`; nothing new to install.
- **No content leaks via static build.** Section components, narrative
  copy, and memo bodies for any `/promote/[slug]/*` route must be rendered
  at request time (not pre-rendered into HTML at build), so an unauth'd
  visitor can never receive the unlocked-state HTML.

### The lean teaser header (locked state)

The locked-state hub renders one small component above the passcode field:

```
┌────────────────────────────────────────────┐
│  ◇  Promoting   {Company / Codename}       │
│     {one-line eyebrow, e.g.                │
│      "Series B · AI Infrastructure"}       │
└────────────────────────────────────────────┘
```

Keep it lean: wordmark on the left (the diamond is the mpstaton mark),
two lines of type, no body copy from the opportunity. The fanciness comes
from typography and the wordmark, not from preview content.

This deliberately tells the visitor they're at the right place and
implicitly confirms an opportunity exists — which is the right tradeoff,
because they got here by direct link.

### Master code vs per-opportunity codes

Default to a **single master code** that unlocks `/promote/*`. Reasons:

- Most prospects will see multiple opportunities over time; one code per
  prospect is operationally simpler than one code per (prospect ×
  opportunity).
- Per-opportunity codes are a leak vector: rotating one means notifying
  everyone with a copy. Master code rotates once.

Reserve **per-opportunity codes** for cases where one deal is materially
more sensitive than the rest (e.g. competitive disclosure, named LPs).
The middleware's cookie scope and the hash registry both already support
the per-slug case; lighting it up is a config change, not new code.

We have implemented OAuth login on LinkedIn for `fullstack-vc` and can use that as a basis for implementing LinkedIn login for this promotion surface, if that makes sense.

### When to escalate

The Tier 1.5 mechanism above is sufficient until either (a) the prospect
list grows past ~50 individuals or (b) a deal needs per-prospect access
tracking. At that point, two escalation paths are both viable:

- **Tier 2 — email + magic link + KV-stored sessions**, per the
  Confidential Content Access Control Blueprint. Lower friction for
  prospects; gives MP a record of who unlocked what.
- **LinkedIn OAuth**, lifting the implementation already shipped on
  `sites/fullstack-vc`. Higher trust signal (the prospect's verified
  professional identity), and feels appropriate for a VC-to-VC context
  where everyone has a public LinkedIn anyway. The cookie + middleware
  shape stays the same; only the unlock route changes.

Pick the path whose friction matches the deal's audience. Note the
escalation in the changelog when it happens.

## The Materials Chooser

The chooser is the core conditional surface. Specify it tightly:

```ts
type Material = {
  type: "deck" | "memo" | "data-room" | "video" | "qa-log";
  format?: "scroll" | "static" | "interactive";  // required for `deck`; omitted for others
  title: string;
  description?: string;
  primary?: boolean;            // if exactly one is primary, it gets visual weight
  status?: "live" | "draft" | "archived";  // drafts hidden in prod
  default_version?: number;     // defaults to 1; the version `/.../{type}/{format?}` resolves to
};
```

The `href` is **computed**, not declared, from `(slug, type, format,
default_version)` per the URL grammar above. This keeps the YAML edit
surface minimal and prevents the chooser from drifting away from the URL
contract.

Render rules:

- Filter to `status !== "draft"` in production (env-gated; show drafts in dev).
- **If exactly one material remains: redirect to its href on hub load.**
  The hub becomes a router; prospects never see it.
- If 2-3 materials: vertical card list, each card 1/3 page width on
  desktop, full-width on mobile.
- If 4+: 2-column grid on desktop.
- The `primary: true` material, if any, gets a subtle visual emphasis
  (border tint, larger CTA).
- Sibling formats of the same type (e.g. `deck` in both `scroll` and
  `static`) appear as **separate cards**. Each card's title should make
  the format obvious to the prospect ("Quick scroll-deck", "Polished
  pitch deck").

Use the same theme tokens as the rest of `mpstaton-site`. Do not invent
a new design language for `/promote`; the surface is part of the personal
site, not its own brand.

## The Variant Iteration Loop

The most important workflow this blueprint enables. The goal is **3-5
minute cycle time** from "story + data are sharp" to "a new variant of
the deck is live and shareable." Sketched here; will be expanded in a
follow-up section once the first opportunity ships and we observe what
actually breaks.

> **Terminology:** *variant* and *version* refer to the same artifact in
> this blueprint. The URL grammar uses `version-N`; the on-disk directory
> uses `vN/`; the prose uses *variant* where the design-exploration
> connotation is helpful.

### The four-ingredient recipe (lifted from calmstorm-decks)

The narrative-driven composition recipe from
`Build-a-Fundraise-Deck-Workspace.md` ports directly. The ingredients:

1. **Pre-sharpened narrative copy**, one markdown file per slide, with
   structured frontmatter and a prose section. Lives at
   `src/content/promote/[slug]/narratives/{NN}-{slug}.md`.
2. **Shared opportunity data** as YAML (per the YAML-data-files rule),
   not TypeScript. Things like cap table snapshot, key metrics, team
   roster, comparable companies. Lives at
   `src/content/promote/[slug]/data.yaml`. Section components import
   this; narratives reference it when they need a number that should
   stay in sync across slides.
3. **Theme tokens already defined** at the `mpstaton-site` level. The
   promotion surface inherits the site's theme; opportunities do not get
   per-deal brand tokens (the host is `mpstaton-site`, not the company).
   Where a company brand color is genuinely needed (logo + accent),
   declare it on the opportunity entry and scope it to a CSS custom
   property `--opportunity-accent` inside the hub root.
4. **A single rendering primitive** — `PageAsDeckWrapper.astro`, copied
   from `calmstorm-decks` and adapted to inherit `mpstaton-site` chrome.

### Variant directory shape

Decks are nested by `format` then `version`. Sections are siblings within
each version directory.

```
src/layouts/sections/promote/[slug]/
├── deck/
│   ├── scroll/
│   │   ├── v1/
│   │   │   ├── S01-Cover.astro
│   │   │   ├── S02-Problem.astro
│   │   │   ├── ...
│   │   │   └── SNN-Ask.astro
│   │   ├── v2/
│   │   │   └── (same slide identifiers, different layouts)
│   │   └── vN/
│   ├── static/
│   │   └── v1/
│   └── interactive/
│       └── v1/
```

Memos don't appear here — they live in `src/content/promote/[slug]/` as
markdown files, with versions as sibling files (`memo.md`, `memo.v2.md`,
or a `memo/` subdirectory of versioned files).

#### Markdown file for deck ordering (optional)

By default, sections render in filename order (`S01-…`, `S02-…`). If the
opportunity directory contains an `order.md` (or `deck/scroll/v1/order.md`
for per-version overrides), the loader uses that ordered list instead.
Useful when you want to reorder slides without renaming files, or when
the same section files compose into multiple narratives.

A registry per opportunity at `src/content/promote/[slug]/variants.yaml`
lists which `(format, version)` pairs exist and which version is the
default for each format. URL resolution:

- `/promote/[slug]/deck/scroll` → `default_version` for the `scroll`
  format from `variants.yaml`
- `/promote/[slug]/deck/scroll/version-N` → explicit version N
- Same shape for `static` and `interactive`

### The minimum-spec variant prompt

When asking Claude to generate variant N, brief it with:

- The narrative files (all of them).
- `data.yaml`.
- `theme.css` and the typographic utility class catalog.
- One existing variant's S01 as a structural anchor (only as reference if the user is seeking new design variants).
- A one-sentence design voice for variant N (e.g. "editorial print
  magazine", "monospace technical brief", "dense data dashboard").
- An explicit instruction **not to read prior variants beyond the S01
  anchor**, to prevent drift toward existing compositions.

This prompt design will be expanded into a reusable orchestration prompt
(probably in `context-v/prompts/`) once we've run it 3-4 times and seen
what consistently breaks. Defer until then.

### The 3-5 minute target

The cycle that ships in 3-5 minutes is **a new variant of an
already-modelled opportunity**, not a brand-new opportunity. New
opportunities still need narrative authoring (the slowest step) and at
minimum a v1. Once narratives are written, additional variants are
where the sub-five-minute economics live.

### Future: the variant evaluator UI

Calmstorm's `/{slug}` slide-by-slide variant chooser is overkill for
single-opportunity decks of 8-12 slides. A lighter pattern to build
later:

- `/promote/[slug]/deck/{format}/compare` — shows the same slide-N from
  every version of that format side-by-side, scrollable. One row per
  slide, one column per version. Scoped to a single format because
  comparing scroll-vs-static would mostly compare apples to oranges.

Defer until the second opportunity is live and we feel the lack.

## Content Model

Each opportunity is one entry in a `promote` Astro content collection at
`src/content/promote/[slug]/`. Layout:

```
src/content/promote/[slug]/
├── opportunity.yaml          # metadata: company name, logos, status, materials, gate config
├── variants.yaml             # registry of (format, version) deck pairs + per-format defaults
├── data.yaml                 # shared structured data the deck composes against
├── narratives/               # one .md per slide
│   ├── 01-cover.md
│   ├── 02-problem.md
│   └── ...
├── order.md                  # optional: explicit slide order override
└── memo/                     # versioned memo content
    ├── v1.md                 # default version
    └── v2.md
```

### `opportunity.yaml` shape (minimal)

```yaml
codename: aurora                # internal codename; URL slug derived from this
company_name: Aurora Systems    # display name in the locked teaser + OG
status: active                  # active | closing-soon | closed | paused
listed_in_index: true           # default true; false hides from /promote but URL still works
short_description: "Series B · industrial AI for cold-chain logistics"
logo:
  full_light: /promote/aurora/logo-light.svg     # used on OG share image
  full_dark: /promote/aurora/logo-dark.svg
  symbol: /promote/aurora/symbol.svg             # appIcon / mark; used on index cards + locked header
accent_color: "#2563eb"         # surfaces as --opportunity-accent inside hub root
og_image: /promote/aurora/og.png                 # 1200x630, includes full logo + name + accent
materials:
  - type: deck
    format: scroll
    title: "Quick scroll-deck"
    description: "12 slides, 5-minute read"
    primary: true
    default_version: 2
  - type: deck
    format: static
    title: "Pitch deck"
    description: "Polished, conventional layout"
    status: draft
  - type: memo
    title: "Investment memo"
    description: "~2,500 words. Risk, structure, terms."
    default_version: 1
gate:
  override_code: null           # use master code unless a string is set here
```

### `variants.yaml` shape

```yaml
deck:
  scroll:
    versions: [1, 2]
    default: 2
  static:
    versions: [1]
    default: 1
memo:
  versions: [1]
  default: 1
```

### Why YAML, not TypeScript

Per the YAML-data-files convention: the shape above is the kind of thing
that gets edited fast in the middle of a deal. YAML is what client-style
edits look like. TypeScript validation can wrap it via Astro's
content-collection schema (Zod) without forcing the editor to write code.
Keep the schema minimal — document the shape, don't gatekeep edits.

## Directory Conventions

```
sites/mpstaton-site/
├── src/
│   ├── middleware.ts                                 # gate enforcement (skips /promote index)
│   ├── pages/
│   │   ├── promote/
│   │   │   ├── index.astro                           # Surface 1 (public)
│   │   │   ├── [slug]/
│   │   │   │   ├── index.astro                       # Surface 2 (hub, dual-state)
│   │   │   │   ├── deck/
│   │   │   │   │   └── [format]/
│   │   │   │   │       ├── index.astro               # default version of {format}
│   │   │   │   │       └── [version].astro           # explicit version (e.g. version-2)
│   │   │   │   ├── memo/
│   │   │   │   │   ├── index.astro                   # default memo version
│   │   │   │   │   └── [version].astro               # explicit memo version
│   │   │   │   └── [material].astro                  # extensibility seam for new types
│   │   │   └── api/
│   │   │       └── unlock.ts                         # POST handler
│   ├── content/
│   │   └── promote/
│   │       └── [slug]/                               # one dir per opportunity
│   ├── components/
│   │   └── promote/
│   │       ├── PromotionHeader.astro                 # locked-state teaser header
│   │       ├── UnlockForm.astro                      # passcode field + POST
│   │       ├── SessionToast.astro                    # "signed in for 7 days" notice
│   │       ├── MaterialsChooser.astro                # conditional renderer
│   │       ├── OpportunityCard.astro                 # used by /promote index
│   │       └── StatusPill.astro                      # Active / Closing soon / Closed
│   ├── layouts/
│   │   ├── PromotionHub.astro                        # base layout for hub pages
│   │   ├── PageAsDeckWrapper.astro                   # scroll-deck wrapper (copy from calmstorm)
│   │   └── sections/
│   │       └── promote/
│   │           └── [slug]/
│   │               └── deck/{format}/v{N}/           # per-format, per-version sections
│   └── lib/
│       └── promote/
│           ├── gate.ts                               # cookie sign/verify, code-hash lookup
│           ├── opportunities.ts                      # content-collection loader
│           ├── variants.ts                           # variants.yaml loader, default resolution
│           └── urls.ts                               # URL builder for material hrefs
└── .env
    # PROMOTE_SESSION_SECRET=<hex 32 bytes>
    # PROMOTE_MASTER_CODE_HASH=<bcrypt hash>
    # PROMOTE_OVERRIDE_CODES_JSON=  (optional, JSON map of slug → bcrypt hash)
```

## Decisions

The six decisions originally surfaced as open questions; each is now
resolved and folded into the body above. The original framing and MP's
response are preserved here as an audit trail.

1. **Index gate posture** — *Resolved: index is public, with OG image
   and Twitter card meta so the URL unfurls compellingly when shared in
   iMessage / WhatsApp DMs.* See *Surface 1 — Index*.

> [!RESPONSE]
> Index is a public page with opengraph share image and meta tags for social sharing.
> We will most likely send this over iMessage or WhatsApp, so the opportunity page itself should be shareable and compelling.

2. **Cookie scope and TTL** — *Resolved: 7 days, sliding renewal, with a
   small "signed in for 7 days on this device" toast on unlock.* See
   *The Hard Gate → Mechanism*.

> [!RESPONSE]
> 7 days sounds right, we should have an alert message that let's them know.
> It will make us look polished and professional that way.

3. **Material auto-redirect on single-material hubs** — *Resolved:
   Option A, redirect on hub load. The hub becomes a router; prospects
   never see it.* See *Surface 2* and *Materials Chooser → Render rules*.

> [!RESPONSE]
> Option A — Redirect: When the prospect lands on /promote/aurora (after unlock), the page
  immediately navigates them to /promote/aurora/deck/scroll. They never see the hub itself — it acts
  as a router. Faster: one fewer click.

4. **Logo treatment in the locked teaser header** — *Resolved: split.
   The OG share image carries the full company logo + name; the locked
   teaser header on the page itself, and every index thumbnail, uses the
   appIcon / symbolic mark only.* See *Surface 1* and *Surface 2 — Locked
   state*.

> [!RESPONSE]
> Because only we will be sharing the link, the OpenGraph metadata can have the company logo and name.
> The thumbnail should show only their appIcon or the symbolic part of their trademark.

5. **Memo + deck cross-linking** — *Resolved: nice-to-have, not v1
   scope. Improvise inline if it falls out of the work cheaply (e.g.
   deck slides linking to memo anchors via the shared `lib/promote/urls.ts`
   builder); otherwise defer.* No body change.

>[!RESPONSE]
> We would absolustely love this, but it's not a requirement for v1.  
> If you can improvise it just as fast, then absolutely.

6. **Index thumbnail content** — *Resolved: status pills are on the
   index. Default state is `Active`; `Closing soon` gets emphasised
   treatment; `Closed` stays visible (below active opportunities) so
   prospects see what they missed.* See *Surface 1 — Index*.

>[!RESPONSE]
> This is a good idea.  Let's do it.  Default will be active as the only reason I am using this is for active opportunities.
> Showing closed opportunities that they missed looks good though.

## Reference

- **Sibling blueprint — fundraise deck workspace:**
  `context-v/blueprints/Build-a-Fundraise-Deck-Workspace.md` — source of
  the scroll-deck composition recipe, narrative-driven authoring loop,
  `PageAsDeckWrapper` and `DeckNav` patterns.
- **Sibling blueprint — auth tiers:**
  `context-v/blueprints/Confidential-Content-Access-Control-Blueprint.md` —
  source of the gate mechanism. Tier 1.5 already implemented in
  `dark-matter`; lift the middleware + cookie pattern from there.
- **Reference implementation for scroll-decks:**
  `sites/calmstorm-decks/src/layouts/PageAsDeckWrapper.astro` and
  `sites/calmstorm-decks/src/layouts/sections/teaser/`.
- **Reference implementation for content data:**
  `sites/calmstorm-decks/src/data/` (currently TypeScript; this blueprint
  prefers YAML for the same role per the astro-knots data-files rule).
- **Reference implementation for the auth pattern:**
  `sites/dark-matter` (Tier 1.5) and `sites/hypernova-site` (Tier 1).
- **Memo rendering pattern:** `sites/mpstaton-site` already consumes
  `@lossless-group/lfm` for context-v document rendering — reuse that
  pipeline for the memo routes (`memo/index.astro` and
  `memo/[version].astro`).
- **Parent guidance:** `astro-knots/CLAUDE.md` — workspace structure,
  LFM consumption, CSS token convention, design-system + brand-kit motion.
