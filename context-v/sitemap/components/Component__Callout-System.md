---
title: "Callout System (LFM)"
lede: "Three-file split for rendering Lossless Flavored Markdown callouts — structure, type registry, and mode-aware styles. Every type obeys the light/dark/vibrant mode switcher."
date_created: 2026-05-08
date_modified: 2026-05-08
status: Published
category: Components
tags: [LFM, Callouts, Markdown-Rendering, Component-System, Mode-Aware, Two-Tier-Tokens]
authors:
  - Michael Staton
related_blueprint: "[[Maintain-Themes-Mode-Across-CSS-Tailwind]]"
related_reminder: "[[YAML-Frontmatter-Parsing-Must-Be-Lenient]]"
canonical_source: "packages/lfm-astro/components/"
---

# Callout System (LFM)

The renderer for `> [!type] Title` callouts produced by `@lossless-group/lfm`'s `remark-callouts` plugin. Splits cleanly along the seam where change actually happens: structure, data, styles.

## Three files

```
packages/lfm-astro/components/
├── Callout.astro        # structure only — icon row + header + body slot
├── callout-types.ts     # registry: { note, info, tip, success, warning, ... }
└── callout.css          # base layout + per-type accent + per-mode overrides
```

**Why this split (and not one file per type):** the structure (icon + label + body) is identical across all types — only the icon, default label, and accent color differ. A `CalloutInfo.astro` / `CalloutWarning.astro` / etc. setup would be 95% duplicated markup, with the structural code drifting between copies over time. Splitting along the *data* axis (one entry per type in `callout-types.ts`) instead of the *file* axis keeps each file single-purpose and compact.

## Supported types

`note`, `info`, `tip`, `success`, `warning`, `danger`, `quote`, `example`, `question`, `important`.

Plus aliases that route to a canonical type:

| Author writes | Renders as |
|---|---|
| `warn`, `caution`, `attention` | `warning` |
| `fail`, `failure`, `error`, `bug` | `danger` |
| `hint` | `tip` |
| `check`, `done` | `success` |
| `todo` | `note` |
| `abstract`, `summary`, `tldr` | `info` |
| `faq`, `help` | `question` |

Anything unrecognized falls back to `note`.

## Mode awareness (LAW)

Every callout obeys the light / dark / vibrant mode switcher. This is non-negotiable across all Astro Knots projects — see [[Maintain-Themes-Mode-Across-CSS-Tailwind]].

Implementation: `callout.css` sets a vibrant-mode default for `--callout-accent` per type, then `[data-mode="light"]` and `[data-mode="dark"]` selectors override the accent for contrast and intensity:

- **Light mode** — accents deepened via `color-mix(... var(--color__ink))`. Cyan becomes deep teal, lime becomes forest green, magenta becomes wine. Without this, neon accents disappear into bone backgrounds.
- **Dark mode** — loud accents (cyan, lime, magenta) gently desaturated via `color-mix(... var(--color__graphite-600))` at ~80% strength. Takes the retina-burn edge off without losing identity.
- **Vibrant mode** — raw named tokens. Full neon.

## The `info` hero variant

`info` is intentionally bigger and brighter than the other types — it's the brand's "why this matters" emphasis block at the top of sessions, posts, and changelog entries. Mode-awareness rides on the existing `--fx-glow-opacity` and `--fx-glow-spread` tokens from `theme.css` (light=0.06/8px, dark=0.22/24px, vibrant=0.55/48px). The info background gradient strength, outer glow spread, and icon halo all scale automatically per mode.

This pattern (effects keyed to `--fx-glow-*`) is the right way to mode-adapt any future callout-style override. Don't hardcode glow intensity — read it from the mode token.

## Lists, paragraphs, code inside callouts

Tailwind v4 preflight zeros out `<p>` margins and list bullets globally. `callout.css` restores prose flow scoped to `.ak-callout-body p / ul / ol / li / code` — so multi-paragraph callouts, bulleted lists, and inline code all render correctly inside any callout.

## Nesting policy: full LFM features inside callouts

Callouts in LFM are **containers**, not rendering-only blocks. Every LFM and `AstroMarkdown` feature available at the document level — other directives (`:::youtube`, `:::image-gallery`), citations (`[^a1b2c3]`), fenced code blocks, GFM tables, link previews, video embeds, even other callouts — MUST work when nested inside a callout body.

This is **intentional and divergent from upstream conventions**:

- **CommonMark blockquotes** carry markdown children but render plainly without participating in extended pipelines.
- **Obsidian callouts** support some inline markdown (bold, italic, links) but custom embeds, directives, and citation systems generally do not work inside them.

In LFM we deliberately enable full nesting. The `remarkCallouts` plugin produces a `containerDirective` MDAST node whose children are ordinary block-level MDAST nodes — so when `Callout.astro` recursively delegates to `AstroMarkdown` for every child, every other branch in the renderer's switch fires normally. There is no safety challenge: a callout is just a container in the MDAST, and rendering its children through the same renderer used for the rest of the document is simpler than maintaining an allowlist that would drift over time.

**Implementation requirement (LAW for any per-site Callout copy):** the component MUST recursively render `node.children` via `<AstroMarkdown node={child} data={data} />`. Never use `toString(node)` or a plain-text fallback — that silently disables nesting and is the most common reason a freshly-copied Callout looks "fine" until an author tries to embed something inside it.

The canonical `Callout.astro` in `packages/lfm-astro/components/` already does this correctly. The pattern to preserve:

```astro
const children = Array.isArray(node?.children) ? node.children : [];
// ...
<div class="ak-callout-body">
  {children.map((child) => <AstroMarkdown node={child} data={data} />)}
</div>
```

Authoring shapes that should all work:

```markdown
> [!info] With a citation
> Aging drives healthcare costs.[^a1b2c3]

> [!example] With a fenced code block
> ```ts
> const t = resolveCalloutType('warn'); // → 'warning'
> ```

> [!warning] With a directive
> :::youtube{id="dQw4w9WgXcQ"}

> [!quote] With a nested callout
> "Predict the future by inventing it." — Alan Kay
>
> > [!note] Editor's note
> > 1971 talk at PARC.
```

## How to add a new callout type

1. Add an entry to `CALLOUT_TYPES` in `callout-types.ts`:
   ```ts
   bookmark: { label: 'Bookmark', iconPaths: I.someIcon },
   ```
2. Add a `.ak-callout--bookmark { --callout-accent: var(--color__some-named-token); }` rule in `callout.css`.
3. Add light-mode and (if a loud color) dark-mode overrides in the same file.
4. Optionally add aliases in the `ALIASES` map.

## How to use in markdown

```md
> [!info] Why this matters
> Three presenters, two Kauffman Fellows and one Founder, will share short demos.
>
> - Wins
> - Scars
> - Open questions
```

Empty title (`[!info]-` in Obsidian's foldable syntax, or just no title text) suppresses the header row.

## Canonical source

Live in `packages/lfm-astro/components/` — every Astro Knots site copies these three files into `src/components/markdown/` per the LFM integration steps in `astro-knots/CLAUDE.md`. Updates to the canonical source should be propagated to consuming sites; sites are free to customize their copies to match site-specific brand requirements.

## Related

- [[Maintain-Themes-Mode-Across-CSS-Tailwind]] — the two-tier token system and mode contract callouts inherit
- [[Maintain-Extended-Markdown-Render-Pipeline]] — how AstroMarkdown.astro routes callout directives into this component
- [[Lossless-Flavored-Markdown-LFM]] — the upstream remark plugin chain that produces callout MDAST nodes
