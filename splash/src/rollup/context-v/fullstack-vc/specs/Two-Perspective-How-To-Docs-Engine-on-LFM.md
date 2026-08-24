---
title: A Two-Perspective How-To Engine — Use-Cases ✕ Tool-Uses, Built on LFM (Not Starlight)
lede: "VCs arrive two ways: 'I need to automate dealflow' (a use-case) and 'I've heard I need Hermes Agent' (a tool). The same how-to should be reachable from both doors. This spec defines a docs engine on top of @lossless-group/lfm that renders one body of how-to content through two parallel navigation perspectives — with left-nav, right-hand TOC, prev/next pagination, wikilinks, callouts, citations, and video/GIF embeds — and deliberately does NOT adopt Astro Starlight."
date_authored_initial_draft: 2026-06-22
date_authored_current_draft: 2026-06-22
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-06-22
at_semantic_version: 0.0.2.0
status: Draft
augmented_with: Claude Code (Opus 4.8, 1M context)
category: Specification
tags:
  - Documentation-Engine
  - Two-Perspective
  - Use-Cases
  - Tool-Uses
  - LFM
  - Lossless-Flavored-Markdown
  - How-To-Content
  - Left-Nav
  - Right-Hand-TOC
  - Pagination
  - Wikilinks
  - Video-Embeds
  - GIF-Embeds
  - Not-Starlight
  - Content-Collections
authors:
  - Michael Staton
date_created: 2026-06-22
date_modified: 2026-06-22
publish: true
site_uuid: f72b43d6-fcda-467e-836c-a7c3e3ce2fae
hex_code: hnsunm
from: fullstack-vc
from_path: specs/Two-Perspective-How-To-Docs-Engine-on-LFM.md
---
<!-- Rolled up from fullstack-vc/context-v/specs/Two-Perspective-How-To-Docs-Engine-on-LFM.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# A Two-Perspective How-To Engine — Use-Cases ✕ Tool-Uses, Built on LFM

## What this spec is

A specification for a **documentation engine inside `fullstack-vc`** that publishes practical, how-to content for the Agentic VC Dojo community — and renders it through **two parallel navigation perspectives** over a single body of content:

- **`use-cases/`** — the problem the VC is trying to solve. *"Automate dealflow." "Accelerate memo drafts." "Triage inbound." "Monitor the portfolio."*
- **`tool-uses/`** — the tool the VC has heard they should learn. *"How do I actually use Hermes Agent?" "What's OpenClaw for?" "Set up Composio."*

These are not two separate doc sets. They are **two doors into the same room.** A how-to like *"Draft a first-pass IC memo with Hermes Agent"* belongs to the **Accelerate Memo Drafts** use-case **and** the **Hermes Agent** tool — and the engine surfaces it from both, with the cross-perspective link rendered inline so a reader who entered through the tool door can step sideways into the problem door (and vice-versa).

It is built on **`@lossless-group/lfm`** (Lossless Flavored Markdown), copies the proven rendering pattern from `mpstaton-site`, and **deliberately does not use Astro Starlight**. It ships the docs-UI furniture every reader expects — left-hand navigation, right-hand table of contents, prev/next pagination, breadcrumbs — plus LFM's richer authoring surface (wikilinks, callouts, citations, video and GIF embeds, link unfurls).

## Direction (2026-06-22) — naming is provisional; settle it with content, not on paper

Working-session decision after the first read: **don't over-resolve the tree shape here.** The lean is **two URL-facing trees** that read well as routes:

- **`use-cases/`** — indexes by the *problem* (`/use-cases/automate-dealflow`). Hub pages that frame a job-to-be-done.
- **`guides/`** — the actual *how-to articles* (`/guides/draft-ic-memo-with-hermes`). The substance. Each guide declares the `tools:` and `use_cases:` it touches in frontmatter.
- The **tool angle** most likely rides on the **existing `src/content/tools/` registry** — each tool page surfaces the guides that use it — so we probably **don't need a separate `tool-uses/` content tree**. (Hermes Agent, OpenClaw, Composio, etc. already live there.)
- **"Recipe"** was the earlier name for the atomic how-to. Read it throughout this spec as **"a guide, surfaced under both a use-case and a tool"** — a *navigation/relationship* concept, not a third folder. (Mike's instinct: "recipes is some kind of nav on both" — yes, exactly that.)

**The detailed model, folder sketches, and routing below predate this note and still say `tool-uses/` and "recipe."** Treat them as *illustrative*, not binding. The exact tree boundaries (is there a `tool-uses/` tree or just the registry? does the how-to unit get called a guide or a recipe?) get **finalized while authoring the first real guides** — the structure should fall out of the content, not the other way around.

## Why care

### The two-door insight

The Dojo's own survey data names this split out loud. People register and tell us, in the same breath, *"I want to automate the horrible parts of being an emerging manager"* (a use-case) **and** *"I've heard I need to use Hermes Agent / OpenClaw / MCP servers"* (a tool). Same person, two mental models. A docs site that only indexes by tool fails the problem-first reader; one that only indexes by problem fails the *"I already know I want to learn X"* reader.

Most documentation systems pick one axis (usually the tool/API). The bet here is that **for this audience the use-case axis matters at least as much**, and that maintaining one body of content surfaced through two indexes is cheaper and clearer than writing it twice.

### Why not Starlight

Astro Starlight is the obvious reach for "I need docs." We're not using it, for three reasons the user has already hit in practice:

1. **The UI and constraints feel unnecessary.** Starlight imposes a layout, a sidebar model, a frontmatter contract, and component-override ceremony. The docs furniture we actually want — left-nav, right-TOC, prev/next — is a few hundred lines of Astro we can generate quickly and own completely.
2. **It fights our content model.** Starlight is single-axis (one sidebar tree). Our defining feature is **two parallel perspectives over one content set** — exactly the thing a single-tree system makes awkward.
3. **It doesn't speak LFM.** Our markdown is Lossless Flavored — Obsidian callouts, hex-code citations, `[[wikilinks]]`, bare-link video unfurls, link-preview directives. We already have a parser (`@lossless-group/lfm`) and a renderer pattern (`AstroMarkdown.astro`) that handle all of it. Adopting Starlight means re-pipelining our content through its remark stack and losing the components we've built.

The speed of generating common UI with an agent has changed the build-vs-adopt math. We build.

## The two-perspective model

### The shape of the data

Think of it as a **bipartite graph**. On one side, use-cases; on the other, tools. The edges are **how-tos** (also called *recipes*): each how-to connects exactly one (or a small set of) use-case(s) to exactly one (or a small set of) tool(s).

```
   USE-CASES                     HOW-TOS (recipes)                    TOOL-USES
  ┌───────────────┐                                              ┌───────────────┐
  │ Automate       │◄────── "Draft an IC memo with Hermes" ─────►│ Hermes Agent  │
  │  Dealflow      │◄─┐                                       ┌─►│               │
  ├───────────────┤  └─ "Score inbound with OpenClaw + n8n" ─┘  ├───────────────┤
  │ Accelerate     │◄────── "Summarize calls into a memo" ──────►│ OpenClaw      │
  │  Memo Drafts   │                                              ├───────────────┤
  ├───────────────┤◄────── "Wire Affinity to Claude (MCP)" ─────►│ Composio      │
  │ Monitor        │                                              ├───────────────┤
  │  Portfolio     │◄────── "Nightly portfolio news sweep" ──────►│ ...           │
  └───────────────┘                                              └───────────────┘
```

- A **use-case hub** page reads: *here's the problem, here's the maturity ladder, and here are the recipes that solve it* (each tagged with the tool it uses).
- A **tool-use hub** page reads: *here's what this tool is, when to reach for it, and here are the recipes that put it to work* (each tagged with the use-case it serves).
- A **recipe** is the atomic how-to. It declares **both** relations in frontmatter (`use_cases:` and `tools:`), so it appears in both hubs and renders a "you can also read this as…" cross-link.

### Parallel processing in practice

"Parallel process the perspectives" means: **author once, navigate twice.** The recipe is the single source of truth. The two perspective trees are *projections* of the recipe set, built at render time from frontmatter relations — never hand-maintained mirror copies.

### The key architectural decision — DECIDED: Model A

Where does the recipe physically live? **Decided (2026-06-22): Model A — dual-index over a neutral core.**

- **Model A — Dual-index over a neutral core.** Recipes live in a third tree, `guides/`. `use-cases/` and `tool-uses/` hold only **hub/landing** docs (`index.md` per use-case / per tool) plus curated framing. The engine builds both nav trees by querying recipes' `use_cases:` / `tools:` frontmatter. No content is duplicated; both perspectives are pure projections — DRY, no "which folder is home?" judgment per recipe.
- ~~Model B — Primary-home with secondary surfacing~~ (rejected: each recipe would need a per-doc "home" decision, and the win — physical co-location with one perspective — isn't worth the ambiguity).

The folder structure, frontmatter, and components below all assume Model A.

## Content architecture

### Folder structure (Model A)

```
src/content/
├── use-cases/
│   ├── automate-dealflow/
│   │   └── index.md              # use-case hub (problem framing + maturity ladder)
│   ├── accelerate-memo-drafts/
│   │   └── index.md
│   └── monitor-portfolio/
│       └── index.md
├── tool-uses/
│   ├── hermes-agent/
│   │   └── index.md              # tool hub (what it is, when to reach for it)
│   ├── openclaw/
│   │   └── index.md
│   └── composio/
│       └── index.md
└── guides/
    ├── draft-ic-memo-with-hermes/
    │   ├── index.md              # the how-to body (LFM markdown)
    │   └── assets/               # co-located gifs / images / posters
    │       ├── 01-setup.gif
    │       └── memo-output.png
    └── score-inbound-openclaw-n8n/
        └── index.md
```

**Why folders-per-doc (not flat files):** every doc gets a stable slug from its directory, and **assets co-locate** with the doc that uses them (`assets/*.gif`, `*.png`, poster frames for video). This keeps a recipe and its media a single movable unit.

### File naming convention

- **Directory = slug = URL.** `guides/draft-ic-memo-with-hermes/` → `/guides/draft-ic-memo-with-hermes`. Train-Case is for prose/specs; **content slugs are kebab-case** to match URLs.
- **Body file is always `index.md`.** One canonical entry per doc directory; the glob loader keys on it.
- **Assets** live in `./assets/` beside the `index.md`, referenced with relative paths.
- **Use-case slugs are verbs/outcomes** (`automate-dealflow`, `accelerate-memo-drafts`).
- **Tool-use slugs mirror the tools registry handle** (`hermes-agent`, `openclaw`, `composio`) so a tool-use page can 1:1 link the existing `src/content/tools/<handle>.md` entry.

### Frontmatter contract

A shared base, plus per-collection fields. All schemas use `.passthrough()` (Lossless convention — never hard-fail on extra frontmatter; see the YAML-leniency reminder).

**Shared base (all three collections):**

```yaml
title: "Draft a first-pass IC memo with Hermes Agent"
lede: "Turn a messy folder of call notes + the deck into a structured IC memo draft in one pass."
status: Draft            # Draft → In-Review → Published (Train-Case display string)
publish: false           # gate; the engine only lists publish:true in production
order: 10                # optional manual sort key within a nav group
date_created: 2026-06-22
date_modified: 2026-06-22
authors:
  - Michael Staton
augmented_with: "Claude Code on Opus 4.8"
tags:
  - IC-Memo
  - Dealflow
```

**Use-case hub (`use-cases/*/index.md`):**

```yaml
perspective: use-case
problem: "I have to turn raw deal materials into a memo my partners will actually read."
difficulty: intermediate          # beginner | intermediate | advanced
maturity_ladder:                  # optional: the crawl→walk→run framing
  - "Crawl: paste notes into Claude, ask for a memo outline."
  - "Walk: a saved prompt + template that ingests the deck."
  - "Run: an agent that watches the deal folder and drafts on its own."
tools: [hermes-agent, openclaw]   # tools that show up in this use-case's recipes (can be derived)
```

**Tool-use hub (`tool-uses/*/index.md`):**

```yaml
perspective: tool-use
tool: hermes-agent                # FK → src/content/tools/hermes-agent.md
when_to_reach_for_it: "When you want persistent, high-context memory across a multi-step workflow."
official_url: https://...
docs_url: https://...
use_cases: [accelerate-memo-drafts, automate-dealflow]   # use-cases this tool serves (can be derived)
```

**Recipe (`guides/*/index.md`) — the atomic how-to:**

```yaml
kind: how-to
use_cases: [accelerate-memo-drafts]     # ← relation: which use-case hubs list this
tools: [hermes-agent]                    # ← relation: which tool-use hubs list this
prerequisites:
  - "A Hermes Agent instance (see [[tool-uses/hermes-agent/index]])"
  - "Your deal notes in one folder"
estimated_minutes: 20
video: "https://youtu.be/XXXX"           # optional hero walkthrough (LFM bare-link unfurl)
```

> The `use_cases` / `tools` arrays on a **recipe** are the load-bearing edges of the bipartite graph. The hub-level `tools:` / `use_cases:` arrays are optional conveniences — they can be **derived** by querying recipes at build time, so authors only have to maintain the relation in one place (the recipe).

### The relation/cross-link model

Two complementary mechanisms:

1. **Structured relations (frontmatter)** drive the *navigation* — which hub lists which recipe, the prev/next sequence, the "related recipes" rail. These are typed arrays of slugs, validated soft (warn-and-skip on a dangling slug, never fail the build).
2. **`[[wikilinks]]` (inline prose)** drive *contextual* cross-references inside the body — "first set up [[tool-uses/hermes-agent/index|Hermes Agent]], then come back here." Resolved by LFM's `remarkLosslessWikilinks` with a site resolver that maps `[[use-cases/...]]`, `[[tool-uses/...]]`, `[[guides/...]]`, and `[[tools/<handle>]]` (the existing registry) to URLs.

## Built on LFM (the foundation)

### Consuming the library

`fullstack-vc` already depends on LFM from JSR:

```jsonc
// package.json
"@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^0.3.0"
```

The render path mirrors `mpstaton-site`: build a processor, parse to MDAST, walk it with a copied-and-adapted `AstroMarkdown.astro`.

```ts
import { createLfmProcessor } from '@lossless-group/lfm';
import { remarkLosslessWikilinks } from '@lossless-group/lfm';

const processor = createLfmProcessor().use(remarkLosslessWikilinks, { resolver: docsWikilinkResolver });
const mdast = processor.parse(entry.body);
const tree = await processor.run(mdast);
// → <AstroMarkdown node={tree} />, citations from tree.data?.citations?.ordered
```

### Local ↔ JSR toggle (port from mpstaton-site)

Because **we expect to improve LFM** while building this, port the dual-mode switch from `mpstaton-site/scripts/lfm-mode.mjs`. Note: it is **not** an `.env` flag — it rewrites the `package.json` dependency spec, keyed on git branch:

| Command | Effect |
|---|---|
| `pnpm lfm:local` | dependency → `link:../../../lfm` (the sibling checkout at `/Users/mpstaton/code/lossless-monorepo/lfm`) — edit LFM and see changes live |
| `pnpm lfm:jsr` | dependency → `npm:@jsr/lossless-group__lfm@<version>` (the deployable form) |
| `pnpm lfm:auto` | branch in `{development, develop, dev}` → local; else JSR |

**Hard rule (carried over):** never commit a `link:`-mode `package.json`/lockfile to a deployable branch — the `link:` path won't resolve on Vercel. The `lfm:jsr` form is what ships.

> When we add a feature LFM doesn't have yet (e.g., a native GIF directive, or a `:::steps` container), the workflow is: `pnpm lfm:local`, build it in the sibling repo, validate here, then publish LFM to JSR, bump the version, `pnpm lfm:jsr`.

### The renderer

Copy `mpstaton-site/src/components/markdown/AstroMarkdown.astro` and its siblings (`Callout.astro`, `CodeBlock.astro`, `MarkdownImage.astro`, `Sources.astro`, the YouTube/Vimeo embeds, `LinkPreviewCard.astro`, `MermaidChartDisplay.astro`) into `fullstack-vc/src/components/markdown/`. It already dispatches every node type below. Adapt styling to fullstack-vc's three-mode theme.

## Authoring surface (what a recipe author can write)

Everything here is **already supported by LFM + the copied renderer** unless marked *(net-new)*.

| Capability | Syntax | Renders as |
|---|---|---|
| **Internal wikilinks** | `[[guides/score-inbound-openclaw-n8n/index\|Score inbound]]` | resolved `<a class="wikilink">` via site resolver |
| **Callouts** | `> [!warning] Heads up` or `:::callout{type="tip"}` | `<Callout>` (info/tip/warning/llm-response/…) |
| **Citations / Sources** | `claim.[^a1b2c3]` + `[^a1b2c3]: 2026. [Title](url). Published: …` | inline `[n]` superscript + `<Sources>` list at foot |
| **YouTube / Vimeo embeds** | a bare URL on its own line, or `::youtube-video{url=…}` | responsive `<YouTubeEmbed>` / `<VimeoEmbed>` |
| **GIF embeds** | `![alt](./assets/01-setup.gif)` *(works today)*; `:::gif{src=… loop autoplay}` *(net-new directive, nice-to-have)* | `<img>` / a `<MarkdownGif>` with play-on-hover |
| **Images w/ caption** | `:::image{src=… alt=…}` caption `:::` | `<MarkdownImage>` (lazy, captioned) |
| **Link previews / unfurls** | `:::link-preview{format="card"}` `<url>` `:::` | `<LinkPreviewCard>` (OG title/desc/image) |
| **Code blocks** | fenced ` ```ts ` | `<CodeBlock>` w/ language label + copy button |
| **Mermaid diagrams** | ` ```mermaid ` | `<MermaidChartDisplay>` |
| **Tables, task lists, strikethrough** | GFM | native |
| **Step lists** *(net-new, optional)* | `:::steps` … `:::` | numbered, anchorable `<Steps>` component |

**GIF note:** the user explicitly wants GIF embeds. Plain `![](x.gif)` already animates. The *fancy* version — a `:::gif` directive with `loop`, `autoplay`, `play-on-hover`, and a poster frame to avoid layout jank — is a small net-new directive + component. Recommended but not blocking.

## Reading experience (the UI to build)

A three-zone docs shell: **left-nav · article · right-TOC**, with a top bar and a footer pager. All of it three-mode (light/dark/vibrant) and `noindex` only where appropriate (most of this *is* meant to be indexed/GEO-surfaced).

```
┌──────────────────────────────────────────────────────────────────────┐
│  TopBar: [logo] [Use-Cases | Tool-Uses ↹] ……………… [⌘K search] [theme] │
├──────────────┬──────────────────────────────────────┬────────────────┤
│ LEFT NAV     │  Breadcrumb: Use-Cases › Memo Drafts  │ ON THIS PAGE   │
│              │                                        │  • Overview    │
│ ▸ Automate   │  # Draft an IC memo with Hermes        │  • Prereqs     │
│   Dealflow   │  ⟦also a Tool-Use: Hermes Agent →⟧     │  • Steps       │
│ ▾ Memo       │                                        │  • Verify      │
│   Drafts     │  …article body (LFM-rendered)…         │  • Troublesh.  │
│   • Draft IC │                                        │                │
│   • Summ.call│  [tools used: Hermes ·chip]  [20 min]  │  (scroll-spy)  │
│ ▸ Monitor    │                                        │                │
│   Portfolio  │                                        │                │
│              │  ◄ Prev: Summarize calls   Next: … ►   │                │
└──────────────┴──────────────────────────────────────┴────────────────┘
```

### Components (each is a small, ownable Astro/Svelte unit)

1. **`DocsShell.astro`** — the 3-column grid layout; collapses right-TOC then left-nav at breakpoints; honors `BaseThemeLayout` + theme/mode toggle.
2. **`PerspectiveSwitcher`** *(the signature component)* — top-bar toggle between **Use-Cases** and **Tool-Uses**. Switches which tree the left-nav shows. Persists choice (localStorage). When viewing a recipe, also renders the inline **cross-perspective banner** ("You're reading this as a *use-case*. Also a *tool-use*: **Hermes Agent →**").
3. **`LeftNav.astro`** — the active perspective's tree: hubs as groups, recipes as leaves, sorted by `order` then title. Current item highlighted; ancestor group auto-expanded; collapsible groups (state persisted).
4. **`OnThisPage.astro` (right-hand TOC)** *(net-new harvest needed)* — built from a **`extractToc(tree)`** helper that walks the MDAST and emits `{ depth, text, id }` using the **same slug algorithm** as `AstroMarkdown` so anchors match. Scroll-spy highlights the active section; depths 2–3 by default.
5. **`Pager.astro` (prev/next)** — sequential nav **within the active perspective's flattened order**. Same recipe has *different* neighbors under use-cases vs tool-uses — that's correct and intended. Built from the same ordered nav model as `LeftNav`.
6. **`Breadcrumbs.astro`** — `Perspective › Hub › Recipe`, perspective-aware.
7. **`RelatedRail` / `ToolsUsedChips`** — at the foot of a recipe: chips for each `tools:` (linking the tool-use hub *and* the `src/content/tools/<handle>` registry entry) and each `use_cases:`; plus a "related recipes" list (recipes sharing a tool or use-case).
8. **`DocMeta`** — difficulty badge, estimated-time, last-updated, authors, "edit on GitHub" link.
9. **Search (`⌘K`)** *(fancy)* — client-side over a build-time JSON index (title, lede, headings, tags, perspective). Pagefind is the likely engine (already used on Lossless splashes); results grouped by perspective.
10. **Reading niceties** *(fancy, cheap)* — anchor-link-on-heading-hover, copy-link button, reading-progress bar, "copy as markdown" for LLM ingestion, and an `llms.txt` projection of the whole corpus.

### Routing

```
src/pages/
├── use-cases/index.astro          # perspective landing — all use-case hubs
├── use-cases/[...slug].astro      # a use-case hub
├── tool-uses/index.astro          # perspective landing — all tool-use hubs
├── tool-uses/[...slug].astro      # a tool-use hub
└── guides/[...slug].astro        # a recipe, rendered under whichever perspective referred it
```

A recipe URL carries the perspective via query/segment or referrer so the shell shows the right tree, breadcrumb, and pager — defaulting to its first `use_cases` entry if entered cold. **(Exact mechanism is an open question — see below.)**

## Build sequence (phasing)

**Phase 0 — Foundations.** Port `lfm-mode.mjs` + `pnpm lfm:*` scripts. Copy the `markdown/` renderer components from `mpstaton-site` and theme them. Write the `docsWikilinkResolver`.

**Phase 1 — Content model.** Define the three collections (`use-cases`, `tool-uses`, `recipes`) in `content.config.ts` with the frontmatter contract above (soft schemas, `.passthrough()`). Author **one vertical slice end-to-end**: one use-case hub, one tool-use hub, one recipe wired to both. Render it raw (no chrome) to prove the LFM pipeline + relations.

**Phase 2 — The shell + nav.** `DocsShell`, `LeftNav`, `Breadcrumbs`, `PerspectiveSwitcher`, the cross-perspective banner. Both perspective trees navigable over the one slice.

**Phase 3 — TOC + pager.** `extractToc` helper + `OnThisPage` with scroll-spy; `Pager` over the per-perspective ordered model.

**Phase 4 — Authoring richness.** Verify callouts, citations, video, image/GIF, link-previews, Mermaid render correctly in-theme. Add the `:::gif` and `:::steps` directives to LFM (local mode → publish) if we want the fancy versions.

**Phase 5 — Fancy.** Pagefind search (`⌘K`), `ToolsUsedChips` + related rail, reading-progress, copy-as-markdown, `/llms.txt`, per-doc OG images.

**Phase 6 — Seed content.** Populate from the survey's named asks: *Automate Dealflow*, *Accelerate Memo Drafts*, *Wire Claude into the VC stack (MCP)*, *Diligence + portfolio tracking*; tool-uses for *Hermes Agent*, *OpenClaw*, *Composio*, *n8n* (registry entries already exist).

## Non-goals

- **Not** an MDX/JSX system. LFM gives MDX-class richness without JSX lock-in; keep authoring in plain `.md`.
- **Not** Starlight, and not a Starlight clone — we build only the furniture we want.
- **Not** a runtime DB feature. This is static content collections rendered at build (SSG), distinct from the live poll/session layer.
- **Not** a replacement for the `changelog/` or `context-v/` surfaces — a new, parallel content type.
- **Not** authored twice. One recipe, two projections. Mirror-duplication is explicitly rejected.

## Open questions

- [x] **Model A vs B** — ✅ **Resolved 2026-06-22: Model A** (neutral `guides/` core; both perspectives are derived projections).
- [ ] **Exact tree boundaries — deferred to first content (intentional).** Per the *Direction* note: leaning `use-cases/` + `guides/` as the two URL trees, with the tool angle on the existing `tools/` registry (no separate `tool-uses/` tree), and "guide" likely replacing "recipe" as the unit name. Don't settle on paper — let it fall out of authoring the first few guides.
- [ ] **Recipe URL + perspective context** — how does `/guides/<slug>` know which perspective shell to render? Options: `?from=use-case`, a perspective-prefixed route (`/use-cases/<hub>/<recipe>`), or default-to-first-relation + client switch. Leaning default-to-first + `PerspectiveSwitcher` override.
- [ ] **Derive vs author hub relations** — do hubs declare their recipe list, or is it fully derived from recipe frontmatter? Leaning derived (single source of truth on the recipe) with optional manual `order`/`featured` overrides on the hub.
- [ ] **Search engine** — Pagefind (matches Lossless splashes, zero-infra) vs a hand-rolled JSON index. Leaning Pagefind.
- [ ] **GIF + Steps directives** — ship the fancy `:::gif` / `:::steps` as net-new LFM directives, or stay with `![](x.gif)` + ordered lists for v1? Leaning: plain for v1, fancy in Phase 4.
- [ ] **Where the engine lives** — confirmed `fullstack-vc` (the community site), copying patterns from `mpstaton-site`. Flag if it should instead be a shared `@knots/*` pattern from day one.

## Related

- [[context-v/specs/Build-Section-Composed-Decks-with-Live-Theme-Mode.md]] — sibling fullstack-vc spec; same "build our own UI, inherit the three-mode theme, don't adopt a heavy framework" ethos.
- `@lossless-group/lfm` — the parser. Local checkout: `/Users/mpstaton/code/lossless-monorepo/lfm`. Remote: `jsr.io/@lossless-group/lfm`.
- `mpstaton-site` — reference implementation for LFM consumption: `scripts/lfm-mode.mjs` (local↔JSR toggle), `src/components/markdown/AstroMarkdown.astro` (the renderer), `src/lib/remark-lossless-wikilinks-local.ts` (resolver pattern), `src/content.config.ts` (collection schemas).
- `src/content/tools/` — the existing fullstack-vc tools registry; tool-use hubs link 1:1 to these handles (`hermes-agent`, `openclaw`, `composio`, `n8n`, `granola`, …).
- The `lossless-flavored-markdown` and `astro-knots` skills — LFM authoring conventions and the framework prohibitions (no React/JSX) this engine honors.
