---
title: Page Spec — projects/index.astro & projects/[slug].astro
lede: A specification for the FullStack VC Projects page (gallery + detail), the supporting content collection, the Hero and Project Gallery section components, and the Jumbo Popdown that surfaces projects from the site header.
date_authored_initial_draft: 2026-04-27
date_authored_current_draft: 2026-04-27
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-04-27
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags:
  - Page-Spec
  - Projects
  - Content-Collection
  - Hero
  - Section-Component
  - Jumbo-Popdown
  - Sitemap
  - FullStack-VC
authors:
  - Michael Staton
image_prompt: A blueprint of a peer learning community's project gallery — a hero banner with a message hierarchy at the top, a grid of working-group project cards beneath it, an archive shelf in the lower margin, and a header dropdown that mirrors the gallery, all rendered as a layered architectural diagram.
date_created: 2026-04-27
date_modified: 2026-04-27
from: fullstack-vc
from_path: sitemap/pages/Page__projects-index.astro.md
---
<!-- Rolled up from fullstack-vc/context-v/sitemap/pages/Page__projects-index.astro.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Page Spec — `projects/index.astro` & `projects/[slug].astro`

**Status**: Draft (v0.0.1.0)
**Site**: `sites/fullstack-vc`
**Author**: Michael Staton

---

### Workflow Status

#### Done
- [ ] (none yet — this spec is the first artifact)

#### In Review
- [ ] Initial draft of page composition, content model, and component inventory.

#### Planned (post-approval)
- [ ] Implement content collection (`projects`) and Zod schema.
- [ ] Port content for the five active projects from lossless.group.
- [ ] Implement `HeroBannerWithMessageHierarchy.astro`.
- [ ] Implement `Section__ProjectGallery.astro` (with at least two creative concept variants).
- [ ] Implement `projects/index.astro` and `projects/[slug].astro`.
- [ ] Wire `JumboPopdown__Projects` into `Header.astro`.
- [ ] Add `/design-system/sections/project-gallery.astro` showcasing variants.

---

## 1. Problem

FullStack VC is a peer learning community organized around **working groups that collaborate in an attempt to learn, codify, and potentially ship projects together**. The point is to learn and apply knowledge, not necessarily to ship. Today the site has a Dojo page, Webinars, and a Changelog — but **no surface for the projects themselves**. Members and prospective members cannot:

- See what working groups are active
- Read what each group is building, why, and who's involved
- Find proposed projects to join, or revisit archived projects to learn from prior work
- Land directly on a project from the site header without navigating through prose pages

Meanwhile, the lossless.group site already hosts five projects that are conceptually owned by FullStack VC's community (Content Farm, MemoPop AI, Astro Knots, Augment It, Context Vigilance). They need a home on this site, not on a parent-org site.

The Lossless Flavored Markdown package could also be included in as a current project.

---

## 2. Goal

Define a **complete sitemap unit for projects** in FullStack VC:

1. A **Projects index** page (`/projects/`) that lists active working-group projects with proposed and archived projects browsable in adjacent zones.
2. A **Project detail** page (`/projects/[slug]/`) that renders a single project's full content using the LFM markdown pipeline.
3. A **`projects` content collection** with a Zod schema covering identity, status, working-group metadata, links, and rendering hints.
4. A reusable **`HeroBannerWithMessageHierarchy.astro`** for the index page (image-banner background + the existing `HeroContentCoreMessage` message hierarchy).
5. A new **`Section__ProjectGallery.astro`** with at least two creative-concept variants for displaying project cards.
6. A **`JumboPopdown__Projects`** component for `Header.astro`, conforming to the patterns in `context-v/blueprints/Jumbotron-Popdown-Patterns.md`.
7. Per the project convention, **the same change that introduces these components updates `/design-system/`** with demo entries.

---

## 3. Prior Art and References

This spec borrows from the following existing artifacts in the repo:

| Reference | Location | What we take |
|-----------|----------|--------------|
| LFM Spec | `astro-knots/context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md` | Frontmatter conventions, citation handling on detail pages |
| Jumbotron Popdown Patterns | `astro-knots/context-v/blueprints/Jumbotron-Popdown-Patterns.md` | Popdown structure, props interface, accessibility expectations |
| Areas of Venture section | `sites/fullstack-vc/context-v/sitemap/sections/Section__Areas-of-Venture.md` | File-naming convention for sitemap specs |
| AreasOfVentureGrid component | `sites/fullstack-vc/src/components/sections/AreasOfVentureGrid.astro` | Card-grid pattern, semantic-token usage, mode-aware styling |
| HeroContentCoreMessage | `sites/fullstack-vc/src/components/heroes/HeroContentCoreMessage.astro` | Message hierarchy already in use (eyebrow → h1 → h2 → supporting → CTA) |
| Design System convention | `astro-knots/context-v/reminders/Design-System-Pages-Per-Site.md` | Catalog updates land in the same change as the component |
| Content collections (existing) | `sites/fullstack-vc/src/content.config.ts` | `glob` loader pattern, Zod schema style |
| ProjectCard component | `/Users/mpstaton/code/lossless-monorepo/site/src/components/content/ProjectCard.astro` | Card pattern, semantic-token usage, mode-aware styling |
| ProjectGrid component | `/Users/mpstaton/code/lossless-monorepo/site/src/components/content/ProjectGrid.astro` | Grid pattern, semantic-token usage, mode-aware styling |
| ProjectsDropdown component | `/Users/mpstaton/code/lossless-monorepo/site/src/components/basics/ProjectsDropdown.astro` | Dropdown pattern, semantic-token usage, mode-aware styling |

External reference (content to port — read only, not linked at runtime):
- `https://www.lossless.group/projects/gallery/content-farm`
- `https://www.lossless.group/projects/gallery/memopop-ai`
- `https://www.lossless.group/projects/gallery/astro-knots`
- `https://www.lossless.group/projects/gallery/augment-it`
- `https://www.lossless.group/projects/gallery/context-vigilance`
- `https://github.com/lossless-group/astro-knots/packages/lfm` & `https://github.com/lossless-group/astro-knots/packages/astro-knots/lfm-astro`

---

## 4. Page Composition

### 4.1 `projects/index.astro` — the Gallery

**Route**: `/projects/`
**Layout**: `BaseThemeLayout` (sticky `Header` + footer; theme/mode aware)
**Prerender**: `true` (static)

**Top-to-bottom sections:**

1. **Hero** — `HeroBannerWithMessageHierarchy.astro`
   - Background: full-bleed image banner with a dimming/gradient overlay so the message hierarchy stays legible across light/dark/vibrant modes.
   - Foreground: the existing `HeroContentCoreMessage` message hierarchy (eyebrow → h1 → h2 → supporting → CTA).
   - Default copy (text-content props end with `Txt`; the visual element they render into is the *eyebrow*, *headline*, etc.):
     - `contextSetterTxt` → renders as the eyebrow: "Working Groups · Peer Learning"
     - `headerTxt`: "Projects shipped together."
     - `subheaderTxt`: "Active working groups in the FullStack VC community."
     - `supportingTxt`: One-sentence framing of why projects matter (we ship to learn).
     - `ctaLabelTxt` / `ctaHref`: "Propose a project" → `/projects/propose` (out-of-scope here; link only).

2. **Active Projects** — `Section__ProjectGallery.astro` with `status="active"`
   - `headingTxt`: "Active Working Groups"
   - `contextSetterTxt` (rendered into the eyebrow): "In flight"
   - Card grid of all `status: active` entries from the `projects` collection.

3. **Proposed Projects** — `Section__ProjectGallery.astro` with `status="proposed"` and `variant="lite"`
   - `headingTxt`: "Proposed — looking for working-group members"
   - `contextSetterTxt` (rendered into the eyebrow): "Open call"
   - Lighter visual treatment (smaller cards, no banner thumbnails) to communicate "not yet committed."

4. **Archived Projects** — `Section__ProjectGallery.astro` with `status="archived"` and `variant="shelf"`
   - `headingTxt`: "Archive"
   - `contextSetterTxt` (rendered into the eyebrow): "Prior work"
   - Compact list/shelf treatment; archived projects are valuable as references but should not dominate visual weight.

**Empty-state behavior:** Each of the three sections renders nothing (no header, no spacer) when its filtered list is empty. This avoids ghost headers when the community is between cycles.

### 4.2 `projects/[slug].astro` — the Detail

**Route**: `/projects/[slug]/`
**Layout**: `BaseThemeLayout`
**Prerender**: `true`
**Path params**: from `getStaticPaths()` over the `projects` collection.

**Top-to-bottom sections:**

1. **ProjectHero** — uses `HeroContentCoreMessage` with project-specific copy:
   - `contextSetter`: project's `category` or `working_group_name`
   - `headerTxt`: project `title`
   - `subheaderTxt`: project `lede`
   - `supportingTxt`: empty by default; opt-in via frontmatter
   - Status badge ("Active" / "Proposed" / "Archived") rendered as an eyebrow extension.
   - Optional `hero_image` rendered as a banner above or behind the message (re-uses `HeroBannerWithMessageHierarchy` when an image is present; falls back to plain hero when not).

2. **ProjectMeta** — small metadata strip:
   - Working-group leads (avatars + names)
   - Participants (avatars + names)
   - Cadence (e.g., "Bi-weekly · Thursdays 14:00 PT")
   - External links (repo, Figma, demo, RSVP) as icon buttons
   - Getting Started content in Markdown file.
   - Last activity date

3. **Project Body** — markdown body rendered via `@lossless-group/lfm`'s `parseMarkdown()` + the site's local `AstroMarkdown.astro` renderer. Citations use the existing pattern from the LFM spec (`tree.data.citations.ordered` → `Sources.astro`).

4. **Sources** — `Sources.astro` (only when `tree.data.citations.ordered` is non-empty).

5. **Adjacent Projects** — small footer strip linking to one prior + one next active project to encourage browsing.

---

## 5. Content Model — `projects` Collection

### 5.1 Loader

```ts
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({ /* see 5.2 */ }).passthrough(),
});
```

Add to `src/content.config.ts` exports next to `pages`, `webinars`, `changelog`, `ventureWorkflows`.

### 5.2 Zod Schema (proposed)

```ts
z.object({
  // Identity
  title:                 z.string(),
  slug:                  z.string().optional(),  // auto from filename if omitted
  lede:                  z.string(),
  summary:               z.string().optional(),  // longer paragraph used in JumboPopdown if present
  scope:                 z.string().optional(),  // short description of the Scope of Work to clarify project boundaries

  // Lifecycle
  status:                z.enum(['active', 'proposed', 'archived']),
  date_initiated:        z.coerce.date().optional(),
  date_archived:         z.coerce.date().optional(),
  date_last_activity:    z.coerce.date().optional(),

  // Working group
  working_group_name:    z.string().optional(),
  working_group_leads:   z.array(z.object({
    uuid:    z.string(),
    name:    z.string(),
    role:    z.string().optional(),
    profile: z.string().url().optional(),
    avatar:  z.string().optional(),
  })).optional(),
  members_count:         z.number().optional(),
  cadence:               z.string().optional(),  // e.g. "Bi-weekly · Thursdays 14:00 PT"
  rsvp_url:              z.string().url().optional(),

  // External surfaces
  links: z.object({
    repo:   z.string().url().optional(),
    site:   z.string().url().optional(),
    demo:   z.string().url().optional(),
    figma:  z.string().url().optional(),
    spec:   z.string().url().optional(),
    notes:  z.string().url().optional(),
    videos: z.array(z.string().url()).optional(),
  }).optional(),

  // Discovery
  tags:                  z.array(z.string()).optional(),  // Train-Case per repo convention
  category:              z.string().optional(),
  origin:                z.string().optional(),  // e.g. "Ported from lossless.group"

  // Display
  hero_image:            z.string().optional(),
  hero_image_prompt:     z.string().optional(),
  thumbnail:             z.string().optional(),
  banner_overlay:        z.enum(['gradient', 'scrim', 'none']).default('gradient'),
  card_accent:           z.string().optional(),  // semantic token name override

  // Behavior
  publish:               z.boolean().default(true),
  feature_in_popdown:    z.boolean().default(true),
  popdown_order:         z.number().optional(),

  // Authorship
  authors:               z.array(z.string()).optional(),
  augmented_with:        z.string().optional(),

  // Versioning
  at_semantic_version:   z.string().optional(),
  date_created:          z.coerce.date().optional(),
  date_modified:         z.coerce.date().optional(),
}).passthrough()
```

### 5.3 Directory Layout

```
src/content/projects/
  active/
    content-farm.md
    memopop-ai.md
    astro-knots.md
    augment-it.md
    context-vigilance.md
  proposed/
    .keep
  archived/
    .keep
  README.md
```

The `status` field is the source of truth for filtering — directory is for authoring ergonomics only. Rendering logic must NOT infer status from path.

### 5.4 Initial Active Projects (port targets)

Five entries to be created during implementation, each with `status: active` and `origin: "Ported from lossless.group"`:

| Title | Slug | Source URL |
|---|---|---|
| Content Farm | `content-farm` | https://www.lossless.group/projects/gallery/content-farm |
| MemoPop AI | `memopop-ai` | https://www.lossless.group/projects/gallery/memopop-ai |
| Astro Knots | `astro-knots` | https://www.lossless.group/projects/gallery/astro-knots |
| Augment It | `augment-it` | https://www.lossless.group/projects/gallery/augment-it |
| Context Vigilance | `context-vigilance` | https://www.lossless.group/projects/gallery/context-vigilance |

Bodies should be ported as LFM-compatible markdown (citations preserved as hex-code footnotes if present in source).

---

## 6. Component Inventory

### 6.1 `HeroBannerWithMessageHierarchy.astro`

**Location**: `src/components/heroes/HeroBannerWithMessageHierarchy.astro`
**Composes**: `HeroContentCoreMessage.astro`
**Purpose**: Image-banner hero that wraps the existing message hierarchy. Used by the projects index, optionally by individual project detail pages.

> [!NOTE]
> Message Hierarchy components should control the relative styling of the message hierarchy, not the surrounding components in which it is rendered. The content data should always be structured in the frontmatter in a clear way for easy user edits.

**Props**:

```ts
export interface Props {
  // Banner imagery
  image: string;                          // path or URL (absolute or root-relative)
  imageAlt?: string;
  overlay?: 'gradient' | 'scrim' | 'none';  // default: 'gradient'
  align?: 'left' | 'center';                 // default: 'left'
  height?: 'short' | 'standard' | 'tall';   // default: 'standard'

  // Message hierarchy — passed through to HeroContentCoreMessage.
  // Text-content props end with `Txt`; the visual elements they render into
  // (eyebrow, headline, subheader, supporting paragraph, CTA button) are
  // named separately in the component's CSS classes and slots.
  contextSetterTxt?: string;   // renders into the eyebrow element
  headerTxt: string;           // renders into the headline element
  subheaderTxt?: string;       // renders into the subheader element
  supportingTxt?: string;      // renders into the supporting paragraph
  ctaLabelTxt?: string;        // renders into the CTA button label
  ctaHref?: string;
}
```

**Visual contract**:
- Background image fills the section; semantic-token overlay (`var(--color-background)` mixed with transparency) ensures legibility in all three modes.
- Message hierarchy is constrained to `max-width: 56ch` and offset from the left edge by the page gutter.
- `height` maps to clamp ranges: `short` ~ 320–420px, `standard` ~ 420–560px, `tall` ~ 560–720px.
- Reads only semantic tokens (`--color-text`, `--color-text-muted`, `--color-primary`, `--font-display`, `--font-code`, `--font-body`, `--fx-headline-gradient`). No `--color__*` references.

### 6.2 `Section__ProjectGallery.astro`

**Location**: `src/components/sections/Section__ProjectGallery.astro`
**Purpose**: Renders a filtered set of projects as a card grid. Single component, multiple `variant` modes — picked by parent context (active vs. proposed vs. archived).

**Props**:

```ts
export interface Props {
  // Section header — text-content props end with `Txt`. Visual elements
  // (eyebrow, heading, intro paragraph) are named separately in the
  // component's CSS classes and slots.
  contextSetterTxt?: string;   // renders into the eyebrow element
  headingTxt?: string;         // renders into the section heading (h2)
  introTxt?: string;           // renders into the intro/lede paragraph

  // Data
  projects: ProjectEntry[];    // already filtered by status

  // Treatment
  variant?: 'standard' | 'lite' | 'shelf';   // default: 'standard'
  emptyHide?: boolean;                       // default: true
}
```

**Variant matrix**:

| Variant | When to use | Card treatment | Density |
|---|---|---|---|
| `standard` | `status: active` | Banner thumbnail + title + lede + leads + tags | 2-column at md, 3-column at xl |
| `lite` | `status: proposed` | No thumbnail; title + lede + "join" CTA | 3-column at md |
| `shelf` | `status: archived` | Compact horizontal list rows; title + lede + dates | 1-column |

**Behavior**:
- Empty list + `emptyHide: true` → renders nothing (no `<section>` markup at all).
- Cards link to `/projects/[slug]/`.
- Status badge in top-right of standard cards (color from semantic token; "Active" green, "Proposed" amber, "Archived" muted).

#### 6.2.1 Creative Concepts (to explore in design-system)

Before settling, prototype at least **two** of these as `/design-system/sections/project-gallery-*.astro` pages so the team can pick one for `standard` variant:

1. **Working Group Cards** — banner image, title, lede, lead avatars, tag chips. Reads like a portfolio card.
2. **Mission Briefs** — number badge ("01", "02") + monospace eyebrow + title + 1-paragraph mission text + repo/demo icon row. Reads like a typed dossier (echoes `AreasOfVentureGrid`).
3. **Constellation** — non-grid layout: cards offset on a 2-axis canvas, sized by activity level. Visually communicates "ecosystem of projects." More expensive to implement; treat as wish list.

Acceptance: ship `standard` with concept 1 OR 2; document the unused concept in design-system as a future variant.

### 6.3 `JumboPopdown__Projects.astro`

**Location**: `src/components/ui/menus/JumboPopdown__Projects.astro`
**Purpose**: Header dropdown that surfaces active projects (and optionally proposed) directly from the site nav. Mounted from `Header.astro` as a new top-level nav item: **Projects**.

**Conformance**: Follows `astro-knots/context-v/blueprints/Jumbotron-Popdown-Patterns.md` — generic `JumboDropdown` shape, custom variant with project-specific content.

**Props**:

```ts
export interface Props {
  // Trigger label in the header nav. Visual element is the nav link/button;
  // this prop carries the text content only.
  triggerLabelTxt?: string;             // default: "Projects"

  // Data
  projects: ProjectEntry[];             // filtered to feature_in_popdown === true, sorted by popdown_order then date_last_activity desc

  // Behavior
  showProposed?: boolean;               // default: true — appends a "Proposed" subgroup
  maxItems?: number;                    // default: 6
}
```

**Structure**:
- Dropdown header: "Working Groups"
- Grid of items: title (2–3 words), one-sentence description (`summary` or `lede`), small status dot.
- Footer row with two links: `View all projects →` (`/projects/`) and `Propose a project →` (`/projects/propose`).
- Keyboard: `role="menu"`, arrow-key navigation between items, `Esc` closes, focus trap while open.
- Hover open + click toggle on touch; respects `prefers-reduced-motion`.

**Source of truth**: a small loader (`src/lib/load-projects-for-popdown.ts`) reads the `projects` collection at build time and passes the array to the popdown. The popdown does not fetch at runtime.

### 6.4 `ProjectMetadataDisplay.astro` (detail page)

**Location**: `src/components/sections/ProjectMetadataDisplay.astro`
**Purpose**: Below-hero metadata strip on `projects/[slug].astro`. Renders working-group leads, cadence, RSVP CTA, and external link icon row. Pure semantic tokens.

### 6.5 `ProjectReader.astro` (detail page)

**Location**: `src/components/sections/ProjectReader.astro`
**Purpose**: Main content area on `projects/[slug].astro`. Renders the project's markdown body with a clean, readable layout. Includes a back-to-projects link and optional "Edit on GitHub" button.

---

## 7. Routing & Data Flow

```
[ projects collection (md files) ]
            │
            ├──► getStaticPaths()  ───► projects/[slug].astro  (one page per entry)
            │
            ├──► load-active-for-index.ts  ──► projects/index.astro
            │                                  ├─ active   → Section__ProjectGallery (standard)
            │                                  ├─ proposed → Section__ProjectGallery (lite)
            │                                  └─ archived → Section__ProjectGallery (shelf)
            │
            └──► load-projects-for-popdown.ts ──► JumboPopdown__Projects (in Header.astro)
```

All loaders are pure (read collection, filter, sort, return). No runtime fetches.

---

## 8. SEO & Meta & Share Optimization

- `<title>`: index → "Projects · FullStack VC"; detail → `${project.title} · FullStack VC`.
- `<meta name="description">`: `lede` for both.
- OG image: detail uses `hero_image` if set; index uses a static `/og/projects.png` (to be generated). Generation script is out-of-scope for v0.0.1.0.
- Structured data (JSON-LD) deferred to a later version.
- Attention to Semantic HTML tags and proper, legible ids. 
- OG image generation script for `/projects/`.

---

## 9. Accessibility

- Section headings are `<h2>`; project card titles are `<h3>`.
- Status badges include accessible text (e.g., `<span class="sr-only">Status: </span>Active`).
- Cards are entirely link-wrapped (clickable card pattern) but include a real `<a>` on the title for screen-reader landmark navigation.
- JumboPopdown follows the blueprint's a11y checklist (menu role, keyboard nav, focus trap, esc-to-close).
- Hero overlay must keep contrast ratio ≥ 4.5:1 against the headline gradient in all three modes — verify in `/brand-kit` after implementation.
- Attention to Semantic HTML tags and proper, legible ids.

---

## 10. Theme & Token Compliance

Per `astro-knots/CLAUDE.md` two-tier token rule:
- Components MUST read only semantic tokens (kebab-case: `--color-primary`, `--font-display`, etc.).
- No component in this spec may reference `--color__*` named tokens directly.
- Status colors should map to existing semantic tokens (`--color-success`, `--color-warning`, `--color-text-muted`) — if those don't yet exist, add them to `theme.css` Tier 2 (semantic) before implementation, pointing at existing Tier 1 named tokens.
- Any improvisation for convenience and speed with hardcoded should be immediately refactored to include "keepsake" changes or additions in the theme and mode CSS files and the two-tier token system.

---

## 11. Design System Integration

Immediately after codifying the code that will be committed and shipped, PRIOR to shipping, componentize any components and include in the visual display of the design-system. Add the following under `src/pages/design-system/`:

- `design-system/sections/project-gallery.astro` — renders all three variants with mock data, all three modes verifiable via the existing `ModeToggle`.
- `design-system/heroes/hero-banner-with-message-hierarchy.astro` — three banners (short/standard/tall, with and without CTA, with each overlay option).
- `design-system/components/jumbo-popdown-projects.astro` — popdown shown open with a representative project list.
- Update `design-system/index.astro` to link to the three new entries.

Per `Design-System-Pages-Per-Site.md`: this is non-negotiable and lands in the same PR as the components.

---

## 12. Out of Scope (v0.0.1.0)

- Join an active project or support a proposed project (future enhancement) with oauth login system.
- `/projects/propose` page (linked but not implemented here — defer to its own spec).
- Member-only gating on project details.
- Project activity feeds / live status (e.g., last commit, next meeting countdown).
- Search/filter UI on the index (tags, leads, category).
- Internationalization.

---

## 13. Implementation Phases

### Phase 1 — Content Model & Port (foundation)
- Add `projects` collection to `src/content.config.ts`.
- Create `src/content/projects/active/` with the five ported entries.
- Verify `astro check` passes.

### Phase 2 — Hero
- Implement `HeroBannerWithMessageHierarchy.astro`.
- Add design-system demo page.

### Phase 3 — Section & Index Page
- Implement `Section__ProjectGallery.astro` with `standard`, `lite`, `shelf` variants.
- Prototype concepts 1 and 2 in design-system; pick one for `standard`.
- Wire up `projects/index.astro` with the three sections.

### Phase 4 — Detail Page
- Implement `projects/[slug].astro` with LFM rendering, ProjectMeta, Sources.
- Verify citations in at least one ported project.

### Phase 5 — JumboPopdown
- Implement `JumboPopdown__Projects.astro`.
- Add `Projects` nav item to `Header.astro`.
- Add design-system demo entry.

### Phase 6 — Polish
- Cross-mode contrast checks in `/brand-kit`.
- Keyboard/screen-reader pass on popdown and gallery.
- Update site footer/sitemap.

---

## 14. Open Questions

1. **Status taxonomy** — is `active | proposed | archived` enough, or do we need `paused` (working group dormant but project not archived) and `graduated` (shipped and stable, no longer requires a working group)?
2. **Popdown scope** — should proposed projects appear in the JumboPopdown, or only active? Default proposed-included; willing to flip.
3. **Lead avatars** — do we have an authoritative source for member portraits, or do we use initials-monogram fallbacks initially?
4. **Archive sort order** — by `date_archived` desc (most recently archived first) or by `date_initiated` desc (chronology of community history)?
5. **Detail page hero** — is the banner-hero overkill for short projects? Should detail use plain hero by default and banner only when `hero_image` is present? (Current draft says: yes, banner only when image present.)
6. **JumboPopdown proposed grouping** — separate "Proposed" subheader inside the popdown, or hide proposed entirely and link "+ Propose a project" only?

---

## 15. Acceptance Criteria

- [ ] `pnpm --filter fullstack-vc dev` renders `/projects/` with hero + three sections (any non-empty section visible; empty sections fully suppressed).
- [ ] Each ported project has a working `/projects/[slug]/` route.
- [ ] Citations in detail bodies render correctly (inline `[n]` + `Sources` block).
- [ ] All three modes (light / dark / vibrant) pass visual inspection on index, detail, and popdown.
- [ ] Header shows a `Projects` nav item that opens the JumboPopdown.
- [ ] Design-system catalog has three new entries (gallery, banner-hero, popdown) and is linked from the index.
- [ ] No component references `--color__*` named tokens directly.
- [ ] Site builds with `pnpm --filter fullstack-vc build` and is deployable from its own repo.

---

## 16. Related Documents

- `astro-knots/CLAUDE.md` — pseudo-monorepo conventions and two-tier tokens.
- `astro-knots/context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md` — LFM spec used by the detail-page renderer.
- `astro-knots/context-v/blueprints/Jumbotron-Popdown-Patterns.md` — popdown structure, props, a11y.
- `astro-knots/context-v/reminders/Design-System-Pages-Per-Site.md` — design-system catalog discipline.
- `astro-knots/context-v/reminders/Tags-Must-Use-Train-Case.md` — tag formatting.
- `sites/fullstack-vc/context-v/sitemap/sections/Section__Areas-of-Venture.md` — adjacent section spec, file-naming pattern.

---

## Changelog

- **0.0.1.0** (2026-04-27) — Initial draft: page composition, content model, four-component inventory, design-system integration, six open questions.
