---
site_uuid: 931fd3f7-0a8b-486f-882b-d3c3b07e891e
hex_code: c9910k
title: Verifying the Wikilink Resolver Migration on mpstaton-site
date_created: 2026-09-09
date_authored_initial_draft: 2026-09-09
date_authored_current_draft: 2026-09-09
date_modified: 2026-09-09
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Open
tags:
  - Issue
  - LFM
  - Wikilinks
  - Verification
  - Handoff
lede: "The migration is written, pushed, and provably identical to the rules it replaces — but nobody has watched it resolve a single real link, because the content it needs is behind two API tokens that only exist on another machine."
summary: "Pick-up doc for finishing the mpstaton-site wikilink migration on a machine that has GITHUB_PERSONAL_ACCESS_TOKEN and YOUTUBE_API_KEY. Records exactly what shipped, what was verified and how, the one unverified claim, the three environment blockers hit on NixOS and how each was cleared, and the specific check that remains. Read before touching remark-lossless-wikilinks-local.ts or src/config/wikilinks.ts."
publish: true
---

# Verifying the Wikilink Resolver Migration on mpstaton-site

**Date:** 2026-09-09
**Project/System:** `astro-knots/sites/mpstaton-site` — wikilink rendering via `@lossless-group/lfm@0.6.0`
**Status:** Code shipped and pushed. Verification incomplete, blocked on API tokens.

## Why this matters

`@lossless-group/lfm@0.6.0` exists *because* of this migration. The whole point of
publishing declarative path resolution was to stop every site hand-rolling the
same `startsWith` chain. mpstaton-site was the site carrying that hand-rolled
resolver, and it has now been switched over.

What has not happened is anyone watching it work. The site's content lives in
other repos and is pulled at build time through the GitHub API, and without a
token that fetch rate-limits at 60 requests/hour. So the build that would prove
the migration renders correctly has never run to completion with real content on
the machine where the work was done.

**This document exists so that verification can be finished without re-deriving
any of the analysis.**

## What shipped

Commit `83261ae` on `mpstaton-site` (`main`, `development`, `master` all at parity).

| Change | Detail |
|---|---|
| New | `src/config/wikilinks.ts` — destinations as data |
| Changed | 3 page templates now use `remarkLfmWikilinks` |
| Changed | essays page dev-warning rewired onto `onUnresolved` |
| Muted | `src/lib/remark-lossless-wikilinks-local.ts` — banner added, imported by nothing |
| Untouched | `scripts/wikilink-rules.ts` — still used by `scripts/audit-wikilinks.ts` |

`src/config/wikilinks.ts` is the file `scripts/wikilink-rules.ts` predicted in its
own header: *"the site's `src/config/wikilinks.ts` … same shape, single source of
truth."*

Two deliberate choices:

- **`slugFrom: 'tail'`** reproduces the old `slugifyTail` — strip the matched
  prefix, slugify the remainder, keep the slashes. LFM's `slugifyPath` excludes
  `/` from its character class for exactly this.
- **No `index` is supplied.** `createPathResolver` can resolve bare `[[Page]]`
  links by basename given a vault index, but this site has no local vault, and
  the old rules never resolved bare links either. Omitting it keeps behaviour
  identical rather than quietly changing what does and does not link.

## What was verified, and how

The old rules were transcribed and both implementations run over the same twelve
paths — nested, case-drifted, parked, and unmatched:

```
12 identical, 0 different
```

Including `Tooling/AI-Toolkit/Zod` → `…/toolkit/ai-toolkit/zod` in both, and
`organizations/Anthropic` staying unresolved in both (the old `DEFERRED_PREFIXES`
became `to: null` routes, which *claim* the path and resolve it to nothing —
preserving the distinction between "parked" and "nobody looked at this").

**That test is synthetic.** It proves the config is equivalent to the rules. It
does not prove the plugin is wired into the pages correctly.

## The one unverified claim

A full build did eventually run (with a borrowed token) and all 61 rendered
`context-vigilance` pages were scanned:

- **0** literal `[[…]]` leaked into output *outside* `<code>` tags
- **0** anchors carrying `class="wikilink…"`

The surviving literals were all inside `<code>` — documentation *about* wikilinks
— which is correct: the plugin visits text nodes only and skips code spans.

So: nothing is broken, nothing leaks, and **nothing was seen resolving either.**
That is consistent with two very different explanations and the evidence does not
distinguish them:

1. The fetched context-v corpus genuinely contains few or no wikilinks whose
   prefixes match the configured routes (`tooling/`, `essays/`, `concepts/`,
   `vocabulary/`, `projects/`, `sources/`, `lost-in-public/`). Most observed
   wikilinks were things like `[[essays/my-presentation.md|…]]` inside fenced
   examples.
2. The plugin is not actually running on those pages.

**Distinguishing these is the remaining work.**

## The check to run

On a machine with the tokens:

```bash
cd astro-knots/sites/mpstaton-site
pnpm dev        # or pnpm build && preview
```

Then either:

- Open a page you *know* should contain a resolvable wikilink and look at it, or
- Add a one-line temporary probe to a page template to print how many wikilinks
  the resolver saw, e.g. count invocations of `onUnresolved` against total
  `[[…]]` occurrences in `entry.body`.

The essays page already has a dev-only warning wired to `onUnresolved`; running
`pnpm dev` and watching that console output is the cheapest signal. **If it prints
nothing and there are wikilinks in the body, the plugin is not running.** If it
prints misses, the plugin is running and the routes simply do not cover those
paths — which is a config question, not a wiring one.

## Environment blockers hit, and how each was cleared

All three are fixed and committed; recorded because they cost most of the session.

**1. Undeclared dependency broke the build entirely.**
`remark-lossless-wikilinks-local.ts` imports `unist-util-visit`, which was never
in `package.json`. It resolved by accident of hoisting until a stricter install
layout stopped hoisting it. The build was already failing on `main` before any
migration work. Now declared.

**2. `pnpm install` exits 1 on this repo.**
`pnpm-workspace.yaml` carried pnpm 11's `allowBuilds:` block still at its literal
placeholder text — `esbuild: set this to true or false`. That is not a valid
answer, so pnpm refuses to run the build scripts and, unlike pnpm 10, treats it
as a hard failure. `pnpm build` never starts. Resolve to real booleans; both
are wanted (sharp is Astro's image pipeline, esbuild is Vite's).

**3. `bun: command not found`.**
The three `fetch-*` scripts invoke `bun` directly. It was briefly placed only in
the monorepo's `.#js` devshell, which meant the project's own build command
failed in a plain shell. Now installed system-wide via
`nixos-hypr-config/home/mps/dev-tools.nix`.

## The actual blocker

The fetch scripts check four names — `GITHUB_PERSONAL_ACCESS_TOKEN`,
`GITHUB_CONTENT_PAT`, `GITHUB_TOKEN`, `GH_TOKEN` — and warn *"Expect
truncation"* when none is set. `fetch-youtube-playlists.ts` wants
`YOUTUBE_API_KEY` and degrades to facade mode without it.

`mpstaton-site/.env.example` documents **neither**. There is no `.env` in the
repo. Anyone setting this site up on a new machine hits the same wall with no
written indication of what to supply.

**Smallest useful fix:** add both variables to `.env.example` with
`replace-me-…` placeholders, matching how `PROMOTE_SESSION_SECRET` and
`OPENPANEL_CLIENT_ID` are already documented there.

## If it turns out to be wrong

`src/lib/remark-lossless-wikilinks-local.ts` is muted, not deleted — banner at
the top, imported by nothing. Reverting is restoring three imports.

Do not delete it, or `scripts/wikilink-rules.ts`, until the check above has
actually passed. `scripts/audit-wikilinks.ts` still imports the latter; pointing
the audit at the shared config is its own piece of work.

## Related

- [[Workspace-vs-JSR-for-LFM-Consumers]] — the earlier LFM-consumption decision
- `lfm/context-v/Maintain-Path-Resolution-for-Wikilinks.md` — the 0.6.0 design record
- `astro-knots/context-v/loops/Propagate-an-LFM-Release-Across-Sites.md` — the loop this came out of
