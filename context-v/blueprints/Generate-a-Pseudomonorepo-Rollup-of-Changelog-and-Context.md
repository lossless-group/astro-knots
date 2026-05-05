---
title: "Generate a Pseudomonorepo Rollup of Changelog and Context"
lede: "How an Astro splash site for a pseudomonorepo aggregates each child submodule's changelog/ and context-v/ into one feed — with provenance, without runtime dependencies on the GitHub API, and without auth token plumbing in CI. The deliberate-sync model: a human runs `pnpm rollup:sync`, content lands in src/rollup/, gets committed, deploys like any other static asset."
date_created: 2026-05-04
date_modified: 2026-05-04
status: Authoritative
category: Blueprints
semantic_version: 0.0.0.1
tags:
  - Astro-Knots
  - Pseudomonorepo
  - Rollup
  - Content-Collections
  - GitHub-API
  - Build-Time
  - Deliberate-Sync
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
applies_to: Any Astro Knots splash or site for a pseudomonorepo
reference_implementation: lossless-group/content-farm splash/
---

# Generate a Pseudomonorepo Rollup of Changelog and Context

> **Status:** Authoritative — first encoding, derived from the content-farm splash implementation shipped 2026-05-04.

## What this blueprint solves

A pseudomonorepo (the [pseudomonorepos](../../../.claude/skills/pseudomonorepos/SKILL.md) skill) aggregates several child repos as git submodules. Each child often has its own `changelog/` and `context-v/`. The parent's splash page should surface those *together* — one chronological changelog feed, one grouped notes archive — not just the parent's own.

The naive solutions all have problems:

- **Glob the local submodule clones.** Requires submodules checked out at full depth in CI; bloats build; depends on parent's pinned commit (often stale vs. the child's actual `development`).
- **Fetch via GitHub Content API at every build.** Adds 30s to every build, requires `GITHUB_TOKEN` plumbing through to the build env, eats the rate limit on iterative dev, makes the build non-deterministic.
- **Copy by hand.** Drifts immediately.

This blueprint is the fourth option: **a deliberate-sync model.** A CLI script does the API fetching when a human asks; results land in `src/rollup/` as plain markdown files; from then on the build is pure file IO.

## The two-layer mental model

> Parent-authored content stays live; child-authored content syncs explicitly.

```
splash/
├── src/
│   ├── content/
│   │   └── plugin-highlights/        # local + curated, lives here always
│   └── rollup/                        # ← synced submodule content
│       ├── changelog/
│       │   ├── <child-slug>/
│       │   │   └── 2025-06-07_01.md
│       └── context-v/
│           ├── <child-slug>/
│           │   ├── blueprints/
│           │   ├── reminders/
│           │   └── specs/
│       └── README.md                   # auto-generated marker
└── scripts/
    └── rollup-sync.ts                  # the CLI

../changelog/                            # parent's own — read live
../context-v/                            # parent's own — read live
.gitmodules                              # source of truth for child URLs/branches
```

A function loader in `content.config.ts` unions:

1. The parent's own `changelog/` and `context-v/` (read directly, edits show up in `pnpm dev` immediately).
2. The synced `splash/src/rollup/` (committed files, no API calls at build time).

## Why "deliberate sync" over "fetch every build"

| Concern | Sync-on-build | Sync-on-demand |
|---|---|---|
| Build time | 30s+ (API calls dominate) | 1–2s (file IO) |
| CI auth | needs `GITHUB_TOKEN` env passthrough | none |
| Rate limits | every build counts toward 5000 req/hr | sync runs at human cadence |
| Diff visibility | invisible — content exists only at render time | `git diff src/rollup/` shows what changed |
| Determinism | depends on remote state at build time | what you commit is what deploys |
| Local dev | API calls on every dev-server restart | restarts in seconds |
| Content staleness | always fresh | bounded by sync cadence |

The only category sync-on-build wins: *freshness*. And that's what the sync script is for — the human decides when to refresh.

## Components

### 1. `.gitmodules` is the source of truth

The sync script reads the parent repo's `.gitmodules` to discover children. Each `[submodule "..."]` block contributes:

- `url` → derive `{owner}/{repo}` (strip `https://github.com/` prefix and `.git` suffix)
- `branch` → the ref to query against (default `development` per the [branch-alignment](../../../.claude/skills/pseudomonorepos/references/branch-alignment.md) convention)
- The leaf of `path` becomes the **provenance slug** (e.g. `plugin-modules/cite-wide` → `cite-wide`)

Submodules with non-GitHub remotes are skipped. Vendored upstream submodules (e.g. `obsidian-git`) are not specially marked here — they simply tend to lack `changelog/` and `context-v/` directories, and the loader treats their 404 as "nothing to roll up."

### 2. The fetcher

A pure function `fetchRolledUp(options) → entries[]` that:

1. Parses `.gitmodules`.
2. For each submodule, hits `GET /repos/{owner}/{repo}/contents/{remotePath}?ref={branch}`.
3. Walks subdirectories recursively.
4. For each `.md` file: fetches the raw content via the file's `download_url`.
5. Optionally tries fallback paths (e.g. `context-v/changelogs/` for legacy placement — see "Legacy placement" below).
6. Returns an array of entries with `from`, `from_path`, `legacy`, `data`, `body`, and `raw`.

Auth: reads `GITHUB_TOKEN` or `GITHUB_API_TOKEN` from `process.env`. Anonymous works (60 req/hr); authenticated (5000 req/hr) is recommended for any repeated use.

Failure modes:
- 404 on a directory → silent skip.
- 403 with rate-limit-exhausted → throw with a helpful message about which env var to set.
- Network error on one submodule → skip that submodule, continue with the rest, surface the error in the per-submodule report.

### 3. The sync CLI

A single TypeScript file invoked via `pnpm rollup:sync`. It:

1. Loads `splash/.env` for the token (best-effort; no `dotenv` dep).
2. Wipes `src/rollup/` (so removed-upstream entries don't linger).
3. Calls `fetchRolledUp` once per logical collection (changelog, context-v).
4. Writes each entry to disk at `src/rollup/<collection>/<slug>/<from_path>`.
5. Re-emits the original frontmatter plus injected `from`, `from_path`, and (where relevant) `legacy: true` fields.
6. Drops a one-line marker comment at the top of each file: `<!-- Rolled up from … Edit at the source, not here. -->`.
7. Writes a `src/rollup/README.md` explaining what the directory is.

Run it via Node directly with `--experimental-strip-types` (Node 22+) so no transpiler dep is needed. Loader-internal imports inside `src/loaders/` use relative paths so the script runs cleanly outside the Astro build context.

### 4. The union loader

`content.config.ts` defines a small `unionLoader` (Astro 5+ Loader-object form) that reads two directories and merges into one collection store:

- The parent's own content (e.g. `../changelog`, `../context-v`) — provenance set to the parent's slug (`content-farm`).
- The synced rollup directory (e.g. `src/rollup/changelog`, `src/rollup/context-v`) — provenance is the first path segment under the rollup root.

IDs are prefixed with provenance to avoid collisions: `cite-wide/2025-06-07_01`, `content-farm/2026-05-04_04`. URLs follow.

### 5. The schemas — every field optional

The schema validates expected fields with **lenient preprocessors** (z.preprocess that coerces empty strings and nulls to undefined; coerces dates from strings) and uses `.passthrough()` so unknown frontmatter survives unchanged. The provenance fields (`from`, `from_path`, `legacy`) are **optional** — if a stylistic quirk in one entry breaks parsing, the loader catches the error, logs a warning, and stores the raw frontmatter instead of failing the build.

This is non-negotiable. Frontmatter across the farm spans many months, many hands, and many conventions. Hard validation rejects perfectly readable entries over stylistic drift.

## Legacy placement (the changelog/context-v intersection)

Some early Lossless plugins (notably `cite-wide` and `image-gin`) store changelog-shaped files under `context-v/changelogs/` rather than at a top-level `changelog/`. The convention has since stabilized at `changelog/` parallel to `context-v/`, but back-rewriting the old placements is the kind of churn that breaks parallel sessions and isn't worth doing as a side effect.

So the rollup honors both:

- The changelog fetch hits `changelog/` (current) AND `context-v/changelogs/` (fallback). Entries from the fallback get `legacy: true` injected so the UI can flag them.
- The context-v fetch *filters out* `changelogs/` paths so the same files don't show up on both feeds.

Without this dual-path handling, half the actual ship history of older plugins quietly disappears from the rolled-up feed.

## Provenance, in the UI

Every rolled-up entry carries:

- `data.from` = `<plugin-slug>` (or `'<parent-slug>'` for parent-authored content)
- `data.from_path` = path within the source repo's content root (e.g. `blueprints/Lossless-Citation-Standards.md`)
- `data.legacy` = `true` when from a fallback path (optional)

Renderable:

- **List cards**: `◆ <plugin-slug>` tag in the meta row, only when source isn't the parent.
- **Detail pages**: same tag in the article header, plus a `legacy` pill where applicable.

The visual treatment is intentionally understated. Provenance is information, not decoration.

## Tech-hierarchy notes (Astro Knots compliance)

- **No `gray-matter`, no `js-yaml`.** A ~150-line in-tree YAML subset parser scoped to the frontmatter shape we author is enough. (Block-style arrays, flow-style arrays, quoted/unquoted scalars, booleans, numbers, comments. No anchors, no nested mappings, no multi-line block scalars.)
- **No additional runtime deps.** Node's built-in `fetch` for the API; built-in `node:fs/promises` for IO; Astro's `astro/loaders` `glob` for the local content collection.
- **`@latest` Astro.** The skill rule. Currently 6.x.
- **Path aliases declared in `tsconfig.json`** for code imports (`@components`, `@layouts`, `@loaders`, `@content`, `@pages`, `@/*`). Loader-internal files use relative imports so the sync script (run via plain `node`) doesn't need a path-mapping shim.

## File checklist (when adopting this on a new site)

- [ ] `splash/scripts/rollup-sync.ts` — the CLI.
- [ ] `splash/src/loaders/parseGitmodules.ts` — `.gitmodules` parser.
- [ ] `splash/src/loaders/githubContentApi.ts` — minimal Content API client.
- [ ] `splash/src/loaders/frontmatter.ts` — YAML subset parser.
- [ ] `splash/src/loaders/rollupFetch.ts` — the build-target-agnostic fetcher.
- [ ] `splash/src/content.config.ts` — `unionLoader` reading parent + rollup.
- [ ] `splash/package.json` — `"rollup:sync": "node --experimental-strip-types --no-warnings scripts/rollup-sync.ts"`.
- [ ] `splash/src/rollup/.gitkeep` (or just commit the populated dir).
- [ ] `splash/.env.example` — `GITHUB_API_TOKEN=` placeholder.
- [ ] `splash/.gitignore` — ensure `.env` ignored, `src/rollup/` *not* ignored.
- [ ] `splash/README.md` — document `pnpm rollup:sync` and when to run it.
- [ ] CI workflow — *don't* pass `GITHUB_TOKEN`; *don't* `submodules: recursive` (no longer needed for content).

## When to run `pnpm rollup:sync`

- A child plugin shipped a noteworthy `changelog/` entry you want surfaced.
- A child published a new spec, blueprint, or note worth featuring.
- You bumped a child's submodule pointer.
- Periodic refresh (suggested: weekly). Could be cron-ed locally; keeping it manual until that drift becomes painful.

Each sync produces a `git diff` showing exactly what changed. Commit message convention: `sync(rollup): refresh from <reason>`.

## Reference implementation

`lossless-group/content-farm` splash. Key commits:

- `ship(rollup): aggregate every plugin's changelog/ and context-v/` — first version (sync-on-build).
- *(forthcoming)* `refactor(rollup): switch to deliberate-sync` — the architecture this blueprint encodes.

The content-farm splash deploys to <https://lossless-group.github.io/content-farm/>. Its `/changelog` and `/context-v` listings demonstrate the pattern in production.

## Cross-references

- `pseudomonorepos/references/content-rollup.md` (skill) — the original convention, written before the deliberate-sync model. Some of the API-on-every-build framing in that file should be revised to point here once this blueprint is reviewed.
- `pseudomonorepos/references/branch-alignment.md` (skill) — why every submodule's `branch =` defaults to `development`.
- `changelog-conventions` (skill) — the frontmatter shape rolled-up entries should preserve.
- `astro-knots/references/playbooks/github-pages-deploy.md` (skill) — the deploy target this rollup feeds.
- `astro-knots/SKILL.md` § Hard Prohibitions — why the rollup uses no extra deps.

## Follow-ups

- **Cron the sync** in CI as a scheduled workflow (e.g. weekly) that runs `pnpm rollup:sync`, opens a PR if `src/rollup/` has changes. Removes the human cadence dependency without giving up the diff-visibility benefit.
- **`repository_dispatch` triggers** from each child's CI → an automated sync PR on the parent splash whenever a child ships. More precise, more setup. Defer until cron drift is painful.
- **Caching** in the sync script — keyed by `{owner}/{repo}/{branch}/{sha}` — would let `pnpm rollup:sync` short-circuit unchanged submodules. Currently it always re-fetches everything; a clean sync uses ~60-70 API calls.
- **Normalize legacy `context-v/changelogs/`** placements in cite-wide and image-gin (one `git mv` per file). Until that pass happens, the fallback path keeps those entries surfacing on `/changelog`. Tracked as a quiet cleanup task, not a blocker.
