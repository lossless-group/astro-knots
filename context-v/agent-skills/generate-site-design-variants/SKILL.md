---
name: generate-site-design-variants
description: Redesign a site as N complete, genuinely different design directions built in parallel against one shared content layer — working code, two-tier theming, three-mode contract, themed image assets, consistent stack — so a stakeholder can compare them like-for-like and retiring the losers is a delete rather than a refactor. Use whenever a prospective or existing client needs a redesign pitch, whenever the user says "three directions", "design variants", "show them some options", "redesign this site", "build a spike", "competing designs", or asks to generate multiple looks for one site; also when scaffolding the chooser/brand-kit/design-system surfaces those variants need. Encodes the spine-before-pixels ordering, the one-content-layer rule, per-direction Tier 2 theme files, the single-family themed-imagery pattern, constraint-in-code, and the no-cross-imports isolation that makes variants disposable.
---

# Generate Site Design Variants

> Redesign a site with real variants — working code, proper theming, themed image
> assets, one consistent stack — from **1–3 prompts**. A 15–30 minute loop with
> concurrent subagents produces **3–5 complete variants**.

That claim is only true because of the ordering and the invariants below. Skip
them and you get three pretty pages that quietly argue three different things,
share nothing, and cost a refactor to narrow down.

## When to use this skill

- A prospective client needs a redesign pitch and a mood board won't settle it.
- An existing site needs a direction chosen before a build is committed to.
- The user says "three directions", "design variants", "competing designs",
  "show them options", "build a spike", "redesign this".
- You are about to write a second design for the same content and are tempted
  to fork the components.

Composes with **`astro-knots`** (stack rules and prohibitions), **`theme-system`**
(two-tier tokens, three-mode contract), **`generate-consistent-og-images`** and
**`maintain-design-md`** (imagery), **`context-vigilance`** (where the spec goes),
and **`pseudomonorepos`** (each site is its own repo, deployed independently).

## The ordering is the whole trick

### Phase 0 — Extract the spine BEFORE any design

Write the argument down as **content** first: the beats, the sections, the
orientation. Put it in `src/content/` and in a `context-v/specs/` document.

This is what makes parallel generation safe. If the argument is settled and
stored, N agents can build N designs against it and **none of them can quietly
rewrite the pitch**. If you design first, each variant invents its own copy and
the comparison is worthless — you are no longer comparing form, you are
comparing three different products.

Worked examples:
- **multiphasic-site** — eight narrative beats into `src/content/beats/`,
  extracted from one confidential deck, before a single component existed.
- **gth-site** — the plain-language spine as an `ORIENTATION` object in
  `src/lib/site.ts`: *what this is → what you do → what you get → only then the
  term of art*.
- **dominocielo-site** — `WORD_BUDGET = 320`, because the brief was that the
  site is 300 words and stays that way.

### Phase 1 — One content layer, N directions

Every direction reads the **same** collections. Same articles, same beats, same
tiers, same cart. Only form differs.

```
src/content/          ← shared. All N directions read this. Client edits here.
src/pages/index.astro ← the chooser. NOT the shipping homepage.
src/pages/<direction-a>.astro
src/pages/<direction-b>.astro
src/pages/<direction-c>.astro
```

`/` is an internal chooser. When a direction is picked it is promoted to `/` and
the others are retired.

### Phase 2 — Variants are themes, not forks

This is the load-bearing decision. A direction costs **one Tier 2 theme file**,
not a copy of the component tree.

```
src/styles/
  global.css                 ← Tier 1 named tokens (--color__navy-deep). Shared.
  themes/<direction-a>.css   ← Tier 2 semantic tokens (--color-primary). Per direction.
  themes/<direction-b>.css
  themes/<direction-c>.css
```

Tier 1 is raw values with a `__` separator, defined once. **Components never read
Tier 1.** Tier 2 is kebab-case (Tailwind v4 only generates utilities for
kebab-case), defined per `[data-theme][data-mode]`, and is all a component ever
touches.

Re-pointing a brand is then: add one named token, re-aim one semantic token.
Components do not change.

### Phase 3 — Three modes, per direction

`light`, `dark`, `vibrant` on `<html data-mode>`, for **every** direction. Three
directions means nine combinations and all nine get verified.

**Vibrant is dark-based.** Each theme file sets its own ground, surface, text and
border explicitly rather than inheriting from light — inheriting is the single
most common reason light and vibrant end up indistinguishable.

Direction is determined by the **route** and is deliberately not restored from
`localStorage`. Mode is a viewer preference and is. `/design-system` is the one
page where direction is switchable at runtime.

### Phase 4 — Themed image assets: one family, not one set per mode

Naive approach: generate a light set and a dark set per direction. For three
directions that is six asset families to keep in sync. Don't.

**The Plate pattern** (reference: `gth-site/src/components/basics/Plate.astro`):

1. Generate **one** family off a **single locked seed**, so the images are
   siblings rather than strangers.
2. Dissolve the ground with a blend mode — `multiply` in light, `invert` +
   `screen` in dark and vibrant.
3. Tint toward the active `--color-primary`.

One family, 3N appearances, and it re-colours automatically when the brand moves.

**Archive raw candidates outside `public/`** (e.g. `.ideogram-candidates/`) so
the build never ships them. Re-encode PNG → JPEG at full pixel dimensions before
committing; generation output is routinely 5–7× larger than it needs to be with
zero resolution benefit.

**The stronger alternative: illustration as code.** Where the subject allows it,
draw the flare in SVG/CSS reading theme tokens — then there is no raster to keep
in sync at all, and it re-colours with the brand for free. Reference:
`multiphasic-site/src/components/flare/` (`EnergyLandscape`, `PhaseField`,
`LatticeExcitation`, `PulseEnvelope`, `BeamDivider`, `OverdesignMass`), each with
its own inspection page under `/design-system/flare/`.

### Phase 5 — Isolation, so retiring is a delete

```
src/components/basics/       ← shared across directions
src/components/ui/           ← shared (ModeToggle)
src/components/<direction>/  ← per direction. NEVER cross-import.
```

Per-direction components must not import from each other. Get this right and
narrowing three directions to one is: delete two folders, delete two routes,
promote the winner to `/`. Get it wrong and it is a refactor under deadline.

Shared interactive islands take a `layout` prop rather than forking. `gth-site`'s
`BundleLadder.svelte` serves three cart layouts (`ledger`, `compare`, `steps`)
from one island.

### Phase 6 — The three reference surfaces

| Route | Audience | Contents |
|---|---|---|
| `/` | Internal / stakeholder | The chooser. Every direction, one click away. |
| `/brand-kit` | Stakeholders, client marketing | Palette, type, mark, imagery, and where they came from. |
| `/design-system` | Developers, agents | Component catalogue. **Direction *and* mode switchable at runtime.** |

These replace Storybook. They ship inside the site, in the site's own theme and
runtime, so they cannot drift from it.

## Constraint-in-code — what makes agent output trustworthy

An agent given creative latitude will fill space with invented copy unless the
constraint is **executable**. Put the discipline in the build, not in a document
nobody opens:

- **`WORD_BUDGET`** checked against each direction's built HTML. Over budget
  means copy was invented. (`dominocielo-site`)
- **Schema-enforced orientation** — `articles` carries a required
  `plain_question`, and index cards render it *above* the clinical title, so
  "orient before you educate" cannot be forgotten. (`gth-site`)
- **Strict-superset tiers** — each tier a superset of the one below is what lets
  a cart show a *delta* instead of swapping in a whole new cart. (`gth-site`)
- **One sentence per item**, enforced by the shape of the schema, not by review.

Where a direction wants more surface, it takes it in **typography, space and
structure — never in words**.

## Stack invariants (from `astro-knots`)

Astro 7 · Tailwind 4 via `@tailwindcss/vite` · Svelte 5 only where reactivity
earns it · pnpm. **No React, no JSX, no MDX, no UI libraries.**

Every site installs standalone so it deploys independently:

```bash
pnpm install --ignore-workspace      # --ignore-workspace on EVERY dep command
pnpm build
pnpm exec astro check
```

Ship `vercel.json` pinning `pnpm install --frozen-lockfile` + `pnpm build`, a
site-local `pnpm-lock.yaml`, and **no `packageManager` pin**. Sites are not
members of the astro-knots pnpm workspace.

## Running it as a loop

1–3 prompts, 15–30 minutes, concurrent subagents, 3–5 variants:

1. **Prompt 1 — the spine.** Point at the source (deck, live site, PDF). Produce
   the content layer and the `context-v/specs/` brief. Nothing visual yet.
2. **Prompt 2 — the fan-out.** N agents, one per direction, each given: the
   shared content layer, the Tier 1 token file, the mode contract, its own
   direction name and stance, and the no-cross-imports rule. They build
   concurrently because the argument is already fixed.
3. **Prompt 3 — the surfaces.** Chooser, `/brand-kit`, `/design-system`, imagery
   family, `astro check`, README.

Give each direction a **stance**, not a mood — "closest to the source deck",
"furthest from it", "reinterprets it" — so they diverge on purpose rather than
converging on the same safe layout.

## Verify before calling it done

- [ ] `pnpm build` clean and `pnpm exec astro check` clean
- [ ] Every direction renders in all three modes (3N combinations)
- [ ] No component reads a `--color__*` Tier 1 token directly
- [ ] No cross-imports between per-direction component folders
- [ ] All directions read the same content collections — no forked copy
- [ ] Word/constraint budget checked against **built HTML**, not source
- [ ] `/brand-kit` and `/design-system` exist and render in all modes
- [ ] Imagery is one family, not one set per mode; raw candidates outside `public/`
- [ ] Site-local lockfile + `vercel.json`; no `packageManager` pin
- [ ] `robots noindex, nofollow` while the work is speculative
- [ ] Confidential source material in `context-v/extra/` (gitignored)

## Anti-patterns

**Designing before the spine exists.** Each variant invents its own copy; you end
up comparing three products instead of three designs.

**Forking the component tree per variant.** Retiring two directions becomes a
refactor. Variants are themes.

**A light asset set and a dark asset set.** 2N families to keep in sync. Use one
family plus blend-mode dissolve, or draw it in code.

**Reading `--color__*` from a component.** Breaks the one-line re-brand, which is
the main thing the two-tier system buys.

**Building variants in separate repos or branches.** They must be reachable
side-by-side at sibling routes or the comparison never actually happens.

**Letting vibrant inherit from light.** They become indistinguishable.

**Shipping the chooser as the homepage.** `/` is internal; promote the winner.

## Reference implementations

| Repo | Directions | What it demonstrates best |
|---|---|---|
| [multiphasic-site](https://github.com/lossless-group/multiphasic-site) | Phase Diagram · Lattice · Before the Beam | Spine-before-pixels; illustration as code |
| [gth-site](https://github.com/lossless-group/gth-site) | Journal · Atlas · Practice | Shared content layer at scale; one island, three layouts; the Plate imagery pattern |
| [dominocielo-site](https://github.com/lossless-group/dominocielo-site) | Card · Sheet · Aperture | Creativity under a hard word budget; restraint as the design problem |

## After authoring or editing this skill

Newly-linked skills load in the **next** session, not the current one:

```bash
bash /Users/mpstaton/code/lossless-monorepo/context-v/agent-skills/sync-skills-symlinks.sh
```
