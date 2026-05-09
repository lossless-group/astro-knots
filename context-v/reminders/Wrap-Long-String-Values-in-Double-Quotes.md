---
title: "Wrap Long String Values in Double Quotes"
lede: "Long YAML string values — descriptions, titles with punctuation, URLs with query strings, ledes — should always be wrapped in double quotes. Cheap insurance against the entire class of YAML-syntax-collision bugs."
date_created: 2026-05-08
date_modified: 2026-05-08
status: Published
category: Reminders
tags: [Frontmatter, YAML, Conventions, Property-Conventions, Content-Collections]
authors:
  - Michael Staton
related_blueprint: "[[Managing-Complex-Markdown-Content-at-Build-Time]]"
related_reminder: "[[YAML-Frontmatter-Parsing-Must-Be-Lenient]]"
---

# Wrap Long String Values in Double Quotes

**Don't:** leave long, human-authored YAML string values unquoted. Long strings — descriptions, ledes, titles with punctuation, URLs with query strings or fragments, prompt text, error messages — reliably contain at least one character that has special meaning in YAML.

**Do:** wrap any string value that is more than a few words, or that contains URL syntax / punctuation / symbols, in double quotes (`"`).

## Correct

```yaml
title: "Secure Document Sharing — #1 DocSend Alternative"
description: "An open-source document and data-rooms sharing platform. Free alternative to DocSend with custom branding and document tracking."
og_image: "https://www.papermark.com/_static/meta-image.png?v=2&utm=share"
lede: "A safe, non-judgemental support session — nobody here knows what they're doing either."
zinger: "Stop writing data rooms by hand. Ship one in 10 minutes."
```

## Incorrect (works until it doesn't)

```yaml
title: Secure Document Sharing — #1 DocSend Alternative
# ^ `#` starts a YAML comment. Everything after it is silently dropped.

description: An open-source platform: free alternative.
# ^ The mid-string `:` can be parsed as a nested mapping in some contexts.

og_image: https://example.com/img.png?a=1&b=2
# ^ `&` introduces a YAML anchor. Some parsers tolerate it; others don't.

lede: He said, "this won't parse"
# ^ Mid-string quotes inside an unquoted scalar create ambiguity.
```

## Why

Any long human-authored string is likely to contain at least one of: `:` `#` `&` `*` `>` `|` `!` `%` `@` ` `` ` `` `,` `[` `]` `{` `}` — and every one of those has special meaning to a YAML parser when the value is unquoted. Wrapping in `"` makes the value a literal string and eliminates the entire class of "works on my machine, breaks in CI" bugs in one move.

It is cheaper to make wrapping a habit than to debug a single instance of a `#` silently truncating a description three weeks after it was written.

This reminder is the *value*-side companion to `[[YAML-Frontmatter-Parsing-Must-Be-Lenient]]` (the *parser*-side rule). Authors quote their long values; loaders tolerate it when authors forget.

## When quoting is unnecessary

Short, alphanumeric, no-punctuation values do not need quotes:

```yaml
status: active
slug: papermark
publish: true
date_created: 2026-05-08
tags: [Open-Source-Alternatives, Founder-Toolkit]
```

The rule is not "quote everything." The rule is "quote anything that could plausibly contain a YAML-significant character." When in doubt: quote.

## Single quotes vs. double quotes

Default to **double quotes**. They allow standard escape sequences (`\n`, `\"`, `é`) and match the dominant style across the codebase. Use single quotes (`'`) only when the value itself contains a literal `"` and you don't want to escape it.

## Applies to

Every YAML frontmatter block in:

- All site content collections (`src/content/**/*.md`)
- All `context-v/` documents (specs, prompts, blueprints, reminders, explorations, issues)
- All changelog entries
- All deck slide files
- Any other YAML or YAML-bearing file in the Astro Knots ecosystem
