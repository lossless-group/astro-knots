---
site_uuid: fd1d57d6-b33f-4b77-811c-23d4c075d242
hex_code: x86kp4
title: "Preference for Shortcuts in Config to Absolute Paths"
lede: >-
  `../../../components/basics/DeckHeader.astro` breaks the moment you move the importer; `@components/…` reads the same from anywhere.
summary: "Establishes tsconfig `paths` aliases as the standard import style for Astro Knots sites, records the canonical eight-alias set the splashes share, and names the competing `vite.resolve.alias` pattern in use on mpstaton-site along with the editor-resolution cost of choosing it. Includes the current per-site adoption counts. Read when scaffolding a site's tsconfig or when a file move breaks a pile of imports."
status: Published
category: Reminders
publish: true
date_created: 2026-05-05
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
  - Reminder
  - TypeScript
  - Astro
  - Config
  - Import-Aliases
  - Developer-Experience
---

# Preference for Shortcuts in Config to Absolute Paths

**Don't:** `import DeckHeader from "../../../components/basics/DeckHeader.astro"`

**Do:** `import DeckHeader from "@components/basics/DeckHeader.astro"`

## Why

Deep relative paths get **crazy to follow**. Reading `../../../` tells you how far
up to climb, not where you land — you have to know the importing file's own depth
before the import means anything. The alias form is absolute from the project root
and reads identically from every file, at any nesting level.

The second cost is that relative paths are **positional, so they rot on every
move.** Relocating one component invalidates every `../` count that pointed at it,
and the failure is a build error per import rather than one place to fix.

## The canonical alias set

Shared verbatim by `astro-knots/splash`, `lfm/splash`, and `ai-labs/splash`:

```jsonc
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*":           ["src/*"],
      "@components/*": ["src/components/*"],
      "@content/*":    ["src/content/*"],
      "@layouts/*":    ["src/layouts/*"],
      "@lib/*":        ["src/lib/*"],
      "@loaders/*":    ["src/loaders/*"],
      "@pages/*":      ["src/pages/*"],
      "@styles/*":     ["src/styles/*"]
    }
  }
}
```

`baseUrl` is required — `paths` are resolved relative to it.

**No Vite config is needed.** Astro reads `tsconfig.json` `paths` and wires them
into the bundler itself. Confirmed 2026-08-17: none of the splashes declare a
`vite.resolve.alias`, and their aliased imports resolve at build.

## The competing pattern — and why tsconfig wins

`astro-knots/sites/mpstaton-site` declares aliases in `astro.config.mjs` instead:

```js
// Build aliases conditionally so standalone deployments don't depend on monorepo paths.
const aliases = { /* … */ };
// → vite: { resolve: { alias: aliases } }
```

That exists for a real reason — conditional resolution so the site can deploy
standalone, outside the monorepo. **But it has a cost that is easy to miss:**
`vite.resolve.alias` is a *bundler* concern. TypeScript and your editor know
nothing about it. On mpstaton-site, `@layouts`, `@components`, and `@lib` resolve
at build time but **not** in the editor, because its `tsconfig.json` declares only
`@brand`. You get working builds and broken go-to-definition.

**Default to tsconfig `paths`.** Reach for `vite.resolve.alias` only when
resolution genuinely has to vary by environment — and when you do, mirror the
aliases into `tsconfig.json` anyway so tooling keeps up.

## Current adoption

| Site | Deep relative (`../../../`) | Aliased | tsconfig `paths` |
|---|---|---|---|
| `ai-labs/splash` | 0 | 53 | full set |
| `content-farm/splash` | 0 | 5 | partial — missing `@lib`, `@styles` |
| `astro-knots/splash` | 2 | 36 | full set |
| `lfm/splash` | 12 | 33 | full set |
| `astro-knots/sites/mpstaton-site` | 42 | 52 | `@brand` only (rest via Vite) |
| `astro-knots/sites/fullstack-vc` | **101** | 0 | **none** |

`fullstack-vc` is the outlier worth fixing: 101 deep-relative imports and no
aliases declared at all.

## How to apply

- Scaffolding a site → paste the canonical block into `tsconfig.json` before
  writing the first component.
- Adding a new top-level `src/` directory → add its alias in the same commit.
- Touching a file with `../../` in an import → convert that import while you're
  there. Do not do a tree-wide rewrite as a side quest.
- Keep alias names matching directory names (`@layouts` → `src/layouts`). A
  cleverly-named alias is a second thing to learn.

## Origin

This reminder began as a pasted diff of the change that introduced the pattern to
`splash/tsconfig.json` — the original six aliases, before `@lib` and `@styles`
were added:

```diff
-  "exclude": ["dist"]
+  "exclude": ["dist"],
+  "compilerOptions": {
+    "baseUrl": ".",
+    "paths": {
+      "@/*": ["src/*"],
+      "@components/*": ["src/components/*"],
+      "@layouts/*": ["src/layouts/*"],
+      "@loaders/*": ["src/loaders/*"],
+      "@content/*": ["src/content/*"],
+      "@pages/*": ["src/pages/*"]
+    }
+  }
```

## Related

- [[Astro-Knots-is-not-a-True-Monorepo]] — why standalone-deployable sites are a
  constraint, and therefore why the Vite-alias variant exists at all
- [[Preferred-Stack]]
