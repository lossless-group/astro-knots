---
site_uuid: e6aeb427-6f22-4808-b721-f729251c8307
hex_code: xcxeli
title: "Nine hand-rolled frontmatter parsers, all functionally identical"
lede: "One YAML bug had to be fixed nine times. The nine copies turn out to be byte-different and behaviourally identical — the drift is brace style, nothing more."
summary: "Records the duplication of `src/loaders/frontmatter.ts` across nine Astro surfaces and the two defects it cost on 2026-08-18. Establishes by normalized comparison that all nine are FUNCTIONALLY IDENTICAL — six byte-hashes collapse to two, and those two differ only in brace style — so no site has earned a bespoke parser and consolidation is provably safe. Also records why LFM is not currently the owner: it is a rendering pipeline, and nothing in the tree owns content loading. Read before writing another splash loader, or before assuming LFM covers frontmatter."
status: Open
publish: true
date_created: 2026-08-18
date_modified: 2026-08-18
date_authored_initial_draft: 2026-08-18
date_authored_current_draft: 2026-08-18
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
tags:
  - Issue
  - Frontmatter
  - LFM
  - Astro-Knots
  - Code-Duplication
  - Content-Loaders
---

# Nine hand-rolled frontmatter parsers, all functionally identical

## What happened

On 2026-08-18 a single YAML defect had to be found once and fixed **nine times**,
in nine copies of the same file:

```
astro-knots/splash/src/loaders/frontmatter.ts
lfm/splash/src/loaders/frontmatter.ts
ai-labs/splash/src/loaders/frontmatter.ts
content-farm/splash/src/loaders/frontmatter.ts
ai-labs/augment-it/splash/src/loaders/frontmatter.ts
ai-labs/id-didi-sh/splash/src/loaders/frontmatter.ts
ai-labs/flave-ai/splash/src/loaders/frontmatter.ts
ai-labs/memopop-ai/apps/memopop-site/src/loaders/frontmatter.ts
context-v/skills/splash/src/loaders/frontmatter.ts
```

**They are all the same parser.** Nine files, 175–222 lines, six distinct
byte-hashes — but strip comments and whitespace and the six collapse to **two**,
and diffing those two yields nothing but brace style:

```
-if (colonIdx < 0) { i++; continue; }
+if (colonIdx < 0) {
+i++;
+continue;
+}
```

| Implementation | Surfaces |
|---|---|
| `29f1e827` (expanded braces) | astro-knots/splash, ai-labs/splash, content-farm/splash |
| `ccb30554` (compact braces) | lfm, augment-it, id-didi-sh, flave-ai, memopop-site, skills/splash |

Identical exports (`ParsedFrontmatter`, `parseFrontmatter`), identical helper set
(`readIndentedArray`, `splitFlowList`, `parseScalarOrFlow`, `findKeyColon`),
identical behaviour. **No surface has earned a bespoke parser.** That matters more
than the bug: it means consolidation cannot regress anyone, because there is no
site-specific behaviour to preserve.

Two surfaces escaped: `ai-labs/context-vigilance-kit/splash` uses Astro's built-in
`glob()`, and `astro-knots/sites/mpstaton-site` imports a real `yaml` package.
Both were unaffected, which is the tell.

### The defects

Each file carries a header saying *"Intentionally not a general YAML parser."*
The intent is defensible; the execution had two holes.

```js
if (rest === '' || rest === '|' || rest === '>') {
  const { items, consumed } = readIndentedArray(lines, i + 1);
  if (items !== null) { /* array */ }
  data[key] = null;
}
```

1. **Chomping indicators unrecognised.** `|` and `>` matched; `>-`, `>+`, `|-`,
   `|+` did not. So `lede: >-` fell through to scalar parsing and the value became
   the literal two-character string `">-"`. Live consequence, measured before the
   fix: `content-farm/splash` shipped
   `<meta name="description" content="&gt;-">` on every page whose lede used a
   folded scalar.
2. **Text blocks became `null`.** Even a *recognised* `|` returned null unless the
   indented body parsed as a list. So `subhead: |`, `cta_or_footer: |`, and
   `post_ship_note: |` have been silently null on every surface for as long as
   they have existed — nobody noticed, because null renders as nothing rather than
   as an error.

Defect 2 is the more expensive one. Defect 1 at least *looked* wrong.

### It reached the data, not just the render

`content-farm/splash/scripts/rollup-sync.ts` and its `astro-knots` twin import the
same parser, then **re-serialize** what they parsed. So the corrupted value was
written into the roll-up copies as `lede: ">-"` — a quoted string that looks
deliberate. The original text survived only because the source files were never
touched.

`ai-labs/splash/scripts/rollup-sync.ts` was unaffected for an instructive reason:
it preserves the frontmatter block **verbatim** and only appends `from` /
`from_path`. It does less, so it could not corrupt anything. **A roll-up that
re-serializes can only ever be as correct as its parser.**

## Why LFM does not currently solve this

The reasonable expectation is that `@lossless-group/lfm` owns this. It does not,
and the reason is a category difference worth stating plainly:

| | |
|---|---|
| **LFM is** | a remark/rehype **rendering** pipeline — directives, callouts, citations, link previews, embeds |
| **This is** | **content loading** — reading a `.md` file off disk and turning its frontmatter into typed data before Astro's content layer sees it |

LFM v0.5.1 exports `.`, `./types`, `./formats`, `./formats/yang`,
`./formats/json-schema`, `./formats/plantuml`. There is no loader export and no
frontmatter parser anywhere in `lfm/src/`. Its single frontmatter-adjacent file,
`src/utils/og-backends/frontmatter-only.ts`, reads *directive attributes*, not YAML.

So LFM never obviated this. It was never asked to. The gap is real; LFM is simply
not currently the thing that fills it.

## The plan existed and was not executed

`astro-knots/context-v/reminders/YAML-Frontmatter-Parsing-Must-Be-Lenient.md`
already says it, in the *How to apply* section:

> The loader should live in a shared location per site (e.g.
> `src/lib/lenient-glob-loader.ts`) and be imported by every collection in
> `content.config.ts`. **Once the pattern is proven, promote it into a shared
> package — strong candidate for `@lossless-group/lfm` or a sibling
> `@lossless-group/astro-content-loaders`.**

The pattern is proven — it is running on nine surfaces. The promotion never
happened, and `@lossless-group/astro-content-loaders` does not exist anywhere in
the tree. What happened instead is the default outcome when a shared thing has no
home: it got copy-pasted nine times. The saving grace is that it was only ever
copy-pasted — nobody diverged it on purpose, so the copies stayed in lockstep and
consolidation is still cheap. That will not stay true indefinitely.

## Options

1. **New sibling package — `@lossless-group/astro-content-loaders`.** Cleanest
   separation: LFM renders, this loads. Ten repos already consume LFM from JSR, so
   the publishing path is proven and a second package costs little.
2. **A subpath export on LFM — `@lossless-group/lfm/loaders`.** Fewer moving
   parts, one version to track. Costs LFM its clean identity as a rendering
   package, and drags Astro/Node-fs concerns into something currently
   environment-agnostic.
3. **Do nothing, keep nine copies.** Defensible only while they remain identical,
   which they currently are. The cost already showed up once as a nine-way fix;
   it recurs every time the frontmatter standard grows a field. Note this is
   legacy accumulation rather than a decision anyone made.

Option 1 is the recommendation, on the grounds that the environment coupling is
real: a content loader touches `node:fs` and Astro's loader API, and LFM currently
touches neither.

## Whatever gets built must keep these

Hard-won behaviour already encoded in the nine copies. Do not regress it:

- **Property-level recovery.** One malformed key drops that key, never the file,
  never the build. See [[YAML-Frontmatter-Parsing-Must-Be-Lenient]].
- **Load-bearing key escalation.** Some keys are structural; losing one means the
  document cannot be served. Those escalate loudly rather than dropping silently.
- **Block scalars, fully.** `|` `>` with `-` `+` chomping and explicit indent
  digits. Folded joins with spaces; literal preserves newlines.
- **Both spellings of aliased fields** — `at_semantic_version` / `semantic_version`,
  `lede` / `description`. A consumer resolving `a ?? b` needs both to survive.
- **Round-trip safety for re-serializers.** `formatScalar` in the roll-up scripts
  is correct and worth lifting wholesale: it quotes on a leading `|`/`>`, on `: `
  anywhere, on newlines, on booleans and numerics.

## Current state

The nine copies are patched, unit-tested, and building. Zero pages across every
`dist/` emit a bare indicator. `content-farm`'s roll-up data self-healed on
rebuild. **This issue is about the duplication, not the bug** — the bug is fixed
nine times over, which is exactly the problem.

## Related

- [[YAML-Frontmatter-Parsing-Must-Be-Lenient]] — the reminder that called for the
  shared package
- [[Rule-to-Assure-Collection-Schema-is-Flexible]] — the Zod-layer companion
- `lfm/context-v/Workspace-vs-JSR-for-LFM-Consumers.md` — how a shared package
  actually reaches consumers here, and the `workspace:*` trap to avoid
