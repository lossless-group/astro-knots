# Workspace vs JSR for LFM Consumers

**Date:** 2026-05-05
**Project/System:** Astro-Knots monorepo — pnpm workspace and `@lossless-group/lfm` consumption
**Components/Files Affected:**
- `astro-knots/pnpm-workspace.yaml` (added `../lfm` as a workspace member)
- `astro-knots/sites/fullstack-vc/package.json` (over-switched to `workspace:*`)
- `astro-knots/sites/reach-edu-hub/package.json` (over-switched to `workspace:*`)
- `astro-knots/sites/calmstorm-decks/package.json` (over-switched to `workspace:*`)
- `astro-knots/sites/mpstaton-site/package.json` (correctly on `workspace:*` — already has the mode-switcher)
- `astro-knots/sites/twf_site/package.json` (correctly unchanged — excluded from workspace via `'!sites/twf_site'`)
- `lossless-monorepo/lfm/` (new sibling repo: <https://github.com/lossless-group/lossless-flavored-markdown-package>)

**Status when written:** Nothing committed in astro-knots — the `workspace:*` swaps and the `pnpm-workspace.yaml` line are sitting unstaged in the working tree, waiting on the deliberate fix described below.

## The Problem

When extracting `packages/lfm/` from astro-knots into its own public GitHub repo (`lossless-flavored-markdown-package`) and wiring it back as a sibling pnpm workspace member at `lossless-monorepo/lfm/`, four workspace-resident sites had their `@lossless-group/lfm` dependency changed from a JSR pin to `workspace:*`:

- `sites/fullstack-vc`
- `sites/reach-edu-hub`
- `sites/mpstaton-site`
- `sites/calmstorm-decks`

The intent was to deliver the "no JSR publish-bump-import round-trip during dev" that drove the extraction in the first place. The execution over-reached: only **one** site needed the workspace consumption — the rest should have stayed pinned to JSR.

## Why It Matters

`workspace:*` resolves only inside the workspace context. It points at the workspace member's directory at `pnpm install` time. That works perfectly for `pnpm dev` from a fully-checked-out astro-knots tree.

It probably **breaks remote deploys**. Vercel (and any similar deploy host) checks out only the site's directory, not the parent workspace. When `pnpm install` runs in that environment, there's no `../lfm` workspace member to resolve to — install fails or installs a phantom shim, and the build can't find `@lossless-group/lfm`.

Sites that need to *publish* to the internet need a real, registry-resolvable dependency (JSR). Only the dev sandbox needs the symlink.

## The Right Strategy

**One site as the LFM dev sandbox** consumes the workspace. Everything else stays on JSR.

`mpstaton-site` is the right sandbox because it already established the pattern: it has `lfm:local`, `lfm:jsr`, and `lfm:auto` package.json scripts backed by `scripts/lfm-mode.mjs` that swap the dependency between local and JSR forms. That tooling exists precisely because the workspace-vs-JSR distinction is a recurring concern, and was the prior team's solution to it.

The new `../lfm` workspace member at `lossless-monorepo/lfm/` is now the canonical "local mode" source for that script.

## What Didn't Work

### Treating "no round-trip" as a per-site requirement

The user's stated goal was to avoid the publish-bump-import cycle when working *on LFM*. That's a per-developer concern — solved with one workspace consumer that the developer dev's against. Generalising it to "every site avoids round-trips" turned a dev-ergonomics fix into a deploy-fragility risk.

### Failing to read the existing tooling

`mpstaton-site/scripts/lfm-mode.mjs` was sitting right there. Its existence is a strong signal that the workspace-vs-JSR question had already been answered for this monorepo: opt-in per site, switchable per developer, never a blanket flip. The extraction work proceeded as if that signal didn't exist.

## Current State (what's pending in the working tree)

```
unstaged in astro-knots:
  pnpm-workspace.yaml                      + ../lfm                     ← keep
  sites/fullstack-vc/package.json          → "workspace:*"              ← REVERT
  sites/reach-edu-hub/package.json         → "workspace:*"              ← REVERT
  sites/calmstorm-decks/package.json       → "workspace:*"              ← REVERT
  sites/mpstaton-site/package.json         → "workspace:*"              ← keep (sandbox)
  pnpm-lock.yaml                           refreshed                    ← will refresh again on revert

staged in astro-knots:
  packages/lfm/  (24 files)                deletions                    ← keep, the package now lives at ../lfm
```

## When You Get Around to Fixing It

```bash
# 1. Revert the three over-switched sites back to JSR pins
#    (bumping the two that were on ^0.2.1 to ^0.2.2 while you're there)
```

| Site | Revert to |
|---|---|
| `sites/fullstack-vc/package.json`     | `"@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^0.2.2"` |
| `sites/reach-edu-hub/package.json`    | `"@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^0.2.2"` |
| `sites/calmstorm-decks/package.json`  | `"@lossless-group/lfm": "jsr:^0.2.2"` |

```bash
# 2. Refresh the lockfile
cd astro-knots && pnpm install

# 3. Verify the symlink only exists for mpstaton-site
readlink sites/mpstaton-site/node_modules/@lossless-group/lfm   # → ../../../../../lfm
readlink sites/fullstack-vc/node_modules/@lossless-group/lfm    # → real package dir, not a workspace symlink
```

## Forward-Looking Notes

- **The `lfm:local`/`lfm:jsr`/`lfm:auto` scripts in `mpstaton-site`** are no longer the only way to do this — `workspace:*` is now baked in. The scripts may still be useful for occasional "force JSR mode for a deploy preview" testing, but they're now a secondary tool, not the primary mechanism.
- **A blueprint or context-v note titled something like "Adopting a Sibling Package Without Breaking Site Deploys"** would be worth writing once this resolution lands, so the pattern is documented before the next package extraction.
- **CI safety:** any automated check that runs `pnpm install` from a site directory in isolation will catch this class of mistake. Worth adding to a CI pipeline for the workspace-resident sites if not already there.

## Origin

Issue introduced 2026-05-05 during the LFM repo extraction work. Caught the same session, before commit, by the user spotting the over-reach in the pnpm-workspace + per-site `package.json` diffs. Documented here so the deliberate revert can be done at a calmer moment without re-deriving the analysis.
