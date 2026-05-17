---
title: "Astro Frontmatter: Avoid Inline Block Comments and Risky Regex Literals"
lede: "Astro's `.astro` frontmatter is parsed by esbuild's TS pipeline before reaching the runtime, and the parser sometimes misclassifies `/* */` block comments and certain regex-literal shapes when they appear in expression-adjacent positions. The error message reports a position past EOF on the affected line, which makes the bug feel like a phantom. Workaround: prefer line comments and string methods in `.astro` frontmatter where you'd reach for an inline block comment or a slash-heavy regex."
date_created: 2026-05-17
date_modified: 2026-05-17
status: Published
category: Reminders
tags:
  - Astro
  - Astro-Frontmatter
  - Esbuild
  - Parser-Quirk
  - Comments
  - Regex
  - Shell-Lift-Lessons
authors:
  - Michael Staton
related_reminder:
  - "[[YAML-Frontmatter-Parsing-Must-Be-Lenient]]"
---

# Astro Frontmatter: Avoid Inline Block Comments and Risky Regex Literals

**Don't:** drop `/* trailing block comments */` after statement terminators, or rely on complex multi-slash regex literals, inside an `.astro` file's frontmatter (the `---` … `---` block at the top). Both shapes can trip Astro's esbuild-backed TS pre-parser into a regex-vs-divide ambiguity that surfaces as `Unterminated regular expression` with a column position past the end of the line.

**Do:** prefer line comments (`// …`) over inline block comments inside the frontmatter, and prefer string methods (`startsWith`, `endsWith`, `indexOf`, `split`, `lastIndexOf`, `slice`) over regex literals when the logic is simple enough.

## The two specific shapes that bite

### Inline block comment after a statement

```ts
// In an .astro frontmatter block:
const staticPorted = authoredSlotFiles; /* every per-slide file is by definition a static-play port */
```

The parser sees `;` and re-enters expression-position. The `/*` that follows can be lexed as the start of a regex literal rather than a block comment. Build fails with `Unterminated regular expression`, column reported past the line end.

**Fix** — replace with a line comment:

```ts
// Every per-slide file is by definition a static-play port.
const staticPorted = authoredSlotFiles;
```

### Multi-segment regex literal in expression-adjacent position

```ts
// Same context:
const m =
  p.match(/^\/data\/(?:firms|investors)\/([^/]+)\/portfolio\//) ??
  p.match(/^\/data\/([^/]+)\/portfolio\//);
```

Heavy slash-laden patterns inside `match()` chains have been observed to push the parser into the same regex-vs-divide ambiguity. The patterns themselves are syntactically valid; the parser's classification of the surrounding context is the issue. Same error signature: `Unterminated regular expression`, position past EOF.

**Fix** — use string-method extraction when the structure is amenable:

```ts
function firmSlugFromPath(p: string): string {
  const parts = p.split("/").filter(Boolean);
  if (parts[0] === "data" && (parts[1] === "firms" || parts[1] === "investors") && parts[3] === "portfolio") {
    return parts[2];
  }
  if (parts[0] === "data" && parts[2] === "portfolio") return parts[1];
  return "(unknown)";
}
```

Or, if a regex is genuinely the right tool, **hoist it to a `const` at the top of the file** so it's not parsed in expression-adjacent position:

```ts
const FIRM_FROM_INVESTOR_PATH = /^\/data\/(?:firms|investors)\/([^/]+)\/portfolio\//;
const FIRM_FROM_TOP_PATH      = /^\/data\/([^/]+)\/portfolio\//;

function firmSlugFromPath(p: string): string {
  const m = FIRM_FROM_INVESTOR_PATH.exec(p) ?? FIRM_FROM_TOP_PATH.exec(p);
  return m ? m[1] : "(unknown)";
}
```

## The diagnostic signature

When this trap fires, the build error looks like:

```
Unterminated regular expression
  Location:
    /path/to/Component.astro:112:49
```

The `:49` column is the giveaway — line 112 is often a one-character `}` or a line of normal length, and esbuild's "where the regex should have ended" position lands past the actual line end. **Don't waste time looking AT line 112**; the real culprit is an inline `/* */` or a multi-slash regex literal *somewhere earlier in the file*. Bisect by commenting the script section in halves until the error moves.

## Where this applies

- The `---` … `---` script block at the top of every `.astro` file (page or component).
- Specifically inside `.astro` files served by Astro's build/dev pipeline; ordinary `.ts` files don't have this issue because they go through TypeScript's parser directly, not Astro's pre-parse.

## Where this does NOT apply

- JSX / template region of the `.astro` file (below the closing `---`). Block comments are HTML comments there (`<!-- … -->`) anyway.
- Plain `.ts` / `.tsx` / `.js` files imported by `.astro` files. Move complex regex helpers out to a `.ts` module if the frontmatter parser balks.
- Comment blocks at the top of the frontmatter (the JSDoc header). Those parse cleanly because they're at the start of the script, not expression-adjacent. **However:** any `*/` sequence INSIDE a JSDoc block (e.g. paths like `data/**/portfolio/*.md` written into the doc) will terminate the block early. Spell out the path in prose or wrap in backticks when documenting glob shapes in JSDoc.

## Why this happens

Astro's TS frontmatter pre-pass uses esbuild. ESBuild — like any JS/TS parser — has to decide at each `/` token whether it's a division operator or the start of a regex literal. The decision is context-sensitive (regex literals only appear in expression position; division only after a value). When the surrounding expression shape is unusual (semicolon-then-block-comment, optional-chain-then-replace, regex-against-regex with `??`), the heuristic occasionally classifies wrong. The error is a downstream consequence: the parser commits to "regex literal" and then can't find a closing `/`.

This is not a syntax error in any standard. It's a parser tolerance gap. The workarounds above sidestep the gap entirely.

## Related

- [[YAML-Frontmatter-Parsing-Must-Be-Lenient]] — the value-parsing companion (loaders should tolerate authoring noise).
- `astro-knots` skill — the broader Astro Knots conventions; this reminder is a candidate for promotion if the trap keeps biting.
- Realized examples that prompted this reminder: `dididecks-ai/apps/deck-shell/src/components/DeckStatsPanel.astro` (2026-05-17) and the data-assets routes from the same date.
