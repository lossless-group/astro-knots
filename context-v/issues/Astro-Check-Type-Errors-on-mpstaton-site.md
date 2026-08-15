# Astro Check Type Errors on mpstaton-site

**Date:** 2026-05-03
**Project/System:** `sites/mpstaton-site`
**Surfaced by:** `pnpm astro check` after wiring Mermaid + bare-link auto-unfurl
**Build status:** `pnpm build` PASSES — these are typecheck-only failures. They block `astro check` (and any CI gate that runs it) but not Vercel deploys.

## Snapshot

`pnpm astro check` reports **8 errors, 0 warnings (some marked as warning here for lint-style noise), 70 hints** across 83 files. Grouped by root cause:

| # | Group | Files | Errors | Predecessor in `lossless-monorepo/site`? |
|---|---|---|---|---|
| 1 | Missing `mdast` types | `AstroMarkdown.astro` | 1 | **Yes** — same import, but lossless-site has `@types/mdast` resolvable via its dep tree |
| 2 | `parseMarkdown(entry.body)` signature mismatch | three `[...slug].astro` pages | 3 | No — mpstaton-site invented this pattern |
| 3 | `doc.data.title` may be undefined | `context-vigilance/index.astro` | 1 | No — mpstaton-site-specific |
| 4 | `Buffer` vs `BodyInit` in `new Response()` | `pages/api/og.ts` | 1 | No — lossless-site uses `@vercel/og`'s `ImageResponse`, a different implementation |
| 5 | Orphaned `originalOrder` reference | `pages/portfolio/index.astro` | 2 | No — mpstaton-site-specific |

Only **#1** has a real predecessor in `lossless-monorepo/site`. The user's instinct to check predecessors is right for that one; the other four groups are mpstaton-site-local issues.

---

## 1. Missing `mdast` type declarations

**Error:**
```
src/components/markdown/AstroMarkdown.astro:2:115 - error ts(2307):
  Cannot find module 'mdast' or its corresponding type declarations.
```

**Code site:**
```ts
import type { Root, Content, Heading, List, ListItem, Link, Image, Code, InlineCode, Paragraph, Blockquote } from "mdast";
```

**Root cause:** `AstroMarkdown.astro` was copied from `lossless-monorepo/site/src/components/markdown/AstroMarkdown.astro`, where the same import exists. mpstaton-site doesn't have `@types/mdast` in its dep tree — `@lossless-group/lfm` re-exports MDAST types but only via its own surface, not the bare `'mdast'` module specifier. The runtime bundler resolves these to `any` and works fine; only `tsc` complains.

**Suggested fix:** Add `@types/mdast` as a devDependency on mpstaton-site:
```bash
pnpm add -D @types/mdast --ignore-workspace
```
Then the import resolves and the unused-import warnings (`Paragraph`, `ListItem`) become actionable cleanups.

**Predecessor check:** Verify whether the same import compiles cleanly in `lossless-monorepo/site/src/components/markdown/AstroMarkdown.astro`. If it does, lossless-site has `@types/mdast` resolvable somewhere in its tree (transitive from a remark-* dep, probably) — replicate that.

---

## 2. `parseMarkdown(entry.body)` — `string | undefined` not assignable to `string`

**Errors:**
```
src/pages/context-vigilance/[...slug].astro:21:34 - error ts(2345)
src/pages/essays/[...slug].astro:19:34         - error ts(2345)
src/pages/notes/from-the-rabbit-hole/[...slug].astro:19:34 - error ts(2345)
```

Three identical errors:
```ts
const tree = await parseMarkdown(entry.body);
//                               ^^^^^^^^^^
//   Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

**Root cause:** Astro 6's content-collection types make `entry.body` `string | undefined` because some loaders (image-only collections, data-only frontmatter) emit entries without a body. `@lossless-group/lfm`'s `parseMarkdown` expects a `string`. The runtime works because all three of these collections always have a body, but the type system can't prove that.

**Suggested fix (any of):**
- **Cheapest:** `await parseMarkdown(entry.body ?? '')` — accepts the type and renders an empty doc for entries that somehow lack one (unreachable in practice).
- **Cleaner:** narrow earlier — `if (!entry.body) return Astro.redirect('/404');` then `parseMarkdown(entry.body)` after the guard.
- **Cleanest:** loosen LFM's `parseMarkdown` signature to accept `string | undefined` and return an empty tree when given undefined.

**Predecessor check:** lossless-site doesn't use `parseMarkdown(entry.body)` — its renderer pipeline is different. No predecessor pattern to align with.

---

## 3. `doc.data.title` may be undefined

**Error:**
```
src/pages/context-vigilance/index.astro:84:15 - error ts(2322):
  Type 'string | undefined' is not assignable to type 'string'.

      title={doc.data.title}
```

**Root cause:** The `context-v` content-collection schema in `src/content.config.ts` declares `title: z.string().optional()` — so `doc.data.title` can be `undefined`. The downstream component requires `title: string`.

**Suggested fix (any of):**
- `title={doc.data.title ?? doc.id}` — falls back to the slug ID, which is always present.
- Make the consuming component's `title` prop optional.
- Tighten the schema: `title: z.string()` (then the catalog of fetched docs must have titles, which seems true already — context-v entries all do).

**Predecessor check:** Not from lossless-site. The content-collection-driven schema is mpstaton-site-specific.

---

## 4. `Buffer<ArrayBufferLike>` not assignable to `BodyInit`

**Error:**
```
src/pages/api/og.ts:259:25 - error ts(2345):
  Argument of type 'Buffer<ArrayBufferLike>' is not assignable to parameter of type 'BodyInit | null | undefined'.

      return new Response(pngBuffer, { ... });
```

**Root cause:** This is a known TypeScript / `@types/node` v20+ regression where Node's `Buffer` type narrowed in a way that no longer satisfies `BodyInit` from `lib.dom.d.ts`. Affects every project that does `new Response(someNodeBuffer)`. Runtime works perfectly — it's purely a typing impedance.

**Suggested fix (any of):**
- **Cheapest:** `return new Response(pngBuffer as unknown as BodyInit, { ... })` — explicit cast at the boundary.
- **Cleaner:** Convert to `Uint8Array`: `return new Response(new Uint8Array(pngBuffer), { ... })` — `Uint8Array` is a valid `BodyInit` and the conversion is zero-copy on V8.
- **Cleanest:** Switch to `@vercel/og`'s `ImageResponse` (what lossless-site does) — it returns a proper `Response`-compatible object. Heavier rewrite.

**Predecessor check:** lossless-site has `src/pages/toolkit/[...slug]/og.png.ts` using `@vercel/og`'s `ImageResponse` — different implementation, no shared bug. mpstaton-site rolled its own Satori + resvg-js path.

---

## 5. `originalOrder` is not defined; `row` implicit any

**Errors:**
```
src/pages/portfolio/index.astro:468:7  - error ts(2304): Cannot find name 'originalOrder'.
src/pages/portfolio/index.astro:468:30 - error ts(7006): Parameter 'row' implicitly has an 'any' type.
```

Plus a related warning on the same file:
```
src/pages/portfolio/index.astro:414:9  - warning ts(6133): 'allRows' is declared but its value is never read.
```

**Root cause:** Looks like a mid-edit broken state. Line 414 declares `const allRows = ...` but never reads it; line 468 references `originalOrder` which is never declared anywhere in the file. Almost certainly a refactor where `allRows` was renamed to `originalOrder` (or vice versa) and the rename didn't finish, or where the snapshot logic ("save the original order so we can restore it after re-sorting") was deleted but a consumer of it survived.

**Suggested fix:** Read `pages/portfolio/index.astro` lines 410-470, decide which of:
- `allRows` should be renamed to `originalOrder` (and the unused warning resolves), OR
- Line 468 should reference `allRows` (and `originalOrder` was accidental).

Then add an explicit type to the `.forEach((row) => ...)` callback (e.g. `(row: HTMLTableRowElement)` since `allRows`/`originalOrder` is typed that way).

**Predecessor check:** No equivalent file in lossless-site. mpstaton-site portfolio is a custom build.

---

## Lint-style hints (not errors, worth a sweep)

These show up as warnings, don't fail the build, but are easy wins:

- `src/components/markdown/AstroMarkdown.astro:2` — `Paragraph` and `ListItem` imported but never used. Remove from the import after the `mdast` types resolve.
- `src/components/markdown/YouTubeEmbed.astro:36` (and Shorts:32, Playlist:27) — `frameborder="0"` is deprecated HTML. Switch to `style="border: 0"` or just remove (modern iframes default to no border).
- `src/pages/promote/[slug]/index.astro:8` — `materialUrl` imported but unused. Trim the import to `{ visibleMaterials }`.
- `src/pages/promote/[slug]/deck/[format]/[version].astro:5` — `hubUrl` imported but unused. Trim to `{ parseVersionParam }`.
- `src/pages/promote/[slug]/deck/[format]/index.astro:5` — `hubUrl` imported but unused. Remove the line entirely.

---

## Recommended order of operations

1. **#1 first** — `pnpm add -D @types/mdast --ignore-workspace`. Cheapest, makes `AstroMarkdown.astro` typecheck-clean and resolves the unused-import noise in one stroke.
2. **#5 next** — read 50 lines of `portfolio/index.astro`, decide which name was the rename target, finish it. Removes 2 errors + 1 warning.
3. **#2 batch** — apply the `?? ''` fix to all three `[...slug].astro` pages (or relax `parseMarkdown`'s signature in LFM if you'd rather solve it upstream). Removes 3 errors at once.
4. **#3** — `doc.data.title ?? doc.id` one-liner.
5. **#4** — pick the `as unknown as BodyInit` cast or the `Uint8Array` wrap.

After all five, `astro check` should report 0 errors and a much shorter warnings list. The remaining hints are unused imports — a quick pass.

## Predecessor follow-ups (lossless-site)

The user noted: "*I may need to go fix the components that were throwing errors in their predecessor instances in the lossless-site.*"

Of the 5 error groups, only **#1 (`mdast` types)** has a real predecessor (`lossless-monorepo/site/src/components/markdown/AstroMarkdown.astro` has the same `import type { ... } from "mdast"` line). Worth confirming whether lossless-site's `tsc` is happy with that import — if yes, it has `@types/mdast` resolvable somewhere in its tree and the fix is to mirror that dep. If no, lossless-site has the same dormant issue and a fix there benefits both.

The other four groups are mpstaton-site-only patterns (custom OG image generator, custom portfolio page, custom content-collection consumers, custom site-wide schema with optional titles) — no predecessor parity work needed.
