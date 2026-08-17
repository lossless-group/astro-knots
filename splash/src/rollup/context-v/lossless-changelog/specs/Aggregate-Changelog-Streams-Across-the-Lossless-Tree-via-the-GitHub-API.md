---
date_created: 2026-08-08
date_modified: 2026-08-08
title: Aggregate Changelog Streams Across the Lossless Tree via the GitHub API
lede: The group-wide changelog stops being one hand-maintained collection and becomes a live aggregation over 38 explicitly-declared changelog streams arranged in a three-deep tree, each pulled from its own repo at its own branch — with rolled-up content structurally excluded and new entries ingested incrementally on push.
publish: true
version: 0.1.0.0
status: draft
authors:
  - Michael P. Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
tags:
  - Changelog
  - GitHub-API
  - Pseudomonorepo
  - Content-Rollup
  - Incremental-Ingest
  - Webhooks
  - Lossless-Site-Rebuild
from: lossless-changelog
from_path: specs/Aggregate-Changelog-Streams-Across-the-Lossless-Tree-via-the-GitHub-API.md
---
<!-- Rolled up from lossless-changelog/context-v/specs/Aggregate-Changelog-Streams-Across-the-Lossless-Tree-via-the-GitHub-API.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Aggregate Changelog Streams Across the Lossless Tree via the GitHub API

## Why Care?

`lossless-site` models the changelog as **one** collection. It ships three hardcoded content collections — `src/generated-content/changelog--content`, `changelog--code`, `changelog--laerdal` — each backed by markdown committed into the site repo, each with its own layout (`ChangelogLayout.astro`, `LaerdalChangelogLayout.astro`). Adding a project meant adding a collection, a layout, and a sync.

That was right when there were three streams. There are now **38 changelog streams across ~31 distinct GitHub repositories**, spanning up to three levels of nesting and four levels of the pseudomonorepo tree. The collection-per-project model has run out of road.

This spec replaces it with an explicitly-declared manifest of `(repo, ref, path)` triples read through the GitHub API, so a changelog stream is a **configuration entry**, not a code change.

## The core discipline: never ingest a rollup

Per `changelog-conventions` and `pseudomonorepos/references/content-rollup.md`, every parent in the tree is *supposed* to roll up its children's changelogs into its splash. That feature is the primary threat to this site: naive aggregation would surface the same entry once from the child and again from every ancestor that rolled it up.

**The structural fact that makes this cheap:** rolled-up content does not land in `<repo>/changelog/`. It lands in `<repo>/splash/src/rollup/changelog/<child>/`. A manifest that names `changelog/` paths therefore excludes rollups *by construction*.

Verified on disk: **868 rolled-up markdown files** across `astro-knots/splash/src/rollup/`, `ai-labs/splash/src/rollup/`, and `content-farm/splash/src/rollup/`. All three are committed (not gitignored), so all 868 are visible to the GitHub API. `splash/dist/` **is** gitignored, so build output is a non-issue.

### Two things are called "rollup" and only one is a duplicate

| | Location | Original prose? | Ingest? |
|---|---|---|---|
| **Mechanical rollup** | `splash/src/rollup/changelog/<child>/` | No — synced copies of child entries | **Never** |
| **Editorial rollup** | `astro-knots/changelog/`, `ai-labs/changelog/`, `content-farm/changelog/` | Yes — parent narrating fleet-wide work | **Yes** — they carry derived `altitude: fleet` |

The parent-level `changelog/` directories are not duplicates. Sampled titles from `astro-knots/changelog/`:

- *"Sweep: llms.txt + sitemap + robots.txt across every site and splash"*
- *"Sweep: LFM 0.3.0, Astro 6.3.1, and OpenPanel layered across the fleet"*
- *"Confidential Access v2 — Signed-Link Sessions + Telemetry for Client-Content Workspaces"*

These are original cross-cutting narratives and are among the most valuable entries the aggregate can carry. They are not a duplication problem — they are a **granularity** problem. "Sweep: LFM 0.3.0 across the fleet" will sit next to eleven site-level entries describing their own share of that same sweep. The resolution is not exclusion but altitude: each stream's depth in the tree yields `fleet` / `product` / `component`, and the feed can nest or collapse rather than showing twelve entries about one sweep. See "Hierarchy" below.

### Three enforcement layers

1. **Manifest allowlist.** Only declared `(repo, ref, path)` triples are read. Nothing is discovered automatically.
2. **Path denylist.** Reject any resolved path matching `**/splash/**`, `**/dist/**`, `**/node_modules/**`, `site/src/generated-content/**`, `content/changelog--*`, `context-v/skills/changelog*`, `data/changelog-data`, `tidyverse/changelog-scripts`.
3. **Frontmatter guard.** Drop any document carrying a `from:` or `from_path:` key. The rollup script injects these as provenance — **865 of the 868** rolled-up files carry them, and hand-written entries never do. This is a two-line filter that makes a fat-fingered manifest entry non-fatal.

Layer 1 is the contract. Layers 2 and 3 exist because a hand-authored manifest will eventually contain a mistake, and the failure mode (silent duplication of hundreds of entries) is expensive to notice.

## Four structural shapes a stream can take

Probing the live API against all candidates surfaced four distinct shapes. The manifest schema must express all four.

**A. Repo root `changelog/`** — the common case. `mpstaton-site` → `lossless-group/mpstaton-site`, `main`, `changelog/`.

**B. Nested path inside a larger repo** — a pseudomonorepo child that is *not* its own repo. `memopop-native` (`apps/memopop-native/changelog/`, 6 entries) and `memopop-site` (`apps/memopop-site/changelog/`, 3) both live inside `lossless-group/memopop-ai`. Their sibling `memopop-orchestrator` *is* its own repo, so a single product spans two repos and three streams — the reason `path` is free-form and the reason sync cursors key on stream rather than repo.

**C. `changelog/` is itself a git submodule.** `dark-matter` is the live example: `GET /repos/lossless-group/matter-site/contents/changelog` returns `{"type":"submodule","submodule_git_url":"https://github.com/lossless-group/changelog_matter-site.git"}` and **zero files**. The 25 entries live in the standalone repo `lossless-group/changelog_matter-site` at its root. Any implementation that assumes `contents/changelog` returns an array will silently produce an empty stream here.

**D. Standalone changelog repo, entries at root.** The org contains `changelog_matter-site` (25), `changelog-cilantro-site` (2), `changelog-neo` (1), and `changelog-parslee` (0 — empty for now). These have no `changelog/` subdirectory; entries sit at the repo root. `changelog-neo` and `changelog-parslee` track projects with no other presence in the tree.

## The branch trap

**Default branch is not where the changelog lives.** This broke six of thirty-four probes on the first pass and is the single most likely source of silently-empty streams:

- `lmstud-yo`, `grab-reference`, `plunk-it`, `filestarter`, `file-transporter` — default is `master`, which has **no** `changelog/` at all. Every entry is on `development`.
- `augment-it` — default branch is `rebuild/turbo-rsbuild`, a feature branch, and it is the **only** branch carrying the changelog (94 entries). `main`, `master`, and `development` all 404.
- `astro-knots`, `context-vigilance-kit`, `cite-wide`, `image-gin`, `metafetch`, `hypernova-site`, `lossless-site` — default `master`, content present there.
- `image-wrangler`, `dididecks-ai` — content on `development`.

**Therefore `ref` is a required, explicit field.** Never resolve to the repo's default branch. The branch tier model (`development` → `main` → `master`) is aspirational across the tree and is not yet uniformly applied; the manifest records reality, not intent.

## Manifest schema

Committed at `src/config/streams.yaml`. Per the "YAML for editable data" convention — this is a file that gets hand-edited often.

```yaml
streams:
  - slug: astro-knots          # stable URL segment + dedupe key; never reuse
    repo: lossless-group/astro-knots
    ref: master                # REQUIRED — never inferred from default_branch
    path: changelog/           # "" or "/" for root-of-repo streams (shape D)
    parent: null               # null = tree root; else another stream's slug
    title: Astro Knots         # display name
    shape: root-dir            # root-dir | nested-path | submodule-ref | standalone-repo
    enabled: true

  - slug: memopop-orchestrator
    repo: lossless-group/investment-memo-orchestrator
    ref: main
    path: changelog/
    parent: memopop-ai         # which is itself parented to ai-labs — depth 3
    title: Investment Memo Orchestrator
    shape: submodule-ref
    enabled: true
```

Notes on fields:

- **`slug`** is the dedupe key and the URL segment. It must stay stable across the eventual `lossless-changelog` → `lossless-site` rename.
- **`shape`** is documentation for humans and an assertion for the sync script — if `shape: root-dir` and the API returns `type: submodule`, **fail loud**. That's the `dark-matter` failure mode, and it should be an error, not an empty stream.
- **`parent`** replaces a flat `group` field. See "Hierarchy" below — the tree is genuinely three deep, so a bucket label is not enough.
- **`altitude`** is **derived from depth**, not declared: depth 1 = `fleet`, depth 2 = `product`, depth 3 = `component`. Declaring it by hand alongside `parent` would let the two disagree.
- **`enabled: false`** keeps a known-empty stream (`changelog-parslee`) declared but unfetched.

## Hierarchy

The tree is three levels deep, not two. The `memopop` subtree is the forcing case:

```
ai-labs                      (fleet)      lossless-ai-labs @ main
└── memopop-ai               (product)    memopop-ai @ main
    ├── memopop-orchestrator (component)  investment-memo-orchestrator @ main   ← own repo
    ├── memopop-native       (component)  memopop-ai @ main : apps/memopop-native/changelog/
    └── memopop-site         (component)  memopop-ai @ main : apps/memopop-site/changelog/
```

Three things about this subtree matter beyond itself:

**It is the live example of shape B (`nested-path`).** `memopop-native` and `memopop-site` are plain directories inside `memopop-ai`, not submodules — only `memopop-orchestrator` is its own repo. So one product spans **two** repos and three streams, and the schema's free-form `path` is load-bearing rather than theoretical.

**Slug and mount path disagree.** The repo is `investment-memo-orchestrator`; it mounts at `apps/memopop-orchestrator`; the existing `ai-labs` splash rollup already slugs it `memopop-orchestrator`. Recommend `slug: memopop-orchestrator` (matching the in-tree identity and the existing rollup) with `title: Investment Memo Orchestrator`. Slug is for URLs, title is for humans; they do not need to match the repo name.

**Nothing about the exclusion discipline changes.** `memopop-ai` has no `splash/` of its own, so `memopop-ai/changelog/` holds only its own 5 entries. The one place the hierarchy gets flattened is `ai-labs/splash/src/rollup/changelog/memopop-ai/memopop-orchestrator/` — the local-filesystem rollup variant already auto-discovers `apps/*/changelog/` and collapses it to `<child>/<app>` slugs. That path is denylisted, so a three-deep tree cannot triple-count. The discipline was designed for two levels and holds at three without amendment.

### Don't put hierarchy in URLs

Entry URLs stay flat — `/stream/<slug>/<entry>` — with the parent chain rendered as a breadcrumb rather than encoded as path segments.

The reason is empirical: **re-parenting happens in this tree.** `calmstorm-decks` moved from `astro-knots/sites/` to `ai-labs/dididecks-ai/client-sites/` and is *still* sitting as a stale rollup under `astro-knots/splash/src/rollup/`. Had its URLs encoded `/astro-knots/calmstorm-decks/…`, that move would have broken every link to it. A flat slug survives re-parenting as a one-line manifest edit.

### The toggle

Every node in the tree renders with a **"include descendants"** toggle:

- **Off** — only that stream's own entries. `ai-labs` shows its 12 fleet-level narratives.
- **On** — that stream plus its full subtree, merged date-descending, each entry badged with its origin slug. `ai-labs` shows ~230 entries across nine descendant streams.

Default: **on** for `fleet` and `product` nodes (the reason to visit a parent is to see what happened underneath it), **off** is meaningless for leaf `component` nodes (no descendants).

This is the same relationship the splashes implement by *copying files*, expressed instead as a view over one corpus. The site does not need a rollup step because it already holds every stream.

### One stream will dominate the global feed

`memopop-orchestrator` carries **71** entries and `augment-it` carries **94** — together **42%** of the ~389-entry corpus, from two components. A naive global date-descending feed is mostly those two.

Options, in preference order: (a) default the root feed to `fleet`- and `product`-altitude entries with descendants collapsed behind a per-day expander; (b) cap consecutive entries from one stream in the merged view; (c) leave it raw and let facets carry the weight. Needs a design pass against real data — flagged, not decided.

## The manifest, enumerated

All rows probed against the live API on 2026-08-08. Counts are `.md` files found at the declared `(ref, path)`.

### Fleet altitude — parent narratives

| slug | repo | ref | path | n |
|---|---|---|---|---|
| `astro-knots` | `lossless-group/astro-knots` | `master` | `changelog/` | 12 |
| `ai-labs` | `lossless-group/lossless-ai-labs` | `main` | `changelog/` | 12 |
| `content-farm` | `lossless-group/content-farm` | `main` | `changelog/` | 7 |

### Project altitude — `astro-knots` sites

| slug | repo | ref | path | n |
|---|---|---|---|---|
| `fullstack-vc` | `lossless-group/fullstack-vc` | `main` | `changelog/` | 25 |
| `banner-site` | `lossless-group/emblem-site` | `main` | `changelog/` | 12 |
| `hypernova-site` | `lossless-group/hypernova-site` | `master` | `changelog/` | 6 |
| `twf-site` | `lossless-group/the-water-foundation-site` | `main` | `changelog/` | 5 |
| `arthouse-site` | `lossless-group/arthouse-site` | `main` | `changelog/` | 4 |
| `learnstart-site` | `lossless-group/learnstart-site` | `main` | `changelog/` | 3 |
| `cilantro-site` | `lossless-group/cilantro-site` | `main` | `changelog/` | 2 |
| `cogs-site` | `lossless-group/cogs-site` | `main` | `changelog/` | 2 |
| `mpstaton-site` | `lossless-group/mpstaton-site` | `main` | `changelog/` | 2 |
| `coglet-shuffle` | `lossless-group/steampunk-site` | `main` | `changelog/` | 1 |
| `dark-matter` | `lossless-group/changelog_matter-site` | `main` | `` (root) | 25 |

`dark-matter` is shape **submodule-ref** — declared against the resolved standalone repo, not `matter-site`.

### Project altitude — `ai-labs` children

| slug | repo | ref | path | n |
|---|---|---|---|---|
| `augment-it` | `lossless-group/augment-it` | `rebuild/turbo-rsbuild` | `changelog/` | 94 |
| `dididecks-ai` | `lossless-group/dididecks-ai` | `development` | `changelog/` | 16 |
| `id-didi-sh` | `lossless-group/id-didi-sh` | `main` | `changelog/` | 7 |
| `context-vigilance-kit` | `lossless-group/context-vigilance-kit` | `master` | `changelog/` | 6 |
| `memopop-ai` | `lossless-group/memopop-ai` | `main` | `changelog/` | 5 |
| `corpora-builder` | `lossless-group/corpora-builder` | `main` | `changelog/` | 1 |

### Component altitude — the `memopop-ai` subtree (`parent: memopop-ai`)

| slug | repo | ref | path | shape | n |
|---|---|---|---|---|---|
| `memopop-orchestrator` | `lossless-group/investment-memo-orchestrator` | `main` | `changelog/` | submodule-ref | 71 |
| `memopop-native` | `lossless-group/memopop-ai` | `main` | `apps/memopop-native/changelog/` | nested-path | 6 |
| `memopop-site` | `lossless-group/memopop-ai` | `main` | `apps/memopop-site/changelog/` | nested-path | 3 |

`apps/memopop-web-app` has no `changelog/` yet — omit until it does, rather than declaring it `enabled: false`.

Note `memopop-native` and `memopop-site` share a repo with their parent `memopop-ai` but declare different `path` values. The sync cursor is therefore **per stream, not per repo** — three streams reading one repo must not share a cursor, or one stream's sync would mark the others' commits as already-seen.

### Project altitude — `content-farm` plugin modules

| slug | repo | ref | path | n |
|---|---|---|---|---|
| `perplexed` | `lossless-group/perplexed-plugin` | `main` | `changelog/` | 13 |
| `cite-wide` | `lossless-group/cite-wide` | `master` | `changelog/` | 9 |
| `image-gin` | `lossless-group/image-gin` | `master` | `changelog/` | 7 |
| `lmstud-yo` | `lossless-group/lmstud-yo` | `development` | `changelog/` | 3 |
| `plunk-it` | `lossless-group/plunk-it` | `development` | `changelog/` | 2 |
| `filestarter` | `lossless-group/obsidian-plugin-starter` | `development` | `changelog/` | 2 |
| `file-transporter` | `lossless-group/google-docs-api-plugin` | `development` | `changelog/` | 2 |
| `grab-reference` | `lossless-group/grab-reference` | `development` | `changelog/` | 1 |
| `image-wrangler` | `lossless-group/ai-image-wrangler-obsidian-plugin` | `development` | `changelog/` | 1 |
| `metafetch` | `lossless-group/metafetch` | `master` | `changelog/` | 1 |

### Project altitude — standalone / top-level

| slug | repo | ref | path | n |
|---|---|---|---|---|
| `self-host-stack` | `lossless-group/vc-self-host-stack` | `main` | `changelog/` | 13 |
| `lfm` | `lossless-group/lossless-flavored-markdown-package` | `main` | `changelog/` | 6 |
| `lossless-site` | `lossless-group/lossless-site` | `master` | `changelog/` | 1 |
| `neo` | `lossless-group/changelog-neo` | `main` | `` (root) | 1 |
| `parslee` | `lossless-group/changelog-parslee` | `main` | `` (root) | 0 |

**Total: 38 streams, ~389 entries.** `lossless-monorepo` itself has no `changelog/` on any branch tier and is deliberately absent.

Counts are a **2026-08-08 snapshot and already drifting** — `memopop-ai` gained two entries (3 → 5, one dated 2026-08-08) between two probes in the same session. Treat the `n` column as evidence the stream resolves, not as a number to assert anywhere in the UI.

### Deliberately excluded

- `astro-knots/splash/src/rollup/**`, `ai-labs/splash/src/rollup/**`, `content-farm/splash/src/rollup/**` — mechanical rollups (868 files).
- `site/src/generated-content/changelog--{content,code,laerdal}` — the legacy collections this spec retires. **Migration of their historical entries is an open question (see below).**
- `content/changelog--*` in `lossless-content` — same legacy shape.
- `context-v/skills/changelog`, `context-v/skills/changelog-conventions` — the skill itself, not entries.
- `data/changelog-data`, `tidyverse/changelog-scripts` — tooling, not entries.
- `calmstorm-decks` — relocated to `ai-labs/dididecks-ai/client-sites/`; still present as a **stale** rollup under `astro-knots/splash/src/rollup/`. A good argument for the frontmatter guard.

## Incremental ingest — adding one entry on push

The requirement: pushing a changelog file to a tracked stream should **add that one file to the stream**, not trigger a full re-fetch of all 38 streams.

Two costs must be separated. **Fetch cost** is the API fanout — a cold sync is ~38 directory listings plus ~389 blob fetches, and this is what must become incremental. **Build cost** is the Astro static build. A static site still rebuilds on any content change, but a ~389-file build is cheap and is not worth engineering around. *Incremental* here means incremental **sync**, not incremental rendering.

### Store

Synced entries are committed into this repo:

```
src/stream/<slug>/<filename>.md      # the entry, with injected provenance
src/stream/sync-state.json           # per-stream cursor: last commit SHA + ETag
```

Committing the corpus is deliberate and follows the precedent the splashes already set — they moved *away* from build-time API fetching because it cost ~60 calls per build, needed `GITHUB_TOKEN` plumbing in CI, and produced flaky builds on rate-limit or 5xx. This site would be roughly triple that fanout, so the same reasoning applies with more force. **CI must never need the GitHub API to build.**

Injected provenance on every synced file mirrors the rollup convention (`from`, `from_path`), plus `from_repo`, `from_ref`, `from_sha`, and `altitude`. Note the pleasing consequence: this site's own output carries `from:`, so it can never be re-ingested by anything applying layer-3 of the exclusion rule — including itself.

### Trigger tier 1 — org-level webhook (recommended)

One webhook on the `lossless-group` org, `push` events, pointed at `POST /api/ingest`:

1. Verify `X-Hub-Signature-256` against a shared secret. Reject unsigned.
2. Match `payload.repository.full_name` **and** `payload.ref` against the manifest. Ignore everything else — most org pushes are irrelevant.
3. Collect `commits[].added` + `commits[].modified` + `commits[].removed`, filter to the stream's `path` prefix and `.md`.
4. If empty → 204, no work.
5. Fetch only those blobs, apply the exclusion layers, write to `src/stream/<slug>/`, update the cursor, commit.
6. The commit triggers the deploy.

One configuration point covers all 38 streams **and** any stream added later — no per-repo setup. Requires org-admin access to create.

### Trigger tier 2 — `repository_dispatch` (rejected)

A workflow plus a PAT secret in each of ~30 repos. Thirty places to rotate a token, thirty places to forget one when a repo is added. Documented only to record why it wasn't chosen; fall back to it only if the org webhook is unavailable.

### Trigger tier 3 — scheduled cursor sync (fallback, required)

A cron GitHub Action in this repo, every ~6h. Webhooks are fire-and-forget and *will* be missed — a dropped delivery must not mean a permanently missing entry.

For each enabled stream: `GET /repos/{repo}/commits?path={path}&sha={ref}&since={cursor}`. That is **one call per stream** (~38) when nothing changed, and blob fetches only for genuinely changed files. Send `If-None-Match` with the stored ETag — **304 responses do not count against the rate limit**, so a quiet poll is close to free.

This tier is also the cold-start path and the re-sync path after a manifest edit.

### Deletions

`commits[].removed` and cursor-diff both surface deletions. An entry removed upstream should be removed from the stream — the aggregate reflects what the source says now, not what it once said.

## Open questions

1. **Historical migration.** Do the legacy `changelog--content` / `changelog--code` / `changelog--laerdal` entries (several hundred, back to 2025-03) get migrated into streams, or does the aggregate start fresh and the old collections stay archived at the current site? `changelog--laerdal` is client-named and needs the `client-anonymity` treatment either way.

2. **`augment-it`'s ref.** `rebuild/turbo-rsbuild` as both default branch and sole changelog carrier looks like a branch that outlived its name. Pinning a feature branch in the manifest is fragile — worth reconciling upstream before launch rather than encoding it here.

3. **`cilantro-site` duplication.** It has 2 entries at `cilantro-site/changelog/` *and* a standalone `changelog-cilantro-site` repo with 2 root entries. Unverified whether these are the same two entries. If they are, one source must win — likely the in-repo one, matching every other site.

4. **`dark-matter`'s shape.** Is `changelog/`-as-submodule a pattern being adopted deliberately (the `changelog_*` / `changelog-*` repos suggest an experiment) or a one-off? If deliberate, shape **C** becomes common and deserves first-class handling rather than a special case.

5. **Altitude in the feed.** Does a `fleet` entry nest its related `project` entries, collapse them, or merely render with a different badge? Needs a design pass once there is a feed to look at.

## References

- `context-v/skills/changelog-conventions/SKILL.md` — entry frontmatter, the four-audience cascade, "Roll-up at every level"
- `context-v/skills/pseudomonorepos/references/content-rollup.md` — the rollup mechanism this spec must avoid double-counting
- `context-v/skills/maintain-splash-pages/SKILL.md` — the splash pattern that produces `src/rollup/`
- `astro-knots/CLAUDE.md` — site independence, LFM integration, two-tier CSS tokens
