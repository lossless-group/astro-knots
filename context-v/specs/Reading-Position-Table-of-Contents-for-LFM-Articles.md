---
title: "A Reading-Position Table of Contents for LFM Articles"
lede: "LFM already hands every renderer a build-time outline; nothing renders it. One component, three viewport-driven states — left rail, hamburger overlay, mobile header — and a scrollspy that always knows which heading you're in."
site_uuid: c22eb17a-a8ce-491c-be02-2c9e35a67621
hex_code: 9kzkyr
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-08-17
at_semantic_version: 0.0.1.0
publish: false
status: Proposed
augmented_with: "Claude Code on Opus 5"
category: Information-Design
date_created: 2026-08-17
date_modified: 2026-08-17
authors:
  - Michael Staton
slug: reading-position-table-of-contents-for-lfm-articles
tags:
  - Information-Design
  - Long-Form-Reading
  - LFM
  - Navigation
  - Responsive-Design
  - Accessibility
---

# A Reading-Position Table of Contents for LFM Articles

## Why Care?

Long-form content on these sites has outgrown the scrollbar. A recipe with five job sections and a dozen sub-headings gives a reader no way to see the shape of the argument, jump to the part they came for, or know where they are once they're deep in it.

Everything needed to fix that already exists **except the component**. `remarkHeadingIds` (LFM 0.4.0) assigns every heading a stable, deduped anchor and attaches an ordered outline to the tree at `tree.data.headings` — described in its own source as *"ready to render a table of contents."* No site renders it.

The one ToC in the tree, on `lossless-monorepo/site`, predates LFM: roughly 1,800 lines across `TableOfContents.astro` and `MobileTableOfContents.astro`, with the outline built by **scraping the DOM at runtime** (`querySelectorAll('h1[id], h2[id], …')`) because nothing upstream handed it one. That works, and it is the wrong shape now.

## What this is

**One component family, three viewport-driven states, one reading-position tracker.**

| State | Viewport | Placement | Affordance |
|---|---|---|---|
| **Rail** | Wide desktop | Persistent left column, always visible | None — it's just there |
| **Collapsed** | Laptop / narrow desktop | Hamburger button, left edge | Click expands **rightward as an overlay** over the content |
| **Header** | Mobile | Bar pinned at top showing the **current heading** | Tap expands **downward**; auto-collapses on selection |

Reading-position tracking runs in **all three**. On mobile it isn't just a highlight — the current heading *is* the collapsed button's label, so the bar answers "where am I" without being opened.

## The three states in detail

### Rail — wide desktop

The default and the simplest. A persistent left column beside the article, no toggle, no overlay. Nested by heading depth. The active heading is highlighted; the rail scrolls internally if the outline is longer than the viewport, without scrolling the page.

### Collapsed — laptop and narrow desktop

Below the rail breakpoint the ToC gives up its column rather than crushing the article, and becomes a hamburger button at the left edge.

**It expands rightward as an overlay — it does not push the article.** Reflowing body text on every ToC open is disorienting mid-read, and the reader opened it to jump somewhere, not to re-read a re-laid-out paragraph. The overlay dismisses on selection, on `Esc`, and on click-outside.

The trigger is a **window** width, not a device: the case that matters is a laptop browser sharing the screen with something else, so the breakpoint should be set where the article column starts to suffer, around half a typical laptop width. See open questions — this needs a real number, not a guess.

### Header — mobile

A bar pinned to the top of the viewport whose label is the heading the reader is currently inside. Tapping expands the full outline downward; selecting a heading scrolls to it **and auto-collapses the bar**, because leaving a full-height outline covering the destination defeats the jump.

## Reading-position tracking

One mechanism serves all three states.

- **`IntersectionObserver`** over the heading elements, not a scroll handler — cheaper and steadier.
- **When several headings are in view, the topmost wins.** A reader scrolled to the middle of a long section should see that section as active, not the next one that happens to have entered the viewport.
- The active entry updates the rail highlight, the overlay highlight, and the mobile bar label from the same state.
- **Degrade gracefully.** With JavaScript disabled the ToC is still a list of working anchor links; only the tracking and the collapse behavior are enhancements.
- Respect `prefers-reduced-motion` for scroll-to and expand/collapse transitions.

## Data contract

Input is `tree.data.headings` — `LfmHeading[]` from LFM ≥ 0.4.0:

```ts
interface LfmHeading {
  id: string;           // final, deduped anchor id; matches the heading node's data.id
  text: string;         // plain text, markup stripped
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  duplicateOf?: string; // slug collided with an earlier heading — diagnostics
  synthetic?: boolean;  // text slugified to nothing; positional id used
}
```

Three consequences the component owns:

1. **The outline is flat.** Nesting `<ul><li><ul>` from `depth` is the renderer's job.
2. **`synthetic` entries should probably be skipped in the ToC** while keeping their anchor — a heading whose text slugified to nothing has no useful label to show.
3. **`duplicateOf` is diagnostics, not display.** Render the text; the id already disambiguates.

## Non-goals

- **Not a share-link affordance.** That is `HeadingAnchor.astro`, specified in the LFM anchors decision doc. Same data, different component.
- **Not per-site restyling beyond tokens.** Colors, spacing, and type come from the site's semantic tokens; the component ships structure and behavior.
- **Not a replacement for `lossless-monorepo/site`'s ToC in the first pass.** That site has the highest link-breakage exposure and goes last.

## A note on naming — why this is *not* `TableOfContents--{Variant}.astro`

The house convention puts author-selectable variants in `--` modifier siblings (`PersonCard--Thumb`, `ImageCarousel--Peek`). **This component deliberately does not follow that pattern**, because its three states are **viewport-driven, not author-chosen**. An author never picks "the mobile one" — all three exist simultaneously in one render and CSS decides which is visible.

Proposed shape follows the Callout / ImageCarousel split instead:

```
TableOfContents.astro          structure for all three states
table-of-contents.css          shared block + element + state styles
table-of-contents.client.ts    IntersectionObserver, collapse/expand, label sync
toc-types.ts                   nesting helper, depth filter, LfmHeading re-export
```

If a genuine author-facing variant appears later — a `--Inline` summary block, say — *that* takes the modifier suffix.

## Dependencies and sequencing

**Order matters, and the LFM 0.4.0 release notes are explicit:** *"Do not adopt the new `AstroMarkdown.astro` before upgrading the package — on 0.3.x `data.id` is `undefined`, so headings would lose their ids entirely."*

1. **Upgrade the consuming site to LFM ≥ 0.4.1.** `fullstack-vc` is pinned at 0.3.0, which predates `remarkHeadingIds` entirely.
2. **Delete the site's local slugify.** `AstroMarkdown.astro` currently computes its own heading ids (`[^a-z0-9\s-]` strip, spaces to dashes) — exactly the drift `remarkHeadingIds` exists to end. Read `data.id` instead.
3. **Accept the anchor churn.** LFM's default slugifier is bug-for-bug compatible with `lossless-monorepo/site`'s algorithm, which differs from what astro-knots sites compute today. The anchors doc counted **646 anchors that move** across astro-knots — judged acceptable because those sites have no share UI, so their fragments are near-exclusively internal ToC jumps that regenerate at build. Verify that still holds before shipping.
4. **Build the component** against `tree.data.headings`.
5. **Rewire `lossless-monorepo/site` last**, from DOM-scraping to the data outline.

## Open questions

- **What is the Rail → Collapsed breakpoint, in pixels?** "Approaches half-screen" is the intent; it needs a measured number, taken from where the article column starts to suffer rather than from a device table.
- **Which depths appear?** `h2` + `h3` is the common answer for readability; the data supports 1–6. Deep recipes may want `h4`. Probably a prop with a sane default.
- **Headings inside callouts and directives — this is the real blocker.** A `> [!info]` body can contain an `###`. It deserves an anchor; it almost never deserves a top-level ToC entry. `data.headings` cannot currently tell the two apart, so a naive ToC over-collects and shows structure that isn't structure. The fix is package-side (`inContainer` on the outline entry) and is specified in `lfm/context-v/Maintain-Table-of-Contents-from-the-Heading-Outline.md`. **Resolve it there before building here** — the alternative is a per-site tree walk, which is precisely the divergence the anchors decision existed to stop.
- **Opt-in or automatic?** Every guide, or a frontmatter flag? A three-heading page does not want a rail.
- **Does the mobile bar stack with existing chrome?** Site headers are already sticky on some surfaces; two stacked sticky bars is a real risk.

## Acceptance criteria

- [ ] Renders from `tree.data.headings` with no DOM scraping anywhere
- [ ] All three states reachable by resizing a single browser window
- [ ] Collapsed state overlays the article rather than reflowing it
- [ ] Mobile bar label always names the heading currently being read
- [ ] Selecting a heading on mobile scrolls **and** collapses
- [ ] Topmost visible heading wins when several are in view
- [ ] Usable with JavaScript disabled — anchors still navigate
- [ ] `Esc` and click-outside dismiss the overlay; focus returns to the trigger
- [ ] Honors `prefers-reduced-motion`
- [ ] Correct in light, dark, and vibrant modes
- [ ] Landed in the consuming site's `/design-system` catalog in the same change

## Related

- `lfm/context-v/Maintain-Table-of-Contents-from-the-Heading-Outline.md` — the **package-side half of this spec**: what the outline contract guarantees, the proposed `inContainer` flag this is blocked on, and the possible `nestHeadings` helper. Read together; that one owns the data, this one owns the reader.
- `lfm/context-v/Maintain-Heading-Anchors-and-Share-Links.md` — the decision that produced `remarkHeadingIds`, the 646-anchor migration count, and the `HeadingAnchor.astro` sibling affordance
- [[An-Internet-Friendly-Responsive-UI-for-Longform-Writing]] — the reader-UI spec this navigates within
- [[Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package]] — the LFM spec that owns the data contract
- Prior art to replace: `lossless-monorepo/site/src/components/markdown/TableOfContents.astro` and `MobileTableOfContents.astro`, plus `src/utils/markdown/remark-toc.ts` (an `mdast-util-toc` node injector, superseded by `tree.data.headings`)
