---
title: Versatile Component Library for Video Players
lede: Videos links can come from various sources, and include metadata, playlists, and other information that handled to maximize the value of video content, all from simple markdown triggers.
date_authored_initial_draft: 2026-05-07
date_authored_current_draft: 2026-05-07
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-07
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags: [Markdown, Video-Embeds, YouTube, Vimeo, Loom, Components, Astro, Render-Pipeline, LFM, Link-Previews, Bare-Links]
authors:
  - Michael Staton
  - AI Labs Team
image_prompt: A taxonomy diagram showing a single bare YouTube URL fanning out into five rendering surfaces — full-bleed embedded player, row card, vertical card, thumbnail, and gallery grid — with provider matchers in the middle and theme-token-neutral component shells on the right.
date_created: 2026-05-07
date_modified: 2026-05-07
parent_spec: "[[Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package]]"
---

# Versatile Component Library for Video Players

**Status**: Draft (v0.0.0.1)
**Date**: 2026-05-07
**Author**: Michael Staton
**Parent spec**: [[Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package]] — this document extracts and supersedes §4.12 (Zero-Friction Media Embeds) and the video-flavored portion of §4.23.6 (Inline Link Substitutions).

***

## Workflow Status

### Done
- [x] Bare-URL classifier (`remark-bare-link`) — paragraph-with-single-autolink detection
- [x] Provider catalog (`packages/lfm/src/plugins/Bare-Link-Provider-Catalog.md`) — frontmatter-as-record format
- [x] `YouTubeEmbed` — full video, 16:9
- [x] `YouTubeShortsEmbed` — dedicated 9:16, max-width 320, centered wrapper
- [x] `YouTubePlaylistEmbed` — wired but **needs visual polish and playlist-aware UX** (current focus)
- [x] `VimeoEmbed` — covers `/{id}`, `/{hash}`, `/channels/...`, `player.vimeo.com`
- [x] `LinkPreview__Video--FullPlayer` — name reserved for the bare-URL embed path; today the per-provider components fill this role

### In Progress
- [ ] Playlist component improvements — see §4.1.3 below
- [ ] `:::link-preview{type="video"}` directive routing through the same provider matchers

### Next
- [ ] `LinkPreview__Video--Row` — inline-with-prose density
- [ ] `LinkPreview__Video--Card` — aside-friendly density (carries `aside` attribute)
- [ ] `LinkPreview__Video--Thumb` — for use inside rollups
- [ ] `LinkPreview__Video--LiveSite` — sandboxed iframe of provider page (author opt-in)
- [ ] `LinkRollup__Column` × `type="video"` — children render as Video Row
- [ ] `LinkRollup__Gallery` × `type="video"` — children render as Video Card
- [ ] `LinkRollup__Carousel` × `type="video"` — children render as Video Card with prev/next
- [ ] `LinkRollup__ThumbRow--HorizontalScroll` × `type="video"` — children render as Video Thumb

### Wish List
- [ ] `LoomEmbed` — once the Loom matcher is added to the provider catalog
- [ ] Hover-to-preview inside `LinkPreview__Video--Card` (autoplay muted on hover, like YouTube's grid)
- [ ] Chapter-aware deep-linking (start time pulled from URL query params automatically)
- [ ] Provider-native captioning passthrough (when the provider exposes a captions URL)

***

## 1. Problem

The LFM spec already declares *that* video-flavored components exist and *how* the bare-link plugin dispatches to them, but it doesn't specify the component family in enough detail to drive implementation. The result:

- Authors paste a YouTube playlist URL and get an embed that works mechanically but doesn't communicate "this is a playlist, not a single video" — a UX gap the playlist case makes obvious.
- The `:::link-preview{type="video"}` directive is documented but no Video-flavored variants of `Row`, `Card`, `Thumb`, or `LiveSite` exist.
- The `LinkRollup__*` containers are documented but the contract for "what does a Video-typed child look like inside each container" is implicit.
- Cross-cutting concerns (theme tokens, aside compatibility, fence-equivalence, fallback behavior) are scattered across three sections of the parent spec.

Pulling video into its own spec lets the family grow without forcing every change to ride alongside unrelated LFM work.

## 2. Goal

A complete, implementable specification for the video-component family that:

1. **Lists every component** (built and planned) with its responsibility, inputs, sizing model, and accessibility contract.
2. **Defines the dispatch graph** — which markdown shapes route to which components, including the playlist-vs-video-vs-Short distinction the bare-link classifier already makes.
3. **Codifies the `LinkPreviewData` shape for video** — what every Video-flavored component is guaranteed to receive and how to fall back when fields are missing.
4. **Keeps the parent LFM spec focused** — once this lands, §4.12 and the video portion of §4.23.6 collapse to short summaries that point here.

## 3. The S→T→C Model: Syntax → Trigger → Component

Lossless Flavored Markdown is built on a three-stage pipeline: **Syntax → Trigger → Component**. Every renderable feature in LFM — whether it's a callout, a citation, a Mermaid diagram, an image directive, or a video player — must specify all three stages. A new component is not a feature until the syntax that triggers it and the trigger that maps to it are both codified.

This is the model the rest of this spec is organized around. Every video-flavored component in §4–§5 is paired with the syntax forms that route to it and the trigger logic that does the routing.

### 3.1 The Three Stages

**S — Syntax.** The shapes a markdown author can write that mean "render this as a video." LFM's polyglot principle (parent spec §3.4) means a single semantic intent typically has 2–3 syntactic surfaces — bare URL, directive, fenced-code-with-directive-lang — and the renderer treats them as equivalent.

**T — Trigger.** The parse-time logic that recognizes a Syntax shape and emits a normalized MDAST node. Triggers are remark plugins (`remark-bare-link`, `remark-directive`, `remark-code-fence-as-directive`) plus shared catalogs (`Bare-Link-Provider-Catalog.md`, the directive registry). A Trigger's job is to turn surface syntax into a stable internal representation — once the trigger has fired, downstream code only sees the internal node, never the original characters.

**C — Component.** The Astro/Svelte component the renderer dispatches the internal node to. Components consume the normalized props the trigger produced; they don't parse URLs, classify providers, or read the catalog. That separation is what lets one component (e.g. `YouTubeEmbed`) serve every Syntax form (bare URL, `::youtube-video{id}` directive, `youtube-video` code fence) without branching internally.

### 3.2 The Three Syntax Positions for Video

Every video URL an author writes lands in one of three positions. Each position routes through a different Trigger and ends at a different Component family:

| S — Syntax position | T — Trigger | C — Component family |
|---|---|---|
| Bare URL on its own line (paragraph with single autolink child) | `remark-bare-link` matches against the provider catalog; emits a `leafDirective` with `{ provider, id, kind, url }` | **Tier A** — per-provider embed components (`YouTubeEmbed`, `VimeoEmbed`, etc.) |
| `:::link-preview{type="video"}` containing one URL | `remark-directive` parses the container; the inline-link classifier (sharing the bare-link catalog) enriches the URL into `LinkPreviewData`; renderer dispatches on `name + format` | **`LinkPreview__Video--{Format}`** — substitution previews (Row / Card / Thumb / LiveSite / FullPlayer) |
| `:::link-rollup{type="video"}` containing 2+ URLs | `remark-directive` parses the container; the rollup wrapper classifies each child URL via the same catalog; renders the container component with each child as a `LinkPreview__Video--{ChildFormat}` | **`LinkRollup__{Format}`** with Video-flavored children |

A fourth Syntax position — the **directive form on its own** (`::youtube-video{id="..."}`) — is the explicit equivalent of bare-URL Tier-A. It exists for authors who need control over embed attributes (start time, autoplay, mute) that bare URLs can't carry. Same Trigger output, same Component — just a different Syntax surface.

### 3.3 Why All Three Forms Share One Catalog

The Trigger stage for all three positions reads from a single source of truth: `packages/lfm/src/plugins/Bare-Link-Provider-Catalog.md`. This is what guarantees that:

- A bare YouTube URL, an `::youtube-video` directive, and a `:::link-preview{type="video"}` wrapping a YouTube URL all classify to the same `provider: 'youtube'`, same ID extraction, same fallback behavior.
- Adding a new provider (say, Loom) takes one frontmatter entry in the catalog — every Syntax position picks it up automatically.
- Components never duplicate URL parsing. The classification has happened by the time a component receives its props.

### 3.4 Worked Example: YouTube Playlist URL

Walk a single playlist URL through S→T→C end to end:

**S — Syntax (what the author writes):**
```markdown
https://youtube.com/playlist?list=PLME9DvdybGUN7PtbmJhSyYcUakt7tAya1&si=SKKEtkemYJ5tpQRO
```
A bare URL on its own line — the simplest Syntax position.

**T — Trigger (what the parser does):**
1. `remark-gfm` autolinks the URL — the paragraph now contains a single `link` node whose `value` equals its `url`.
2. `remark-bare-link` walks paragraphs, recognizes the bare-URL signal, and tries each provider's matchers from `Bare-Link-Provider-Catalog.md` in order.
3. The `youtube-playlist` matcher hits: `host: youtube.com`, `path: /playlist`, `query.list: ^(?<id>[A-Za-z0-9_-]+)$`. `id` captures as `PLME9DvdybGUN7PtbmJhSyYcUakt7tAya1`. The `si` tracking param is discarded.
4. The plugin replaces the paragraph with a `leafDirective` node: `{ name: 'youtube-playlist', attributes: { id: 'PLME9DvdybGUN7PtbmJhSyYcUakt7tAya1', provider: 'youtube', kind: 'playlist' } }`.

**C — Component (what the renderer mounts):**
1. `AstroMarkdown.astro` walks the MDAST, hits the `leafDirective` whose name is `youtube-playlist`, and dispatches to `YouTubePlaylistEmbed.astro`.
2. The component receives `id` (and any other attributes the directive form would have supplied — `index`, `start`, etc.); it does **not** parse the URL or know what `youtube.com/playlist?list=…` looks like.
3. The component renders the playlist iframe with the visual differentiation specified in §4.1.3.

The same `YouTubePlaylistEmbed` component would have been mounted if the author had instead written:

```markdown
::youtube-playlist{id="PLME9DvdybGUN7PtbmJhSyYcUakt7tAya1" index=2}
```

…or the Obsidian-portable fence form:

````markdown
```youtube-playlist id="PLME9DvdybGUN7PtbmJhSyYcUakt7tAya1" index=2
```
````

Three Syntax surfaces, one Trigger output, one Component. That's the S→T→C contract.

### 3.5 Acceptance Criterion for New Features

When this spec adds a new component or a new provider, the work is **not done** until all three columns are filled in:

1. **S — Syntax.** Document every shape the author may write. At minimum: bare URL pattern (if applicable), directive form (`::name{attrs}` or `:::name{attrs}`), code-fence-equivalent (Obsidian portability).
2. **T — Trigger.** Either add a frontmatter entry to `Bare-Link-Provider-Catalog.md` (for bare-URL auto-unfurl), register the directive in the directive registry (for directive forms), or both. Specify the matcher regex, the named captures, the discarded query params, and the emitted node shape.
3. **C — Component.** Specify the props the component receives (named after the trigger's normalized output), the rendering contract, and the fallback behavior.

A pull request adding only Component code without specifying Syntax and Trigger is incomplete and should be rejected. A pull request adding Syntax + Trigger without a Component renders to a no-op and ships a build warning.

***

## 4. The Component Family

The three rendering positions defined in §3.2 each map to a Component family. This section specifies the components themselves.

### 4.1 Tier A — Bare-URL Auto-Unfurl Players (Per-Provider)

A bare URL on its own line auto-unfurls to a full embedded player. The bare-link plugin's matchers determine which component takes over.

#### 4.1.1 Dispatch Map (current and planned)

| Status | Provider / kind | URL shapes | Directive emitted | Component |
|---|---|---|---|---|
| ✅ Stable | YouTube — full video | `youtu.be/{id}`, `youtube.com/watch?v={id}` | `::youtube-video` | `YouTubeEmbed` |
| ✅ Stable | YouTube — Short | `youtube.com/shorts/{id}` | `::youtube-short` | `YouTubeShortsEmbed` |
| ✅ Stable | YouTube — Playlist | `youtube.com/playlist?list={id}` | `::youtube-playlist` | `YouTubePlaylistEmbed` |
| ✅ Stable | Vimeo | `vimeo.com/{id}` (incl. `/{hash}`, `/channels/...`), `player.vimeo.com/video/{id}` | `::vimeo` | `VimeoEmbed` |
| 🟡 Planned | Loom | `loom.com/share/{id}` | `::loom` | `LoomEmbed` |

The frontmatter of `Bare-Link-Provider-Catalog.md` is the source of truth — the table above is a summary. New providers land by adding a frontmatter entry first; the parser picks them up automatically.

#### 4.1.2 Per-Component Contracts

Each Tier-A component MUST:

1. **Render a 16:9 (or 9:16 for Shorts) responsive frame** that scales with the column it's placed in, never overflows horizontally on mobile, and never causes CLS at load.
2. **Expose a single `id` prop** (the provider-specific video/playlist/etc. ID extracted by the matcher) plus optional `start`, `autoplay`, `mute`, `loop`, `controls` props that the directive form (Tier B, §4.2) can supply.
3. **Use lazy-loading by default** (`loading="lazy"` on the iframe, or a click-to-play poster for heavy embeds — see §5.4 for the "facade" pattern).
4. **Read theme tokens, not hex literals** — see §5.3.
5. **Degrade to a labeled link** if the embed fails to mount (network blocked, embed disallowed by provider).

##### `YouTubeEmbed`
- Full 16:9 player. Uses `youtube-nocookie.com` privacy-enhanced embed by default.
- Inputs: `id` (11-char), `start?` (seconds), `autoplay?`, `mute?`.
- Accessibility: `<iframe title="YouTube video {id}">` plus a visible caption slot when the directive form supplies `title`.

##### `YouTubeShortsEmbed`
- 9:16 vertical frame, `max-width: 320px`, centered.
- Distinct from `YouTubeEmbed` because Shorts have a different aspect, different default UX expectation (mobile-first), and a different recommended iframe sizing strategy.
- Same input set, minus `start` (Shorts are too short for time deep-links to matter).

##### `YouTubePlaylistEmbed` *(current focus — see §4.1.3)*
- 16:9 frame with a playlist sidebar (provider's own UI when `&list={id}` is in the embed URL).
- Inputs: `id` (the playlist ID, prefixed `PL`/`UU`/`OL` etc.), `index?` (which item to start on), `start?` (seconds within the starting item).
- **Distinguishes itself visually** from a single-video embed — see open questions in §4.1.3.

##### `VimeoEmbed`
- 16:9 frame, Vimeo's player chrome.
- Inputs: `id` (numeric), `hash?` (private/unlisted), `start?` (seconds), `autoplay?`, `mute?`, `loop?`.
- Channel/staff-picks/showcase URLs all reduce to a single Vimeo numeric ID by the matcher; the component never knows about the marketing URL.

##### `LoomEmbed` *(planned)*
- Per Loom's embed URL pattern (`loom.com/embed/{id}`).
- Inputs: `id`, `start?`, `t?`. Loom's iframe has the most stable embed contract of the planned providers.

#### 4.1.3 Playlist UX — The Specific Gap This Spec Triggers

A playlist URL today auto-unfurls to a frame that looks identical to a single-video embed — same chrome, same aspect, same affordances. Authors expect the playlist nature to be communicated visually before the user clicks play. Open questions:

1. **Sidebar visible by default?** YouTube's `?list=` embed param plus `&listType=playlist` exposes the sidebar, but it pushes the player to the left and on narrow viewports becomes unreadable. Decision pending: sidebar-on by default at ≥1024px, sidebar-off below.
2. **Header strip with playlist title and item count.** Pulled from oEmbed (`https://www.youtube.com/oembed?url=...`) at build-time and cached alongside the OG cache. Falls back to "YouTube playlist" if the fetch fails.
3. **"Play first" affordance vs. "Show all" link to YouTube** — both, with the first being the default action.
4. **Theme-token chrome around the iframe** — a thin `--card`/`--border` frame so the playlist component reads as a *bundle* visually, not as a single-video player. This is the cheapest visual cue and should land first.

These four points define the playlist component's near-term roadmap. They are scoped narrowly so progress is visible without a full UX overhaul.

### 4.2 Tier B — Directive-Form Players

Authors who need to control embed behavior (start time, autoplay, dimensions) write the directive form. Tier-B and Tier-A **share the same component** per provider — Tier-A is just sugar that produces the same `leafDirective` node Tier-B writes by hand.

```markdown
::youtube-video{id="dQw4w9WgXcQ" start="42" autoplay}

::youtube-playlist{id="PLrAXtmRdnEQy6nuLMfO6gpRH7Wey7zkB7" index=2 mute}

::vimeo{id="76979871" hash="abc123def4" start=30}
```

The renderer's dispatch is `leafDirective.name` → component lookup. Adding a provider extends one map; nothing else changes.

### 4.3 Tier C — Inline-Substitution Previews (`LinkPreview__Video--{Format}`)

When the author writes `:::link-preview{type="video"}` around a URL, the URL is **replaced in the document flow** by a card-sized component. This is for "see this video" moments where a full embed would be heavy and an autolink would be too quiet.

#### 4.3.1 Format Matrix

| Format | Visual density | Best for | Min required data |
|---|---|---|---|
| `Row` | Low (~64-80px tall, one line) | Inline in prose without breaking flow | title, source domain, thumbnail |
| `Card` | Medium (~240-320px tall) | Asides, feature blocks, sidebars | title, description, thumbnail, duration |
| `Thumb` | High (small image + title only) | Inside rollups and dense grids | title, thumbnail |
| `LiveSite` | Variable (sandboxed iframe of the provider page) | Author-trusted demos | URL only |
| `FullPlayer` | Full-bleed embedded media | Bare-URL auto-unfurl path (§4.1) | provider, id |

`Row`, `Card`, `Thumb` differ in *density*, not *data shape* — they all consume the same `LinkPreviewData` (§5.2). A site that builds `Card` first can ship `Row` and `Thumb` as CSS variants of the same component if it wants; the spec does not require three separate files.

#### 4.3.2 Acceptance Criteria

Every `LinkPreview__Video--{Format}` component MUST:

1. **Pull thumbnail from the provider** before falling back to OG (`img.youtube.com/vi/{id}/maxresdefault.jpg` for YouTube; Vimeo's oEmbed `thumbnail_url`). The provider matchers in the bare-link catalog already give us the ID — components reuse that work, they don't refetch.
2. **Show duration** when the provider exposes it via oEmbed and the format slot calls for it (Card has it; Row does not).
3. **Click-to-play** semantics: clicking the card replaces it with the corresponding Tier-A embed (or opens the provider page in a new tab if the site has chosen the "no-embed" policy via theme config).
4. **Render an `aside`-compatible wrapper** when the directive carries `aside=`. See §5.5 for the compatibility matrix.
5. **Degrade to a plain autolink** if both provider matchers fail and the OG fetch fails. Never render an empty card.

### 4.4 Tier D — Multi-URL Containers (`LinkRollup__*` with Video Children)

A `:::link-rollup{type="video"}` container holds 2+ URLs and applies one layout to all of them. The container declares the layout; each child is rendered as the matching density variant.

#### 4.4.1 Container × Child Rendering Map

| Container format | Layout | Children render as |
|---|---|---|
| `Column` | Vertical stacked list | `LinkPreview__Video--Row` |
| `Gallery` | Grid (configurable `columns`, default 3) | `LinkPreview__Video--Card` |
| `Carousel` | Horizontal scroll with prev/next + pagination dots | `LinkPreview__Video--Card` |
| `ThumbRow--HorizontalScroll` | Horizontal scroll of compact thumbnails | `LinkPreview__Video--Thumb` |

The container itself is **type-agnostic** — `LinkRollup__Gallery` works for `type="article"`, `type="video"`, etc. The container reads `type` from its directive attributes and dispatches each child to the correct `LinkPreview__{Type}--{ChildFormat}` component. Mixed-type rollups require multiple containers.

#### 4.4.2 Container Acceptance Criteria

1. **Lazy-render children below the fold** — particularly important for `Gallery` with many video items (each child is fetching a thumbnail).
2. **Honor the `columns` attribute** for Gallery (1–6, default 3, narrows to 1 on mobile via container query).
3. **Honor the `aside` attribute** with the same compatibility matrix as single previews (Column + aside = vertical list in margin track; Gallery + escape-aside = collapse to 1 column).
4. **Handle URL parsing failures gracefully** — a single broken child renders as an autolink without breaking the container layout.

***

## 5. Cross-Cutting Concerns

### 5.1 Provider Catalog (Single Source of Truth)

`packages/lfm/src/plugins/Bare-Link-Provider-Catalog.md` carries every provider entry as YAML in its frontmatter. Every component in this spec reads its provider classification from there — no hardcoded URL parsing inside components. Adding a video provider takes three edits:

1. Add a frontmatter entry (id, kind, directive, component, matchers).
2. Add the component file matching `component:`.
3. Add a row to the dispatch table in §4.1.1 of this spec.

The catalog's frontmatter format is documented in the catalog itself.

### 5.2 The `LinkPreviewData` Shape (Video Specialization)

Every `LinkPreview__Video--*` and the `LinkRollup__*` children consume the same `LinkPreviewData` interface defined in §4.23.6 of the parent LFM spec. The Video-relevant fields:

```ts
interface LinkPreviewData {
  type: 'video';
  url: string;                       // canonical URL the author wrote
  provider: string;                  // 'youtube' | 'vimeo' | 'loom' | ...
  providerId: string;                // YouTube video ID, Vimeo numeric ID, etc.
  providerKind?: string;             // 'video' | 'short' | 'playlist'
  providerExtra?: Record<string, string>; // e.g. { hash: 'abc123' } for unlisted Vimeo

  title?: string;
  description?: string;
  image?: string;                    // thumbnail URL — provider-direct preferred, OG fallback
  imageAlt?: string;
  duration?: string;                 // ISO 8601 (PT4M30S) when available

  source?: string;                   // human label — 'YouTube', 'Vimeo'
  sourceFavicon?: string;
}
```

A component renders against whatever subset is present and degrades gracefully when fields are missing. Components MUST NOT throw on missing `description` or `duration`.

### 5.3 Theme-Token Neutrality

Every component in this family reads semantic tokens (`--card`, `--card-foreground`, `--border`, `--muted-foreground`, `--brand-aqua`, etc.) — never hex literals. Same convention as `MermaidChartDisplay.astro`. This is what lets a single component file work across every site without per-site forks.

Sites that opt into the `LinkPreview__Video--*` family must declare the relevant tokens in their `theme.css`. The parent spec's theme-token blueprint (`Maintain-Themes-Mode-Across-CSS-Tailwind.md`) governs the contract.

### 5.4 Lazy-Load and Facade Strategy

Heavy embeds (full YouTube/Vimeo iframes) bloat first-paint. Each Tier-A component MUST support a "facade" mode where the initial render is a thumbnail + play-button overlay; the iframe mounts on click. Sites opt in via theme config:

```ts
// site config
lfm: {
  videoEmbeds: {
    facadeByDefault: true,   // render facade until clicked
    autoplayOnFacadeClick: true,
  }
}
```

Facade-by-default is **strongly recommended** for content-heavy pages (memos with multiple embeds). Direct-embed mode remains available for pages where instant playback matters (a single hero video at the top of a page).

### 5.5 Aside Compatibility (Margin Tracks)

Inherited from the parent spec's §4.23.6. Video-flavored applicability:

| Component | `aside=none` | `left` / `right` | `left-escape` / `right-escape` |
|---|---|---|---|
| Tier-A embeds (`YouTubeEmbed` etc.) | ✅ | ❌ | ❌ |
| `LinkPreview__Video--Row` | ✅ | ❌ | ❌ |
| `LinkPreview__Video--Card` | ✅ | ✅ | ✅ |
| `LinkPreview__Video--Thumb` | ✅ | ✅ | ⚠️ (collapses to float) |
| `LinkPreview__Video--LiveSite` | ✅ | ⚠️ (discouraged) | ⚠️ |
| `LinkRollup__Column` × video | ✅ | ✅ | ✅ |
| `LinkRollup__Gallery` × video | ✅ | ✅ | ⚠️ (collapses to 1 column) |
| `LinkRollup__Carousel` × video | ✅ | ⚠️ | ❌ |
| `LinkRollup__ThumbRow--HorizontalScroll` × video | ✅ | ❌ | ❌ |

✅ = supported. ⚠️ = allowed but degrades. ❌ = not supported (renders inline with a build warning).

### 5.6 Obsidian-Portable Fence-Equivalence

Authors editing in Obsidian frequently use code-fence-with-custom-lang shapes for community plugins. LFM's `remark-code-fence-as-directive` (forthcoming) treats a fence whose lang matches a registered LFM directive name as semantically equivalent to the `:::` form. Every video directive in this spec MUST be reachable both ways:

````markdown
::youtube-video{id="dQw4w9WgXcQ"}
````

````markdown
```youtube-video id="dQw4w9WgXcQ"
```
````

````markdown
:::link-preview{type="video" format="card"}
https://youtu.be/jCe2wg1ulus
:::
````

````markdown
```link-preview type="video" format="card"
https://youtu.be/jCe2wg1ulus
```
````

The renderer doesn't care which form the author wrote — both produce the same MDAST node, both dispatch to the same component.

### 5.7 Auto-Unfurl Opt-Out

Prefix a bare URL with `\` to suppress auto-unfurl and render it as a plain autolink:

```markdown
\https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

Useful for "I'm referencing this URL, I don't want a player" situations.

### 5.8 Privacy Posture

YouTube embeds use `youtube-nocookie.com` by default. Vimeo's player is GDPR-friendly out of the box. Sites that need stricter posture (e.g. publishing in EU jurisdictions with an active cookie banner) opt into facade-only mode (§5.4) so no provider iframe loads until the reader explicitly clicks play.

***

## 6. Implementation Phases

### Phase 0 — Shared foundation (already in place)
- [x] `remark-bare-link` plugin
- [x] Provider catalog with frontmatter-as-record format
- [x] OG fetcher (build-time, cached) — used as fallback when provider matchers don't extract a thumbnail/title

### Phase 1 — Tier-A polish (current focus)
- [ ] Playlist component visual differentiation (§4.1.3, items 1–4)
- [ ] Facade mode wired in `YouTubeEmbed`, `YouTubeShortsEmbed`, `YouTubePlaylistEmbed`, `VimeoEmbed`
- [ ] oEmbed enrichment build step that populates title/duration/thumbnail for catalog providers and writes to the OG cache

### Phase 2 — `LinkPreview__Video--{Format}` family
- [ ] `Card` first (richest data shape, biggest payoff)
- [ ] `Row` (CSS variant of Card if data shape allows)
- [ ] `Thumb` (smallest density, used by rollups)
- [ ] `LiveSite` (author opt-in only, lowest priority)

### Phase 3 — `LinkRollup__*` × video
- [ ] Column container (simplest layout)
- [ ] Gallery container (most common production use)
- [ ] ThumbRow horizontal-scroll
- [ ] Carousel (heaviest UX — last)

### Phase 4 — New providers
- [ ] Loom matcher + `LoomEmbed`
- [ ] Future video providers added by extending the catalog only

***

## 7. Open Questions

1. **Should `YouTubePlaylistEmbed` carry an `index` prop for "start playing item N"?** YouTube's embed URL supports it; the matcher does not currently extract it. Likely yes — easy add.
2. **oEmbed at build time or on-demand?** Build-time is cheaper for static sites but means stale titles for long-published memos when video titles change. Default: build-time, with a "freshness window" config.
3. **Do `LinkPreview__Video--*` variants require their own files, or are they CSS variants of one component?** The naming taxonomy implies separate files; pragmatism may collapse them. Decide during Phase 2 implementation.
4. **Carousel keyboard/screenreader contract.** Carousels are the format most likely to ship with a11y bugs. Block on documented keyboard nav (arrow keys, Home/End, focus management on slide change) before merging.
5. **Should the Vimeo channel URL pattern (`vimeo.com/channels/{name}/{id}`) preserve the channel context anywhere in the rendered UI?** Today the matcher discards it. Probably yes for `Card` and `LiveSite`; not needed for `Row`/`Thumb`.

***

## 8. References

- Parent spec: [[Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package]] (§4.12, §4.23.5, §4.23.6)
- Provider catalog: `packages/lfm/src/plugins/Bare-Link-Provider-Catalog.md` (in the lfm repo at `/Users/mpstaton/code/lossless-monorepo/lfm/src/plugins/`)
- Theme tokens contract: [[Maintain-Themes-Mode-Across-CSS-Tailwind]]
- Test fixture: `sites/mpstaton-site/src/content/promote/_demo/memo/v1.md`
- Reference component implementations: `sites/mpstaton-site/src/components/markdown/` (`YouTubeEmbed.astro`, `YouTubeShortsEmbed.astro`, `YouTubePlaylistEmbed.astro`, `VimeoEmbed.astro`)
