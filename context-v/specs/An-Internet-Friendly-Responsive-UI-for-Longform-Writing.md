---
title: "An Internet-Friendly, Responsive UI for Long-Form Writing"
lede: "A reader UI for publishing book-length content as a sequenced series of chapters on the FullStack VC site. The wrapper provides chapter sequencing, navigation, and reading affordances; all content-level features (callouts, citations, image directives, wikilinks) stay in the Lossless Flavored Markdown plugin where they belong."
date_authored_initial_draft: 2026-04-26
date_authored_current_draft: 2026-04-26
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-04-26
at_semantic_version: 0.0.1.0
publish: false
status: Proposed
augmented_with: "Claude Code with Opus 4.7"
category: Information-Design
date_created: 2026-04-26
date_modified: 2026-04-26
authors:
  - Michael Staton
image_prompt: "A floating digital book opened to a single chapter page, flanked on both sides by two translucent preview cards that match the book's height — each card softly truncated at its bottom edge. A thin glowing line traces a reading-progress arc above the book. Isometric vector illustration, devtools-meets-dojo aesthetic."
slug: an-internet-friendly-responsive-ui-for-longform-writing
tags:
  - Information-Design
  - Long-Form-Reading
  - Reading-Experience
  - Responsive-UI
  - Mobile-First
  - Lossless-Flavored-Markdown
  - LFM
  - Content-Collections
  - Book-Reader-Layout
  - Mobile-ToC
  - Swipe-Navigation
  - Banner-With-Overlay
  - Preview-Cards
  - Chapter-Sequencing
  - Reading-Progress
  - Accessibility
  - Venture-Handbook
  - FullStack-VC
  - Kauffman-Fellows
  - Agentic-VC-Dojo
---

# Context

## Overview

A book-style reader UI for the FullStack VC site that publishes long-form content as a sequenced series of chapters. The first piece of content is the **Venture Handbook (Class 20 Living Draft)** — ten workflow chapters covering the practice of venture capital — but the layout is content-agnostic: any future ebook, manifesto, or multi-chapter essay shipped on the site uses the same components.

The wrapper UI handles three things and three things only:

1. **Chapter sequencing** — knowing what comes before, what comes after, and how to get there
2. **Reading affordances** — banner, in-page TOC, reading progress, persistent place-holding
3. **Mode/theme cohesion** — same `BaseThemeLayout` as the rest of the site, same tokens

Every content-level feature — callouts, citations, image directives with caption/credit, wikilinks, code blocks with copy buttons, pull quotes, embedded video, footnotes — lives in **`@lossless-group/lfm`**. If a feature can be expressed as a markdown extension or a remark plugin, it goes in LFM. The reader UI never reaches into the markdown to render a particular thing differently; it composes whatever the LFM AstroMarkdown renderer hands it.

This separation is the load-bearing decision of the spec.

## Inspiration

Reader UIs that have found a defensible balance between immersion and navigation:

- **Stripe Press** digital editions (e.g., *High Growth Handbook*, *The Revolt of the Public*) — generous typography, prev/next at chapter ends, low-chrome margins, a subtle floating ToC on desktop that collapses on mobile. The closest reference for what we want.
- **The New Yorker / The Atlantic** long-read templates — proves you can publish 20,000-word pieces on the public web without forcing the reader into a "reader mode."
- **The Pudding's** essay templates — strong on banner-as-anchor and chapter-as-scene treatments.
- **Edward Tufte's** web essays — the gold standard for sidenote/margin-note treatment, though probably out of scope for v1.
- **The Lossless Group reader** at `lossless-group/site/src/pages/read/` — our prior art for a multi-collection reader, especially the **mobile collapsing ToC pattern** we already proved works (gets ported in this spec).
- **Substack's article view** — shows what NOT to do (cluttered, monetization-driven), but the bottom prev/next pattern is sound.
- **mdBook output** — useful reference for keyboard navigation (arrow keys for chapter change) and search affordances.

## Context on the Astro-Knots pseudo-monorepo

This spec lives in `context-v/specs/` of the `astro-knots` pseudomonorepo for cross-site reference, but the implementation lands in **`sites/fullstack-vc`**. The reader components are first built into the site directly (per the Astro Knots "build in client sites first, extract later" motion) and may eventually graduate to `packages/lfm-astro/components/` as a copy-pattern source for sibling sites. **No `workspace:*` dependencies** — the published `@lossless-group/lfm` package is the only runtime dependency added.

Companion docs:

- [[context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package]] — defines what markdown features the renderer must handle. Read first.
- [[context-v/specs/Remark-Citations-Plugin-for-Hex-Code-Footnote-Management]] — citation handling spec; already in LFM. The reader's footnote rendering is downstream of this.
- [[context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]] — two-tier token convention. All reader components read semantic tokens only.
- [[context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions]] — every component lands in `/design-system` in the same change.
- [[context-v/prompts/Discuss-how-to-Publish-Long-Form-like-eBook]] — the discussion that decided we'd "wing it with LFM" rather than adopt Starlight or mdBook.

## Preferred Stack

1. **Astro 6** content collections — one collection per book (e.g., `venture-workflows`), one file per chapter. Frontmatter drives card display + sequencing; body is markdown rendered through LFM.
2. **`@lossless-group/lfm`** as the only runtime markdown dependency — currently published with `remark-gfm`, `remark-directive`, `remark-callouts`, and citations. The wishlist features (image directive, heading slugs + per-chapter TOC, wikilinks) get built INTO LFM as part of the work, then consumed here.
3. **Astro components only** for the wrapper UI — no Svelte islands needed for the v1 reader. Mobile ToC is a small client-side script (vanilla TS, ~60 LOC, IntersectionObserver-driven). Swipe navigation is a small touch-event handler.
4. **Tailwind v4** semantic tokens for layout/spacing/typography — no hardcoded hex. Vanilla CSS allowed where Tailwind falls short in expressiveness of design intent.
5. **`BaseThemeLayout`** is the parent layout. The book reader layout (`BookReaderLayout.astro`) wraps it without replacing it. Theme + mode toggle stay accessible everywhere.
6. **No client-side router** — Astro's per-page navigation is fine. View transitions (Astro 6's `<ClientRouter />`) get evaluated in v0.3 for smoother chapter-to-chapter feel.

## Audience & Scale

- **Primary audience**: Kauffman Fellows and Agentic VC Dojo participants reading the Venture Handbook — practicing VCs who'll dip in chapter-by-chapter, often on mobile, occasionally on desktop for deeper reads.
- **Secondary audience**: anyone who lands on a chapter from search/social (LLM citations, Twitter, LinkedIn) — they'll arrive deep, not at the index. The first-chapter-experience is therefore the *every-chapter* experience.
  - SEO/GEO concerns are paramount.  If we're doing the work, we should be found.
- **Scale**: 10 chapters in the first book, ~5K-10K words each, ~50 footnotes total, ~25 images. Future books may be larger (30+ chapters), so anything that hardcodes "10" is wrong.
- **Balance Skim Friendly and Deep Reading Sessions**: 5-15 minutes typical, 30-45 for deep reads. Most will "skim"
- **Devices**: ~60% mobile (per FullStack VC analytics expectation, common for content-driven sites), ~35% desktop, ~5% tablet. Mobile-first design — but mobile-first does not mean mobile-only; the desktop layout has to earn its real estate.

### Wish List if Low Effort
- **Reading sessions**: 5-15 minutes typical, 30-45 for deep reads. Save-my-place and reading-progress matter for the deep-read tail.

## Responsive Design

Four layout modes, selected by the **container's width AND aspect ratio** — not the viewport's pixel count alone. A 1732×2158 window (split-screen on a high-DPI laptop) is plenty wide in CSS pixels but distinctly portrait — width-only thresholds would call it "Desktop" and ship the full triptych, which then crowds the banner and pushes the body column off-balance.

| Mode | Trigger (container `inline-size` × aspect ratio) | Layout | Prev/Next | ToC | Banner |
|---|---|---|---|---|---|
| **Mobile** | `cw < 768px` (any aspect) | Single column | Tiny chevron buttons flanking banner + swipe gesture + full cards at chapter end | Sticky bar at top showing current heading; tap to expand | Full-width, condensed |
| **Tablet** | `768px ≤ cw < 1024px` (any aspect) | Single column, wider | Medium preview cards inline (collapsed text) flanking banner | Floating "Contents" button bottom-right opens drawer | Centered, capped at content width |
| **Half Screen / Split Screen** | `cw ≥ 1024px` AND aspect ratio `< 1.3` (i.e., closer-to-square or portrait) — OR — `1024px ≤ cw < 1280px` (any aspect) | Three-column band like desktop but slimmer; tall vertical real estate emphasized | Slim preview cards (~200px wide) flanking banner; collapse to chevron-only buttons if horizontal space gets tight; full preview cards still appear at chapter end | Floating "Contents" button bottom-right opens drawer (right-margin sidebar would crowd the body) | Centered, narrower (~640px max) |
| **Desktop** | `cw ≥ 1280px` AND aspect ratio `≥ 1.3` (landscape) | Three-column band at top, single column below | Full preview cards flanking banner; smaller versions in margin if scrolled past banner | Persistent right-margin sidebar (or top-of-content slide-out) | Centered, max-width matches content column |

> **Implementation primitive: container queries, not viewport media queries.** The `BookReaderLayout` element is declared `container-type: inline-size; container-name: reader`. All mode rules use `@container reader (...)`. This makes the layout respond to *its own width*, which means: split-screen browsers, embedded iframe contexts, and anything that constrains the container all "just work" without us reasoning about viewport math. Container queries support `aspect-ratio` natively, so the dual-axis rule above is one CSS block per mode, not a JS measurement loop.

> **Why a dedicated Half Screen / Split Screen mode?** Two distinct cases trigger it:
> 1. **Aspect-ratio-driven**: a wide-but-portrait window — e.g., 1732×2158 from split-screen on a high-DPI display. The width says "Desktop," but the portrait aspect means the full triptych crowds the banner and the right-margin ToC eats the body column.
> 2. **Width-driven**: a small-laptop-fullscreen or split-screen pane in the 1024–1279px range. Wide enough for desktop interaction patterns (mouse + keyboard, hover affordances) but not wide enough for the full triptych.
>
> Both cases want the *desktop interaction model* (clickable preview cards, keyboard nav, no swipe gestures) at narrower or taller proportions. When reasonable, Half Screen looks like a smaller version of Desktop, not a wider version of Mobile.

The reader **never** uses a fixed multi-column layout that splits running text across columns. Every mode gets one column of body text, max ~70ch wide. Margins, sidebars, and flanking cards are scaffolding *around* that single column.

## The "Wrapper Stays Out of the Way" Thesis

Three practical rules that follow from the separation-of-concerns above:

1. **No content-feature creep into the layout.** If a chapter wants a callout, that's `> [!info]`. If it wants a captioned image, that's `:::image{src caption credit}`. If it wants a sidenote, that's a future LFM directive. The reader doesn't get a `<Sidenote>` component prop; the markdown gets a `:::sidenote` directive.
2. **The banner is part of the wrapper, not the content.** Each chapter's banner is composed from frontmatter (title, eyebrow, image) by the reader layout. Authors don't write `<Banner />` in their markdown.
3. **The reader assumes nothing about chapter structure.** Some chapters have one H2; some have eight. Some have footnotes; some don't. The mobile ToC reads what's there at build time and renders accordingly. No chapter is "broken" because it doesn't conform to a particular sub-section grammar.

This thesis lets us evolve the reader and the markdown flavor independently. New LFM features show up in the reader for free. New reader features (e.g., reading progress) don't require any change to existing chapters.

---

# Current Task & Prompt

Author the v0.1 of the long-form reader UI. Cover layout, the four new components, mobile interaction model (swipe + collapsing ToC), URL conventions, accessibility, and performance. The implementation should be sequenced so that v0.1 ships a single readable chapter end-to-end (no prev/next yet), v0.2 adds multi-chapter sequencing + prev/next + ToC, and v0.3 adds the mobile polish layer (swipe nav, save my place, view transitions).

The first content under it: the Venture Handbook chapters scaffolded in `sites/fullstack-vc/src/content/long-form/venture-workflows/`. The collection schema in `src/content.config.ts` is intentionally not yet registered; this spec defines the schema additions required.

---

# Requirements

## User Experience

### Reading the focused chapter

- Land on a chapter URL → see a centered banner with the chapter's title overlaid on its hero image (handled by the existing `BannerWithOverlay` component).
- Below the banner: a slim chapter-meta block (chapter number, estimated reading time, author, last-updated date).
- Below that: the chapter body, rendered through LFM's `AstroMarkdown.astro` recursive renderer. Single-column, ~70ch max, generous line-height (1.6+), larger body type than the rest of the site (1.0625rem–1.125rem).
- Footnotes: rendered inline via the existing citation pipeline (superscript reference inline, full Sources block at chapter end).
- Reading progress visible somewhere ambient — top of viewport, thin bar, mode-aware color.

### Moving between chapters

- **Desktop**: full-fidelity preview cards (`ContentPreviewNavCard.astro`) flank the banner — left side shows previous chapter, right side shows next chapter. Each preview card displays chapter number, title, lede, and a few of the chapter's marketing tags (the same `tags` array the AreasOfVentureGrid uses). The card auto-truncates its body content so it never exceeds the banner's height — visually, the three elements form a triptych at the top of the viewport.
- **Half Screen / Split Screen**: same triptych as desktop but with slimmer (~200px) preview cards and the lede clamped to 3 lines. If banner + cards together would exceed viewport width with reasonable margins, the cards collapse to chevron-only buttons (preserving the desktop *position*, just losing the preview body); the bottom-of-chapter full preview cards remain at full fidelity regardless.
- **Tablet**: medium-density preview cards inline next to the banner, with the body text auto-truncated to two lines instead of four.
- **Mobile**: prev/next collapse to small chevron buttons (`‹` and `›`) flanking the banner. Swiping left or right anywhere in the content area triggers chapter change with a brief horizontal slide animation. At the chapter end (after the Sources block), full preview cards reappear stacked vertically.
- **Keyboard**: left arrow → previous, right arrow → next, `[` and `]` as alternates (avoids conflict with content-area textareas if any ever exist).

### In-page navigation (ToC)

- **Mobile**: a sticky thin bar pinned just below the site header. Shows the *current* heading the user is reading, swapped automatically as the user scrolls (IntersectionObserver-driven). On tap, the bar expands into the full chapter ToC. Tapping a row scrolls/anchors to that section. This is the pattern Lossless Group already proved works at `lossless-group/site` (port the implementation; don't reinvent).
- **Tablet**: floating "Contents" button bottom-right opens an overlay drawer with the same ToC.
- **Half Screen / Split Screen**: same floating "Contents" button + drawer pattern as tablet. The right-margin sidebar doesn't fit at this width without crowding the body column.
- **Desktop**: a persistent ToC in the right margin (sticky, indented to indicate hierarchy). The currently-active section is highlighted via the same IntersectionObserver script.

### Saving my place

- Chapter and last scroll position persisted in `localStorage` per-book. Returning to the book index shows a "Continue reading: Chapter 3 — Thesis, Diligence & Pushing Deals Through" banner above the chapter list.
- Privacy: localStorage only, never reported to a server. Cleared via a "Forget my place" link in the book footer.

### Sharing

The bet: **mobile message sharing has displaced email as the primary high-trust distribution channel.** People share what they're reading right now, in the moment, to one or two specific people in iMessage / Signal / WhatsApp / DM. Whole-chapter shares are too coarse for that motion. Section shares and quote shares are what actually get sent — and they're what we should actively offer.

Two share affordances per chapter:

- **Per-section share** — every heading exposes a "share this section" button (`↗` icon) next to its anchor link. Click → URL with the section identifier as a query param copied to clipboard. Tapped from a phone, opens the native iOS/Android share sheet via `navigator.share()`.
- **Quote share** — when the user selects a span of text in the article body, a small "Share quote" pill appears near the selection (Medium-style). Click → URL with the quote URL-encoded as a query param, plus the quote itself copied to clipboard so it pastes verbatim into the message. Long quotes are truncated for the OG description but preserved in full in the URL.

Both share types **override the chapter-level Open Graph metadata** when the link is unfurled by a chat app, social card scraper, or LLM. The chapter banner image is preserved as `og:image`, but `og:title` and `og:description` reflect the section/quote, not the chapter.

Critical link-landing behavior: the user must arrive at the section/quote, not the top of a 10K-word chapter. The mechanic for this — including the *why fragments alone don't work* problem — lives in "Section-Specific & Quote Sharing" below.

Whole-chapter shares still exist (browser URL bar, the OS share button) but section/quote shares are the ones we actively offer and instrument.

Plain `#anchor` permalinks are also still emitted for in-page navigation (every heading gets an anchor); they coexist with the share-button URLs.

## Functional

- Build statically — every chapter prerenders to HTML at build time. No runtime SSR required for the reader.
- Works without JavaScript for the read path. Prev/next links and ToC links degrade to plain anchors. Swipe nav and the auto-swapping ToC require JS but are progressive enhancements.
- Single source of truth for chapter sequencing: the `chapter_number` frontmatter field, sorted ascending. No manual prev/next wiring.
- All chapters share one URL pattern: `/read/[book]/[chapter-slug]`. The `[book]` is a content-collection name; the `[chapter-slug]` is derived from the filename minus the numeric prefix.
- Book index page at `/read/[book]/` — chapter list, optional foreword/intro, "continue reading" banner if applicable.
- Full library index at `/read/` — list of all books on the site. Empty for now (one book), but the route exists.

## Non-functional

- **Performance budget per chapter page**: under 100KB total transferred (HTML + CSS + JS + above-fold images), Lighthouse Performance ≥ 95 on mobile.
- **Accessibility**: WCAG 2.2 AA. All interactive elements keyboard-reachable. Skip-to-content link. Banner overlay text passes contrast in all three modes. ToC is a proper `<nav>` with `aria-label="Chapter contents"`. Active heading exposed via `aria-current="location"`.
- **Reduced motion**: `prefers-reduced-motion: reduce` disables swipe-gesture transition animation, view transitions, and any auto-scroll behavior; chapter changes happen instantly.
- **No-script fallback**: every interactive control degrades to a plain link or a non-collapsing UI. The reader is fully usable with JS off.
- **Print stylesheet**: clean single-chapter print — banner image suppressed, ToC suppressed, prev/next suppressed, footnotes inline, page breaks before each H2.

---

# Imagined Features / Approach

## Layout primitives

### `BookReaderLayout.astro`

Wraps `BaseThemeLayout`. Receives the chapter entry + the full chapter list + the prev/next entries (resolved by the calling page). Composes:

```txt
┌─ <BaseThemeLayout> ──────────────────────────────────────┐
│  ┌─ Header (existing, sticky) ──────────────────────┐    │
│  ├──────────────────────────────────────────────────┤    │
│  │  ┌─ ReadingProgressBar (thin top stripe) ─────┐  │    │
│  │  ├──────────────────────────────────────────────┤  │    │
│  │  │                                              │  │    │
│  │  │  ┌─ Top triptych (desktop) ──────────────┐  │  │    │
│  │  │  │ [PrevPreview]  [Banner]  [NextPrev]   │  │  │    │
│  │  │  └────────────────────────────────────────┘  │  │    │
│  │  │                                              │  │    │
│  │  │  ┌─ ChapterMeta ─────────────────────────┐  │  │    │
│  │  │  │ Ch.03 · 12 min read · Updated …       │  │  │    │
│  │  │  └────────────────────────────────────────┘  │  │    │
│  │  │                                              │  │    │
│  │  │  ┌─ Article body (AstroMarkdown via LFM) ┐  │  │    │
│  │  │  │ ── content ──                           │  │  │    │
│  │  │  └────────────────────────────────────────┘  │  │    │
│  │  │                                              │  │    │
│  │  │  ┌─ Sources (LFM citations) ─────────────┐  │  │    │
│  │  │  └────────────────────────────────────────┘  │  │    │
│  │  │                                              │  │    │
│  │  │  ┌─ Bottom cards (always visible) ───────┐  │  │    │
│  │  │  │ [PrevPreview-full] [NextPrev-full]    │  │  │    │
│  │  │  └────────────────────────────────────────┘  │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                    │    │
│  │  ┌─ Mobile ToC bar (sticky, mobile only) ─────┐   │    │
│  │  │ ▾ Currently: "Discussion"                   │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                    │    │
│  │  ┌─ Desktop ToC (sticky right margin) ────────┐   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### URL patterns

- **Read index** (list of all books): `/read/`
- **Book index** (chapter list for one book): `/read/[book]/` (e.g., `/read/venture-handbook/`)
- **Chapter** (the canonical reading URL): `/read/[book]/[slug]/` (e.g., `/read/venture-handbook/strategy-development-and-raising-a-fund/`)
- **Share endpoint** (server-rendered for OG override; never directly typed by users): `/share/[book]/[slug]/?h=…&q=…` — see "Section-Specific & Quote Sharing" for the full mechanic.
- The `[slug]` is the filename minus its numeric prefix and `.md` extension. So `01-strategy-development-and-raising-a-fund.md` → `strategy-development-and-raising-a-fund`. Numeric prefix preserved on disk for sort order, dropped from URL for cleanliness.

**Naming rationale**: short and verb-y. `/read/` reads cleanly in URL bars, share previews, and aloud. We considered `/library/`, `/dojo/library/`, `/books/`; rejected as redundant or jargon-y for the volume of content we'll have at our scale. We also considered `/library/read/[book]/` — explicitly out: doubly nested, no SEO upside, no semantic clarity gain.

### Centralized path management

**The principle**: disk organization is for *us* (easy file management, sensible nesting, clear ownership). URL paths are for *readers* (short, SEO-friendly, easy to type and share). Those two things should not be coupled. A file at `src/content/library/books/venture-handbook/01-strategy-development.md` — sensibly organized 4 levels deep on disk — should serve at `/read/venture-handbook/strategy-development/`. The bridge between them lives in **one config file** so renaming either side is a single change.

**The file**: `src/config/routes.ts`. Lives in `config/` because it's a cross-cutting configuration concern, not a runtime utility.

It does two jobs:

#### 1. URL builders — used by every component that emits a link

```ts
// src/config/routes.ts
const READ_BASE = '/read';
const SHARE_BASE = '/share';

export const routes = {
  /** Read index — list of all books on the site. */
  readIndex: () => `${READ_BASE}/`,

  /** Book index — chapter list for a single book. */
  book: (bookSlug: string) => `${READ_BASE}/${bookSlug}/`,

  /** Chapter detail page — the canonical reading URL. */
  chapter: (bookSlug: string, chapterSlug: string) =>
    `${READ_BASE}/${bookSlug}/${chapterSlug}/`,

  /** Section-specific in-page anchor (browser scrolls; no OG override). */
  chapterSection: (bookSlug: string, chapterSlug: string, sectionSlug: string) =>
    `${READ_BASE}/${bookSlug}/${chapterSlug}/#${sectionSlug}`,

  /** Share URL — query-param form that triggers OG metadata override server-side.
   *  Pass `h` for section, `q` for quote, both for combined. */
  share: (
    bookSlug: string,
    chapterSlug: string,
    opts?: { h?: string; q?: string }
  ) => {
    const base = `${SHARE_BASE}/${bookSlug}/${chapterSlug}`;
    if (!opts?.h && !opts?.q) return base;
    const params = new URLSearchParams();
    if (opts.h) params.set('h', opts.h);
    if (opts.q) params.set('q', opts.q);
    return `${base}?${params.toString()}`;
  },
};
```

Every component, layout, server endpoint, sitemap generator, and test imports from this file. **No hardcoded `'/read/...'` strings anywhere else.** Renaming a route — say, swapping `/read/` for `/r/` for shorter share URLs — becomes a one-file change. TypeScript catches missing args.

#### 2. Disk-to-URL mapping — used by the Astro `getStaticPaths` for the chapter route

The content collection lives at whatever depth makes organizational sense. The route file at `src/pages/read/[book]/[slug].astro` calls a single function from `routes.ts` that returns the `(bookSlug, chapterSlug)` pair for each entry — derived from frontmatter, not from the file's nested location.

```ts
// In routes.ts:

/** Where reader content is organized on disk.
 *  Loose enough to be reorganized without touching URL logic. */
export const contentRoots = {
  books: 'library/books',  // resolves to src/content/library/books/...
};

/** Given a content collection entry, return the URL pair that locates it. 
 *  Source of truth: frontmatter — NOT the file's directory location. */
export function entryToUrl(entry: { 
  collection: string;
  data: { chapter_number: number; book_slug?: string };
  id: string;
}): { bookSlug: string; chapterSlug: string } {
  const bookSlug = entry.data.book_slug ?? entry.collection; // collection name = book slug by default
  // 'library/books/venture-handbook/01-strategy-development.md'
  //   → '01-strategy-development'  (filename without extension/path)
  //   → 'strategy-development'      (numeric prefix stripped)
  const filename = entry.id.split('/').pop()!.replace(/\.md$/, '');
  const chapterSlug = filename.replace(/^\d+-/, '');
  return { bookSlug, chapterSlug };
}
```

Calling code in `src/pages/read/[book]/[slug].astro`:

```ts
export async function getStaticPaths() {
  const entries = await getCollection('venture-workflows');
  return entries
    .filter(e => e.data.published)
    .map(entry => {
      const { bookSlug, chapterSlug } = entryToUrl(entry);
      return { params: { book: bookSlug, slug: chapterSlug }, props: { entry } };
    });
}
```

Result: nesting `content/library/books/venture-handbook/01-strategy-development.md` is *invisible* to the URL. Reorganize the disk later (e.g., move books into per-publisher subfolders) — `entryToUrl` is the only place that needs to know.

#### 3. Short-link aliases (future)

If a share URL ever needs to fit inside character-constrained mediums (Twitter, SMS), a small `redirects` table in the same file lets us add things like `/v/<chapter>` → `/read/venture-handbook/<chapter>` without changing canonical routes. Astro's `redirects` config in `astro.config.mjs` reads from a list — easy to source from `routes.ts`.

When this pattern matures, `routes.ts` graduates to cover non-reader routes too (`/dojo`, `/stack/me`, `/changelog/...`) — but starts scoped to the reader to avoid premature abstraction.

## Component inventory

| Component | Path | Status | Role |
|---|---|---|---|
| `BookReaderLayout` | `src/layouts/` | NEW | Page-level chrome around a chapter |
| `BannerWithOverlay` | `src/components/changelog/` | EXISTS, reuse | Hero banner with overlay text — already built for changelog; extract to a more general home if needed |
| `ContentPreviewNavCard` | `src/components/read/` | NEW | Prev/next preview card — visually echoes `AreasOfVentureGrid` cards |
| `ChapterMeta` | `src/components/read/` | NEW | Slim block: chapter number, reading time, author, dates |
| `ReadingProgressBar` | `src/components/read/` | NEW | Thin top-of-viewport bar, scroll-driven |
| `MobileTocBar` | `src/components/read/` | NEW | Sticky current-heading bar, taps to expand |
| `DesktopTocSidebar` | `src/components/read/` | NEW | Right-margin sticky ToC, IntersectionObserver-highlighted |
| `SwipeNavigator` | `src/components/read/` | NEW (mobile) | Touch handler — wraps the article body, dispatches prev/next |
| `BookIndex` | `src/components/read/` | NEW | Renders the chapter list on `/read/[book]/` |
| `SectionShareButton` | `src/components/read/` | NEW | `↗` button rendered next to every heading; copies `?h=…` share URL or invokes `navigator.share()` on mobile |
| `QuoteShareTooltip` | `src/components/read/` | NEW | Floating "Share quote" pill that appears on text selection inside the article body; emits the `?q=…` share URL with combined `#:~:text=` fragment |
| `AstroMarkdown` | (copied from `packages/lfm-astro/`) | EXISTS, copy-pattern | Recursive MDAST renderer; already proven |
| `Sources` | (copied from `packages/lfm-astro/`) | EXISTS, copy-pattern | Renders citation list at chapter end |

A new `src/components/read/` directory homes the reader-specific components. They don't belong in `heroes/`, `sections/`, or `buttons/` — long-form reading is its own concern.

## The Banner (existing, keep)

`BannerWithOverlay.astro` already composes brand-font HTML title text over an Ideogram-generated, text-stripped base image. It's already mode-aware (the scrim adapts to light/dark/vibrant). The reader uses it directly — passes `src` (chapter banner image), `title` (chapter title), `eyebrow` (e.g., "Chapter 03 · Venture Workflows"), and optionally `subtitle` (the chapter lede).

**Banner image generation** for chapters reuses the same Ideogram pipeline already in `scripts/generate-changelog-banners.ts`. Add a sister script `scripts/generate-chapter-banners.ts` that walks any content collection with an `image_prompt` field and an optional `image:` field, generates if missing, writes the resolved image path back to frontmatter. (Or generalize the existing script to take a path argument.)

## ContentPreviewNavCard (new)

Visual echo of `AreasOfVentureGrid` cards — same card surface tokens (`--fx-card-bg`, `--fx-card-border`, hover treatment), same number-in-corner motif, same lede + tags. Differences:

- Smaller default size (~280px max-width on desktop; collapses to ~64px chevron-only on mobile)
- Auto-truncation of `lede` and `tags` arrays so the card never exceeds the height of the banner it sits beside (CSS `max-height` + `overflow: hidden` + `-webkit-line-clamp` for the lede)
- Direction-aware affordance: the prev card has a `‹` icon top-left; the next card has a `›` icon top-right
- Whole card is a single `<a>` so the entire surface is clickable (not just the title)

Auto-truncation strategy: pure CSS with `-webkit-line-clamp` is the pragmatic floor (works in all modern browsers, degrades gracefully). If a card's lede is two lines + a row of tags + the title, that's already roughly banner-height on desktop. The card's `max-height` matches the banner's known height (passed as a CSS custom property at the layout level, e.g. `--banner-height: 280px`).

Props sketch:

```ts
export interface Props {
  direction: 'prev' | 'next';
  number: number;
  title: string;
  lede: string;
  tags?: string[];
  href: string;
  /** Optional max-height override; defaults to var(--banner-height). */
  maxHeight?: string;
  /** Number of lines to clamp the lede at; defaults to 4 desktop / 3 half-screen / 2 tablet / 0 mobile (chevron-only). */
  ledeLineClamp?: number;
}
```

## Mobile ToC (port from Lossless Group)

Pattern, summarized:

1. Sticky bar pinned just below the site header, spanning full width, ~36px tall.
2. By default shows: `▾ Currently: <text of the H2 the user is in>`. Updates on scroll via IntersectionObserver watching all chapter H2s.
3. On tap: the bar expands into a full-screen overlay (or a slide-down panel) showing every H2 + H3 in the chapter as a tappable list.
4. Tapping a row: smooth-scrolls to that heading using `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`, with `scroll-margin-top` on each heading set to clear the sticky header + ToC bar.
5. `prefers-reduced-motion: reduce` disables smooth scrolling.

Implementation: ~60 LOC vanilla TypeScript module, imported once in `BookReaderLayout`. No framework, no Svelte island. Heading IDs come from LFM's heading-slug remark plugin (a wishlist feature this spec depends on — see [[context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package]]).

**Source to port from**: `lossless-group/site` (path TBD — find the existing implementation in the next session and copy/adapt). If the Lossless Group implementation is more complex than needed, simplify ruthlessly.

## SwipeNavigator (new, mobile)

Lightweight touch-event wrapper around the article body element. Detects horizontal swipes (threshold ~80px, vertical-component must stay under ~30% of horizontal to ignore vertical scrolling). On swipe-left → navigate to next chapter. On swipe-right → previous.

Conflicts to handle:

- **Vertical scrolling must always work.** The handler ignores any swipe whose vertical component exceeds 30% of horizontal.
- **Pinch-zoom on images must not trigger.** Touch with `touches.length > 1` is ignored.
- **Selecting text must not trigger.** If `getSelection().toString().length > 0` at swipe-end, ignore.
- **Code blocks have horizontal overflow.** Wrap code blocks in a container with `touch-action: pan-x` so internal horizontal scroll wins over the page-level swipe.

View transitions: if the browser supports them and `prefers-reduced-motion` is not set, wrap the navigation in `document.startViewTransition()` so the chapter swap animates as a horizontal slide. Falls back to plain navigation otherwise.

## Reading progress + reading time

- **Reading time**: computed at build time from word count. Standard formula: `Math.ceil(words / 220)` minutes (220 wpm is the long-tail-validated average for adult readers of online prose). Stored in the chapter's frontmatter as `reading_time_minutes` after a build script runs, OR computed inline at render time (probably the latter — avoids touching files).
- **Reading progress**: thin (~3px) top-of-viewport stripe. Width tracks scroll position relative to the article body's bounding rect, NOT the viewport (so the bar reaches 100% when the user has scrolled past the last paragraph, not when they hit the bottom of the page including the prev/next cards). Uses CSS variables + a `requestAnimationFrame`-throttled scroll listener.
- Color tracks `--color-primary` for visual cohesion.

## Chapter meta block

Slim, code-font, low-contrast row immediately below the banner:

```
Chapter 03 · 12 min read · Michael Staton · Updated 2026-04-26 · 5,420 words
```

Fields are conditional — if `reading_time_minutes` isn't computable (no body), it's omitted. `Updated` shows the more recent of `date_modified` or `date_published`.

## Save my place

`localStorage` per book. Key: `lf-book:${bookSlug}:place`. Value: `{ chapter_number, scroll_y, updated_at }`. Updated throttled to once per 2 seconds while scrolling.

On the book index page: if a place exists for this book, render a "Continue reading" banner at the top of the chapter list, with a button that links directly to the chapter and triggers a scroll restoration on load.

Privacy: never sent to a server; opt-out via a "Forget my place" link in the footer of the book index page. Per the existing `/privacy` policy, this is local-only state and doesn't require disclosure beyond the catch-all "we may use localStorage for UI preferences" line — but adding a specific bullet wouldn't hurt.

## Section-Specific & Quote Sharing

This is one of the highest-leverage features in the spec, even though it's not the most visually obvious. The thesis: **most long-form readers treat "share" as a chapter-level action and miss the bulk of organic distribution.** People share *the part* of a piece that hit them — a sentence, a paragraph, a heading — to one or two specific people in iMessage / Signal / WhatsApp / DM. Section + quote shares are what actually get sent. We design for that motion explicitly.

### Why URL fragments alone don't work

The intuitive URL for "share this section" is:

```
/read/venture-handbook/strategy-development#anchor-lp-outreach
```

Browser-native, scrolls to the heading on load, no JS required. Fine for someone *clicking* the link. **But it does not work for OG metadata overrides** — the `#anchor` portion is never sent to the server. When iMessage / Slack / Twitter / Bluesky / an LLM fetches the URL to build the unfurl card, they see only `/read/venture-handbook/strategy-development` and read the chapter-level `<meta>` tags. Result: the rich preview shows the chapter title and chapter description, not the section the sender wanted to highlight. Defeats the whole purpose.

To make the OG card reflect the section, the section identifier has to live in a part of the URL the server sees: a query param or a path segment. We use query params.

### URL conventions

Section share:
```
/read/venture-handbook/strategy-development?h=anchor-lp-outreach
```

Quote share (quote URL-encoded):
```
/read/venture-handbook/strategy-development?q=One+notable+fund+had+over+700+meetings
```

Combined — the most common form generated by the quote-share button (quote AND its enclosing section, so the server can show "in section X" context):
```
/read/venture-handbook/strategy-development?h=foundations&q=One+notable+fund+had+over+700+meetings
```

For browsers that support [W3C Text Fragments](https://wicg.github.io/scroll-to-text-fragment/) (Chrome / Edge / Safari 16.4+), the share-button output also appends a `#:~:text=...` fragment so the browser natively scrolls to and highlights the quote without us writing any JS:
```
/read/venture-handbook/strategy-development?h=foundations&q=One+notable+fund+had+over+700+meetings#:~:text=One%20notable%20fund%20had%20over%20700%20meetings
```

The query params drive the unfurl card; the text fragment drives the in-browser highlight. Both pointing at the same content keeps the URL self-consistent and safely degrades — non-supporting browsers ignore the `#:~:text=` part and we fall back to JS-driven scroll + highlight.

Plain `#anchor` permalinks are still emitted for in-page navigation (every heading has an anchor link icon on hover) — `?h=` URLs are specifically what the share button produces.

### OG metadata override (server-side mechanic)

This requires server rendering for the share URLs. Two options:

1. **SSR every chapter page** (`prerender = false`). Server reads `?h=` / `?q=` on each request, generates section-specific `<meta>` tags. Simplest to reason about; loses CDN caching for the bare chapter URL.
2. **Keep chapter pages prerendered; route share URLs through a separate SSR endpoint** at `/share/[book]/[chapter]?h=...&q=...` that renders the chapter HTML with custom OG meta in the `<head>`. The share buttons emit `/share/...` URLs; normal navigation uses the prerendered chapter URL. Preserves edge caching for the common case.

**Recommended: option 2.** The `/share/...` endpoint is a thin Astro server route that:

1. Loads the chapter content collection entry (read-only).
2. Resolves `?h=<slug>` to the matching heading text + ~200 chars of following body.
3. Resolves `?q=<text>` to the literal quote (truncated to ~280 chars for the OG description).
4. Renders the same `BookReaderLayout` template with overridden `og:title` / `og:description` props; `og:image` stays the chapter banner.
5. Sets `Cache-Control: public, max-age=300, s-maxage=86400` so common share URLs still cache at the edge.

OG override rules (in priority order):

| Inputs present | `og:title` | `og:description` |
|---|---|---|
| `?h=` and `?q=` | `"<quote excerpt>" — <heading>` | first ~200 chars of the quote |
| `?h=` only | `<heading text>` | first ~200 chars of the section body |
| `?q=` only | `"<quote excerpt>" — <chapter title>` | first ~200 chars of the quote |
| neither | chapter title (default) | chapter lede / summary (default) |

`og:image` stays the chapter banner in all cases. We don't try to render per-quote OG images dynamically — the chapter banner provides enough visual identity, and per-quote image rendering is a rabbit hole that doesn't compound.

### Landing behavior (client-side)

When the page loads (whether via `/share/...` or via direct chapter URL with query params):

1. If `?h=<slug>` present → wait for layout, then `document.getElementById(slug).scrollIntoView({ behavior: 'smooth', block: 'start' })`. The heading already has `scroll-margin-top` set to clear the sticky header + ToC bar, so the scroll lands cleanly under the chrome.
2. If `?q=<text>` present → use the Text Fragment URL (already constructed by the share button) to let the browser do the work natively. For browsers without Text Fragments support: JS fallback uses `window.find(decodeURIComponent(q))` then scrolls to the selection.
3. If both → quote highlight wins for visual emphasis; the section anchor sets the initial scroll position before the highlight refines it.
4. `prefers-reduced-motion: reduce` → instant scroll, no smooth animation.

`/share/...` URLs that successfully resolve a section-or-quote should `history.replaceState` to the canonical chapter URL with the same `?h=` / `?q=` params, so refreshes still work and the URL bar shows the friendlier form.

### LFM dependencies

Shared with the ToC work — no net-new remark plugins:

- **`remark-heading-slugs`** (already in yak-shaving) — required for stable section identifiers (used by `?h=`).
- **A heading-to-text-excerpt index built at content load time** — for each heading in each chapter, capture the first ~200 chars of body content following it. Used by the `/share/...` endpoint to build `og:description` for `?h=`-only URLs. Lives either in a build-time generated JSON map next to the chapter, OR computed on the fly inside the share endpoint (probably the latter — chapter MDAST is already in memory).

The quote-share button itself is pure DOM: `window.getSelection().toString()` on `mouseup` / `touchend` inside the article body, with a small selection-stable timer to avoid flicker.

### Privacy + abuse considerations

- Quotes are arbitrary user input that ends up in our HTML when rendered as OG meta. **Server MUST escape the quote before injecting into `<meta content="...">`** to prevent attribute injection. Use Astro's standard escaping; do not concatenate by hand.
- Quote length capped at 1000 characters in the URL (well above any reasonable highlight) to prevent absurd URLs and OG payloads.
- Optional and probably unnecessary at our scale: a denylist of substrings (slurs, etc.) that won't be rendered into OG meta, falling back to the chapter default. Revisit if it ever becomes a real problem.
- The share URLs themselves contain quoted content from the page — by design. They're not personal data; they're public quotes from a published book. Worth one line in `/privacy` so it's not surprising.

## Schema additions for content collection

Update `src/content.config.ts` to register the long-form collection. Schema fields beyond what's already in the scaffolded files:

```ts
const ventureWorkflows = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/long-form/venture-workflows' }),
  schema: z.object({
    chapter_number:                z.number(),
    title:                         z.string(),
    lede:                          z.string(),
    tags:                          z.array(z.string()).optional(),
    subsection_outline:            z.array(z.string()).optional(),

    published:                     z.boolean().default(false),
    date_authored:                 z.coerce.date().optional(),
    date_published:                z.coerce.date().nullable().optional(),
    date_modified:                 z.coerce.date().nullable().optional(),

    source_publication:            z.string().optional(),
    source_organization:           z.string().optional(),
    source_chapter_number:         z.number().optional(),
    source_chapter_title_original: z.string().optional(),

    // New for the reader
    chapter_eyebrow:               z.string().optional(),  // e.g., "Venture Workflows · Areas of Venture"
    hero_image:                    z.string().optional(),  // path under /public/read/[book]/
    hero_image_prompt:             z.string().optional(),  // input to the chapter banner generator
    og_image:                      z.string().optional(),  // overrides hero_image for social cards
    summary:                       z.string().optional(),  // longer-than-lede description for OG/meta
    contributors:                  z.array(z.string()).optional(),  // beyond the primary author
    language:                      z.string().default('en'),
  }),
});
```

The new fields are all optional — existing scaffolded files don't need to be touched until each chapter is genuinely ready to publish.

## Performance budget

- Above-fold delivery: HTML + critical CSS + banner image (≤ 80KB compressed for the banner, lazy-load anything below the fold).
- Total page weight target: < 200KB excluding the banner image.
- JS budget: < 15KB compressed for the entire reader (mobile ToC + swipe + progress bar combined). Vanilla TS, no framework.
- LCP: banner image. Preload the banner image via `<link rel="preload" as="image">`.
- CLS: zero. All component dimensions known at render time (chapter meta is fixed-height, banner is aspect-ratio-locked, ToC bar reserves its own space).

## Accessibility checklist

| Area | Requirement |
|---|---|
| Landmarks | `<main>` for content, `<nav aria-label="Chapter contents">` for ToC, `<nav aria-label="Chapter navigation">` for prev/next |
| Skip link | "Skip to chapter content" — first focusable element on the page |
| Focus order | Header → skip link → prev/banner/next triptych → chapter body → ToC sidebar (desktop) → footer |
| Active heading | `aria-current="location"` on the ToC row matching the current section |
| Banner overlay | Title text contrast ≥ 4.5:1 in all three modes against the scrim |
| Reduced motion | `prefers-reduced-motion: reduce` disables: swipe transition, view transitions, smooth scroll, reading-progress animation tween |
| Screen reader | Banner image's `alt` is the chapter eyebrow + title, NOT the title alone (avoids redundant announcement with the H1 below it) |
| Keyboard | Arrow keys (← →) for prev/next; Home/End to jump to chapter top/bottom; `[` `]` as alternates; `?` opens a small keyboard-shortcuts overlay |
| Color | Reading-progress bar and ToC active-state both use `--color-primary` — never depend on color alone (active ToC row also has a left border) |

---

# Acceptance Criteria

## v0.1 — Single chapter renders end-to-end

- A single chapter at `/read/venture-handbook/[slug]/` renders with: banner, chapter meta, body via LFM, footnotes via LFM Sources component
- `BookReaderLayout` exists and wraps `BaseThemeLayout`
- Content collection registered in `src/content.config.ts` with the v0.1 schema additions
- Chapter banner image generation script in place, runs as part of `pnpm build` if needed
- Lighthouse Performance ≥ 95 on a mobile emulator for the chapter page
- Works with JS disabled (no swipe nav yet, no auto-swapping ToC, but body and links work)
- Registered in `/design-system` with a live-rendered chapter snippet

## v0.2 — Multi-chapter sequencing

- Book index page at `/read/venture-handbook/` lists all chapters as `AreasOfVentureGrid`-style cards (reuse the existing component or thin wrapper)
- `ContentPreviewNavCard` component built; appears in the top triptych (desktop) flanking the banner
- Same preview cards appear at chapter end (full-fidelity, both breakpoints)
- Sequencing is fully driven by `chapter_number` frontmatter
- Keyboard shortcuts (← →) work for prev/next
- Mobile ToC bar (sticky, current-heading display, expandable) ported from Lossless Group
- Desktop ToC sidebar with active-section highlighting via IntersectionObserver
- All headings have anchor links (clickable `#` icon on hover, copies deep-link URL)
- `SectionShareButton` per heading (`↗` icon) emits `?h=<slug>` share URLs (clipboard on desktop, native share sheet on mobile)
- `/share/[book]/[chapter]` SSR endpoint live; returns the chapter HTML with OG meta overridden when `?h=` is present (heading text → `og:title`, first ~200 chars of section → `og:description`, chapter banner preserved as `og:image`)
- Section-share URLs land cleanly at the heading on first paint, accounting for sticky header / ToC bar via `scroll-margin-top`

## v0.3 — Mobile polish + place-holding + quote sharing

- `SwipeNavigator` ships; horizontal swipe in the body navigates prev/next
- View transitions wired (`document.startViewTransition` where supported)
- Save-my-place via `localStorage`, surfaced as a "Continue reading" banner on the book index
- Print stylesheet polished (single chapter prints cleanly)
- Reading progress bar
- "Forget my place" link in book footer
- Keyboard shortcuts overlay (`?` opens it)
- `QuoteShareTooltip` ships — text selection in the article body surfaces a "Share quote" pill; click emits `?q=<encoded>&h=<section>` URL with combined `#:~:text=` fragment for native browser highlighting in supporting browsers; JS fallback (`window.find` + scroll) for the rest
- `/share/...` endpoint extended to handle `?q=` (quote excerpt → `og:title` and `og:description`), with attribute-injection-safe escaping and 1000-char quote cap
- Full a11y pass complete; WCAG 2.2 AA verified

---

# Exploration Summary

This spec is downstream of a four-option discussion appended to [[context-v/prompts/Discuss-how-to-Publish-Long-Form-like-eBook]]. The decision to "wing it with LFM" rather than adopt Astro Starlight, mdBook, or Quartz was made on three grounds:

1. **Brand cohesion** — same theme/mode toggle, same fonts, same surface tokens as the rest of FullStack VC. The book IS the dojo's library, not an annex.
2. **Pipeline ownership** — LFM already handles GFM, directives, callouts, and citations. The wishlist features a longform piece needs (image directive, heading slugs, wikilinks) are exactly the features mpstaton-site, twf-site, and others would also benefit from. Building them here is a forcing function with monorepo-wide compounding.
3. **Cheap chapter chrome** — prev/next, ToC, chapter numbering are 50–100 LOC of Astro on top of a content collection. Not a project, an afternoon.

Trade-off accepted: we own the navigation correctness ourselves rather than inheriting it from a framework.

---

# Yak Shaving

Things this spec depends on that are not yet in `@lossless-group/lfm`. Each is small enough to ship incrementally:

1. **`remark-heading-slugs`** — every heading in the rendered output needs a stable, predictable `id`. The mobile ToC and the anchor-link-on-hover both depend on this. Probably wraps `github-slugger` and `mdast-util-to-string`. ~30 LOC.
2. **`remark-image-directive`** — `:::image{src="..." alt="..." caption="..." credit="..." width="..."}` rendering as a `<figure>` with proper semantics. Replaces the `![][image1]` Google-Doc-export style inline. The venture Handbook has ~25 images that need a one-time content-fixup script to migrate.
3. **`remark-toc-extract`** — produces a per-document table of contents AST that the reader's ToC components can consume directly, instead of re-walking the rendered HTML.
4. **(Stretch) `remark-wikilinks`** — `[[Other Chapter#Section]]` cross-chapter linking. Useful for the venture Handbook (chapters reference each other) but not required for v0.1.

Sequence: heading-slugs first (unblocks ToC + anchor links), then image-directive (lets us migrate the venture content), then toc-extract (cleans up the ToC implementation), then wikilinks (nice-to-have).

Other yak shaves:

5. **Banner image generation script generalization.** `scripts/generate-changelog-banners.ts` is hardcoded to walk `changelog/`. Either add a `scripts/generate-chapter-banners.ts` sibling or generalize the existing script to take a path + frontmatter-key argument.
6. **One-time content-fixup script** for the venture Handbook source: unzip the bundled assets, drop them in `public/read/venture-handbook/`, rewrite all `![][imageN]` references to either `:::image{src=…}` directives or plain markdown image references with stable filenames.
7. **Editorial pass per chapter.** The 2016-era references read as historical now. Decision per chapter: light editorial update, or "living draft" honesty preserved with a date header? Move this question into a per-chapter triage doc.

---

# Open Questions

1. **Top-level nav placement.** Does the library get its own header nav item ("Library"), or live under "Dojo"? Probably the former, but worth deciding before v0.2.
2. ~~**Route naming.**~~ **RESOLVED**: `/read/[book]/[chapter]/` for the canonical reading URL, `/share/[book]/[chapter]?h=…&q=…` for OG-override share URLs. Rationale: short, verb-clear, SEO-friendly. `/library/...` was rejected as redundant for the volume of content at our scale; `/library/read/...` was rejected as doubly nested. Disk organization stays free to nest deeply (e.g., `src/content/library/books/venture-handbook/`) — the `routes.ts` mapping bridges disk → URL.
3. **Foreword + appendix handling.** The venture Handbook has an introductory "New Models of Venture Capital" section and a "Perspectives" appendix that don't fit the 1-10 chapter sequence. Options: file them as `00-` and `99-` prefixed entries in the same collection (filter by `chapter_number` for the main list), or as a separate collection. Probably the former.
4. **Authentication.** Is the venture Handbook public-readable, or behind the Kauffman Fellows OAuth gate that powers `/stack/me`? My instinct: public. But this is content the user produced inside Kauffman, so the call may not be ours alone.
5. **Search.** Out of scope for v0.1–v0.3. Pagefind is the obvious answer when we add it (zero-runtime, builds against the static output). Add a future-version section.
6. **Shareable highlights.** Medium-style "share this paragraph" affordance. Cool but adds complexity. Punt to v0.4+.
7. **Multilingual.** Several Fellows are non-native English speakers. Translation isn't on the roadmap, but the schema includes a `language` field per chapter so future translations can be discovered without a migration.
8. **Comments / annotations.** Hypothesis-style or hard-pass? Strong hard-pass instinct — adds a third-party JS dependency, moderation burden, hosting concerns. If we want Fellow conversation, point them to the dojo's webinars and Discord.
9. **PDF export per chapter.** Print stylesheet handles this for free; do we want a "Download PDF" button anyway? Probably yes for the academic-feel; can use `window.print()` as a launchpad.
10. **Per-card height calculation.** `ContentPreviewNavCard`'s "auto-truncate to banner height" depends on knowing the banner's height. CSS-only via `--banner-height` custom prop is the simplest path; JS-measured is more accurate but adds a layout-thrash risk. Start with CSS-only and a fixed banner aspect ratio.

---

# Future Plans

- **Search**: Pagefind integration once we have 2+ books to search across.
- **Cross-book linking**: `[[Other-Book#Chapter]]` once `remark-wikilinks` exists.
- **Sidenotes**: Tufte-style margin notes via `:::sidenote` LFM directive. Major typographic upgrade for desktop reading; collapses to inline footnotes on mobile.
- **Citation popovers**: Hover on a footnote reference reveals the source inline without scrolling. Sits in LFM, not the wrapper.
- **Audio companion**: per-chapter audio file linked in the chapter meta block. Frontmatter field, no audio player UI in v1 (just a download link).
- **Annotation export**: if save-my-place works, the next step is highlight-and-export — let a Fellow build a personal "favorite quotes" doc from a book over many sessions, exported as markdown.
- **Reader analytics (opt-in)**: anonymous, locally-aggregated reading-completion stats. "Of the people who started chapter 3, 67% finished it." Strictly opt-in, never per-user, never sent to a server until the user explicitly chooses to share.
- **Graduate components to `packages/lfm-astro/components/`**: once the four reader components are battle-tested in FullStack VC, copy them into the LFM-Astro pattern source so mpstaton-site and others can adopt.
