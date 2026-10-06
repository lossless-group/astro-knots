---
type: Plans
title: "Plan: Build a Client Portals Site"
description: "Plan for client-portals-site, the third surface extracted from lossless-site: per-client portals read live from the content vault through Astro 7 live collections, purged on push with no rebuild, gated per client, with wikilinks routed back to lossless.group. Edviro is the first portal."
lede: >-
  The third surface pulled out of lossless-site: client work rendered straight
  from the vault, one signed cookie per client, every stray wikilink sent home
  to lossless.group.
publish: false
date_created: 2026-10-06
date_modified: 2026-10-06
date_authored_initial_draft: 2026-10-06
date_authored_current_draft: 2026-10-06
date_authored_final_draft:
authors:
  - Michael P. Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.3.0
status: Draft
category: Plans
tags:
  - Plan
  - Lossless-Site-Rebuild
  - Client-Surfaces
  - Access-Gating
  - Wikilinks
  - LFM
  - Live-Content-Collections
spec_reference: ""
related:
  - "[[Rethink-on-Client-Focused-Landing-Pages]]"
  - "[[Security-Overkill-for-Avoiding-Brand-Rank]]"
  - "[[Surface-Inventory-and-Open-Product-Questions]]"
  - "[[2026-08-03_Rebuild-Keep-Drop-Ledger]]"
  - "[[Wikilink-Resolution-System]]"
  - "[[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]]"
site_uuid: 9c930469-6e0d-47d3-9f61-16b844aca12f
hex_code: 8dgj56
---

# Plan: Build a Client Portals Site

> Carries out: no spec yet. This plan stands in for one. The intent comes from
> [[Rethink-on-Client-Focused-Landing-Pages]] in `lossless-site`.

> As a courtesy, this plan names no clients. Client folders are described by
> their shape ("a client with a `Recommendations/` folder").

## Why care?

Client portals in `lossless-site` are slow to make. One client touches three
namespaces that don't agree with each other:

- a MOC in `moc/`
- a folder in `client-content/`
- `for_clients:` tags

These are joined by a 60% word-overlap fuzzy match and by regex-parsed
`:::directive` blocks. Underneath all that, the old site's own exploration has
the right idea: personalization should feel like **a gift, not a portal**.

The changelog and the toolkit showed that a surface pulled into its own small
Astro Knots site is faster to work on than the same surface inside the monolith.
`client-portals-site` is the third extraction. Its goals, in order:

1. **Fast custom content, with no rebuilds.** Authors keep writing in the
   Obsidian vault (`lossless-content`). A pushed commit shows up on the live
   portal **within seconds, with no rebuild and no deploy**:
   - A GitHub webhook purges exactly the cached pages that the commit touched.
   - The page kind is inferred from where the file sits, so a new file needs no
     site-code change.
   - Content is read **file by file through the GitHub API** at request time,
     through Astro 7 live content collections. The site never mounts the vault
     as a submodule.

   A rebuild is needed only when we add a collection or change a collection's
   frontmatter handling, because those are code. See *Content delivery*.
2. **Wikilinks that work.** About 90% of the links in client content point at
   shared vault notes: concepts, vocabulary, tooling, organizations. Those pages
   live on lossless.group. The portal renders what it pulled in and routes
   everything else to the right lossless.group URL.
3. **Courteous privacy.** Client privacy here is a courtesy, not a contract. The
   threat model is the toolkit's: someone at the client's company finds our
   page in search for their own brand. So every portal is unlisted by default,
   with an optional per-client passcode for the more personal pages. Crawlers
   and LLMs are told plainly that the site is not for them.

## What the content actually looks like

The survey covered `content/` at `fece53c7` (2026-10-06), including
`content-areas` at `34eca16`. The numbers decide the page kinds.

- **`client-content/`**: 12 client folders and 118 files.
  - About 30 files are stubs of 10 words or fewer.
  - Only 23 files set `publish: true`, and none set `publish: false`.
  - The subfolder conventions are:
    - `Recommendations/`
    - `Portfolio/` and `Files/Portfolio/`
    - `Files/*_Memo.md` and deck analyses, with sibling PDFs
    - `Projects/` (nested workstreams with numbered files)
    - `Proposals/`
    - `Sources/` (org-unit and team-roster notes)
    - long root-level research reports
    - list files (`List.md`, pipelines)
    - `opengraph.json`, with hero copy and a CTA
    - `tool-gallery.yaml`
- **`moc/<Client>.md`**: 11 files. A MOC is **a curated reading list**: it is
  how Michael tags specific vault notes he wants a client to read. They are
  mostly configuration, with a little prose in a few of them.
  - `:::features` (9) switches portal sections on and off (`Reader`,
    `Projects`, `Recommendations`, `Portfolio`).
  - The reading-list directives are `:::vocabulary` (5), `:::concepts` (5),
    `:::portfolio` (4), `:::reader` (3), `:::tool-showcase` (1),
    `:::projects` (1) and `:::essays` (1).
  - Item shapes: 149 plain wikilinks, 2 `{ path: [[…]], title: "…" }`, and 1
    `tag: [[…]]`. At least one item has a stray trailing `- `.
  - The items point all over the shared vault: `concepts/`, `Vocabulary/`,
    `Tooling/…`, `essays/`, `lost-in-public/…`, `projects/`, and bare names.
- **`for_clients`**: 525 files across tooling (240), concepts (125), vocabulary
  (48), vertical-toolkits (33), content-areas (31) and others.
  - Values are Train-Case.
  - Some disagree with the folder names: one client's folder is spelled
    differently from its MOC and its tag, one tag value contains a space, and
    two values describe the same client.
- **Other client-facing material:**
  - `changelog--<client>/` is a delivery changelog.
  - `slides/<client>-*.md` holds client decks; the client is named only in the
    filename.
  - `content-areas/<Area>/` is effectively a client's reference library when
    its files carry that client's `for_clients` tag.
- **Wikilinks (a full census, 825 links in client-content and MOCs):**
  - 58% are path-style and 42% are bare names. 43% are aliased, 3% have
    anchors, and 20 are embeds (9 note transclusions).
  - **31% of path links have the wrong case** (`Tooling/` and `Vocabulary/`
    versus lowercase folders on disk), and some skip a parent folder.
  - They resolve into concepts 27%, tooling 25%, vocabulary 17%,
    client-content 11%, and the rest scattered. 8% don't resolve at all.

### The first client: Edviro (the active content work)

Content development is happening now for Edviro. Its shape differs from the
older clients, and it sets the defaults:

- **`client-content/Edviro/`** holds one file: a 4,650-word market scan
  (*Positioning in the Datacenter Multiverse*), which is a **report**. Its
  frontmatter carries only `date_created` and `date_modified`, with no title,
  so the title comes from the first H1.
- **There is no `moc/Edviro.md` and no `opengraph.json`.** The home page has to
  build itself from the registry and the content alone.
- **The client's real library is `content-areas/AI-Factories-Datacenters/`.**
  It holds 102 files (about 75k words): 86 `Organizations/`, 9 `Concepts/`, a
  `README.md`, and one stray root-level note. `Topics/`, `Issues/`,
  `Vocabulary/` and `Sources/` exist but are empty for now.
  - **Only about 18 of the 102 files carry `for_clients: [Edviro]`.** The
    "pull in only what is tagged" rule would drop most of the area, so a
    portal can take a whole area (`select: all`) rather than only tagged files
    (see the registry).
  - The `Organizations/` notes are profiles with a `url`, a `title`, and
    market-segment `tags` (for example `Operations-Software-DCIM-AI-Ops`).
    That is a natural grouping axis.
  - Many carry `publish: false`. **Portals ignore `publish`.** Being in the
    portal's registry is the publishing decision.
  - There are 387 wikilinks. The largest groups are vault-level `Sources/`
    (120), bare names (114), `content-areas/` paths (63), `concepts/` (39) and
    `Vocabulary/` (24). Two point into `client-content/`.

### Skipped by default (a loader denylist, overridable per portal)

- `Sources/*-Team/` notes. These are people with email addresses, which is PII.
- `Sources/` org-unit stubs (internal context).
- Files that are personal correspondence rather than deliverables (one exists
  in a `Projects/` folder today).
- PDFs.
- **Anything in another client's folder.** Some MOCs link into a different
  client's `client-content/`. Those links render as plain text.
- Stubs below a word threshold, and duplicate `.md` / `.mdx` twins.

## Page kinds

**The kind is inferred from the file's path.** A `kind:` frontmatter key
overrides it. Authors never have to declare anything, which is what makes this
fast. Each kind is one loose schema (see *Frontmatter*) and one component.

| Kind | Inferred from | Renders |
|---|---|---|
| **home** | `moc/<Client>.md` + `opengraph.json` | Hero (from `opengraph.json`, with a generated fallback when it is missing). Then one rail per MOC directive, with sections switched by `:::features`. The MOC directives are parsed **once, in the loader**, into JSON, and cached with the MOC. They are never regex-parsed in a component. **With no MOC** (Edviro), the home page is generated: the hero from `display_name`, then the client's reports, then one rail per pulled-in area folder. |
| **recommendation** | `Recommendations/**` | Article with a hero image if one exists, `![[Note#Heading]]` transclusion, `:::tool-showcase`, and footnotes. "Idea Bin" sections are hidden. |
| **memo** | `Files/*_Memo.md`, `*Deck-Analysis*` | Long-form with a TOC of numbered sections, a numeric `[^n]` citations panel, and tables. A natural candidate for the portal's `passcode` option. |
| **portfolio** | `Portfolio/**`, `Files/Portfolio/**`, MOC `:::portfolio` | Index of OG cards filterable by `portfolios` (fund). MOC-named tooling notes are pulled in, so the detail page renders the note's body, or just the card when the body is empty. |
| **report** | long root-level `.md` in the client folder | Numbered-section TOC, Perplexity `[!info]` callouts, hex `[^abc123]` citations, and a source library. |
| **project** | `Projects/**`, `changelog--<client>/` | Grouped by workstream folder in numeric order, with Vimeo/Loom embeds. The changelog is a dated sub-feed (Why Care? / What's New?). |
| **showcase** | list files, `tool-gallery.yaml`, `for_clients` hits in tooling and vertical-toolkits | Grouped card rails with OG data from the target notes. Each card links out (see routing). |
| **profile** | `content-areas/<Area>/Organizations/**` | Index of organization cards grouped by their market-segment `tags`, with OG data from `url`. Detail page renders the profile body. Edviro's 86 organizations are the first use. |
| **shelf** | MOC `:::reader`, `:::concepts`, `:::vocabulary`, `:::essays`, `:::tool-showcase`, `:::projects`, plus `content-areas/<Area>/{Concepts,Vocabulary,Topics,Issues}/**` | Glossary chips and reading cards. **Every note a MOC names is pulled in and rendered in the portal** (see *MOCs*), as are the area files the registry pulls in. Their own links go to lossless.group. |
| **deck** | `slides/<client>-*` | One slide per H1. Phase 5: it needs a `client` key added to the deck frontmatter first. |

**Adding a kind is one path rule, one schema and one component.** Nothing else
changes.

## Shape of the site

- **Repo:** its own **private** repo under `lossless-group` (decided
  2026-10-06: private keeps the options open for custom client content), mounted as
  `astro-knots/sites/client-portals-site`, with its own
  `pnpm-workspace.yaml` (not a workspace member). It **does not** mount
  `lossless-content` or `content-areas`. Content is read through the GitHub
  API at request time (see *Content delivery*).
- **Docs:** `README.md`, `changelog/`, `context-v/` (with `extra/` gitignored),
  `DESIGN.md`, and the astro-knots `/design-system` and `/brand-kit` pages.
  Both pages are gated and render test portals only.
- **Stack:** always the latest release of every dependency (see
  *Dependencies*). Astro 7 with `@astrojs/vercel` and `@astrojs/svelte`,
  Svelte 5, Tailwind 4, `@lossless-group/lfm` at latest from JSR (see
  *Dependencies*),
  the two-tier `theme.css` from the brand-layer extraction, and Bodoni Moda /
  Figtree / JetBrains Mono. Svelte is installed from the first step. Its first
  islands are the mode toggle and the profile and portfolio filters.
- **Modes:** this is the first Lossless site to implement the three-mode system
  worked out in
  [[Implement-Three-Mode-Theme-System-for-Lossless-Brand-Site-Decouplings]].
  Vibrant is today's lossless-site look and the default here, as on every
  Lossless site; the mode choice is shared across `*.lossless.group` by cookie. Light and dark are
  quiet reading modes. Each step that touches styling appends what it learned to
  that exploration's Findings.
- **Docs tooling:** use the **context-vigilance kit** (`cv` plugin,
  context-v.dev). `/cv:init` sets up the site's `context-v/`, `/cv:new` and
  `/cv:plan` create its docs, and `/cv:implement` runs the phases below.

```text
client-portals-site/
├── src/
│   ├── live.config.ts           # aggregator only: imports each collection's config.ts
│   ├── collections/             # one folder per collection, each with its own config.ts
│   │   ├── client-content/
│   │   │   └── config.ts        # loader + loose schema for client-content/<folder>/**
│   │   ├── content-areas/
│   │   │   └── config.ts        # loader + loose schema for content-areas/<Area>/**
│   │   ├── mocs/
│   │   │   └── config.ts        # moc/<Client>.md, parsed into directive JSON
│   │   └── _shared/
│   │       ├── github.ts        # gh() helper, ETags, sha-keyed memo
│   │       ├── frontmatter.ts   # parse + normalize; never throws
│   │       └── vault-index.ts   # tree → path index for the resolver
│   ├── config/
│   │   ├── portals.yaml         # the registry: one entry per portal
│   │   └── sources.yaml         # repos and refs the loaders may read
│   ├── lib/
│   │   ├── kinds.ts             # path → kind rules
│   │   ├── content-api.ts       # the only content reader (toolkit pattern)
│   │   ├── wikilinks.ts         # the resolver (see below)
│   │   ├── purge.ts             # changed paths → affected portals → cache tags
│   │   └── gate.ts              # sign / verify / check passcode
│   ├── middleware.ts            # deny by default
│   ├── layouts/Portal.astro
│   ├── components/kinds/        # one component per kind
│   └── pages/
│       ├── index.astro          # public, says nothing about clients
│       ├── robots.txt.ts, llms.txt.ts
│       ├── c/[id]/[...page].astro   # prerender = false
│       ├── c/[id]/_report.astro     # per-portal diagnostics, gated like the portal
│       └── api/
│           ├── unlock.ts
│           └── content-hook.ts  # GitHub push webhook → cache purge
└── tests/
    └── fixtures/                # payloads and malformed-frontmatter samples
```

### The registry fixes identity once

`src/config/portals.yaml` is the **only** place a client's identity is defined. It holds the
joins that the old site guessed at with fuzzy matching:

```yaml
- id: k7q2xm                       # opaque, appears in the URL
  name: Northwind                  # matches client-content/<name>/ and moc/<name>.md
  display_name: "Northwind Team"   # what the client sees; a codename is fine
  vault_folder: client-content/<Folder>  # only when the folder name differs from `name`
  moc: moc/<Moc Name>.md            # only when the MOC name differs from `name`
  for_clients: [<Tag>, <Alias-Tag>] # every spelling the vault uses
  content_areas:
    - area: <Area>
      select: tagged                # tagged (default): only files whose for_clients matches
                                    # all: the whole area is this client's library
  gate: unlisted                    # unlisted (default) | passcode
  passcode_env: PORTAL_CODE_K7Q2XM  # only when gate: passcode; the env var's name, never its value
  include: []                       # paths to load even though the default denylist skips them
  expires: 2027-06-30
```

**Matching by name is the default.** `name` finds the client's folder and its
MOC, compared case-insensitively. Write `vault_folder` or `moc` only for the
known mismatches (one client's folder is spelled differently from its MOC).
**Everything in the client's folder is pulled in**, minus the denylist.

The first real entry is Edviro: `name: Edviro` and
`content_areas: [{ area: AI-Factories-Datacenters, select: all }]`. Edviro has
no MOC yet. Adding `moc/Edviro.md` is how Michael curates its reading list, and
it shows up in the portal on the next push, with no deploy.

The registry is site code, so **adding a portal is a deploy.** Adding content
to an existing portal never is.

## MOCs: the curated reading list

A MOC lists the shared vault notes Michael wants a particular client to read.
The old site rendered MOCs as rails of links out. Here, **every note a MOC names
is pulled into the portal** through the GitHub API and read there, in the
portal's modes and typography.

- **Parse with LFM, not regex.** The `mocs` collection runs the MOC through
  `parseMarkdown()` from `@lossless-group/lfm`, which already includes
  `remark-directive`, and walks the `containerDirective` nodes. Each directive
  becomes a section; each list item becomes an entry:
  - `[[path|Alias]]`: the note, with the alias as its display title;
  - `{ path: [[…]], title: "…" }`: the note, with `title` overriding;
  - `tag: [[X]]`: not a note. It links to lossless.group's tag page for `X`
    (for example `/toolkit/tag/<x>/`) when the sitemap has one, and is
    otherwise plain text;
  - anything malformed (a stray `- `, an unknown shape) is kept as plain text
    and reported in `_report`, never thrown.
- **`:::features`** switches portal sections on and off, as on the old site.
  With no `:::features`, every section that has content is shown.
- **Resolve each item against the vault tree** with the same path resolver the
  wikilinks use (case-insensitive, suffix, basename, aliases). Then fetch that
  blob through the GitHub API.
- **One hop only.** A pulled-in MOC note renders in the portal, but its own
  wikilinks are **not** pulled in. They go to lossless.group (see *Wikilink
  routing*). Curating is explicit: to bring a note in, add it to the MOC.
- **The other-client rule still wins.** A MOC item that points into another
  client's `client-content/` folder is plain text.
- **Purging:** a push that changes the MOC, *or any note it names*, purges that
  portal. `lib/purge.ts` keeps a path → portals index, built from each portal's
  folder, its areas and its parsed MOC, and memoized by the MOC's blob sha.
- **MOC prose** (for example a `# Notes:` section with "Current Direction" and
  "Opportunities") reads as internal notes. It is **not rendered** unless that
  is decided otherwise (see Open decisions).

## Content delivery: live collections, purged on push

The goal: **a push to the vault reaches the live portal in seconds, with no
rebuild.** A rebuild happens only when code changes, and the only code that
content work touches is a collection's `config.ts` (a new collection, or a
change to how its frontmatter is read).

Astro 7 provides both halves, and both are stable (no experimental flags,
checked against `astro@7.3.6` and `@astrojs/vercel@11.0.12` on 2026-10-06):

- **Live content collections** (`src/live.config.ts`, `defineLiveCollection`
  from `astro/content/config`). Each loader fetches entries at request time,
  and returns a `cacheHint` (tags and `lastModified`) with each entry.
- **Route caching** (`cache.provider` plus `routeRules` in `astro.config.mjs`,
  `Astro.cache.set()` in routes, `context.cache.invalidate({ tags })`).
  `cacheVercel()` from `@astrojs/vercel/cache` writes `Vercel-CDN-Cache-Control`
  and `Vercel-Cache-Tag`, and purges with `invalidateByTag()` from
  `@vercel/functions`.

`astro build` still makes no network requests, because content is never read
at build time.

### Reading content: the loaders

**`src/config/sources.yaml`** declares every repo the loaders may read:

```yaml
- slug: vault
  repo: lossless-group/lossless-content
  ref: master                # REQUIRED, never inferred from default_branch
- slug: content-areas
  repo: lossless-group/content-areas   # declared directly: inside the vault it is
  ref: master                          # a gitlink, which the Trees API returns as a commit
```

The loaders copy `lossless-changelog/scripts/sync-streams.mjs`'s `gh()` helper,
its ETag handling and its auth (`GITHUB_TOKEN` or `GITHUB_API_TOKEN`, now as a
runtime env var on Vercel: a fine-grained, read-only token on these two repos).
Per request that misses the CDN:

1. **Resolve the head.** `GET /repos/{repo}/commits/{ref}` with
   `If-None-Match`. A `304` does not count against the rate limit.
2. **One tree per head sha.**
   `GET /repos/{repo}/git/trees/{sha}?recursive=1` gives every path and its
   blob sha. It is memoized by sha in the function instance, and it is the
   **vault path index** the wikilink resolver needs.
3. **Blobs by sha.** Fetch only what the portal uses: the files under its
   `vault_folder` minus the denylist, its MOC **and every note the MOC
   names**, `opengraph.json`,
   `tool-gallery.yaml`, its areas (all files, or the tagged ones), its
   `slides/<client>-*` and its `changelog--<client>/` entries. Blobs are
   content-addressed, so the memo never goes stale.
4. **Frontmatter for routing.** For a link target that is *not* loaded but
   whose lossless.group slug comes from frontmatter (a `slug:` override, or the
   `lost-in-public` title-slug folders), fetch that blob once and keep its
   `slug` and `title` in the index.
5. **Provenance.** Each entry carries `from_repo`, `from_ref`, `from_path` and
   `from_sha`, as the changelog does, and the page shows them in a quiet footer.
6. **Cache hints.** Every entry returns
   `cacheHint: { tags: ['portal:<id>', 'source:<slug>'], lastModified }`. The
   page passes each entry to `Astro.cache.set(entry)`, so the page inherits the
   tags.

`routeRules` give `/c/[...path]` `maxAge: 3600, swr: 86400`. The webhook
normally purges within seconds. The hour is only a safety net for a missed
delivery.

**Gated portals are never CDN-cached.** The CDN serves a cached response
without running middleware, so a cached passcode page would bypass the gate.
`gate: passcode` pages call `Astro.cache.set(false)`. They stay fresh anyway,
since every request resolves the head, and they cost only the memoized blobs.

**Local development** reads the monorepo's own vault checkout
(`CONTENT_SOURCE=local`, path `../../../content`) so authors can preview before
pushing. It is a read path in dev, never a mount, and never used in
production. Tests use `tests/fixtures/`.

### The hook: a GitHub push webhook

When a commit is pushed, GitHub posts it to the site. There is no local git hook
and no GitHub Action: Obsidian Git's push is the trigger, and nothing runs on
the author's machine.

- **Setup, once per repo:** a repository webhook on `lossless-content` and on
  `content-areas`. Payload URL `https://clients.lossless.group/api/content-hook`,
  JSON, `push` events only, with secret `CONTENT_WEBHOOK_SECRET`. It can be
  scripted with `gh api repos/<repo>/hooks`. `/api/content-hook` joins the
  middleware's public allowlist.
- **`api/content-hook.ts`:**
  1. Verify `X-Hub-Signature-256` (HMAC-SHA256 of the raw body) with
     `timingSafeEqual`. Reject anything else with `401`.
  2. Ignore pushes to any ref other than the source's declared `ref`.
  3. Collect `added`, `modified` and `removed` from every commit. Map each path
     to the portals whose folder, areas or MOC items cover it (`lib/purge.ts`).
  4. Call `context.cache.invalidate({ tags: ['portal:<id>', …] })`. Purging a
     whole portal is deliberate: portals are small (Edviro's is about 105
     pages), a new file changes the home and index pages too, and pages
     re-render on demand.
  5. **Fallback:** if the push is `forced`, or lists 2,048 commits or more (the
     payload's cap), purge `source:<slug>` instead.
  6. Respond `202` with the purged tags, so GitHub's delivery log shows what
     happened.
- **Manual purge:** `pnpm purge --portal=<id>` (or `--source=<slug>`) signs a
  synthetic payload with the same secret and posts it. Use it after changing the
  registry or when a delivery was missed.

### Collections: one folder, one `config.ts`

`lossless-site` has one `src/content.config.ts` of 610 lines and 34
collections, and it has become unmanageable. This site starts the pattern we
want to move to:

- **Each collection is a folder under `src/collections/`, with its own
  `config.ts`** exporting `collection` as a plain `{ loader, schema }` object,
  plus its path rules.
- **`src/live.config.ts` is only an aggregator.** Astro requires the file to
  exist at that path. It just collects each folder's export:

  ```ts
  const modules = import.meta.glob('./collections/*/config.ts', { eager: true });
  export const collections = Object.fromEntries(
    Object.entries(modules).map(([path, mod]) => [
      path.split('/').at(-2), defineLiveCollection(mod.collection),
    ]),
  );
  ```

  **Verified in Step 1 (2026-10-06):** `import.meta.glob` works in
  `live.config.ts`. But `defineLiveCollection` throws `LiveContentConfigError`
  when it is called from any file other than `live.config.ts` (it checks the
  importer's filename). So the folders export plain objects, and only the
  aggregator calls it.
- **Changing a `config.ts` is the rebuild boundary.** Nothing else in content
  work requires a deploy.
- Once this has proven out here, it is the template for breaking up
  `lossless-site`'s config (see Open decisions). Nothing in `lossless-site`
  changes as part of this plan.

### Frontmatter: pass everything through

Frontmatter is barely validated. **A frontmatter problem never fails a build, a
request or a page.**

- `_shared/frontmatter.ts` parses YAML in a `try`. If parsing fails, the entry
  gets `data: {}`, keeps its body, and the problem is logged as a diagnostic.
- It **normalizes and does not validate:**
  - parseable dates become `Date`, and anything else stays a string;
  - a string `tags`, `aliases` or `for_clients` becomes a one-item list;
  - the title is the frontmatter `title`, else the first H1 (Edviro's report),
    else the filename.
- Each `config.ts` schema is Zod 4 (`astro/zod`):
  `z.looseObject({...})` with every field `.optional().catch(undefined)`, so
  unknown keys pass through and bad values become `undefined`. (`.passthrough()`
  is the deprecated Zod 3 spelling.)
- A loader error on one entry renders that entry with whatever it has. A failed
  GitHub call serves the stale CDN copy (unlisted portals) or a short
  "temporarily unavailable" panel (gated portals), never a 500.
- `/c/<id>/_report` lists everything the loaders skipped and why, every link
  that renders as plain text, and every frontmatter fallback, for that portal.

## Dependencies: always the latest

Build on the latest release of every dependency, Astro and Svelte above all.

- Scaffold with `pnpm create astro@latest`, and add every package as
  `pnpm add <pkg>@latest`. Use caret ranges.
- **pnpm's one-day minimum release age stays on.** pnpm 12 skips releases
  younger than a day, as a supply-chain guard, so "latest" means the newest
  release at least a day old. On 2026-10-06 that installed Astro 7.3.5 and
  Svelte 5.57.1, because 7.3.6 and 5.57.2 were only hours old. Don't disable it.
- **Pinned so far:** `typescript@^6`, because `astro check` refuses
  TypeScript 7.0 and its replacement needs 7.1. The site's
  `context-v/issues/TypeScript-7-Breaks-Astro-Check.md` tracks it.
- **LFM comes from JSR at latest, as in the other Lossless sites.** It is
  installed through the npm alias, with the JSR registry in `.npmrc`:

  ```ini
  # .npmrc
  @jsr:registry=https://npm.jsr.io
  ```

  ```bash
  pnpm add @lossless-group/lfm@npm:@jsr/lossless-group__lfm@latest
  ```

  Never use `workspace:` or a `link:` path in a deployed build. A local-LFM
  mode like the changelog's `lfm:local` / `lfm:jsr` scripts is fine in
  development, as long as it is switched back before a push.
- **At the start of every step:** run `pnpm outdated`, then `pnpm up --latest`,
  then the tests. Note any bump in that step's changelog entry.
- **Fix forward, don't pin back.** If a release breaks something, fix it the
  same day, or pin that one package exactly with a comment and an issue in
  `context-v/issues/`.
- Latest on 2026-10-06, for reference:

  | Package | Version |
  |---|---|
  | `astro` | 7.3.6 (Vite 8, Zod 4, Node ≥ 22.12) |
  | `svelte` | 5.57.2 |
  | `@astrojs/svelte` | 9.0.1 |
  | `@astrojs/vercel` | 11.0.12 |
  | `tailwindcss`, `@tailwindcss/vite` | 4.3.3 |
  | `@lossless-group/lfm` (JSR, via `npm:@jsr/lossless-group__lfm`) | 0.6.0 |
  | `vitest` | 5.0.3 |
  | `@playwright/test` | 1.63.0 |
  | `@fontsource-variable/newsreader` | 5.3.0 |

## Wikilink routing

Build the resolver on LFM's `createPathResolver` (in 0.6.0, the latest on
JSR) with these settings:

- `index` = every vault path
- `cascade: ['exact', 'suffix', 'basename']`
- `caseSensitive: false`, which absorbs the 31% wrongly-cased paths
- `onAmbiguous: 'plain'`
- an alias index from frontmatter `aliases`

Precedence, first match wins:

1. **In this portal.** The target is loaded into this portal: it is in the
   client's folder, in a pulled-in area, or named by the MOC. Emit a relative
   `/c/<id>/…` URL.
2. **Another client's folder.** Emit plain text, with no link and no title
   lookup. This check comes before every fallback.
3. **Sibling surface.** Only if the target is in that site's *published* index.
   Today that means the toolkit's ~199 published tools. Skip this step until
   the toolkit has a working canonical origin; its configured `SITE` currently
   404s.
4. **lossless.group: its sitemap is the authority.** Every link to content
   that is not pulled in goes to **whatever path that note has on
   lossless.group**. We don't predict that path; we look it up.
   - **The sitemap.** `https://www.lossless.group/sitemap-index.xml` lists
     8,374 live URLs (as of 2026-10-06). It is fetched at request time, cached
     with the tag `lossless-sitemap` for a day, and indexed by last path
     segment.
   - **Candidate first.** Compute the expected URL from the table below
     (frontmatter `slug` overrides it). If the sitemap contains it, use it.
   - **Otherwise, match in the sitemap.** Look for one sitemap URL whose last
     segment equals the note's slug: first within the folder's expected section,
     then anywhere. Exactly one match is used. None, or more than one, falls
     through to plain text.
   - **The sitemap lists apex `lossless.group` URLs, but the apex
     `307`-redirects to `www`.** Emit `https://www.lossless.group/…`.

   The table gives the candidates, reproduced from the live routes. The
   sitemap corrects them where they're wrong.

   | Vault folder | URL |
   |---|---|
   | `concepts/` (nested folders flatten) | `/more-about/{seg}/` (e.g. `concepts/Explainers for AI/LLM Gateways` → `/more-about/llm-gateways/`) |
   | `vocabulary/` | `/more-about/{seg}/`? The sitemap shows some vocabulary at the root (`/lock-in/`). Let the sitemap decide. |
   | `content-areas/<Area>/<Sub>/X` | `/content-areas/{area}/{sub}/{seg}/` (97 AI-Factories-Datacenters pages are live) |
   | `essays/` | `/read/essays/{seg}/` (keeps `---`) |
   | `tooling/Portfolio/X` | `/portfolio/{seg}` |
   | `tooling/a/b/X` | `/toolkit/{a}/{b}/{x}/` (nested) |
   | `vertical-toolkits/…` | `/toolkit/vertical/{path}/` |
   | `organizations/`, `sources/`, `projects/` | `/organizations/…`, `/sources/{sub}/…`, `/projects/…` |
   | `specs/` | `/vibe-with/specs/{seg}/` |
   | `lost-in-public/prompts` / `reminders` / `blueprints` | `/vibe-with/{sub}/…` |
   | `lost-in-public/market-maps`, `talks`, `issue-resolution`, `up-and-running`, `to-hero` | slug built from the frontmatter **title**, which is why the vault index carries it |
   | `lost-in-public/keeping-up` | `/keeping-up/{seg}` |
   | `changelog--content`, `changelog--code` | `/log/content-{seg}`, `/log/code-{seg}` |

   `seg` reproduces `site/src/utils/slugify.ts`. It is not identical across
   folders. On Astro's default id (essays, vocabulary, concepts, tooling, specs),
   **dots are removed** (`Agentic.ai` → `agenticai`). On custom ids
   (organizations, sources, vertical-toolkits, projects), **a trailing `.xxx`
   is dropped** (`Academia.edu` → `academia`). `" - "` collapses to `--`
   everywhere except essays. Anchors are lowercased and hyphenated.
   **Never link to a `/client/…` URL on lossless.group**, even when the
   sitemap has a match.
   Outbound links get `target="_blank"` and an "on lossless.group" affordance.
5. **Unresolvable → plain text.** This covers folders with no public route
   (`moc`, `Citations`, `visuals`, `slides`, explorations), ambiguous
   basenames, notes the sitemap doesn't list, and the 8% that don't resolve.
   **Never `/404`.** That is lossless.group's bug, and we don't copy it.
   Every case is logged through `onDiagnostic` into `_report`.

**Transclusions** (`![[Note#Heading]]`, `![[Note#^block]]`) embed the section
when the note is loaded into this portal. Otherwise they become a link by the rules above.

**Keep the routing honest.** Because every outbound link is checked against
the live sitemap, a routing change on lossless.group can't produce a 404 here.
At worst, a link becomes plain text and appears in `_report`. A test also
resolves one fixture per table row and asserts the candidate is in the
sitemap. When it fails, the table row is stale, and the fix is one line.

## Privacy and gating

Privacy here is **a courtesy, not a contract**. Nothing in this section is a
prerequisite, and none of it blocks shipping. The defaults are cheap. The
passcode is an option per portal, for the pages that are more personal or more
pointed than a client would want a colleague to stumble on.

### Crawlers and LLMs: "this is not for you"

- `robots.txt`:
  - `User-agent: *` / `Disallow: /`
  - named blocks for the known AI crawlers: GPTBot, ClaudeBot, Claude-Web,
    anthropic-ai, CCBot, Google-Extended, PerplexityBot, Bytespider,
    Applebot-Extended, meta-externalagent
  - a comment in plain English saying the site holds personal client work
- `llms.txt`: a short plain statement that this site holds personal client work
  and is not for retrieval, indexing, summarization or training, plus a pointer
  to lossless.group's own `llms.txt` for the public corpus. No index of pages.
- `vercel.json` sends
  `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai`
  on every path. There is also a meta robots tag on every page, and no sitemap.
- **No index of clients** anywhere, and no client name in page titles or unfurl
  metadata. Display names can be codenames.

### The optional passcode (mpstaton-site's gate, with three fixes)

A portal with `gate: unlisted` renders for anyone holding the link. A portal
with `gate: passcode` goes through the gate below. Because both postures share
one site, switching a portal is a one-line change in `portals.yaml`.

- **Rendering and routing:**
  - `output: 'server'` with `@astrojs/vercel`. Everything under `/c/*` has
    `prerender = false`, so the middleware always runs.
  - The middleware is deny-by-default, from calmstorm-decks. The public
    allowlist is `/`, `/robots.txt`, `/llms.txt`, `/api/unlock`,
    `/api/content-hook` (which checks its own signature), `/_astro/*` and
    `/_image`. There is no extension wildcard.
  - Unlisted portals pass the middleware with no cookie check.
- **Cookie:**
  - The value is `base64url({portal, exp}).hmac(PORTAL_SESSION_SECRET)`.
  - Flags: `HttpOnly; Secure; SameSite=Lax; Path=/c/<id>`, with 30 days to
    expiry.
  - The unlock route responds with a 303 and an explicit `Set-Cookie`, and only
    redirects within the same portal.
- **Passcodes:** one env var per portal, compared with `timingSafeEqual`. A
  locked request gets `context.rewrite` to the unlock page.
- **The three fixes**, each cheap and each a known hole in a sibling gate:
  1. **Check the scope:** require `payload.portal === route id`.
  2. **Dev bypass only behind `import.meta.env.DEV`.**
  3. **Fail closed:** a missing secret fails the production build.

## Steps

Each step ends with a check that has to pass before the next one starts. Each
step starts with `pnpm outdated` and `pnpm up --latest` (see *Dependencies*).

**The safe write target** for every test that pushes content is a small
fixtures repo, `lossless-group/client-portals-fixtures`, declared as a third
source. It holds the two test portals (`zz-test-alpha`, `zz-test-beta`) and a
malformed-frontmatter sample. Tests never push to `lossless-content` or
`content-areas`, and fixtures don't live in the site repo, because a push there
would trigger a deploy and hide whether the no-rebuild path works.

1. **Scaffold.** *(Done 2026-10-06, except the Vercel deploy.)*
   - Create the `client-portals-site` repo (private; `main`, with work on
     `development`), mount it under `astro-knots/sites/`,
     and run `/cv:init`.
   - `pnpm create astro@latest`, then add `@astrojs/vercel`, `@astrojs/svelte`,
     `svelte`, `tailwindcss` and `@tailwindcss/vite` at `@latest`. Copy the
     rest of the config shape from `lossless-changelog`.
   - Configure `output: 'server'`, `cache: { provider: cacheVercel() }` and
     `routeRules`.
   - Add `src/live.config.ts` with one stub collection under
     `src/collections/`, and check whether `import.meta.glob` works there (see
     *Collections*).
   - Files: `astro-knots/.gitmodules`, the site's `README.md`, `context-v/`,
     `astro.config.mjs`, `package.json`, `src/live.config.ts`.
   - **Done when:**
     - an empty index deploys to `client-portals-site.vercel.app`;
     - `pnpm outdated` prints nothing;
     - the stub collection loads through the aggregator.

     The production target is **`clients.lossless.group`**, one of the family
     subdomains alongside `changelog.` and `toolkit.lossless.group`.
     `lossless-site` drops its `/client/*` routes and links out once portals
     move over.
2. **Registry, live loaders and the push hook.**
   - Files: `src/config/portals.yaml`, `src/config/sources.yaml`,
     `src/collections/*/config.ts`, `src/collections/_shared/*`,
     `lib/purge.ts`, `pages/api/content-hook.ts`, `scripts/purge.mjs`.
   - Start from `lossless-changelog/scripts/sync-streams.mjs`: copy its `gh()`
     helper, ETag handling and auth.
   - Create the fixtures repo, and add the push webhook to it, to
     `lossless-content` and to `content-areas`.
   - **Done when:**
     - Edviro's report renders from GitHub at request time, and a repeat request
       shows `x-vercel-cache: HIT`;
     - a push to the fixtures repo changes the live test page within 60
       seconds, and Vercel shows **no new deployment**;
     - a bad signature gets `401`, and a push to another ref purges nothing;
     - the malformed-frontmatter fixture renders, and appears in `_report`;
     - every entry carries `from_*` provenance.
3. **Kinds and rendering, on Edviro first.**
   - Develop against Edviro, since that is where content work is happening: the
     **report** (the market scan), **profile** (86 organizations), **shelf**
     (9 concepts), and the MOC-less generated **home**. The test portals cover
     the kinds Edviro doesn't have yet.
   - **MOCs:** `src/collections/mocs/config.ts` parses through LFM and pulls in
     every named note. Test it against a fixture MOC that covers every item
     shape, and read one real MOC (Laerdal's, the largest at 105 lines) in dev.
     Once that works, a `moc/Edviro.md` is Michael's to write.
   - Files: `lib/kinds.ts`, `lib/content-api.ts`, `components/kinds/*`,
     `layouts/Portal.astro`, and the `/design-system` entries.
   - **Done when:**
     - Edviro's portal renders its home, report, profiles and concepts;
     - every item in the fixture MOC renders in the portal, the `tag:` item
       links to the lossless.group tag page, and the malformed item is plain
       text and in `_report`;
     - a push that edits a MOC-named note purges the portal;
     - the test portals render every other kind;
     - adding a file to the fixtures repo adds a page with no code change and
       no deploy.
4. **Wikilink resolver.**
   - Files: `lib/wikilinks.ts`, `tests/wikilinks.test.ts`.
   - Use a fixture of real link shapes: each URL-table row, wrong case, a
     suffix-only path, an alias, an anchor, a transclusion, a cross-client link,
     and an unresolvable link. Add Edviro's real shapes: vault-level `Sources/`
     paths, `content-areas/` paths into its own area, and its two
     `client-content/` links.
   - **Done when:**
     - every fixture resolves as the table says
     - the cross-client link is plain text
     - links inside AI-Factories-Datacenters stay in the portal
     - every outbound link is a URL in the lossless.group sitemap, emitted on
       `www`, and never a `/client/…` URL
     - each table row's candidate is in the sitemap, or that row is fixed
5. **Crawler refusal and the optional gate.**
   - Files: `robots.txt.ts`, `llms.txt.ts`, `vercel.json`, `lib/gate.ts`,
     `middleware.ts`, `api/unlock.ts`.
   - **Done when:**
     - the gate unit tests pass: wrong portal, expired cookie, tampered MAC,
       missing secret, off-portal redirect
     - no `/c/*` file exists in `.vercel/output/static`
     - a passcode-gated page never carries `Vercel-CDN-Cache-Control`
6. **Browser drive.** Files: `tests/`. Run it against the test portals only:
   1. Open unlisted `/c/zz-test-alpha/`; it renders, and the `X-Robots-Tag`
      header is present.
   2. Open passcode-gated `/c/zz-test-beta/`; the unlock page shows, and a wrong
      code sets no cookie.
   3. Enter the right code; you land on home with the sections the MOC asks for.
   4. Follow beta's link into alpha's folder; it is plain text.
   5. Follow a MOC item; it opens inside the portal. Follow a link inside that
      note; it lands on a lossless.group 200.
   6. Push a one-line change to alpha's fixture; reload until it shows (60
      seconds at most), and confirm there was no deployment.

   **Done when:** the drive passes in `pnpm test`.
7. **Edviro live, then the second portal.**
   - Point Edviro's portal at `clients.lossless.group`, read its `_report`, and
     fix the content or the routes. Time it, counting from the scaffold.
   - Do a second client. Time that too.
   - **Done when:** the second portal took clearly less time than the first.
     That is the thesis of this site.

## Risks and rollback

- **The lossless.group routes move.** Outbound links follow the sitemap, so
  they move with it. A link that can't be matched becomes plain text and shows
  in `_report`. The row test flags a stale table row.
- **A webhook delivery is missed.** The page is at most an hour stale (the
  `maxAge` safety net). `pnpm purge --portal=<id>` fixes it immediately, and
  GitHub's delivery log can redeliver.
- **GitHub API limits or outages.** Unlisted portals keep serving the CDN copy
  (`swr`). Gated portals show "temporarily unavailable". ETag `304`s and the
  sha-keyed memo keep usage low. The token is a runtime env var on Vercel.
- **A loader drops something an author expected.** `/c/<id>/_report` lists
  every skipped file and every plain-texted link, per portal. A portal's
  `include:` list overrides the default denylist.
- **An Astro or Svelte release breaks the site.** Fix forward the same day, or
  pin that one package with an issue (see *Dependencies*).
- **Rollback:** the site is additive. lossless.group's `/client/*` keeps
  working until we choose to retire it.

## Acceptance criteria

- [ ] A pushed vault commit appears on the live portal within a minute, with
      **no rebuild and no deploy**, no code change, and no submodule.
- [ ] Only a change to a collection's `config.ts` (or other site code) triggers
      a build.
- [ ] Malformed or missing frontmatter never fails a build, a request or a
      page.
- [ ] `astro build` makes no network requests.
- [ ] Every wikilink renders as an in-portal link, a working lossless.group
      link, or plain text. No `/404`, and no link into another client's portal.
- [ ] A passcode-gated portal is not reachable with another portal's cookie,
      and is never served from the CDN cache.
- [ ] `robots.txt`, `llms.txt` and `X-Robots-Tag` all refuse crawlers and LLMs.
- [ ] `pnpm outdated` is empty at every step's close.

## Open decisions

- **Edviro's gate:** unlisted, or passcode? The market scan is candid about the
  company ("data center buyers will discount school traction heavily").
- **lossless.group's public client pages.** Its sitemap lists **316
  `/client/…` URLs, including `/client/edviro/`**, so search engines are
  invited to the very pages this site keeps out of search. That defeats the
  courtesy-privacy goal before this site exists. **Decided 2026-10-06: note
  it, don't fix it.** `lossless-site` is not touched as part of this plan.
  Revisit when deciding whether to retire `/client/*` once each portal moves
  over.
- **Search:** held back on purpose. Client-content is never searchable or
  indexed. A public Pagefind index would leak it past the gate, and
  `astro-pagefind` can't index request-time pages anyway. Cross-repo search
  for shared content is unsolved. See the site's
  `context-v/issues/Nuances-of-Search-and-Privacy-Courtesy.md` and
  `Allowing-Full-Content-Search-across-Repos.md`.
- **MOC prose:** some MOCs have notes below the directives ("Current
  Direction", "Opportunities"). Never render them (the default), or render a
  marked section such as `## For you`?
- **MOC depth:** one hop (the default), or let a MOC directive opt into
  pulling in a note's links too?
- **Toolkit portals:** keep them as the tooling view and link to them from here
  once the toolkit has a working origin, or absorb them?
- **Expiry:** a soft "this portal has closed" page, or a 404?
- **`lossless-site`'s config:** once the per-folder `config.ts` pattern has
  proven out here, plan the split of its 610-line `content.config.ts` as its own
  piece of work.

## Done when (for this document)

- [x] Frontmatter placeholders replaced, IDs minted by command
- [x] Every step names its files and a done-condition someone can check
- [ ] Links to its spec (none yet; promote to a spec if Steps 1–2 change the shape)

## References

[^8dgj56]: [[Build-a-Client-Portals-Site]]

- `site/context-v/explorations/Rethink-on-Client-Focused-Landing-Pages.md`: the intent
- `site/src/content.config.ts`: the single 610-line config this site's per-folder pattern replaces
- `site/src/utils/slugify.ts`, `site/src/utils/routing/routeManager.ts`: lossless.group's slug and route rules
- `sites/lossless-changelog/scripts/sync-streams.mjs`: the `gh()` helper, ETags and auth the loaders copy
- `sites/lossless-toolkit-site/src/lib/wikilinks.ts`: the `createPathResolver` usage to copy
- `sites/mpstaton-site/src/config/wikilinks.ts`: an earlier lossless.group route config (partly wrong; the table above supersedes it)
- `sites/lossless-toolkit-site/context-v/reminders/Security-Overkill-for-Avoiding-Brand-Rank.md`
- `sites/lossless-toolkit-site/tests/build-output.test.ts`: the dist-scan pattern
- `sites/mpstaton-site/src/lib/promote/gate.ts`: the gate this one starts from
- `ai-labs/dididecks-ai/client-sites/calmstorm-decks/src/middleware.ts`: deny-by-default
- `ai-labs/dididecks-ai/changelog/2026-05-17_02.md`: the prerendered-gated-route incident
- `content/client-content/Edviro/` and `content/content-areas/AI-Factories-Datacenters/`: the first portal's content
- `content/moc/*.md`: the 11 MOCs (Laerdal's is the largest); `site/src/content.config.ts:419` is the old site's `moc` collection
- `https://www.lossless.group/sitemap-index.xml`: the routing authority for outbound links
- `sites/lossless-changelog/.npmrc` and `package.json`: the JSR alias setup for LFM
- Astro 7 type definitions: `astro/dist/types/public/config.d.ts` (`cache`, `routeRules`) and `@astrojs/vercel/dist/cache/provider.js` (`invalidateByTag`)
