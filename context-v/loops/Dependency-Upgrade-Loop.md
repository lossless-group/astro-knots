---
title: "Dependency Upgrade Loop"
date_created: 2026-07-06
date_modified: 2026-07-06
authors:
  - mpstaton
augmented_with: "Claude Sonnet 4.6"
semantic_version: 0.1.0.0
tags:
  - Dependency-Management
  - Astro
  - TypeScript
  - Automation
  - Site-Maintenance
status: Active
lede: "Fan out across all active Astro Knots sites, upgrade dependencies, fix breaking changes, verify builds, write changelogs, and push — looping until all sites are clean."
---

# Dependency Upgrade Loop

Runs across all actively maintained Astro Knots sites. For each site: detects outdated packages, upgrades them in safe → risky order, fixes TypeScript and Astro breaking changes, verifies the build, writes a changelog entry, and pushes the submodule. Loops until every site is fully current.

**Invoke with:**
```
/loop Dependency-Upgrade-Loop.md
```

---

## Context for the Agent

### Working Directory
All sites live as git submodules under:
```
/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/
```

### Active Sites (in upgrade priority order)
1. `cilantro-site` — currently on Astro 5, most outdated
2. `arthouse-site` — Astro 6, needs verification
3. `mpstaton-site` — Astro 6→7 jump, has `@astrojs/svelte` and `@astrojs/vercel` major bumps
4. `hypernova-site` — Astro 6→7 jump, has `@astrojs/vercel` major bump
5. `twf_site` — Astro 6→7 jump, has TypeScript 6
6. `fullstack-vc` — Astro 6→7 jump, has TypeScript 6

### Skip these sites (not actively maintained / different workflow)
`dark-matter`, `banner-site`, `coglet-shuffle`, `cogs-site`, `hypernova-site` (check last)

### Package Manager
Always `pnpm`. Never npm, npx, or yarn.

### Do NOT use `workspace:*` dependencies
Sites deploy independently from their own repos. All deps must be published versions.

---

## Known Breaking Change Patterns

### Astro 6 → 7
- Content layer API: `getCollection()` and `getEntry()` from `astro:content` may have changed signatures
- `astro.config.mjs` adapter options may need updating
- Check release notes: `pnpm exec astro info` shows migration warnings
- `@astrojs/vercel` 10 → 11: `edgeMiddleware` option renamed or removed; `isr` config shape changed
- `@astrojs/svelte` 8 → 9: Svelte 5 runes mode enabled by default; `legacy.componentApi` option needed if using Svelte 4 syntax

### Astro 5 → 6 (for cilantro-site)
- Content Collections: `defineCollection` + `z` schema imports from `astro:content` stable
- View Transitions: import from `astro:transitions`, not `@astrojs/transitions`
- Trailing slash behavior changed — check `astro.config.mjs trailingSlash`
- `inlineStylesheets` option moved to `build.inlineStylesheets`

### TypeScript 5 → 6
- Stricter type inference on generics in some cases
- `verbatimModuleSyntax` may require `import type` for type-only imports
- Decorators: if using `experimentalDecorators`, check if behavior changed
- `@astrojs/check` bundles its own TypeScript — site TS version and check TS version may diverge; that's expected

### Tailwind 4.x patches (4.3.0 → 4.3.2)
Safe — run `pnpm update tailwindcss @tailwindcss/vite` without concern.

---

## Loop Prompt

You are running a dependency upgrade loop across Astro Knots client sites. Work through one site at a time, in the priority order listed in the Context section above. For each site, complete all phases before moving to the next. If a site fails and you cannot fix it within 3 attempts, write a clear issue note and move on — do not block the whole loop on one stubborn site.

### Phase 1: Inventory

For the current site, run from within the site directory:

```bash
cd /Users/mpstaton/code/lossless-monorepo/astro-knots/sites/<SITE>
pnpm outdated
```

Categorize every outdated package as:
- **Safe** (patch or minor bump): tailwind, sitemap, most `@astrojs/*` minor updates
- **Risky** (major bump): `astro` itself, `@astrojs/vercel`, `@astrojs/svelte`, `typescript`

If `pnpm outdated` shows nothing, run `pnpm build` to confirm clean state, write a brief "all current" note to the changelog, and move to the next site.

### Phase 2: Safe Updates First

Run within the site directory:
```bash
pnpm update
```

This updates packages within their declared semver ranges (safe). Then:
```bash
pnpm build
```

If the build fails after safe updates, diagnose before proceeding. Most common cause: stale lock file. Try:
```bash
pnpm install --frozen-lockfile
pnpm build
```

### Phase 3: Major Version Upgrades

For each risky (major) update, do one at a time:

```bash
pnpm update <package>@latest
pnpm build
```

If the build fails, check the breaking change patterns above and fix the code. Common fixes:

**For `@astrojs/svelte` 8→9:** Add `legacy: { componentApi: true }` to the svelte integration in `astro.config.mjs` if using Svelte 4 syntax:
```js
svelte({ legacy: { componentApi: true } })
```

**For `@astrojs/vercel` 10→11:** Check the adapter config in `astro.config.mjs`. Remove deprecated options like `edgeMiddleware` if present. The `isr` option shape changed — remove it and reconfigure per v11 docs if the site uses ISR.

**For Astro 5→6 (cilantro-site):** Check for `@astrojs/transitions` imports and replace with `astro:transitions`. Check content collection schemas for API changes.

**For Astro 6→7:** Run `pnpm exec astro build` and read the deprecation warnings carefully — Astro prints migration hints inline.

**For TypeScript 6:** Run `pnpm exec astro check` (not just `tsc`) — this uses Astro's bundled TS checker. Fix any new strict errors. Common pattern: add `import type` to type-only imports if `verbatimModuleSyntax` is enforced.

### Phase 4: Build Verification

Both of these must pass before proceeding:

```bash
# Type check
pnpm exec astro check

# Production build
pnpm build
```

A successful `pnpm build` with exit code 0 is the gate. Type errors from `astro check` are also blocking — fix them.

If the build produces warnings but exits 0, that's acceptable. Note warnings in the changelog.

### Phase 5: Changelog Entry

After a successful build, write a changelog entry for the site. The changelog lives at:
```
sites/<SITE>/changelog/
```

Follow the `changelog-conventions` skill format. Create a new file named with today's date and a short slug, e.g.:
```
2026-07-06-dependency-upgrades.md
```

Frontmatter template:
```yaml
---
title: "Dependency upgrades — Astro X, TypeScript X"
date: 2026-07-06
version: <bumped version from package.json>
tags:
  - Dependency-Management
  - Astro
  - TypeScript
---
```

Body: list every package that was upgraded with old → new version. Note any breaking changes fixed and how. Keep it factual — this is a maintenance record, not a feature announcement.

### Phase 6: Commit and Push the Submodule

Work inside the site's submodule (it has its own git repo):

```bash
cd /Users/mpstaton/code/lossless-monorepo/astro-knots/sites/<SITE>
git add -A
git commit -m "update(deps): upgrade Astro, TypeScript, Tailwind + fix breaking changes

- astro X.X.X → Y.Y.Y
- [other packages]
- Fixed: [breaking change fixes applied]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

Then update the parent monorepo submodule pointer:
```bash
cd /Users/mpstaton/code/lossless-monorepo/astro-knots
git add sites/<SITE>
git commit -m "update(submodule/<SITE>): bump to post-dep-upgrade tip

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Do NOT push the parent repo — only push the submodule. The user handles parent pushes.

### Phase 7: Loop Condition

After completing a site, check: are there remaining sites in the priority list that still have outdated dependencies? If yes, self-pace to the next site. If all sites are current and building cleanly, the loop is complete — report a summary of what was upgraded across all sites.

---

## Issue Escalation

If a site fails to build after 3 fix attempts on a breaking change, write an issue file:
```
sites/<SITE>/context-v/issues/Dep-Upgrade-Blocked-YYYY-MM-DD.md
```

Document:
- Which package version jump caused the failure
- The error message verbatim
- What fixes were attempted
- What is needed to unblock

Then move on to the next site. Do not halt the whole loop.

---

## References

- [[changelog-conventions]] — how to write changelog entries
- [[git-conventions]] — commit message format
- [[astro-knots]] — site independence model, pnpm rules, no workspace:* deps
- [[pseudomonorepos]] — submodule commit/push discipline
