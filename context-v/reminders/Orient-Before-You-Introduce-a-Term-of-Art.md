---
title: "Orient Before You Introduce a Term of Art"
lede: "A reader who does not yet know what the thing is cannot learn its name. Plain question first, clinical title second — enforce it in the schema."
publish: true
date_created: 2026-09-11
date_modified: 2026-09-11
date_authored_initial_draft: 2026-09-11
date_authored_current_draft: 2026-09-11
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
at_semantic_version: 0.1.0.0
status: Draft
category: Reminders
site_uuid: 990e25fc-82a4-456f-9660-3ea1fc6b15a3
hex_code: g41vht
tags:
  - Information-Hierarchy
  - Content-Modeling
  - Copywriting
  - Astro-Knots
---

# Orient Before You Introduce a Term of Art

Expert clients hand us expert copy. Left alone, the homepage opens on the most
precise sentence in the deck — and precision is exactly what a stranger cannot
use. One client site's first substantive line was about the permeability of a
single-cell-thick membrane, and its flagship product was a coined word
introduced before anything explained what it did.

## The rule

**Above the fold, in words the reader already owns: what this is → what you do →
what you get back.** A term of art may appear only *after* the everyday symptom
or idea it names. The coined product name comes last of all.

## Put it in the schema, not in a style note

A rule that lives in a design document survives until the next template rewrite.
A rule that lives in the content model survives everything downstream of it.

```ts
const articles = defineCollection({
  schema: z.object({
    title: z.string(),                        // the clinical, citable name
    plain_question: z.string().optional(),    // what someone types at 11pm
    term_of_art: z.string().optional(),
    term_in_plain_english: z.string().optional(),  // set both or neither
  }).passthrough(),
});
```

Then every index card renders `plain_question` **above** `title`, and a term
never renders without its translation within a few pixels. The inversion is the
thesis, and it is now structural.

## Tells that you have got it backwards

- The first heading contains a word the reader would have to look up.
- A product name appears before a sentence containing a verb the reader does.
- The hero explains a mechanism. Mechanisms are the third thing, never the first.
- You can't answer "what do I do next" from the top of the page without scrolling.

## Related

- [[Build-an-Upgrade-Ladder-Cart-from-Superset-Tiers]] — same discipline applied to pricing
