---
site_uuid: 3133b61c-72c8-4115-9490-41cf4e004705
hex_code: kspslg
title: "Include Full Search as a Default"
lede: >-
  Search ships from the first build via `astro-pagefind`, not at some size threshold. Seven surfaces have it; fifteen do not.
summary: "Specifies Pagefind full-text search as standard equipment on every Astro Knots site, records the exact integration recipe the seven adopting surfaces share, marks the content with the four `data-pagefind-*` attributes, and inventories the fifteen surfaces still missing it. Read when scaffolding a new site, when adding search to an existing one, or when deciding whether a site is 'big enough' to need search — it isn't a size question."
status: Partially-Shipped
category: Specification
publish: true
date_created: 2025-03-03
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
tags:
  - Spec
  - Search
  - Pagefind
  - Astro
  - Astro-Knots
  - Site-Defaults
---

# Include Full Search as a Default

## The rule

**Every Astro Knots site ships full-text search from its first build.** Search is
standard equipment, not a milestone. A four-page splash gets it for the same
reason a 700-page one does: the cost is a dependency and one line of config, and
retrofitting it later means going back through every template to add content
markers.

## Why Pagefind specifically

- **No service, no index server, no API key.** Pagefind builds a static index at
  build time and queries it client-side from the published output. A GitHub-Pages
  splash can have real search with nothing behind it.
- **It indexes the built HTML, not the source.** So it searches whatever actually
  rendered — including content pulled in from roll-ups and generated collections,
  which a source-scanning indexer would miss.
- **It scales to the sizes we actually have.** Verified 2026-08-17: 712 pages on
  `ai-labs/splash`, 287 on `augment-it/splash`, 7 on `flave-ai/splash`. Same
  config at both ends.

## The recipe

All seven adopting surfaces use the **`astro-pagefind` integration**, not the
Pagefind CLI. Match this — do not add `&& pagefind --site dist` to the build script.

```js
// astro.config.mjs
import pagefind from 'astro-pagefind';

export default defineConfig({
  integrations: [
    // astro-pagefind runs Pagefind against `dist/` after `astro build` and copies
    // pagefind/* into the published output. Search runs entirely client-side.
    pagefind(),
  ],
});
```

```jsonc
// package.json — note the build script stays plain
"build": "astro build",
"devDependencies": { "pagefind": "^1.5.2" }
```

### Mark the content

The integration indexes nothing useful until templates say what to index. Four
attributes, all in active use:

| Attribute | Purpose |
|---|---|
| `data-pagefind-body` | the indexable region of a page — **without this, the page is not indexed at all** |
| `data-pagefind-filter` | a facet, e.g. `kind:Context`, `type:blueprints`, `tag:Astro` |
| `data-pagefind-meta` | metadata surfaced in a result, e.g. `title:…` |
| `data-pagefind-ignore` | exclude nav, chrome, footers — the most-used of the four, because unmarked chrome pollutes every single result |

Typical entry-page shape:

```astro
<main data-pagefind-body data-pagefind-meta={`title:${entry.data.title}`}>
  <span data-pagefind-filter="kind:Context" hidden></span>
  {entry.data.tags?.map((t) => <span data-pagefind-filter={`tag:${t}`} hidden></span>)}
```

## Current adoption — the spec is only partly kept

**Has it (7):** `ai-labs/splash` · `ai-labs/augment-it/splash` ·
`ai-labs/memopop-ai/apps/memopop-site` · `lfm/splash` ·
`ai-labs/id-didi-sh/splash` · `ai-labs/flave-ai/splash` ·
`ai-labs/context-vigilance-kit/splash`

**Missing it (15)** — no integration, no CLI, no `data-pagefind-*` markers anywhere:

- `astro-knots/splash` — **218 pages**, the largest gap
- `content-farm/splash` — **143 pages**
- `site`
- `astro-knots/sites/`: `fullstack-vc`, `mpstaton-site`, `lossless-changelog`,
  `arthouse-site`, `dark-matter`, `learnstart-site`, `twf_site`, `banner-site`,
  `cilantro-site`, `coglet-shuffle`, `cogs-site`, `hypernova-site`

The pattern is stark: **adoption tracks `ai-labs`, not `astro-knots`** — which is
backwards, given this spec lives in `astro-knots`. `astro-knots/splash` and
`content-farm/splash` are the two highest-value fixes.

## Gotchas

- **`prerender = false` pages are not indexed.** Pagefind reads `dist/`; an SSR
  route emits no HTML at build time. `mpstaton-site` produces **zero** static HTML
  files, so Pagefind would index nothing there as currently configured. An SSR site
  needs a different approach — this is the one place the default does not simply apply.
- **The search widget mints a random DOM id per build** (`search-iba5uok`, etc.),
  injected into the header of every page. Harmless at runtime, but it makes builds
  **non-deterministic**: two consecutive builds of untouched source differ on 100%
  of pages. Normalize `search-[a-z0-9]{5,}` before diffing build output, or a
  before/after comparison proves nothing. See
  [[Rule-to-Assure-Collection-Schema-is-Flexible]], which depends on such diffs.
- **Forgetting `data-pagefind-body` fails silently** — the build succeeds, Pagefind
  reports a lower page count, and nobody notices. Check the reported count against
  the built page count.

## Remaining work

1. Add the integration to `astro-knots/splash` and `content-farm/splash`.
2. Decide the SSR story for `mpstaton-site`.
3. Roll through `astro-knots/sites/*`.
4. Consider promoting the config + marked-up layout into the shared splash
   scaffold so new sites inherit it rather than copying it.

## Related

- The `maintain-splash-pages` skill — the splash scaffold this should be folded into
- [[Rule-to-Assure-Collection-Schema-is-Flexible]] — the build-diff caveat above
