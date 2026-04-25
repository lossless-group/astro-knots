# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro Knots is a **pseudo-monorepo evolving toward selective package sharing**. It started as a pattern library experiment, and is gradually discovering which shared code genuinely benefits from being a published package vs. which is better copied and adapted per-site.

**The Evolving Philosophy:**
- This is **not a true monorepo** with shared packages everywhere — and it's **not purely a pattern library** either
- `@knots/*` packages are workspace-local pattern references you copy from (not published, not imported at runtime)
- `@lossless-group/*` packages (like `@lossless-group/lfm`) ARE real published packages that sites install as dependencies
- The distinction: publish a package when multiple sites need identical processing logic; copy a pattern when each site customizes it
- Each client site must deploy independently from its own repo (typically via Vercel)
- Development happens in client sites first — extraction to shared packages happens when genuine need is proven

**How we got here:**
- Initially intended as a true monorepo with shared component packages
- Quickly learned that maintaining abstracted, style-free components across sites was impractical with a small team
- Settled into a "pattern library" approach where `@knots/*` are reference implementations you copy from
- As content rendering matured, discovered that markdown processing pipelines genuinely need to be shared (not copied) — leading to `@lossless-group/lfm` as the first real published package
- The design-system-viewer aspiration (shared component explorer per site) remains an initiative waiting for bandwidth

**Do not assume** either "everything is a shared package" or "everything is copy-paste." Ask which approach fits the specific code.

## Critical Constraint

**Each site MUST be independently deployable from its own repository.** Sites install published packages (like `@lossless-group/lfm`) as real dependencies from GitHub Packages or JSR. Sites do NOT use `workspace:*` links — those break independent deployment. Clients deploy their sites directly from their site repos without needing access to this umbrella project.

## Workspace Commands

```bash
# Install all dependencies (MUST use pnpm)
pnpm install

# Build all packages (for development reference)
pnpm -r build

# Build a specific package
pnpm --filter @knots/tokens build

# Watch mode for package development
pnpm --filter @knots/tokens dev

# Run site dev server (sites are workspace members for convenience)
pnpm --filter hypernova-site dev
pnpm --filter cilantro-site dev
pnpm --filter twf_site dev

# Run tests (sites with Vitest configured)
pnpm --filter hypernova-site test
pnpm --filter hypernova-site test:ui
pnpm --filter hypernova-site test:run
```

**Important:** Always use `pnpm` - npm/yarn will cause workspace resolution issues.

## High-Level Architecture

### Workspace Structure

```
astro-knots/
├── packages/
│   ├── lfm/              # @lossless-group/lfm — PUBLISHED package (GitHub Packages + JSR)
│   ├── tokens/           # @knots/tokens — pattern reference (not published)
│   ├── icons/            # @knots/icons — pattern reference (not published)
│   ├── astro/            # @knots/astro — Astro component patterns (AstroMarkdown, CodeBlock, Callout)
│   ├── svelte/           # @knots/svelte — Svelte component patterns
│   ├── brand-config/     # @knots/brand-config — Brand config type + CSS var helper
│   └── tailwind/         # @knots/tailwind — Tailwind 3 preset/plugin (needs TW4 migration)
├── sites/                # Client sites as git submodules
│   ├── mpstaton-site/    # Personal portfolio — actively maintained, first LFM consumer
│   ├── hypernova-site/   # Client site
│   ├── cilantro-site/    # Client site — strong reference implementation
│   ├── twf_site/         # The Water Foundation
│   ├── dark-matter/      # Client site
│   ├── banner-site/      # Client site
│   ├── cogs-site/        # In progress
│   └── coglet-shuffle/   # In progress (nested astro-site)
├── context-v/            # Project documentation (specs, blueprints, prompts, reminders, explorations)
├── design-system-viewer/ # Internal tool — minimal scaffolding (Astro 6 + TW4)
└── pnpm-workspace.yaml   # Workspace config
```

### Pattern Development Workflow

**The Actual Process:**

1. **Build features in client sites** (that's where paid work happens)
2. **Extract patterns to `@knots/*`** when you notice reusable components or approaches (aspirational, happens when remembered)
3. **Copy patterns into other sites** that need similar functionality
4. **Adapt patterns** to each site's specific brand/requirements
5. **Refactor in packages** to improve pattern quality across sites (when time permits)

**Key Insight:** Patterns flow FROM sites TO packages (extraction), then FROM packages TO sites (copying). There's no runtime dependency.

### Site Independence Model

Each site in `sites/*`:
- Lives as a separate git repository
- Added here as a git submodule for co-located development
- Added to `pnpm-workspace.yaml` for development convenience only
- Must have all necessary code in its own repo to deploy independently
- Deploys via Vercel (or similar) by watching its own repo

**What the workspace provides:**
- See all sites together for pattern comparison
- Quickly test pattern changes across multiple sites
- Extract common patterns to `@knots/*` packages
- Development convenience (not deployment requirement)

## Published Packages (`@lossless-group/*`)

These are real packages published to registries that sites install as dependencies.

### @lossless-group/lfm
- **What it is:** Lossless Flavored Markdown — shared remark/rehype pipeline for extended markdown
- **Registries:** GitHub Packages (`npm.pkg.github.com`) and JSR (`jsr.io/@lossless-group/lfm`)
- **Source:** `packages/lfm/`
- **Spec:** `context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md`
- **Usage:** Sites install with `pnpm add @lossless-group/lfm` and import `parseMarkdown()` or `remarkLfm`
- **Includes:** unified, remark-parse, remark-gfm, remark-directive, remark-callouts (Obsidian callout normalization)
- **Currently used by:** mpstaton-site for context-v document rendering

**Example usage in a site:**
```ts
import { parseMarkdown } from '@lossless-group/lfm';
const tree = await parseMarkdown(markdownContent);
// tree is an MDAST — pass to your site's AstroMarkdown renderer
```

Sites need an `.npmrc` to find `@lossless-group` packages:
```
@lossless-group:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### Implementing @lossless-group/lfm in a New Site

This is the step-by-step guide for adding LFM markdown rendering to any site in the monorepo. The reference implementation is `mpstaton-site`.

#### Step 1: Install the package

For **deployed sites** (production), install from the registry:
```bash
pnpm add @lossless-group/lfm
```

The site needs an `.npmrc` to find the package:
```
@lossless-group:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

For **local development only**, you can link the workspace version to get unreleased changes:
```bash
pnpm add @lossless-group/lfm --workspace
```
This sets the dependency to `workspace:^` — **you must change it back to a version range before deploying**, or the site won't build outside the monorepo.

#### Step 2: Parse markdown in your page

In any Astro page that renders markdown content:

```astro
---
import { parseMarkdown } from '@lossless-group/lfm';

// Get your markdown content however your site loads it
const tree = await parseMarkdown(entry.body);

// Citations are attached to the tree after parsing
const citations = (tree as any).data?.citations?.ordered ?? [];
---
```

`parseMarkdown()` returns an MDAST tree with all LFM extensions applied:
- GFM (tables, strikethrough, task lists, footnotes)
- Directives (`:::name{attr="value"}`)
- Obsidian callouts (`> [!type] Title` → directive nodes)
- Citations (hex-code footnote renumbering, structured definition parsing)

#### Step 3: Copy the AstroMarkdown renderer

Copy the recursive MDAST-to-JSX renderer from the canonical pattern source:

```bash
# From the astro-knots root:
mkdir -p sites/YOUR_SITE/src/components/markdown
cp packages/lfm-astro/components/AstroMarkdown.astro sites/YOUR_SITE/src/components/markdown/
```

This component walks the MDAST tree and renders each node type (paragraph, heading, list, link, code, table, footnoteReference, directives, etc.) as Astro/JSX. It handles 20+ node types.

**Key node types to know about:**
- `footnoteReference` — renders as superscript `[n]` using `node.data.citationIndex`
- `footnoteDefinition` — suppressed (rendered via Sources component instead)
- `containerDirective` with `name === "callout"` — renders via a Callout component
- `containerDirective` with `name === "image"` — renders via a MarkdownImage component

**You will likely want to customize this component** for your site's design. That's expected — it's a copy-and-adapt pattern, not a shared dependency.

#### Step 4: Copy the Sources component

```bash
cp packages/lfm-astro/components/Sources.astro sites/YOUR_SITE/src/components/markdown/
```

This renders the citation list at the bottom of a page. It receives `citations` (an array of `Citation` objects) and renders a numbered list with linked titles, source domains, and published dates.

#### Step 5: Wire it into your page template

```astro
---
import { parseMarkdown } from '@lossless-group/lfm';
import AstroMarkdown from '../components/markdown/AstroMarkdown.astro';
import Sources from '../components/markdown/Sources.astro';

const tree = await parseMarkdown(markdownContent);
const citations = (tree as any).data?.citations?.ordered ?? [];
---

<article class="prose">
  <AstroMarkdown node={tree} />
</article>

<Sources citations={citations} />
```

#### Step 6: Optional — Copy supporting components

If your site needs callouts or image directives, copy those too:

```bash
cp packages/lfm-astro/components/Callout.astro sites/YOUR_SITE/src/components/markdown/
cp packages/lfm-astro/components/CodeBlock.astro sites/YOUR_SITE/src/components/markdown/
cp packages/lfm-astro/components/MarkdownImage.astro sites/YOUR_SITE/src/components/markdown/
```

Then update the imports in your copied `AstroMarkdown.astro` to point to your local paths.

#### CRITICAL: How the citation rendering works

The `remarkCitations` plugin transforms the MDAST tree. Understanding this is essential for correct rendering.

**What happens during `parseMarkdown()`:**

1. `remark-gfm` parses `[^a1b2c3]` into `footnoteReference` nodes and `[^a1b2c3]: ...` into `footnoteDefinition` nodes
2. `remark-citations` then:
   - Walks the tree and collects all `footnoteReference` nodes in document order
   - Assigns sequential indices (1, 2, 3...) by order of first appearance
   - Enriches each `footnoteReference` node with `node.data.citationIndex` (the display number) and `node.data.citationHex` (the original identifier)
   - Parses each `footnoteDefinition` into a structured `Citation` object (title, URL, source, dates)
   - **REMOVES all `footnoteDefinition` nodes from the tree** — they no longer exist in the MDAST
   - Attaches the full citation dataset to `tree.data.citations`

**What this means for the renderer:**

The renderer (AstroMarkdown.astro) MUST handle these two node types correctly:

```astro
{/* footnoteReference — render as superscript [n] using the ENRICHED data */}
{type === "footnoteReference" && (() => {
  const ref: any = node;
  // IMPORTANT: Use data.citationIndex for the display number, NOT identifier or label
  // identifier/label contain the raw hex code (e.g., "a1b2c3"), not the sequential number
  const index = ref.data?.citationIndex ?? ref.identifier;
  const hex = ref.data?.citationHex ?? ref.identifier;
  return (
    <sup class="citation-marker">
      <a href={`#source-${hex}`} title={`Citation ${index}`}>[{index}]</a>
    </sup>
  );
})()}

{/* footnoteDefinition — MUST render as null/nothing */}
{/* These nodes are removed by remark-citations, but if any survive, suppress them */}
{/* The citation content is rendered separately via the Sources component */}
{type === "footnoteDefinition" && null}
```

**Common mistakes that break citations:**
- Using `node.identifier` or `node.label` for the display number — these contain the raw hex code, not the sequential number
- Rendering `footnoteDefinition` nodes inline — they should be suppressed; the content lives in `tree.data.citations`
- Not passing `tree.data.citations.ordered` to the Sources component — citations won't appear at the bottom
- Writing a custom footnote renderer that doesn't read `node.data.citationIndex` — the whole point of the plugin is the enriched data on `node.data`

**The Sources component renders the citation list at the bottom:**

```astro
---
// Sources.astro receives the ordered citations array
const { citations } = Astro.props;
const sorted = [...citations].sort((a, b) => a.index - b.index);
---
{sorted.length > 0 && (
  <section>
    <h2>Sources</h2>
    <ol>
      {sorted.map(citation => (
        <li id={`source-${citation.hex}`}>
          [{citation.index}]
          {citation.parsed && citation.url ? (
            <a href={citation.url}>{citation.title}</a>
          ) : (
            <span>{citation.raw}</span>
          )}
          {citation.source && <span>{citation.source}</span>}
          {citation.publishedDate && <span>Published: {citation.publishedDate}</span>}
        </li>
      ))}
    </ol>
  </section>
)}
```

Each citation object in the `ordered` array has these fields:
- `index` (number) — sequential display number (1, 2, 3...)
- `hex` (string) — the original identifier for anchor linking
- `identifier` (string) — same as hex for hex-mode
- `title` (string?) — parsed from `[Title](URL)` in the definition
- `url` (string?) — parsed from `[Title](URL)` in the definition
- `source` (string?) — domain extracted from URL
- `publishedDate` (string?) — parsed from `Published: YYYY-MM-DD`
- `updatedDate` (string?) — parsed from `Updated: YYYY-MM-DD`
- `raw` (string) — full raw definition text (fallback if parsing fails)
- `parsed` (boolean) — whether structured parsing succeeded

**Example markdown input:**
```markdown
Global aging is accelerating.[^a1b2c3]
Healthcare costs are rising.[^d4e5f6]

[^a1b2c3]: 2024. [Population Ageing](https://example.com). Published: 2024-07-11
[^d4e5f6]: 2025. [Key Drivers of Cost](https://example.com). Published: 2024-11-22
```

**Expected rendered output:**
- Inline: `Global aging is accelerating.[1]` and `Healthcare costs are rising.[2]`
- Sources section at page bottom: `[1] Population Ageing. example.com. Published: 2024-07-11` and `[2] Key Drivers of Cost...`
- The `[1]` links to `#source-a1b2c3` and the Sources list item has `id="source-a1b2c3"`

The renderer then displays `[1]` and `[2]` inline, and the Sources component renders the full citation list at the bottom.

#### Dependencies note

`@lossless-group/lfm` bundles its own dependencies (unified, remark-parse, remark-gfm, remark-directive). You do **not** need to install those separately. The only dependency your site needs is `@lossless-group/lfm` itself, plus `mdast-util-to-string` if your AstroMarkdown component uses it for heading IDs.

```bash
pnpm add @lossless-group/lfm mdast-util-to-string
```

## Pattern Packages (`@knots/*`)

These are workspace-local reference implementations that you copy from and adapt. They are NOT published and NOT imported as runtime dependencies.

### @knots/tokens
- **Purpose:** Design token pattern examples (colors, scales, typography, spacing)
- **Usage:** Copy token structure and values into your site's `src/` directory
- **Pattern:** TypeScript types for tokens with runtime objects

**Example - Copy this pattern:**
```ts
// Copy into your site: src/config/tokens.ts
export type ColorScale = { [step: number]: string };
export interface Tokens {
  brandName?: string;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
  };
}

export const tokens: Tokens = {
  colors: {
    primary: { 500: "#2563eb" },
    secondary: { 500: "#06b6d4" },
    accent: { 500: "#f59e0b" }
  }
};
```

### @knots/icons
- **Purpose:** SVG icon helper pattern
- **Usage:** Copy `getIcon()` helper and icon definitions into your site
- **Pattern:** Minimal inline SVG strings with name lookup

**Example - Copy this pattern:**
```ts
// Copy into your site: src/utils/icons.ts
const icons: Record<string, string> = {
  arrowRight: '<svg>...</svg>',
  // ... more icons
};

export default function getIcon(name: string): string {
  return icons[name] || '';
}
```

### @knots/astro & @knots/svelte
- **Purpose:** Component pattern examples
- **Usage:** Copy component files into your site's `src/components/`
- **Pattern:** Simple, composable UI components

**Example - Copy component files:**
```bash
# Don't import these! Copy them:
cp packages/astro/src/components/Button.astro sites/my-site/src/components/
cp packages/svelte/src/components/Button.svelte sites/my-site/src/components/
# Then adapt to your site's needs
```

### @knots/brand-config
- **Purpose:** Brand configuration pattern
- **Usage:** Copy brand config structure into your site
- **Pattern:** Named brand objects with colors/assets

**Example - Copy this pattern:**
```ts
// Copy into your site: src/config/brand.ts
export interface BrandConfig {
  name: string;
  colors: { primary: string; secondary: string; accent: string; };
  assets?: { logoLight?: string; logoDark?: string; };
}

export const myBrand: BrandConfig = {
  name: "My Brand",
  colors: { primary: "#...", secondary: "#...", accent: "#..." }
};
```

### @knots/tailwind
- **Purpose:** Tailwind preset/plugin pattern consuming tokens
- **Usage:** Copy preset and plugin files, adapt to your site's tokens
- **Pattern:** Token-based Tailwind configuration

**Example - Copy and adapt:**
```bash
# Copy the pattern
cp packages/tailwind/preset.mjs sites/my-site/
cp packages/tailwind/plugin.mjs sites/my-site/
# Edit to reference your site's tokens
# Use in tailwind.config.js
```

## Development Workflow

### Working on a Client Site

1. **Navigate to site:** `cd sites/cilantro-site`
2. **Develop normally:** `pnpm dev`
3. **Deploy from site repo:** Vercel watches the cilantro-site repo
4. **Site is self-contained:** All code needed for deployment is in the site repo

### Extracting Patterns to Packages

When you build something reusable in a client site:

1. **Identify the pattern:** "This Button component would be useful in other sites"
2. **Extract to package:** Copy to `packages/astro/src/components/Button.astro`
3. **Generalize if needed:** Remove site-specific hardcoding
4. **Document the pattern:** Add usage examples
5. **Copy to other sites:** Other sites copy from packages when they need it

### Copying Patterns Between Sites

When a site needs a pattern from packages:

1. **Find pattern:** Browse `packages/astro/src/components/`
2. **Copy file:** `cp packages/astro/src/components/Button.astro sites/twf_site/src/components/`
3. **Adapt to site:** Adjust colors, sizes, styles for the site's brand
4. **Site owns the code:** The copied file belongs to the site now

### Adding a New Client Site

For the full step-by-step guide covering configuration, directory structure, content collections, and LFM integration, see: **`context-v/prompts/New-Site-Quickstart-Guide.md`**

The workspace setup steps:

```bash
# 1. Create separate repo for the site
# (done in GitHub/GitLab/etc.)

# 2. Add as submodule to astro-knots (for co-located development)
git submodule add https://github.com/org/client-site.git sites/client_site

# 3. Add to workspace (for development convenience)
# Edit pnpm-workspace.yaml and add:
#   - sites/client_site

# 4. Initialize submodule
git submodule update --init sites/client_site

# 5. Install dependencies
pnpm install

# 6. Site develops independently
cd sites/client_site
pnpm dev  # Site works on its own

# 7. Copy markdown rendering components from the pattern reference
mkdir -p src/components/markdown
cp ../../packages/lfm-astro/components/*.astro src/components/markdown/

# 8. Copy the parseContent utility for LFM polyfills (citations + callouts)
mkdir -p src/lib
cp ../twf_site/src/lib/parse-content.ts src/lib/
```

**Reference implementations by concern:**
- **LFM + markdown rendering:** `sites/twf_site` — cleanest implementation, includes `parseContent` utility with citation/callout polyfills
- **Content rendering + DocCards + OG images:** `sites/mpstaton-site`
- **SEO/OG meta + environment config + content collections architecture:** `sites/cilantro-site`
- **Theme + Mode (3-mode: light/dark/vibrant) switcher:** `sites/hypernova-site` — canonical ThemeSwitcher + ModeSwitcher utilities and Brand Kit page
- **Design System catalog:** `sites/dark-matter/src/pages/design-system/` — most expansive sub-page structure

### CSS Token Convention (Two-Tier System)

Every site uses a two-tier token architecture for colors and fonts (full spec: `context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md` §2.1):

- **Named tokens** (Tier 1, raw values, private): BEM-ish syntax with `__` separator. Live at the top of `theme.css`.
  - Examples: `--color__blue-azure`, `--color__rose-quartz`, `--font__lato`, `--font__playfair-display`
- **Semantic tokens** (Tier 2, system layer): kebab-case. Reference named tokens via `var()`. **Tailwind v4 only generates utilities for kebab-case tokens** — this tier must stay kebab-case.
  - Examples: `--color-primary`, `--color-primary-500`, `--font-heading-1`, `--font-body`, `--fx-glow-opacity`

**Visual rule:** see `__` → raw named token. See only `-` → semantic token. Components and Tailwind utilities only ever read semantic tokens.

**Client-iteration motion:** when a client wants a different color or font, add a new named token at the top and re-point one semantic token: `--color-primary: var(--color__new-name);`. Components don't change.

```css
:root {
  --color__blue-azure: #1f7ae0;        /* Tier 1: named */
  --font__lato: 'Lato', system-ui, sans-serif;
}
.theme-default {
  --color-primary: var(--color__blue-azure);  /* Tier 2: semantic */
  --font-body: var(--font__lato);
}
```

When generating or modifying CSS in a site's theme files: put new raw values in the named tier, wire components through the semantic tier, never reference `--color__*` from a component.

**Markdown component copy source:** Always copy from `packages/lfm-astro/components/`, not from a specific site. This is the canonical pattern reference for `AstroMarkdown.astro`, `Sources.astro`, `Callout.astro`, `CodeBlock.astro`, and `MarkdownImage.astro`. The components include scoped list styles that counter Tailwind's preflight reset — a recurring issue across all sites.

## Reference Pages: `/brand-kit` & `/design-system` (Required Per Site)

**Every Astro-Knots site ships two internal reference pages.** We do not use Storybook or a separate Design System Manager — AI assistants improvise pages inside the site's own theme/mode/runtime, eliminating drift.

| | Brand Kit (`/brand-kit`) | Design System (`/design-system`) |
|---|---|---|
| **Audience** | Stakeholders, brand reviewers, client marketing | Developers, AI assistants, contributors |
| **Scope** | Brand experience essentials (color tokens, typography, marks, signature layouts) | Exhaustive component catalog with variants, props, CSS contracts |
| **Entry file** | `src/pages/brand-kit/index.astro` | `src/pages/design-system/index.astro` |
| **Update cadence** | Rare — only when brand evolves | Continuous — every new component lands here |

Both pages must use `BaseThemeLayout`, expose the theme + mode toggle at the top, render correctly in all three modes (light / dark / vibrant), and emit `<meta name="robots" content="noindex, nofollow" />`.

**Full conventions:** `context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md`.

### Maintenance Motion (Important for AI Assistants)

When you create or modify a component in any site:

1. **Always update `/design-system`** (the relevant sub-page or the index) **in the same change** that introduces or modifies the component. Do not split this across PRs.
2. If the change is a brand evolution (new token, new font, new mark) — **update `/brand-kit` first**, before propagating the change to other pages.
3. If `/design-system/index.astro` does not yet exist for the site, create it as part of the work and add the component as the first entry. If only `component-library.astro` exists (legacy name), rename to `index.astro` while you're there.

This discipline is what replaces Storybook in our workflow. Skip it and the catalog rots.

**Canonical references:**
- Brand Kit: `sites/hypernova-site/src/pages/brand-kit/`, `sites/twf_site/src/pages/brand-kit/`
- Design System: `sites/dark-matter/src/pages/design-system/` (most expansive sub-page structure)

## Submodule Management

Sites are git submodules with fully independent version control:

```bash
# Initialize all submodules
git submodule update --init --recursive

# Update submodule to latest remote
git submodule update --remote sites/cilantro-site

# Sync submodule config
git submodule sync

# Work inside a submodule (standard git workflow)
cd sites/cilantro-site
git checkout main
git pull
# ... make changes ...
git add .
git commit -m "Update"
git push origin main

# Update parent repo to track new submodule commit
cd ../..
git add sites/cilantro-site
git commit -m "Update cilantro-site submodule reference"
```

## Common Patterns & Anti-Patterns

### ✅ Do

- **Import from `@lossless-group/*` published packages** when sites need identical processing logic (e.g., `@lossless-group/lfm` for markdown)
- **Copy and adapt from `@knots/*` pattern packages** for components, styles, and layouts that each site customizes
- **Keep sites independently deployable** - They install published packages from registries, not from the workspace
- **Use pnpm exclusively** - Never npm, npx, or yarn. Use pnpx instead of npx.
- **Commit submodule changes separately** - Each site has its own git history
- **Adapt copied patterns to each site** - Don't force one-size-fits-all

### ❌ Avoid

- **Don't use `workspace:*` in site package.json** - Sites must deploy from their own repos without the monorepo
- **Don't import from `@knots/*` at runtime** - Those are pattern references, not published packages
- **Don't use npm or yarn** - Breaks workspace protocol. Always pnpm/pnpx.
- **Don't assume everything should be a shared package** - Most things are better copied and adapted
- **Don't assume everything should be copied** - Processing pipelines (like LFM) genuinely benefit from a shared package
- **Don't commit inside submodule from parent** - Work in submodule's own git context

## Environment-Driven Configuration Pattern

Sites typically implement environment-based theming (copy this pattern):

**Environment Variables (`.env`):**
```bash
SITE_BRAND=cilantro          # Brand key
SITE_MODE=dark               # Theme mode
FEATURE_FLAGS=search,blog    # Feature toggles
```

**Configuration Files (`src/config/`):**
- `brand.ts` - Brand selection and configuration
- `theme.ts` - Theme token application
- `features.ts` - Feature flag evaluation
- `seo.ts` - SEO defaults

## Package Publishing Status

**Already published:**
- `@lossless-group/lfm` — published to GitHub Packages and JSR. The first real shared package.
- Publishing workflow: edit in `packages/lfm/`, bump version, `pnpm build && pnpm publish` for GitHub Packages, `pnpx jsr publish --allow-dirty` for JSR.

**Not published (pattern references only):**
- `@knots/*` packages remain workspace-local. Publishing them is theoretically possible but not currently justified — the copy-pattern approach works for UI components.

**Future candidates for publishing:**
- The design-system-viewer could become a shared micro-frontend
- Additional remark/rehype plugins will be added to `@lossless-group/lfm` as the LFM spec matures (citations, backlinks, auto-unfurl, etc.)

## Testing

Currently implemented in select sites:

**Vitest Configuration (example from hypernova-site):**
```bash
pnpm --filter hypernova-site test      # Watch mode
pnpm --filter hypernova-site test:ui   # UI mode
pnpm --filter hypernova-site test:run  # Single run
```

**Testing Strategy:**
- Tests live in each site's repo (not in packages)
- Package code is reference/example quality (not production library)
- Focus testing on deployed site code

## Troubleshooting

### Submodule Issues

```bash
# Submodule not initialized
git submodule update --init sites/client_site

# Submodule shows as modified (check if you need to commit inside it)
cd sites/client_site
git status  # Check for uncommitted changes
cd ../..

# Submodule detached HEAD
cd sites/client_site
git checkout main
```

### Site Won't Deploy

**Check:**
1. Does site have all code it needs in its own repo?
2. Are there any `@knots/*` imports that should be copied code?
3. Can you `pnpm install && pnpm build` inside the site directory alone?
4. Is Vercel watching the correct repository?

### Pattern Extraction Questions

**"Should I extract this to a package?"**
- Will another site likely need this pattern?
- Is it generic enough to reuse?
- Do you have time to extract and document it?
- If yes to all: extract it. If not: leave it in the site for now.

## Design System Philosophy

- **Patterns over dependencies:** Copy and adapt rather than import and constrain
- **Site autonomy:** Each site owns its destiny and deployment
- **Extract when ready:** Don't force premature abstraction
- **Minimal coupling:** Sites share ideas, not runtime code
- **Client independence:** Clients can deploy without knowing about astro-knots

## Project-Specific Context

### Why This Approach?

**Client Requirements:**
- Clients need to own and deploy their sites independently
- No vendor lock-in to our monorepo infrastructure
- Sites must work from their own repos (Vercel auto-deploy)

### Recent Progress (Mar 2026)

- **@lossless-group/lfm** — First published package. Shared markdown pipeline with remarkGfm, remarkDirective, remarkCallouts. Published to GitHub Packages and JSR.

- **mpstaton-site** (`sites/mpstaton-site`)
  - Context-V document rendering — DocCard index + detail pages with full markdown rendering via `@lossless-group/lfm`
  - AstroMarkdown renderer copied from `@knots/astro` and extended (tables, strikethrough, HTML nodes)
  - Portfolio, CV, OG image generation complete
  - First site consuming `@lossless-group/lfm` as a published dependency

- **design-system-viewer** — Migrated from Astro 4 + Tailwind 3 to Astro 6 + Tailwind 4 to clear Dependabot vulnerabilities

### Previous Progress (Nov 2025)

- Hypernova — portfolio page, brand mark, TypeScript fixes, content collection cleanup
- TWF — brand mark light/dark support, copy-pattern workflow

### Sites as Reference

**mpstaton-site** is the current primary reference for content rendering — it's the first site using `@lossless-group/lfm` and has the most complete AstroMarkdown renderer.

**Cilantro-site** remains a strong reference for environment-driven configuration, SEO/OG meta utilities, and content collections architecture.

## Notes for AI Assistants

1. **This project is in between states** - It's not a true monorepo and not purely a pattern library. The right approach depends on the specific code.
2. **Published packages (`@lossless-group/*`) are real dependencies** - Sites install them from GitHub Packages or JSR. Import them normally.
3. **Pattern packages (`@knots/*`) are references** - Copy the code into the site, adapt it. Never import at runtime.
4. **Sites are independently deployable** - No `workspace:*` links. Published packages only.
5. **Respect submodules** - Each site has separate git history. Commit inside the submodule, not from the parent.
6. **Use pnpm/pnpx exclusively** - Never npm, npx, yarn, or node directly.
7. **Check `context-v/`** - Specs, blueprints, and prompts contain valuable context about design decisions.
8. **Update `/design-system` when you change components** — every component introduction or variant lands in the site's `src/pages/design-system/` catalog in the same change. Update `/brand-kit` first when changing brand-level tokens. See the "Reference Pages" section above.

**When deciding import vs. copy:**
1. Is this processing logic that should be identical across sites? → **Published package** (like `@lossless-group/lfm`)
2. Is this a component/layout/style that each site customizes? → **Copy and adapt** (like AstroMarkdown.astro)
3. Is this something new that only one site needs right now? → **Build in the site**. Extract later if other sites need it.

**When troubleshooting:**
1. Can the site build/run from its own directory alone?
2. Are there any `workspace:*` dependencies that would break deployment?
3. Is the submodule initialized and on the right branch?
4. Does `.npmrc` have the `@lossless-group` registry configured?
