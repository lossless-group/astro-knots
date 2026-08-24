---
title: Implement the Standard Table of Contents on mpstaton-site
lede: The parent blueprint says every collection rendering markdown gets the same reading-position ToC. This site has five such surfaces, a hand-rolled slugify that has to go, and — as of today — the LFM version that makes it possible.
site_uuid: 92575b1b-e28c-47ca-818b-4024492bf100
hex_code: vsm5ta
publish: true
date_created: 2026-08-17
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
at_semantic_version: 0.0.0.2
status: Draft
tags:
  - Table-Of-Contents
  - LFM
  - Markdown-Rendering
  - Content-Collections
  - Accessibility
from: mpstaton-site
from_path: plans/Implement-the-Standard-Table-of-Contents.md
---
<!-- Rolled up from mpstaton-site/context-v/plans/Implement-the-Standard-Table-of-Contents.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Implement the Standard Table of Contents on mpstaton-site

## Why Care?

Five surfaces on this site render long-form markdown, and none of them offer a map. A context-v spec runs thousands of lines; an essay carries a dozen headings; an investment memo is read by scanning for the section you came for. Right now the only navigation is the scrollbar.

The parent blueprint — [[Standard-Table-of-Contents-for-Every-Markdown-Collection]] — settles the argument about *behaviour* so each site only has to decide *appearance*. This plan is the mpstaton-site half: what to change, in what order, and how to know each step worked.

## What's already true

Grounding, so this plan doesn't repeat work or assume work that hasn't happened. All of it verified 2026-08-17.

| Precondition | State |
|---|---|
| **LFM ≥ 0.4.1** (rollout step 1) | ✅ **Done today** — bumped `0.3.0 → 0.5.1`. On 0.3.x `data.id` was `undefined` and this was impossible. |
| `tree.data.headings` populated | ✅ Verified against this site's install: returns `{depth, text, id}` per heading. |
| Code-fence trap handled upstream | ✅ Verified — a `# comment` inside a ```` ```bash ```` fence does **not** appear in the outline. |
| `nestHeadings` available | ✅ Exported by 0.5.1. The blueprint was written when it wasn't; **the renderer no longer has to nest a flat list by hand.** |
| Local slugify to delete | ⚠️ Present at `src/components/markdown/AstroMarkdown.astro:78–83` — the exact anti-pattern the blueprint names. |
| Horizontal-bleed prerequisite | 🟡 Partly satisfied — `overflow-x: auto` already on `prose.css:96`, `CodeBlock.astro:43`, both Mermaid components, `LinkRollup.astro`. Needs an audit, not a rebuild. |

**Surfaces in scope** (everything rendering through `AstroMarkdown`):

```
src/pages/context-vigilance/[...slug].astro        ← highest value, most heading-dense
src/pages/essays/[...slug].astro
src/pages/notes/from-the-rabbit-hole/[...slug].astro
src/pages/promote/[slug]/memo/index.astro          ← gated
src/pages/promote/[slug]/memo/[version].astro      ← gated
```

There is no `changelog` detail route on this site yet — the collection is wired in `src/content.config.ts` but only `llms.txt` consumes it. **If that route gets built, it lands in scope by default.**

## Phases

Each phase has an exit criterion that can be checked, not just asserted.

### Phase 1 — Retire the local slugify

The blueprint's step 2, and the one that must come first because everything downstream depends on anchors being LFM's.

- Replace the hand-rolled `id` computation in `AstroMarkdown.astro:78–83` with `node.data.id`.
- Keep rendering the heading if `data.id` is missing — degrade, don't throw.

**Exit:** every `<h1>`–`<h6>` on a rendered page carries an `id`, and no id is computed anywhere in `src/`.

### Phase 2 — Diff the anchors before anything ships

The blueprint's step 3, and the step most likely to be skipped. Anchor changes break every share link ever sent.

- Script it: parse every document across the five surfaces, compare LFM's `data.id` to the old local slug, count and list the moves.
- `fullstack-vc` moved 0 of 53. This site has more heading-dense context-v content, so **expect a non-zero number and look at it** before deciding.

**Exit:** a written count of moved anchors, and an explicit decision to accept them or add redirects. Not "it looked fine."

### Phase 3 — Audit horizontal bleed

The sibling blueprint [[Guarantee-Text-Wrapping-and-No-Horizontal-Bleed-at-Any-Width]] is a prerequisite: *a ToC layered onto a page that bleeds sideways will look broken and the ToC will get the blame.*

Most containers already exist (see table above), so this is verification:

- Walk the widest real content at 320px, 768px, 1280px — a mermaid-heavy context-v doc, a wide table, a deep tree outline, a long code block.
- Confirm the **page body** never scrolls horizontally; only the block does.
- Watch for the flex trap the sibling blueprint names.

**Exit:** no horizontal page scroll at any of the three widths on the worst offender in each collection.

### Phase 4 — Build the component

Follow the reference implementation's shape (`fullstack-vc`, shipped 2026-08-17), adapted to this site's tokens:

```
src/components/markdown/TableOfContents.astro         three states in one render
src/components/markdown/TableOfContents__List.astro   recursive <ul>
src/lib/markdown/toc.ts                               filter + nest (use LFM's nestHeadings)
src/styles/table-of-contents.css                      block, elements, three states
src/scripts/table-of-contents.client.ts               scrollspy, collapse, header measurement
```

Non-negotiables from the blueprint — all ten apply, but the ones this site will get wrong:

- **Header offset is measured, not declared.** Publish the pinned header's real bottom edge as a custom property on `:root`. **Do not declare that property on the component element** — an element's own declaration shadows the inherited one and the measurement silently no-ops.
- **Scrollspy tie-break is "topmost visible heading wins,"** with a fallback to the last heading scrolled past, or the highlight goes blank between sections.
- **Renders nothing below ~3 entries.**
- **Works with JS off** — it's a list of anchors; tracking is enhancement.
- **Skip `synthetic` entries**, keep their anchors.
- Default band `h2`–`h3`.

Appearance is this site's business: placement, colour, whether the rail is bordered. Use the semantic token tier, never `--color__*` directly.

**Exit:** all three viewport states work on `/context-vigilance/[slug]`, `Esc` and click-outside dismiss, focus returns to the trigger.

### Phase 5 — Roll across the remaining surfaces, then catalog

- Apply to essays, notes, and both memo routes.
- **Add the component to `/design-system/sections` in the same change** — the Astro Knots maintenance motion, and the reason the catalog doesn't rot.

**Exit:** all five surfaces render it; `/design-system` documents it with props and when-to-use.

## Known blockers and risks

- **Container headings.** A heading inside a callout or `:::details` lands in the outline indistinguishably from a document-level section. Tracked package-side (proposed `inContainer` flag). **This site uses callouts heavily** — `2026-05-08_01` logged shipping the full callout system, and one context-v doc alone rendered 158 callout hits. Unlike `fullstack-vc`, which had zero, **this site will likely over-collect.** Check the corpus in Phase 2 and decide whether to ship anyway or wait for the flag.
- **Anchor churn.** Higher risk here than on `fullstack-vc` because of the volume of heading-dense context-v content.
- **Gated memo routes.** The ToC must not leak headings into a locked render. Whatever the ToC receives has to come from the same gated branch as the body.

## Out of scope

- `lossless-monorepo/site` — the blueprint sequences it last; it isn't this repo.
- Changing the anchor algorithm itself. It lives in LFM.
- A changelog detail route. Worth building, but its own plan.

## References

- [[Standard-Table-of-Contents-for-Every-Markdown-Collection]] — the parent blueprint this implements[^dt9uc8]
- [[Guarantee-Text-Wrapping-and-No-Horizontal-Bleed-at-Any-Width]] — prerequisite
- `astro-knots/context-v/specs/Reading-Position-Table-of-Contents-for-LFM-Articles.md` — the behavioural spec the blueprint generalises
- [[Codeblock-Syntax-Highlighting-with-Shiki]] — the renderer whose fences must never be scanned

[^dt9uc8]: [[Standard-Table-of-Contents-for-Every-Markdown-Collection]]
