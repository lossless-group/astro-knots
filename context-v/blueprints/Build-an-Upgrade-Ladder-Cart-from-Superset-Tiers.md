---
title: "Build an Upgrade Ladder Cart from Superset Tiers"
lede: "Make every tier a strict superset of the one below and the cart can show you the delta instead of swapping in a whole new cart."
publish: true
date_created: 2026-09-11
date_modified: 2026-09-11
date_authored_initial_draft: 2026-09-11
date_authored_current_draft: 2026-09-11
date_authored_final_draft: "[]"
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
at_semantic_version: 0.1.0.0
status: Draft
category: Blueprints
site_uuid: 71a86591-8127-4665-a5e0-11ef5e1f04d1
hex_code: ns6sdq
tags:
  - Commerce
  - Component-Patterns
  - Svelte
  - Information-Hierarchy
  - Astro-Knots
---

# Build an Upgrade Ladder Cart from Superset Tiers

## Why Care?

Most pricing tables make the reader do a diff in their head. Three columns of
ticks and crosses, and the question *"what do I actually get if I go up one?"*
is answerable only by scanning two columns in parallel and subtracting. When the
reader clicks a different tier, the whole panel swaps and they start over.

The fix is a data constraint, not a UI trick.

## The constraint

**Every tier is a strict superset of the tier below it.** Nothing is ever removed
by upgrading.

That single rule buys four things:

1. The cart can present the **delta** — "add these two lines, +$300" — because a
   delta is guaranteed to exist and to be additive.
2. Upgrading can be rendered as **the list filling in**, not as a list being
   replaced. Rows never enter or leave the DOM; only their state changes.
3. A **locked row becomes a real affordance.** Because each row has exactly one
   cheapest tier that contains it, clicking any greyed line item can move the
   reader to that tier. "I want that one" is a valid input, and the reader never
   has to work out which tier it lives in.
4. The **copy cannot drift from the contents**, because there is no hand-written
   "what's new at this tier" list to maintain — see below.

If a proposed tier structure breaks the superset rule (a "Pro" tier that drops
something "Starter" had), that is a pricing problem surfacing as a UI problem.
Fix the pricing.

## Store the full list, diff at render

Each tier's entry stores its **complete** include list, not the delta:

```yaml
order: 2
tier_id: plan
price: 699
includes:
  - label: "At-home collection kit"      # also in tier 1
  - label: "Sequencing"                  # also in tier 1
  - label: "One-to-one review call"      # new at tier 2
  - label: "A written protocol"          # new at tier 2
```

The renderer computes the union across all tiers in order, remembering for each
row the **first** (cheapest) tier that contains it. That index is both the
row's inclusion test and its upgrade target:

```js
const rows = (() => {
  const seen = new Map();
  tiers.forEach((tier, ti) => {
    (tier.includes ?? []).forEach((item) => {
      if (!seen.has(item.label)) seen.set(item.label, { item, firstTier: ti });
    });
  });
  return [...seen.values()];
})();

// included at the current selection?
const included = (row) => row.firstTier <= selectedIndex;
// what one step up actually buys:
const gained = rows.filter((r) => r.firstTier === selectedIndex + 1);
```

**Why full lists and not deltas.** Deltas are smaller to author and impossible to
keep honest — the moment someone adds a line to tier 1 they must remember to
remove it from tier 2's delta. Full lists are redundant on disk and
self-consistent at render. Authoring redundancy is cheap; drift is not.

## Render the union, never re-render the list

Keep every row across every tier in the DOM at all times and change only its
state class. Two consequences worth the trouble:

- The upgrade **reads as acquisition** rather than as a redraw. A CSS keyframe on
  the newly-included rows is enough; no list transitions, no FLIP, no keying
  problems.
- Screen-reader users are not thrown to a rebuilt list. Put `aria-live="polite"`
  on the running total only, so the price is announced and the rows are not
  re-announced wholesale.

## Accessibility

- The tier control is a `radiogroup` of `role="radio"` buttons, with roving
  `tabindex` and Arrow / Home / End handling. It is a single choice, not three
  independent toggles.
- A locked row is a `<button>` with a label that states the consequence:
  *"Add gut permeability panel — upgrades to The Whole Tract, +$400."* Never a
  bare `+`.
- The running total gets `aria-live="polite"`. Nothing else does.

## Presentation is a prop; colour is never one

One component, several `layout` values (`ledger`, `compare`, `steps`), each
changing composition only — grid template, border radius, whether the tier
control reads as a header row or a staircase. **Zero colour in the component.**
Every value resolves through Tier 2 semantic tokens, so the same island reads as
native under every theme and mode the host site defines.

This is what makes the component portable across an estate of sites with
different brands: the only thing a new site supplies is its theme file.

## Anti-patterns

- **A tier that removes something.** Breaks the delta, the fill-in animation and
  the click-to-claim affordance all at once. It is a pricing smell.
- **Authoring deltas instead of full lists.** Guarantees drift.
- **Swapping the panel on tier change.** Destroys the acquisition read and
  re-announces everything to assistive tech.
- **A "most popular" badge with no default selection.** If a tier is most
  popular, open on it.
- **Value-stack theatre.** Struck-through totals are fine if the list values are
  real line items. Manufactured anchors ("total value $1,738!") are the 2008
  register this pattern exists to replace.

## Realised in

`sites/gth-site/src/components/cart/BundleLadder.svelte` — one Svelte 5
island, three layouts, consumed by all three design directions and catalogued
live at that site's `/design-system`.

## References

- [[Maintain-Themes-Mode-Across-CSS-Tailwind]] — the two-tier token contract the component reads
- [[Three-Directions-for-a-Practitioner-Led-Testing-and-Content-Site]] — the spec this pattern was built for
