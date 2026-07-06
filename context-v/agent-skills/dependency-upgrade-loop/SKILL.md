---
name: dependency-upgrade-loop
description: >
  Fan out across all active Astro Knots sites, upgrade dependencies in safe → risky
  order (patch/minor first, then major bumps like Astro and TypeScript), fix breaking
  changes, verify builds with `pnpm build` + `pnpm exec astro check`, write changelog
  entries, and push submodules. Loops until every site is current. Invoke via `/loop`
  to self-pace across all sites, or pass a specific site name to target one.
---

# Dependency Upgrade Loop — Astro Knots Sites

Full spec and per-phase prompt live in [[context-v/loops/Dependency-Upgrade-Loop.md]]. This skill surfaces that loop as an invocable Claude Code command.

## When to invoke this skill

- Running dependency upgrades across one or more Astro Knots sites
- A specific site has known outdated deps and needs build verification + changelog
- Handling a major Astro or TypeScript version bump that requires code fixes
- User says "run the upgrade loop" / "upgrade deps on [site]" / "update [site] to Astro 7"

## Quick invocation

**Upgrade all sites (loop until done):**
```
/loop dependency-upgrade-loop
```

**Target a single site:**
```
/loop dependency-upgrade-loop cilantro-site
```

## Active sites and current state (as of 2026-07-06)

| Site | Astro | TypeScript | Notes |
|---|---|---|---|
| cilantro-site | 5.14.1 | — | Most outdated — Astro 5→7 needed |
| arthouse-site | 6.1.8 | — | Astro 6→7 |
| mpstaton-site | 6.3.1 | — | Astro 6→7, `@astrojs/svelte` 8→9, `@astrojs/vercel` 10→11 |
| hypernova-site | 6.3.1 | 6.0.3 | Astro 6→7, `@astrojs/vercel` 10→11 |
| twf_site | 6.3.1 | 6.0.3 | Astro 6→7 |
| fullstack-vc | 6.4.8 | 6.0.3 | Astro 6→7 |

## Per-site upgrade procedure

All sites live as git submodules under:
```
/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/<site>/
```

### Step 1 — Inventory
```bash
cd /Users/mpstaton/code/lossless-monorepo/astro-knots/sites/<SITE>
pnpm outdated
```

Categorize: **safe** (patch/minor) vs **risky** (major). Tailwind patches are always safe.

### Step 2 — Safe updates first
```bash
pnpm update
pnpm build
```

### Step 3 — Major version upgrades (one at a time)
```bash
pnpm update <package>@latest
pnpm build
```

Fix breaking changes before moving to the next package.

### Step 4 — Type check
```bash
pnpm exec astro check
```

### Step 5 — Changelog entry
Write to `changelog/YYYY-MM-DD_NN.md` per [[changelog-conventions]].

### Step 6 — Commit and push submodule
```bash
# Inside the site dir:
git add -A
git commit -m "update(deps): upgrade Astro X→Y, TypeScript X→Y ..."
git push

# Back in astro-knots root:
cd /Users/mpstaton/code/lossless-monorepo/astro-knots
git add sites/<SITE>
git commit -m "update(submodule/<SITE>): bump to post-dep-upgrade tip"
```
Do NOT push the parent — only push the submodule.

## Known breaking change fixes

### Astro 5 → 6
- Replace `@astrojs/transitions` imports with `astro:transitions`
- `inlineStylesheets` moved to `build.inlineStylesheets` in `astro.config.mjs`
- Content Collections: `defineCollection` + `z` schema from `astro:content` (stable)
- Check `trailingSlash` config behavior

### Astro 6 → 7
- Run `pnpm exec astro build` and read inline deprecation warnings — Astro prints migration hints
- `@astrojs/vercel` 10→11: remove deprecated `edgeMiddleware` option; reconfigure `isr` per v11 docs
- `@astrojs/svelte` 8→9: add `legacy: { componentApi: true }` to svelte() integration in `astro.config.mjs` if using Svelte 4 syntax

### TypeScript 5 → 6
- Add `import type` for type-only imports if `verbatimModuleSyntax` enforces it
- Use `pnpm exec astro check` (Astro's bundled TS checker), not raw `tsc`

### Tailwind 4.x patches
Safe — `pnpm update tailwindcss @tailwindcss/vite` without concern.

## Issue escalation

If a site fails after 3 fix attempts, write:
```
sites/<SITE>/context-v/issues/Dep-Upgrade-Blocked-YYYY-MM-DD.md
```
Document the blocking package, the error, and what was tried. Move on to the next site.

## References

- [[context-v/loops/Dependency-Upgrade-Loop.md]] — full phase-by-phase prompt
- [[changelog-conventions]] — how to write changelog entries
- [[git-conventions]] — commit message format
- [[astro-knots]] — site independence model, pnpm rules
- [[pseudomonorepos]] — submodule commit/push discipline
