---
type: Plans
title: "Plan: Build a Client Portals Site"
description: "Plan for client-portals-site, the third surface extracted from lossless-site: per-client portals rendered from the content vault, gated per client, with wikilinks routed back to lossless.group."
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
at_semantic_version: 0.0.1.0
status: Draft
category: Plans
tags:
  - Plan
  - Lossless-Site-Rebuild
  - Client-Surfaces
  - Access-Gating
  - Wikilinks
  - LFM
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

1. **Fast custom content.** Authors keep writing in the Obsidian vault
   (`lossless-content`). A new file in a client's folder becomes a portal page
   after `pnpm sync`, with no site-code change, because the page kind is
   inferred from where the file sits. Content is pulled **file by file through
   the GitHub API**, as the changelog site does. The site never mounts the
   vault as a submodule.
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
- **`moc/<Client>.md`**: 11 files, all configuration with no prose.
  - `:::features` (8) switches portal sections on and off.
  - The others are `:::portfolio`, `:::concepts`, `:::vocabulary`, `:::reader`,
    `:::projects`, `:::essays` and `:::tool-showcase`.
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

### Skipped by default (a sync denylist, overridable per portal)

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
fast. Each kind is one schema with `.optional().catch()` and `.passthrough()`,
and one component.

| Kind | Inferred from | Renders |
|---|---|---|
| **home** | `moc/<Client>.md` + `opengraph.json` | Hero (from `opengraph.json`, with a generated fallback when it is missing). Then one rail per MOC directive, with sections switched by `:::features`. The MOC directives are parsed **once, at sync**, into JSON. They are never regex-parsed at render. |
| **recommendation** | `Recommendations/**` | Article with a hero image if one exists, `![[Note#Heading]]` transclusion, `:::tool-showcase`, and footnotes. "Idea Bin" sections are hidden. |
| **memo** | `Files/*_Memo.md`, `*Deck-Analysis*` | Long-form with a TOC of numbered sections, a numeric `[^n]` citations panel, and tables. A natural candidate for the portal's `passcode` option. |
| **portfolio** | `Portfolio/**`, `Files/Portfolio/**`, MOC `:::portfolio` | Index of OG cards filterable by `portfolios` (fund). Detail page shows the profile body if there is one, otherwise just the card. |
| **report** | long root-level `.md` in the client folder | Numbered-section TOC, Perplexity `[!info]` callouts, hex `[^abc123]` citations, and a source library. |
| **project** | `Projects/**`, `changelog--<client>/` | Grouped by workstream folder in numeric order, with Vimeo/Loom embeds. The changelog is a dated sub-feed (Why Care? / What's New?). |
| **showcase** | list files, `tool-gallery.yaml`, `for_clients` hits in tooling and vertical-toolkits | Grouped card rails with OG data from the target notes. Each card links out (see routing). |
| **shelf** | MOC `:::reader`, `:::concepts`, `:::vocabulary`, `:::essays`, plus `for_clients` hits in `content-areas/` | Glossary chips and reading cards. `content-areas` files tagged for this client are **pulled in** and rendered; everything else links out. |
| **deck** | `slides/<client>-*` | One slide per H1. Phase 5: it needs a `client` key added to the deck frontmatter first. |

**Adding a kind is one path rule, one schema and one component.** Nothing else
changes.

## Shape of the site

- **Repo:** its own repo under `lossless-group`, mounted as
  `astro-knots/sites/client-portals-site`, with its own
  `pnpm-workspace.yaml` (not a workspace member). It **does not** mount
  `lossless-content` or `content-areas`; content arrives through the
  GitHub API sync below.
- **Docs:** `README.md`, `changelog/`, `context-v/` (with `extra/` gitignored),
  `DESIGN.md`, and the astro-knots `/design-system` and `/brand-kit` pages.
  Both pages are gated and render test portals only.
- **Stack:** Astro 7, `@lossless-group/lfm` (JSR, as the changelog pins it), the
  two-tier `theme.css` from the brand-layer extraction, and Bodoni Moda /
  Figtree / JetBrains Mono. No Svelte until something needs an island.
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
├── scripts/
│   └── sync-portals.mjs         # GitHub API → src/vault/ (committed)
├── src/
│   ├── config/
│   │   ├── portals.yaml         # the registry: one entry per portal
│   │   └── sources.yaml         # repos, refs, and paths the sync may read
│   ├── vault/
│   │   ├── sync-state.json      # per-source sha / etag cursors
│   │   ├── vault-index.json     # every vault path + slug/title where needed
│   │   └── <portal-id>/         # synced files, plus moc.json and manifest.json
│   ├── lib/
│   │   ├── kinds.ts             # path → kind rules
│   │   ├── content-api.ts       # the only content reader (toolkit pattern)
│   │   ├── wikilinks.ts         # the resolver (see below)
│   │   └── gate.ts              # sign / verify / check passcode
│   ├── middleware.ts            # deny by default
│   ├── layouts/Portal.astro
│   ├── components/kinds/        # one component per kind
│   └── pages/
│       ├── index.astro          # public, says nothing about clients
│       ├── robots.txt.ts, llms.txt.ts
│       ├── c/[id]/[...page].astro   # prerender = false
│       └── api/unlock.ts
└── tests/
```

### The registry fixes identity once

`src/config/portals.yaml` is the **only** place a client's identity is defined. It holds the
joins that the old site guessed at with fuzzy matching:

```yaml
- id: k7q2xm                       # opaque, appears in the URL
  display_name: "Northwind Team"   # what the client sees; a codename is fine
  vault_folder: client-content/<Folder>
  moc: moc/<Moc Name>.md            # may differ from the folder name; that's fine here
  for_clients: [<Tag>, <Alias-Tag>] # every spelling the vault uses
  content_areas: [<Area>]           # pulled in when tagged for this client
  gate: unlisted                    # unlisted (default) | passcode
  passcode_env: PORTAL_CODE_K7Q2XM  # only when gate: passcode; the env var's name, never its value
  include: []                       # paths to sync even though the default denylist skips them
  expires: 2027-06-30
```

### Content import: specific files via the GitHub API

This is the same pattern as `lossless-changelog`'s `scripts/sync-streams.mjs`
(spec: `Aggregate-Changelog-Streams-Across-the-Lossless-Tree-via-the-GitHub-API`).
There is **no submodule and no local vault path**. The sync is run deliberately
with `pnpm sync`. The result in `src/vault/` is committed, and `astro build`
never touches the network.

**`src/config/sources.yaml`** declares every repo the sync may read:

```yaml
- slug: vault
  repo: lossless-group/lossless-content
  ref: master                # REQUIRED, never inferred from default_branch
- slug: content-areas
  repo: lossless-group/content-areas   # declared directly: inside the vault it is
  ref: master                          # a gitlink, which the Trees API returns as a commit
```

`scripts/sync-portals.mjs` takes the same flags as the changelog's
`sync-streams.mjs` (`--full`, `--dry-run`, `--only=<portal-id>`). It also uses
the same auth (`GITHUB_TOKEN` or `GITHUB_API_TOKEN`; anonymous is capped at
60 req/hr) and the same cursor in `sync-state.json`.

1. **Skip if unchanged.** For each source, `GET /repos/{repo}/commits?sha={ref}&per_page=1`
   with `If-None-Match`. A `304`, or a head sha that matches the cursor, skips
   that source.
2. **One tree call per source.**
   `GET /repos/{repo}/git/trees/{sha}?recursive=1` returns every path with
   its blob sha. This one response does two jobs:
   - it is the **vault path index** that the wikilink resolver needs, written to
     `vault-index.json`;
   - it shows which blobs changed since the last sync, by comparing blob shas.
3. **Fetch only what a portal uses, and only if the blob changed.** That is:
   - the files under the portal's `vault_folder`, minus the denylist
   - its MOC
   - `opengraph.json` and `tool-gallery.yaml`
   - `slides/<client>-*`
   - the `changelog--<client>/` entries

   Use `GET /repos/{repo}/git/blobs/{sha}`, or `raw.githubusercontent.com` at
   the pinned commit.
4. **`content-areas` by tag.** Fetch the `.md` blobs under the portal's declared
   `content_areas`, read their frontmatter, and keep the ones whose
   `for_clients` matches one of the portal's tags. Match normalized: lowercase,
   spaces → hyphens. The cursor makes later runs cheap, because unchanged blob
   shas are never refetched.
5. **Frontmatter for routing.** For each link target that is *not* synced but
   sits in a folder whose lossless.group slug comes from frontmatter (anything
   with a `slug:` override, and the `lost-in-public` title-slug folders), fetch
   that blob once. Record its `slug` and `title` in `vault-index.json`.
6. **Provenance on every file.** Prepend `from_repo`, `from_ref`, `from_path`
   and `from_sha` to each synced file, as the changelog does. This makes any
   synced page traceable to its vault commit.
7. **Derived files.** Parse the MOC directives once into `moc.json`. Write
   `manifest.json` with what was synced, what was skipped and why, and every
   link that will render as plain text. This is the per-portal diagnostics
   report.

Assets (images embedded with `![[...png]]`) are fetched the same way only when
they are referenced. If an asset is missing from the tree, the reference
renders as nothing, not as a broken image.

## Wikilink routing

Build the resolver on LFM's `createPathResolver` (0.6.0) with these settings:

- `index` = every vault path
- `cascade: ['exact', 'suffix', 'basename']`
- `caseSensitive: false`, which absorbs the 31% wrongly-cased paths
- `onAmbiguous: 'plain'`
- an alias index from frontmatter `aliases`

Precedence, first match wins:

1. **In this portal.** The target was synced into this portal. Emit a relative
   `/c/<id>/…` URL.
2. **Another client's folder.** Emit plain text, with no link and no title
   lookup. This check comes before every fallback.
3. **Sibling surface.** Only if the target is in that site's *published* index.
   Today that means the toolkit's ~199 published tools. Skip this step until
   the toolkit has a working canonical origin; its configured `SITE` currently
   404s.
4. **lossless.group.** Origin `https://www.lossless.group`; the apex redirects,
   so use `www` directly. The table is reproduced from the live routes. Frontmatter
   `slug` always overrides it.

   | Vault folder | URL |
   |---|---|
   | `vocabulary/`, `concepts/` | `/more-about/{seg}/` |
   | `essays/` | `/read/essays/{seg}/` (keeps `---`) |
   | `tooling/Portfolio/X` | `/portfolio/{seg}` |
   | `tooling/a/b/X` | `/toolkit/{a}/{b}/{x}/` (nested) |
   | `vertical-toolkits/…` | `/toolkit/vertical/{path}/` |
   | `organizations/`, `sources/`, `projects/` | `/organizations/…`, `/sources/{sub}/…`, `/projects/…` |
   | `specs/` | `/vibe-with/specs/{seg}/` |
   | `lost-in-public/prompts` / `reminders` / `blueprints` | `/vibe-with/{sub}/…` |
   | `lost-in-public/market-maps`, `talks`, `issue-resolution`, `up-and-running`, `to-hero` | slug built from the frontmatter **title**, which is why `vault-index.json` carries it |
   | `lost-in-public/keeping-up` | `/keeping-up/{seg}` |
   | `changelog--content`, `changelog--code` | `/log/content-{seg}`, `/log/code-{seg}` |

   `seg` reproduces `site/src/utils/slugify.ts`. It is not identical across
   folders. On Astro's default id (essays, vocabulary, concepts, tooling, specs),
   **dots are removed** (`Agentic.ai` → `agenticai`). On custom ids
   (organizations, sources, vertical-toolkits, projects), **a trailing `.xxx`
   is dropped** (`Academia.edu` → `academia`). `" - "` collapses to `--`
   everywhere except essays. Anchors are lowercased and hyphenated.
   Outbound links get `target="_blank"` and an "on lossless.group" affordance.
5. **Unresolvable → plain text.** This covers folders with no public route
   (`moc`, `Citations`, `visuals`, `content-areas` files not pulled in, `slides`,
   explorations), ambiguous basenames, and the 8% that don't resolve.
   **Never `/404`.** That is lossless.group's bug, and we don't copy it.
   Every case is logged through `onDiagnostic` into a build report.

**Transclusions** (`![[Note#Heading]]`, `![[Note#^block]]`) embed the section
when the note was synced. Otherwise they become a link by the rules above.

**Keep the URL table honest.** A build-time test runs `HEAD` requests against a
sample of resolved lossless.group URLs, taking one per row of the table. The
test fails on any 404, so a routing change on lossless.group shows up here
instead of in front of a client.

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
    allowlist is `/`, `/robots.txt`, `/llms.txt`, `/api/unlock`, `/_astro/*`
    and `/_image`. There is no extension wildcard.
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

Each step ends with a check that has to pass before the next one starts.

1. **Scaffold.**
   - Create the `client-portals-site` repo, mount it under `astro-knots/sites/`,
     and run `/cv:init`.
   - Copy the config shape from `lossless-changelog`.
   - Files: `astro-knots/.gitmodules`, the site's `README.md`, `context-v/`,
     `astro.config.mjs`, `package.json`.
   - **Done when:** an empty index deploys to `client-portals-site.vercel.app`.
     The production target is **`clients.lossless.group`**, one of the family
     subdomains alongside `changelog.` and `toolkit.lossless.group`.
     `lossless-site` drops its `/client/*` routes and links out once portals
     move over.
2. **Registry and GitHub API sync.**
   - Files: `src/config/portals.yaml`, `src/config/sources.yaml`,
     `scripts/sync-portals.mjs`, `src/vault/`.
   - Start from `lossless-changelog/scripts/sync-streams.mjs`: copy its `gh()`
     helper, etag handling, cursor file and flags.
   - **Done when:**
     - `pnpm sync --dry-run --only=<one portal>` lists the right files.
     - A second `pnpm sync` makes zero blob requests.
     - `vault-index.json`, `moc.json` and `manifest.json` are written.
     - Every synced file carries `from_*` provenance.
3. **Kinds and rendering.**
   - Develop against two test portals (`zz-test-alpha`, `zz-test-beta`). Their
     source files sit in a fixtures folder in the site repo, which `sources.yaml`
     can point at in place of the vault.
   - Files: `lib/kinds.ts`, `lib/content-api.ts`, `components/kinds/*`,
     `layouts/Portal.astro`, and the `/design-system` entries.
   - **Done when:** both test portals render every kind, and adding a file to a
     test folder adds a page with no code change.
4. **Wikilink resolver.**
   - Files: `lib/wikilinks.ts`, `tests/wikilinks.test.ts`.
   - Use a fixture of real link shapes: each URL-table row, wrong case, a
     suffix-only path, an alias, an anchor, a transclusion, a cross-client link,
     and an unresolvable link.
   - **Done when:**
     - every fixture resolves as the table says
     - the cross-client link is plain text
     - the live `HEAD` sample returns no 404s
5. **Crawler refusal and the optional gate.**
   - Files: `robots.txt.ts`, `llms.txt.ts`, `vercel.json`, `lib/gate.ts`,
     `middleware.ts`, `api/unlock.ts`.
   - **Done when:**
     - the gate unit tests pass: wrong portal, expired cookie, tampered MAC,
       missing secret, off-portal redirect
     - no `/c/*` file exists in `.vercel/output/static`
6. **Browser drive.** Files: `tests/`. Run it against the test portals only:
   1. Open unlisted `/c/zz-test-alpha/`; it renders, and the `X-Robots-Tag`
      header is present.
   2. Open passcode-gated `/c/zz-test-beta/`; the unlock page shows, and a wrong
      code sets no cookie.
   3. Enter the right code; you land on home with the sections the MOC asks for.
   4. Follow beta's link into alpha's folder; it is plain text.
   5. Follow an outbound concept link; it lands on a lossless.group 200.

   **Done when:** the drive passes in `pnpm test`.
7. **First real portal, then the second.**
   - Add one real client to `portals.yaml`, sync it, read `manifest.json`, and
     fix the content or the routes. Time it.
   - Do a second client. Time that too.
   - **Done when:** the second portal took clearly less time than the first.
     That is the thesis of this site.

## Risks and rollback

- **The lossless.group routes move.** The `HEAD` sample test catches it. The fix
  is one row in the URL table.
- **GitHub API limits or outages.** The sync is deliberate and committed, so a
  failed sync never breaks a build or a deploy. Rerun it later. Cold syncs need
  `GITHUB_TOKEN`.
- **Sync drops something an author expected.** `manifest.json` lists every
  skipped file and every plain-texted link, per portal. A portal's `include:`
  list overrides the default denylist.
- **Rollback:** the site is additive. lossless.group's `/client/*` keeps
  working until we choose to retire it.

## Acceptance criteria

- [ ] A new page in a client's vault folder appears in the portal after
      `pnpm sync`, with no code change and no submodule.
- [ ] `astro build` makes no network requests.
- [ ] Every wikilink renders as an in-portal link, a working lossless.group
      link, or plain text. No `/404`, and no link into another client's portal.
- [ ] A passcode-gated portal is not reachable with another portal's cookie.
- [ ] `robots.txt`, `llms.txt` and `X-Robots-Tag` all refuse crawlers and LLMs.

## Open decisions

- **lossless.group `/client/*`:** retire these pages once each portal moves over?
- **Toolkit portals:** keep them as the tooling view and link to them from here
  once the toolkit has a working origin, or absorb them?
- **Expiry:** a soft "this portal has closed" page, or a 404?
- **Trigger:** manual `pnpm sync` only, or also a scheduled GitHub Action, like
  the changelog's planned webhook-plus-schedule fallback?

## Done when (for this document)

- [x] Frontmatter placeholders replaced, IDs minted by command
- [x] Every step names its files and a done-condition someone can check
- [ ] Links to its spec (none yet; promote to a spec if Steps 1–2 change the shape)

## References

[^8dgj56]: [[Build-a-Client-Portals-Site]]

- `site/context-v/explorations/Rethink-on-Client-Focused-Landing-Pages.md`: the intent
- `site/src/utils/slugify.ts`, `site/src/utils/routing/routeManager.ts`: lossless.group's slug and route rules
- `sites/lossless-toolkit-site/src/lib/wikilinks.ts`: the `createPathResolver` usage to copy
- `sites/mpstaton-site/src/config/wikilinks.ts`: an earlier lossless.group route config (partly wrong; the table above supersedes it)
- `sites/lossless-toolkit-site/context-v/reminders/Security-Overkill-for-Avoiding-Brand-Rank.md`
- `sites/lossless-toolkit-site/tests/build-output.test.ts`: the dist-scan pattern
- `sites/mpstaton-site/src/lib/promote/gate.ts`: the gate this one starts from
- `ai-labs/dididecks-ai/client-sites/calmstorm-decks/src/middleware.ts`: deny-by-default
- `ai-labs/dididecks-ai/changelog/2026-05-17_02.md`: the prerendered-gated-route incident
