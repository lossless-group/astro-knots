---
site_uuid: 9e6d3abe-b5cf-4292-8a5e-c69f8ce55f5a
hex_code: y5s80q
title: "Continuous Integration for Astro Knots Sites"
lede: "Every Astro Knots site has a deploy workflow and none has a test. That is defensible right up until a site imports package source, ships a broken link, or renders raw `[[wikilinks]]` to production — none of which a successful build notices."
publish: true
date_created: 2026-08-17
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
summary: "How CI applies to the Astro sites specifically, where deploy workflows already exist everywhere and verification exists nowhere. Load when adding checks to a site, when a Pages deploy breaks after a dependency bump, or when deciding whether a site needs tests at all. Covers what an astro build already proves, the four checks worth adding to a content site, the source-vs-published-package decision and the resolution trap it creates, and astro check as the cheapest first win. The org-wide pattern is the anchor sibling."
tags:
  - Continuous-Integration
  - GitHub-Actions
  - Astro-Knots
  - Testing
  - Deployment
---

# Continuous Integration for Astro Knots Sites

> The general pattern — the verify/deploy split, `--ignore-workspace`, action currency, the hoisting trap — lives in the anchor monorepo at `context-v/blueprints/Continuous-Integration-with-GitHub-Actions.md`. **Read that first.** This document is only what differs for an Astro content site.

## Why Care?

Every site here ships through `Deploy splash to GitHub Pages` or a near-identical sibling, and not one of them runs a check before shipping. For a content site that is more defensible than it sounds — but it stops being defensible in three specific situations, and we have already hit all three.

## What `astro build` already proves

More than you would expect, which is why sites got away with no tests for so long. A successful build means:

- every content file passed its collection schema
- every `import` resolved
- every component compiled
- every page rendered to HTML without throwing
- every `getStaticPaths` produced a route

That is a real integration test, and it runs on every push already.

**What it does not prove** is anything about the *content* of the HTML. A page that renders `[[Some-Page]]` as literal text builds perfectly. So does one whose internal links all 404, or whose markdown pipeline silently stopped running a plugin. The build checks that the machine ran; nothing checks what came out.

## Four checks worth adding, cheapest first

### 1. `astro check` — the free one

```yaml
- run: pnpm exec astro check
```

Type errors in `.astro` frontmatter, unused props, bad component signatures. It usually already exists as a script. If a site adds exactly one check, this is the one.

### 2. Raw syntax leaking into rendered HTML

The failure mode LFM sites are most prone to, because it is invisible to the build and obvious to a reader. Grep the built output:

```yaml
- name: No raw markdown syntax in output
  run: |
    if grep -rlE '\[\[|\[!' dist --include="*.html" | grep -v '/llms'; then
      echo "::error::Unrendered wikilink or callout marker reached dist/"
      exit 1
    fi
```

This is not hypothetical. The `lfm` splash currently renders raw `[[wikilinks]]` on thirteen published pages, because its changelog and context-v collections go through Astro's own `renderMarkdown` rather than through LFM. A build-output grep would have caught it the day it started.

### 3. Internal links resolve

A link checker over `dist/` catches the renames and moved files that a build cannot see. Worth it on sites with heavy cross-linking; skip on small ones.

### 4. Real tests, when there is real logic

Most sites are content plus components and do not need a suite. A site with a resolver, a loader, or a data transform does. Put it in `pnpm test` and add the job from the anchor blueprint.

## The decision that creates most of the trouble: source or published package?

Astro Knots sites consume `@lossless-group/lfm` one of two ways, and the choice has CI consequences that are not obvious.

**Pinned to JSR** — `"@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^0.5.1"`. What almost every site does, and what [[Workspace-vs-JSR-for-LFM-Consumers]] says most sites should do. CI is simple: install, build, done.

**Importing package source** — `import { parseMarkdown } from '../../../src/index.ts'`. What the `lfm` splash does, deliberately: it makes the demo page a live integration test of the local package rather than a brochure for a published one.

The second buys real value and costs you this:

> **A nested site that compiles source from its parent inherits the parent's dependencies.** Node resolves a bare import by walking up from the *importing file*, so an import inside `../../src/preset.ts` resolves from the parent's `node_modules` and never from the site's — regardless of what the site's `package.json` declares.

So the workflow needs two installs, parent first:

```yaml
      - name: Install package deps (site compiles package source)
        working-directory: .
        run: pnpm install --frozen-lockfile=false --ignore-workspace

      - name: Install
        run: pnpm install --frozen-lockfile=false --ignore-workspace   # defaults to the site dir
```

This hides indefinitely on a developer machine, because you always have both installed and the site quietly borrows from one directory up. It surfaces the day a `pnpm/action-setup` bump installs a pnpm that hoists less — which is exactly how it surfaced on `lfm`, as two consecutive red deploys.

Reproduce it before pushing by hiding what CI does not have:

```bash
mv node_modules .node_modules_hidden
cd splash && pnpm build          # fails the way the runner fails
cd .. && mv .node_modules_hidden node_modules
```

## Splash deploys: what to watch

The `Deploy splash to GitHub Pages` workflow is replicated across roughly fourteen repos, so a fix to one is usually a fix to all of them. Two notes:

- **The Pages action trio moves together.** `configure-pages`, `upload-pages-artifact` and `deploy-pages` are a matched set acting on a live site. Bump them as their own change, not as a rider — unlike `checkout`, `setup-node` and `pnpm/action-setup`, which are safe to bump freely and are currently several majors behind across the tree.
- **`--ignore-workspace` is already there** in most of these, and it is load-bearing rather than incidental. Every site sits inside a pnpm workspace locally and does not on a runner.

## Adding this to a site

1. Start with `astro check` in the existing deploy workflow, before the build step. One line, immediate value.
2. Add the output grep if the site renders LFM content.
3. Only add a separate `test.yml` when there is logic worth asserting — follow the anchor blueprint's shape.
4. If the site imports package source, add the parent install and verify with the hidden-`node_modules` trick above.
5. Watch the first run and read the log, not just the checkmark.

## See also

- `lossless-monorepo/context-v/blueprints/Continuous-Integration-with-GitHub-Actions.md` — the general pattern this specializes
- [[Workspace-vs-JSR-for-LFM-Consumers]] — which consumption mode a given site should be in, and why only one site should be the sandbox
- `lfm/.github/workflows/pages.yml` — a splash deploy that installs parent deps first, with the reasoning inline
- [[Maintain-a-Github-Splash-Page-for-each-Repo]] — the deploy workflow every site inherited
