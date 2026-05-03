---
title: "Maintain a Branch-Aware LFM Dev Mode"
lede: "A per-site swap script that lets a development branch consume @lossless-group/lfm from the local workspace while every deployable branch consumes the canonical JSR build — so production deploys can never accidentally ship a workspace link."
date_created: 2026-05-03
date_modified: 2026-05-03
publish: false
slug: maintain-branch-aware-lfm-dev-mode
at_semantic_version: 0.0.0.1
status: Draft
category: Blueprints
authors:
  - Michael Staton
augmented_with: "Claude Opus 4.7"
tags: [Astro-Knots, LFM, JSR, Workspace, Vercel, Branch-Aware]
---

# Maintain a Branch-Aware LFM Dev Mode

> **Status:** Implemented in `sites/mpstaton-site` (canonical reference)
> **Applies to:** Any astro-knots site that consumes `@lossless-group/lfm` and where the maintainer also actively develops LFM in `packages/lfm/`
> **Implementation file:** `sites/mpstaton-site/scripts/lfm-mode.mjs`

---

## Why this exists

Astro-knots sites consume `@lossless-group/lfm` from the **JSR registry** (canonical, public, no auth). Vercel deploys each site standalone from its own git repo and runs `pnpm install --frozen-lockfile`. Two compounding things break that flow:

1. **A `workspace:^` specifier mismatches the lockfile** the moment LFM is bumped locally, so frozen-lockfile rejects the install.
2. **Workspace links can't resolve in the deploy environment anyway** — there is no parent `pnpm-workspace.yaml` when Vercel pulls just the site's repo.

The temptation is to set the site's LFM dep to `workspace:^` while developing LFM features alongside the site. That worked locally and broke `mpstaton-site`'s Vercel deploy in May 2026.

The pattern below keeps the convenience of local LFM development while making it impossible to accidentally ship a workspace link to production: deployable branches always carry a JSR-pinned `package.json` and a JSR-resolved lockfile.

---

## The convention

| Branch (in the **site's** repo) | LFM source | `package.json` spec | `.npmrc` |
|---|---|---|---|
| `main`, `master`, anything not listed below | **JSR** | `npm:@jsr/lossless-group__lfm@^X.Y.Z` | `ignore-workspace=true` |
| `development`, `develop`, `dev` | **local workspace** | `workspace:^` | `ignore-workspace=false` |

Two valid JSR consumption shapes are already in the wild:

- `"npm:@jsr/lossless-group__lfm@^0.2.2"` + explicit `@jsr:registry=https://npm.jsr.io` — see `sites/mpstaton-site` and `sites/fullstack-vc`.
- `"jsr:^0.2.2"` (pnpm's native JSR protocol) — see `sites/calmstorm-decks`.

This blueprint uses the first form because it's the most explicit and works on any pnpm version that supports npm aliases.

**Hard rule:** Never commit a workspace-mode `package.json` or lockfile to a deployable branch. Run `pnpm lfm:jsr` before merging from `development` to `main`.

---

## What to add to a site

### 1. `scripts/lfm-mode.mjs`

```js
#!/usr/bin/env node
// Swap @lossless-group/lfm between the local workspace and JSR.
//
//   pnpm lfm:local  — point at packages/lfm/ in the parent monorepo
//   pnpm lfm:jsr    — point at JSR (canonical, what Vercel needs)
//   pnpm lfm:auto   — pick based on the site's git branch
//
// Convention: branches in LOCAL_BRANCHES use the workspace; everything else
// (notably main/master, which is what Vercel deploys) uses JSR.
// Never commit a workspace-mode package.json/lockfile to a deployable branch.

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const JSR_SPEC = 'npm:@jsr/lossless-group__lfm@^0.2.2';
const WORKSPACE_SPEC = 'workspace:^';
const LOCAL_BRANCHES = new Set(['development', 'develop', 'dev']);

const arg = process.argv[2] ?? 'auto';
const mode = arg === 'auto' ? autoDetect() : arg;
if (mode !== 'local' && mode !== 'jsr') {
  console.error(`Usage: lfm-mode.mjs <local|jsr|auto>`);
  process.exit(1);
}

function autoDetect() {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  return LOCAL_BRANCHES.has(branch) ? 'local' : 'jsr';
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.dependencies['@lossless-group/lfm'] = mode === 'local' ? WORKSPACE_SPEC : JSR_SPEC;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

const npmrc = readFileSync('.npmrc', 'utf8')
  .split('\n')
  .filter((l) => !/^\s*ignore-workspace\s*=/.test(l));
const flagLine = `ignore-workspace=${mode === 'jsr' ? 'true' : 'false'}`;
writeFileSync('.npmrc', [flagLine, ...npmrc].join('\n').replace(/\n{3,}/g, '\n\n'));

console.log(`→ ${mode === 'local' ? 'workspace LFM' : 'JSR LFM'}; regenerating lockfile...`);
execSync(
  `pnpm install --lockfile-only ${mode === 'jsr' ? '--ignore-workspace' : ''}`.trim(),
  { stdio: 'inherit' }
);
```

**Per-site customization:** bump `JSR_SPEC` to whatever LFM version range the site needs. Verify the version exists with `curl -s https://jsr.io/@lossless-group/lfm/meta.json`.

### 2. `package.json` scripts

```json
{
  "scripts": {
    "lfm:local": "node scripts/lfm-mode.mjs local",
    "lfm:jsr": "node scripts/lfm-mode.mjs jsr",
    "lfm:auto": "node scripts/lfm-mode.mjs auto"
  }
}
```

### 3. `.npmrc` (JSR mode — committed default)

```
ignore-workspace=true
shamefully-hoist=true
auto-install-peers=true
strict-peer-dependencies=false
@jsr:registry=https://npm.jsr.io
```

The `ignore-workspace` line will be flipped by the swap script; everything else is stable.

### 4. Initial `package.json` dep

```json
{
  "dependencies": {
    "@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^0.2.2"
  }
}
```

---

## Daily workflow

### Working on a deployable branch (`main`)

Nothing to do. The site is already in JSR mode. `pnpm install` and `pnpm dev` use the published LFM.

### Picking up an unreleased LFM feature

```bash
# In the site
git checkout development          # or create it: git checkout -b development
pnpm lfm:auto                     # or: pnpm lfm:local
# Now @lossless-group/lfm resolves to packages/lfm/ in the workspace.
# Edit packages/lfm/, see changes immediately in the site.

# When the LFM feature is ready:
#   1. Bump packages/lfm/package.json + deno.json, run `pnpx jsr publish --allow-dirty`
#   2. Update JSR_SPEC in scripts/lfm-mode.mjs to the new version range
#   3. Switch back:
git checkout main
pnpm lfm:auto                     # → JSR mode, regenerates lockfile
# Commit + push the JSR-mode package.json + lockfile from main
```

### Before merging `development` → `main`

```bash
git checkout main
pnpm lfm:jsr                      # forces JSR even if branch detection misfires
```

This guarantees the merge target lockfile is JSR-resolved.

---

## Verification

These are the exact checks that mirror Vercel's behavior:

```bash
# From inside the site directory:
pnpm install --frozen-lockfile --ignore-workspace --lockfile-only
```

If this passes, Vercel will pass. If it fails, **do not push** — run `pnpm lfm:jsr` and re-verify.

Inspect the resolved tarball in `pnpm-lock.yaml` to confirm JSR origin:

```yaml
'@jsr/lossless-group__lfm@0.2.2':
  resolution:
    tarball: https://npm.jsr.io/~/11/@jsr/lossless-group__lfm/0.2.2.tgz
```

A `link:` or `workspace:` resolution in the lockfile on `main` is the failure mode this whole pattern exists to prevent.

---

## Known pitfalls

- **The script removes any prior `ignore-workspace=` line and prepends a fresh one.** Comments above that line move down. Cosmetic — doesn't affect behavior.
- **Branch detection runs in the site's repo, not the parent monorepo's repo.** The site is the deployable unit, so this is correct, but a contributor used to working in `astro-knots`-level branches may be surprised. The site's `git rev-parse --abbrev-ref HEAD` is what counts.
- **`workspace:^` requires the site to be discoverable from the parent's `pnpm-workspace.yaml`.** If the site was added recently as a submodule, ensure it's listed in `pnpm-workspace.yaml` at the monorepo root before running `pnpm lfm:local`.
- **Detached HEAD (e.g. mid-rebase) makes `auto` fall through to JSR mode** because the branch name comes back as `HEAD`. That's a safe default, but be aware.
- **`pnpm lfm:local` regenerates the lockfile to use the workspace.** If you commit that lockfile to a deployable branch by mistake, the only fix is to run `pnpm lfm:jsr` and commit the corrected lockfile — there's no hot-fix on Vercel.

---

## Adoption checklist for a new site

- [ ] Site is consuming `@lossless-group/lfm` from JSR (one of the two valid forms above).
- [ ] `.npmrc` has `ignore-workspace=true` and `@jsr:registry=https://npm.jsr.io`.
- [ ] Copy `scripts/lfm-mode.mjs` from `sites/mpstaton-site/`.
- [ ] Update `JSR_SPEC` in the copied script to the version range this site needs.
- [ ] Add `lfm:local`, `lfm:jsr`, `lfm:auto` npm scripts.
- [ ] Run `pnpm lfm:auto` from `main` — should report "→ JSR LFM" and regenerate the lockfile cleanly.
- [ ] Run `pnpm install --frozen-lockfile --ignore-workspace --lockfile-only` to confirm Vercel-equivalent passes.
- [ ] Document in the site's README (or onboarding doc) that `development` is the LFM-dev branch.

---

## Related

- `context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md` — LFM package spec
- `context-v/blueprints/Maintain-Extended-Markdown-Render-Pipeline.md` — how sites render LFM output
- `sites/mpstaton-site/scripts/lfm-mode.mjs` — canonical implementation
- `sites/fullstack-vc/.npmrc`, `sites/calmstorm-decks/.npmrc` — alternative JSR consumption shapes
