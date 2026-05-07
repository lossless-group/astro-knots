---
title: Implementing Full-Text Search by Default
lede: Every Astro Knots site should ship with full-text search out of the box. This is a tour of what that costs, why Pagefind (a Rust-powered static indexer) is the strong default, and what the runner-up libraries are for the cases where it isn't.
date_authored_initial_draft: "2026-05-06"
date_authored_current_draft: "2026-05-06"
date_created: "2026-05-06"
date_modified: "2026-05-06"
at_semantic_version: "0.0.0.1"
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Explorations
tags: [Full-Text-Search, Pagefind, Rust, Astro, Static-Sites, Search-UX, Vercel-Constraints, Pseudomonorepo, Copy-Pattern, New-Site-Quickstart]
authors:
  - Michael Staton
  - AI Labs Team
---

# Implementing Full-Text Search by Default

### UI Goal
Search by:
- Tag
- Filename
- Text fuzzy matches

Backlink UI

## The Problem This Document Solves

A reader lands on a Lossless site and wants to find the one paragraph that mentions "remark-callouts" or "two-tier tokens" or "calmstorm." Today, on most of our sites, that reader has two options: scroll, or open a new tab and Google `site:lossless.group remark-callouts`. The first is annoying, the second is a tiny abandonment surface that we hand to a third party every time it happens.

The motion we want is: **press `/`, type, see results, hit enter.** No backend. No paid service. No build pipeline our clients can't redeploy on their own. Just a small input box at the top of every site that returns the right page, fast, with the matching phrase already highlighted.

This is the kind of feature where "by default" matters more than "best in class." A search box that ships with every new site — even a slightly imperfect one — beats a perfect search box that we keep meaning to add. So this exploration is less about ranking algorithms and more about: **what's the cheapest, most copy-pattern-friendly way to make search a non-decision when scaffolding a new Knots site?**

The galaxy package in the parent monorepo (`packages/galaxy/`) already wired up Pagefind — the Rust-powered static search indexer — and has been running it through `astro build && pagefind --site dist`. None of the sites in `astro-knots/sites/*` have search yet. This is the moment to either codify galaxy's choice as the default, or replace it before it spreads.

---

## The Mental Model: Three Shapes of Static-Site Search

Before comparing libraries, it helps to separate the three shapes that "search on a static site" can take. Most of the disagreements about which library is "best" are actually disagreements about which shape you're solving for.

### 1. Build-time index, client-side query

A tool runs at build time, crawls the built HTML in `dist/`, extracts text, and emits a static **index** (JSON or a binary format) plus a small **runtime** (JS or WASM) that loads the index in the browser and answers queries locally. **No server. No API key. The index ships with the site.** This is what Pagefind does. It's also what you can hand-build with Lunr or MiniSearch by exporting a JSON index from a build script.

### 2. In-memory client-side index

You ship the searchable content **as data** (JSON of all your posts/tools/whatever) inside the page bundle, and a JS library indexes it on page load. Fuse.js is the canonical example. **Trivially simple, no build step beyond getting the JSON to the browser, but the index is rebuilt in every visitor's browser on every visit, and you ship the full content as JS.** Fine for a tools list with 60 items. Painful past a few hundred.

### 3. Hosted / self-hosted search service

You run (or pay for) a service like Algolia, Typesense, or Meilisearch. It indexes your content via an API and answers queries via an API. **Best ranking, best typo tolerance, real analytics — and an external dependency, an API key, a billing relationship, and an extra system the client has to deploy or pay for.**

For Astro Knots specifically, **shape #1 is almost always the right answer**, with shape #2 as a fallback for tiny sites where the index doesn't even need to be a separate file. Shape #3 is overkill for any site we currently maintain and conflicts with the "each site must deploy independently" constraint baked into the pseudomonorepo (see `~/code/lossless-monorepo/astro-knots/CLAUDE.md` § *Critical Constraint*).

---

## Why Pagefind Is the Strong Default

Pagefind is a static-site search library written in Rust. The author is Liam Bigelow. It compiled to ~95KB of WASM at the time galaxy adopted it, and the project has gone through steady, non-flashy releases since 2022. The pitch: **point it at your built `dist/` directory after `astro build`, and it produces a sharded index plus a WASM runtime**. The browser only downloads the index shards it needs to answer the current query — typically tens of KB, not megabytes.

The properties that make it the right default for our shape:

**It indexes the built HTML, not your source.** This means it works for *every* page Astro produces — content collections, MDX, hand-written pages, dynamically generated routes — without any per-source-type configuration. New page in the site? It's searchable on the next build. No schema, no frontmatter contract, no "remember to add this to the index."

**The index is sharded and lazy-loaded.** A 10,000-page site doesn't ship a 100MB JSON to every visitor on first paint. The runtime fetches index slices on demand as the user types. This is the property that makes it scale past Fuse.js's natural ceiling.

**It ships a default UI you can ignore or replace.** `@pagefind/default-ui` is a drop-in modal with results, highlighting, and keyboard navigation. It's fine. It's also trivially replaceable — Pagefind exposes a clean JS API (`pagefind.search("query")`) that returns ranked results with excerpts, so you can build any UI you want over it without forking the library.

**It respects HTML semantics for ranking.** `<h1>` weights more than `<p>`. `data-pagefind-body` lets you mark the searchable region of a layout. `data-pagefind-meta` lets you attach filterable fields (author, category, date) without a separate config file. The site's HTML *is* the schema.

**The deployment story is boring, which is the point.** It runs as a CLI in the build script. Vercel runs the build script. Vercel serves the static output. Our `package.json` already has the pattern — galaxy's `"build": "astro build && pagefind --site dist"` is exactly what each site needs. No new deploy targets, no env vars, no auth tokens.

**The Rust angle is a feature, not a flex.** The reason this works at all is that crawling, tokenizing, and building a sharded postings list for thousands of HTML files in a few hundred milliseconds is *exactly* the kind of CPU-bound, allocation-heavy work where a Rust binary trounces a JS equivalent. Lunr-the-JS-library would be slow at this; Pagefind-the-Rust-binary isn't. We benefit from the speed without writing a line of Rust ourselves.

---

## The Honest Cons

Three real ones, worth naming so we don't pretend Pagefind is unconditional.

**It indexes the *built* output, which means SSR-only routes don't get indexed.** Every Knots site is currently `output: 'static'` (or close to it), so this isn't biting us today. If a future site needs real SSR for some routes, those pages won't be in the index unless we pre-render them or feed Pagefind a separate manifest. Not blocking; worth flagging in the blueprint.

**It's a static index, so freshness equals build cadence.** A site that publishes content via Keystatic and rebuilds on every commit gets near-real-time freshness. A site with hand-edited content that rebuilds weekly has weekly-fresh search. For our cadence (most sites are content-collection-driven and rebuild on git push), this is fine.

**Multilingual ranking is good but not Algolia-good.** Pagefind has language detection, stemming for many languages, and a per-language index. It is not a tuned Elasticsearch deployment. None of our current sites need that level of ranking sophistication, and the day one does, we should reach for a real service rather than over-tune Pagefind.

---

## The Alternatives, Briefly

### Fuse.js — Right for tiny sites, wrong as a default

Fuzzy-matching JS library. Loads your data array in memory, no build step, no index files. Excellent for a single-page "search 60 tools" UX where the data is already on the client anyway. Wrong for a multi-section site where indexing the entire content corpus in the browser would mean shipping it all as JS. **Keep in mind for component-level filters, not site-level search.**

### MiniSearch — The "I want full control" option

Pure-JS full-text engine. You write a build script that walks your content collections, builds an index, serializes it to JSON, and the client loads it. More work than Pagefind, more flexibility if you have a non-HTML content shape (e.g., searching across structured records that aren't really pages). **The tradeoff: you've now written and now maintain a build script and a client integration that Pagefind would have given you for free.**

### Lunr — Skip

Older, JS-based, was the default for Jekyll/Eleventy templates for years. The community has largely moved to Pagefind or MiniSearch. Index files are bigger than Pagefind's, performance is JS-bound, and there's no compelling reason to choose it new today.

### Orama — Interesting, not yet a default

Newer JS engine, supports both lexical (BM25) and vector search out of the same index, and has a cloud offering. The vector angle is genuinely cool — embed your content once and you get semantic search alongside keyword search. **The cost: you're now thinking about embedding models, embedding APIs, and storage of vector data.** Right answer for a future site that genuinely needs semantic search ("show me posts about *the feeling of being late*"). Wrong default for the next site we scaffold this month.

### Algolia / Typesense / Meilisearch — The hosted-service tier

All real, all good, all wrong for our default. Algolia is paid (free tier exists, has hard limits). Typesense and Meilisearch are open source but require running a server somewhere. Each one breaks the "site deploys independently from its own repo with no shared infrastructure" constraint. **Reach for these when a specific client says "we need analytics on what users are searching for and the current ranking isn't good enough" — and then it becomes that client's infrastructure decision, not a default for the family.**

---

## What "By Default" Looks Like in Practice

To make this a non-decision for new sites, three things need to exist:

**1. A pattern reference, copy-and-adapt style.** A directory like `packages/lfm-astro/components/markdown/` that contains a canonical `SearchBar.astro` plus its small JS handler, and a one-paragraph note on where to put the build hook. The existing galaxy implementation (`packages/galaxy/src/components/Search/search-dialog/Dialog.astro` and friends) is most of this already — it just needs to be lifted out of galaxy's site-specific styling and parked in a pattern package. *Copy-pattern, not runtime dependency, per the Astro Knots philosophy.*

**2. A two-line addition to the new-site quickstart.** In `context-v/prompts/New-Site-Quickstart-Guide.md`, alongside the LFM step, a step that reads roughly:
   - `pnpm add -D pagefind @pagefind/default-ui`
   - Update `package.json` build script to `astro build && pagefind --site dist`
   - Copy `SearchBar.astro` from the pattern reference into `src/components/`
   - Mount it in the site's base layout

**3. A blueprint that explains the "why" once, so future agents and humans don't re-litigate.** A short `context-v/blueprints/Full-Text-Search-Pattern.md` that codifies: *we use Pagefind by default for static-site full-text search; here's the directory layout it produces; here's how to mark non-searchable regions with `data-pagefind-ignore`; here's when to escape to a hosted service.* This document becomes the spec input for that blueprint.

The work to actually ship this looks like: extract the galaxy components into a pattern package, write the blueprint, update the quickstart prompt, retrofit one or two existing sites (mpstaton-site is the obvious first target since it has the most context-v content and the worst current "find the thing" UX). Maybe a day of work, spread across two PRs.

---

## Tentative Direction

**Adopt Pagefind as the default search engine for all Astro Knots sites.** Lift the galaxy implementation into a pattern reference under `packages/` (or a new `packages/search/` if it grows), write the blueprint, and add the search step to the new-site quickstart prompt.

Keep Fuse.js in our peripheral vision for *component-level* filtering (a tools list, a glossary page) where the data is already client-side. Keep Orama on a watch list for the day a client asks for semantic search. Don't build for hosted services until a specific client has a specific reason.

This is still an exploration, not a decision. The unknowns I'd want to clear before promoting this to a spec:

- **How does Pagefind's WASM bundle interact with our Tailwind 4 + Astro 6 build? Any size or hydration surprises?** Galaxy is on Astro 5.7 — close, but worth checking on a current-stack site.
- **Does the default UI's mode contract (light/dark/vibrant per `theme-system`) play nicely with our two-tier tokens, or do we need to fork the UI?** Best-case it just inherits CSS variables.
- **What's the right keyboard shortcut?** `/` is standard, `cmd+k` is more modern, `cmd+/` is sometimes claimed by browsers. Worth a 30-second check across our sites' existing shortcuts.

## Outcome

(Pending. This exploration ends when either a) we write the spec + blueprint and start the migration, or b) we test Pagefind on one site and discover a blocker that pushes us toward MiniSearch or a hosted service.)

## Related

- [[blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]] — for the mode contract the search UI will inherit
- [[prompts/New-Site-Quickstart-Guide]] — the quickstart that should grow a "search" step
- [[specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing]] — context for why "find a passage in long content" matters on these sites
- `packages/galaxy/` (parent monorepo) — the existing Pagefind implementation we'd be lifting from
