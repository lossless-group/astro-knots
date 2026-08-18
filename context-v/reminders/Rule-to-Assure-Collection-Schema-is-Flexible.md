---
site_uuid: d2d84118-164a-4005-a70c-ef32bda6bbfa
hex_code: fo0sf1
title: "Rule to Assure Collection Schema is Flexible"
lede: >-
  A lenient Zod schema doesn't remove the failure, it moves it — the build goes green and the date renders blank instead.
summary: "The Zod-layer companion to [[YAML-Frontmatter-Parsing-Must-Be-Lenient]], which covers the parse layer. Establishes permissive-by-default collection schemas across every Astro Knots site, the canonical `lenient*` helper set, the drop-the-property-not-the-document rule, and — critically — the failure mode leniency introduces: a schema that requires nothing cannot protect a consumer that reads a field the document doesn't have. Read before writing or touching any `src/content.config.ts`."
status: Published
category: Reminders
tags:
  - Frontmatter
  - Content-Collections
  - Build-Tolerance
  - Astro
  - Zod
  - Schema
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
date_created: 2025-10-07
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
at_semantic_version: 0.0.1.0
publish: true
related_blueprint: "[[Managing-Complex-Markdown-Content-at-Build-Time]]"
---

# Rule to Assure Collection Schema is Flexible

**Don't:** write a content collection schema that requires a field, rejects an
unknown key, or demands an exact type. Every one of those turns an authoring slip
into a build failure.

**Do:** make every field optional, add `.passthrough()`, and coerce rather than
validate. When a value fails, **drop the property and keep the document.**

This is layer 2 of two. Layer 1 — tolerating malformed YAML during the parse
itself — is [[YAML-Frontmatter-Parsing-Must-Be-Lenient]]. Both must hold; a
lenient parser feeding a strict schema still fails the build.

## Why

**Our frontmatter is loosely adherent by design, not by accident.** Content is
hand-authored, pasted out of Obsidian, and written across years during which the
conventions themselves changed. The spec that describes ideal frontmatter opens
by saying so: *"In practice, frontmatter is scattered… This document describes the
aspirational baseline for new files — not a validator's checklist."*

A schema that enforces the aspiration against the reality just breaks the site.
Concretely, in this corpus you will encounter, all legitimately:

- `at_semantic_version` **and** `semantic_version` — permanently-accepted aliases
  for the same property, ~4,140 files to ~330
- `lede` **and** `description` — both accepted
- `date_authored_final_draft:` **present but deliberately empty** — the empty key
  is the signal that finality is being tracked
- documents with no dates at all, and documents whose only dates are editorial
- keys no current site reads, which cost nothing to carry and must never be deleted

## The canonical helper set

Already implemented across the tree — copy it, don't reinvent it. From
`astro-knots/splash/src/content.config.ts`:

```ts
const lenientString = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().optional(),
);

const lenientDate = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.coerce.date().optional(),
);
```

…plus `lenientStringArray` (which also promotes a bare string to a one-element
array), `lenientNumber`, and `lenientBoolean`.

Two things make these work:

1. **The `preprocess` step maps `''` and `null` to `undefined`.** This is the
   load-bearing part. `date_authored_final_draft:` with no value parses as `null`,
   and `z.coerce.date()` turns `null` into the Unix epoch rather than rejecting
   it — so without the preprocess you get a silently wrong 1970 date, which is
   worse than an error.
2. **`.passthrough()` on the object** so unknown keys survive into `entry.data`
   instead of throwing.

Sixteen `content.config.ts` files in this tree already use `.passthrough()`. It
is the established pattern, not a proposal.

## The trap: leniency moves the failure, it does not remove it

**This is the part that costs real money, and it is not obvious.**

A schema that requires nothing cannot fail a build. It also cannot protect the
*consuming code* — and that code typically walks a list of field names and takes
the first that resolves:

```js
date_modified ?? date_updated ?? date_created
```

Written before the editorial date convention existed, that chain has never heard
of `date_authored_current_draft`. Give it a document whose only dates are
editorial and it resolves to nothing. **The build passes. The page renders. The
date is blank and the sort key is zero.** No error, no log line, nothing to grep
for.

This is not hypothetical. Audited 2026-08-17 across every surface that renders
`context-v/`: **13 of 13 page files across 8 splashes were editorial-blind**, and
16 documents were already rendering blank dates in production.

A strict schema is the *safer* failure here, because it fails loudly. Leniency
buys build resilience and pays for it in silent wrongness. So:

- **Append new field names to the END of every resolution chain**, preserving
  precedence, whenever the standard grows a field.
- **Grep for chains, not just schemas**, before retiring or adding any key:
  ```bash
  grep -rn "date_modified ??\|date_created ??\|\.data\.date\b" src \
    --include="*.astro" --include="*.ts"
  ```
- **If a chain result is passed to `.toISOString()`, the new keys must also be
  declared in the schema** so they coerce to `Date`. Undeclared, `.passthrough()`
  hands them through as raw strings and the build dies on a method that isn't there.
- **Prove chain changes are zero-diff** by building before and after. Be aware
  these builds are **not deterministic** — the search widget and, on some sites,
  lightbox and memomark components mint a random DOM id per build, so an unnormalized
  diff shows 100% of pages changed and proves nothing.

## How to apply

Whenever you scaffold a site or touch `src/content.config.ts`:

- Every field `.optional()`. No exceptions for "obviously required" ones — see the
  load-bearing-key escalation in the layer-1 reminder, which handles genuine
  requirements at the loader rather than the schema.
- `.passthrough()` on every object schema.
- Declare **both** spellings of aliased fields (`at_semantic_version` *and*
  `semantic_version`; `lede` *and* `description`) — a consumer resolving
  `a ?? b` needs both to survive validation.
- Declare fields the site does not currently render but that documents carry.
  Declaring is cheap; a future consumer that needs coercion will thank you.
- Prefer `z.coerce.*` over exact types, always behind the `''`/`null` preprocess.

## Triggers

- Writing the first `content.config.ts` for a new site under `sites/`
- Adding a collection to an existing site
- A `pnpm build` failing on Zod validation of frontmatter
- **Adding a field to the frontmatter standard** — the schema and every
  resolution chain need it, and the chains are the half everyone forgets
- A rendered date, tag, or author that is mysteriously blank on a page that builds fine

## Related

- [[YAML-Frontmatter-Parsing-Must-Be-Lenient]] — layer 1, the parse-layer companion
- [[Managing-Complex-Markdown-Content-at-Build-Time]] — the broader blueprint
- `context-v/skills/context-vigilance/references/frontmatter-spec.md` — the standard
  the leniency exists to absorb drift against
