---
title: "Hover Cards for People and Tool Links"
lede: "Hover a person's or a tool's name in a write-up and its card opens in place. Built at build time, one popover per page, no fetch on hover."
publish: true
status: Reference
date_created: 2026-11-18
date_modified: 2026-11-18
date_authored_initial_draft: 2026-11-18
date_authored_current_draft: 2026-11-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.1.0
category: Blueprints
type: Blueprints
tags:
  - Hover-Cards
  - Wikilinks
  - Lossless-Flavored-Markdown
  - Astro-Knots
site_uuid: c4e77056-f215-46ab-9b77-7f17a7c1e490
hex_code: x86gmb
summary: "Implementation blueprint for hover cards on Astro Knots sites: person and tool wikilinks render a HoverCard that opens the site's own card (people card, tool card) in a floating popover on hover or keyboard focus. Reference implementation: sites/fullstack-vc (src/components/markdown/HoverCard.astro), 2026-11-18. The LFM side, links that carry their kind as data, is proposed in lfm/context-v/blueprints/Maintain-Hover-Cards-from-Wikilink-Kinds.md. Load when a site's long-form content names people, tools, companies or other entities that have their own pages."
---

# Hover Cards for People and Tool Links

## Why care?

A write-up that names seven people and a dozen tools asks the reader to leave
the sentence every time they wonder "who's that?" A hover card answers in place:
hover the name, see the card, click through only if you want more.

![A FullStack VC recipe in dark mode with a hover card open under the linked name George Babu, showing his photo, Aire Labs, Founder, 20 tools, Kauffman 18, and joined Jul 14, 2026](https://ik.imagekit.io/xvpgfijuw/fullstack-vc/smart-link-hover-cards/Hover-Card__Person--George-Babu_20261119T021300Z.jpg)

The name is the industry's: Radix and shadcn call the primitive `HoverCard`,
GitHub calls its own "hovercards". Keep it distinct from LFM's *link previews*,
which unfurl external URLs inline.

## What a site gets

- **People.** A person link opens the site's people card (photo, firm, role,
  stats) with a link to the profile.
- **Tools.** A tool link opens the tool card, plus a link to the tool page.
- **Private stays private.** No card for anyone whose profile isn't public.
- **Calm.** A short delay in and out, one popover per page, keyboard support,
  and no change on phones, where a tap follows the link.

## How it works

```text
lib/docs/wikilink-resolver.ts            tags person/tool links: classes ['wikilink--person' | 'wikilink--tool']
components/markdown/AstroMarkdown.astro  link branch → <HoverCard> for /people/<h> and /tools/<h>
components/markdown/HoverCard.astro      link + <template> holding the card; one shared popover script
components/stack/PersonCard--Thumb.astro the card (reused as-is from the people page)
components/stack/ToolCard.astro          the card (reused as-is from the catalogue)
```

1. **The resolver knows what each link is.** LFM's `remarkLosslessWikilinks`
   resolves `[[georgebabu|George Babu]]` to `/people/georgebabu`; the resolver
   also returns a class naming the kind.
2. **The renderer swaps the link for a HoverCard.** Today it matches the URL;
   once LFM ships link kinds it reads `node.data.wikilink.kind` instead (see the
   LFM blueprint in *See also*).
3. **The card is filled at build time** from the content collections. Reuse the
   cards the site already has: one design, two places.
4. **Each link carries its card in a `<template>`,** and one script per page
   clones the hovered link's card into a single popover appended to `<body>`.

## Rules that bit us

- **A card can't live inside the paragraph as markup.** A `<div>` inside a `<p>`
  makes the browser close the paragraph early and split the sentence. Put the
  card in a `<template>`, which is valid phrasing content and isn't rendered.
- **Popover styles must be global.** The popover is appended to `<body>`,
  outside the component's scoped styles. The cards' own scoped styles still
  apply, because the cloned markup keeps its `data-astro-cid` attributes.
- **Mouse only for hover.** Listen to `pointerover`/`pointerout` and ignore
  `pointerType !== 'mouse'`, or a phone tap opens a card and swallows the click.
- **Don't close when the pointer crosses the gap.** Hide on a ~180ms timer and
  cancel it when the pointer enters the card, or the card vanishes on the way.
- **Prose styles leak into cards.** A reader stylesheet's `a` and `li` rules
  reach into the card. Scope resets to the card, as the tool carousel does.
- **Check private before rendering, at build time.** The `<template>` ships in
  the HTML even though it's invisible; a private profile's details in a
  template are a leak.

## Checking it works

Drive it in a browser (Playwright) on a long write-up:

- every person and tool link that should have a card has one, and private
  people's links don't
- no hover card ends up outside its paragraph (count wrappers with no `p, li`
  ancestor: should be zero)
- hover opens the right card; moving away closes it; focus opens it; Escape
  closes it
- no console errors

## Reference implementation

- **`astro-knots/sites/fullstack-vc`** (repo `lossless-group/fullstack-vc`),
  2026-11-18: `src/components/markdown/HoverCard.astro`, wired in
  `AstroMarkdown.astro` and `lib/docs/wikilink-resolver.ts`. People and tools,
  dark and light modes.

## See also

- `lfm/context-v/blueprints/Maintain-Hover-Cards-from-Wikilink-Kinds.md`: links that carry their kind as data
- [[Share-Every-Page-and-Section-With-Its-Own-OG-Image]]: the same sites' share cards
- [[Standard-Table-of-Contents-for-Every-Markdown-Collection]]: another LFM-data-driven reading feature
