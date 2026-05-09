---
title: "YAML Frontmatter Parsing Must Be Lenient"
lede: "Across every Astro Knots site, content frontmatter parsing must tolerate messy YAML — log a warning and skip the file, never fail the whole build. No strict YAML parsers, ever."
date_created: 2026-05-08
date_modified: 2026-05-08
status: Published
category: Reminders
tags: [Frontmatter, Content-Collections, Build-Tolerance, Astro, YAML, Loaders]
authors:
  - Michael Staton
related_blueprint: "[[Managing-Complex-Markdown-Content-at-Build-Time]]"
---

# YAML Frontmatter Parsing Must Be Lenient

**Don't:** use a strict YAML parser for content frontmatter. That includes Astro's default `glob()` content loader, which pipes through `js-yaml` in strict mode via `safeParseFrontmatter` and crashes the entire build on a single indentation slip.

**Do:** wrap every content collection's loader so YAML parse errors are caught at the **property level**, logged as warnings with the offending path + key + line, and the **bad property is dropped while the rest of the file is preserved and rendered**. The file stays in the collection. The site continues to build.

**Critical:** the bad-syntax property is what gets skipped — not the whole file. A misindented list item under `abandoned_stack:` should drop `abandoned_stack` (or the malformed entry within it) and keep `title`, `name`, `headshot`, etc. The page still renders, just without the broken field. **Never** skip the entire file because one key has bad YAML.

## Why

Our content is authored by humans — often pasted from Obsidian, sometimes hand-edited under deadline. It will always contain occasional indentation slips, stray tabs, unquoted values, and loose lists. That is not a defect to be eliminated upstream; it is the operating reality of the system. The build pipeline must absorb that mess gracefully.

A strict parser turns one bad property into a site-wide outage. That is the wrong shape — and even file-level skipping is the wrong shape, because dropping a whole participant page (or session, or tool entry) because one of its 15 keys had a stray space is still a needless cliff. The right shape is property-level recovery: keep everything that parsed, drop only what failed, surface a warning, and move on.

This just bit `sites/fullstack-vc` on 2026-05-08: a single misindented list item under `abandoned_stack:` in `src/content/participants/mpstaton.md` killed `pnpm build` outright. The file in isolation was fixable in 30 seconds — but the underlying pipeline was the deeper problem. The build had no business failing for the whole site over it, *and* the build had no business losing the whole `mpstaton.md` profile either. The right outcome is: render the page with `title`, `name`, `headshot`, `current_stack`, `aspirational_stack` intact, drop the malformed `abandoned_stack` entry, log one warning.

## What "lenient" means here

Two layers, both must be lenient:

1. **YAML parse layer** — the stage that converts the `---` block into a JS object. Must support **property-level recovery**: when one key's value is malformed, drop that key and keep the rest. Recommended approach: use the `yaml` npm package's document-level API (`YAML.parseDocument()`), which returns a CST/AST with non-fatal errors attached per node. Walk the top-level mapping, attempt to materialize each key's value individually inside a try/catch, drop the keys that throw, and assemble the surviving keys into the returned object. As a fallback for parsers without a partial-recovery mode: a regex-based pre-pass that splits the frontmatter into top-level key blocks and attempts to parse each block independently. Either way, **never** call `js-yaml.load()` on the whole frontmatter and bail on the first error.
2. **Schema validation layer (Zod)** — runs after parse succeeds. Default to permissive schemas: `.optional()` liberally, `.passthrough()` so unknown keys don't throw, and accept date/string coercion (`z.coerce.date()`) rather than strict shapes. When a parsed value fails Zod validation, the loader should likewise **drop the property and keep the document**, not reject the whole entry. See the sibling reminder `[[Rule-to-Assure-Collection-Schema-is-Flexible]]`.

This reminder is specifically about layer 1. Layer 2 has its own reminder.

## How to apply

When scaffolding a new site, or whenever you touch `src/content.config.ts` in any existing site:

- **Do not** use a bare `glob({ pattern, base })` loader for any markdown collection where humans author the frontmatter.
- **Do** use a custom loader that wraps `glob()`, intercepts the file-read step, parses frontmatter with property-level recovery, drops broken keys, and emits warnings (not errors) per dropped key.
- The loader should live in a shared location per site (e.g., `src/lib/lenient-glob-loader.ts`) and be imported by every collection in `content.config.ts`. Once the pattern is proven, promote it into a shared package — strong candidate for `@lossless-group/lfm` or a sibling `@lossless-group/astro-content-loaders`.
- Acceptable parsers: the `yaml` npm package's `parseDocument()` API (gives you per-node errors and partial trees), or a custom key-by-key wrapper around `js-yaml.load()`. **Never** call `js-yaml.load()` on the whole frontmatter block as the only parse attempt. **Never** call `js-yaml`'s schema-tightening modes (`FAILSAFE_SCHEMA`, `JSON_SCHEMA` with strict flags, etc.) on frontmatter.
- Warnings must be specific: `[lenient-loader] sites/fullstack-vc/src/content/participants/mpstaton.md: dropped key 'abandoned_stack' (bad indentation at line 70). Keeping rest of file.` Vague warnings are useless; precise warnings let authors fix things later without blocking now.

## Load-bearing properties: escalate, don't silently drop

Some properties are **structurally required** — without them the document is orphaned, unroutable, or meaningless. Examples per collection:

- `participants`: `handle`, `name`
- `tools`: `title` (and the slug derived from filename, but that's not in frontmatter)
- `sessions`: `title`, `date_scheduled`
- `projects` / `working-groups`: `title`, `slug`, `status`
- `pages`: `title`

Any collection's loader maintains a small **load-bearing set** declared next to its schema. If the lenient parser drops or fails to produce a value for one of those keys, the loader must:

1. **Promote the warning to a prominent error log** — `[lenient-loader][LOAD-BEARING] {file}: required key '{key}' could not be parsed. Document cannot be served.` Use color/bold if the terminal supports it.
2. **Add the file to a per-build "needs-fix" list** that prints as a summary at the end of the build.
3. **Skip that one document** (the only case where file-level skip is acceptable) so the rest of the collection still builds.
4. **Continue the build.** Even load-bearing failures do not abort the whole site. The build succeeds, but the failing files are loud and impossible to miss.

This creates the fix-loop the user wants: build still ships, but the author sees `[LOAD-BEARING]` errors at the top of every build until they're fixed. Routine misindentations get a soft warning. Identity-level failures get a yellow-banner-of-shame.

The list of load-bearing keys is **discovered during implementation**, not specified up-front. Start with the obvious ones above, and escalate any property to load-bearing the first time silent skipping causes a real problem.
- Tool-generated frontmatter (e.g., the Jina/OpenGraph fetch pipeline writing into `tools/`) can be strict, because the producer is deterministic. Only human-authored collections need leniency. When in doubt: lenient.

## Triggers

When loading this reminder helps:

- Initializing a new site under `sites/` and writing its first `content.config.ts`
- Adding a new content collection to an existing site
- Reviewing or refactoring an existing site's loaders
- Debugging a `pnpm build` failure that points at a YAML/frontmatter parse error and crashes the whole build
- Anyone proposing to "just validate frontmatter on save" or other upstream-only fixes as a substitute for runtime tolerance — that is not the answer; runtime tolerance is non-negotiable

## Related

- `[[Rule-to-Assure-Collection-Schema-is-Flexible]]` — the Zod-layer companion to this reminder
- `[[Managing-Complex-Markdown-Content-at-Build-Time]]` — the broader blueprint on build-time content handling
