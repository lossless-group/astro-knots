# Team Pages – Agency-Wide Specification

## Overview

This specification defines how astro-knots sites should implement team pages for all client projects. It generalizes the "team spans" pattern used in `hypernova-site` and `twf_site` into a reusable, data-driven design that:

- **Groups people by role** into visually distinct spans (role header + cards)
- **Uses a shared data model** for people (`TeamMember`) and roles (`TeamRole`)
- **Keeps layout and styling consistent** across clients while allowing brand theming
- **Supports editorial flexibility** (featured members, multiple classifiers, re-ordering)
- **Ensures accessibility and responsiveness** across devices

This spec covers:

- Content model and data source
- Role classification and grouping
- Page layout and spans
- Person card design
- Theming and customization per client
- Performance and accessibility requirements

---

## Content Model

### TeamMember Type

All team pages must use a common `TeamMember` shape, compatible with the existing `team.ts` definitions used in `hypernova-site` and `twf_site`.

Minimum fields:

- **name**: `string` – person’s full name
- **role**: `string` – short label describing their role/title as shown to users
- **classifiers**: `string | string[]` – tags used to group members into spans
- **image**: `string` – URL/path to profile image
- **bio**: `string` – short biography or description
- **socialLinks**: `Array<{ name: string; href: string; icon?: string }>` – optional, can be empty

Optional fields:

- **id**: `string` – internal identifier
- **featured**: `boolean` – can be used to highlight someone visually
- **slug**: `string` – used for anchors or dedicated profile pages (future)

Implementation guidance:

- For JSON-backed content (as in `hypernova-site` and `twf_site`), store team in `src/content/people/team.json` or a similarly named file.
- For MDX/content collections, ensure frontmatter maps cleanly into the `TeamMember` shape.

### TeamRole and Role Labels

Define a `TeamRole` union and a mapping from classifier strings to display labels, similar to `TEAM_ROLES` in `twf_site`:

- **TeamRole**: a finite set of role classifier values (e.g. `"Managing Partner"`, `"Trustee"`)
- **TEAM_ROLES**: `Record<TeamRole, string>` mapping classifier → pluralized display label (e.g. `"Managing Partner" → "Managing Partners"`)

Agencies should:

- Keep `TeamRole` focused on semantic groupings that appear as spans on the page (e.g., Managing Partners, Vertical Partners, Trustees, Advisory Board, Founding Team, Active Fellows, Philanthropies).
- Allow client-specific extension of `TeamRole`, but all roles must flow through the same classification + grouping pipeline.

### Classifiers Usage

- `classifiers` may be a string or array of strings.
- A mapping function (see below) interprets classifiers and assigns each member to **exactly one primary span** for display on the main team page.
- Derived/secondary roles (e.g., `"Founding Trustee"`, `"Founding Advisor"`, `"Founding Principal"`) should map to a base span (`Trustees`, `Advisory Board`, `Founding Team`).

---

## Grouping Logic

Each team page must:

- Read the full list of `TeamMember` objects
- Group them into role-based spans using a deterministic, reusable `groupByRole` helper

### groupByRole Helper

Required characteristics:

- Accepts `TeamMember[]`
- Returns an object keyed by span identifiers (e.g. `managingPartners`, `verticalPartners`, `trustees`, etc.)
- Handles `classifiers` as string or string[]
- Uses a `classifierMap` from classifier text to span key
- For each member:
  - Finds the first matching classifier in the map
  - Assigns the member to the corresponding span array
  - Ignores members without recognized classifiers (or optionally collects them into an `other` span)

Agency guidance:

- Place `groupByRole` in a shared utility module (e.g. `src/lib/team/groupByRole.ts`) so multiple pages/layouts can reuse it.
- Make the classifier map configurable per client (e.g. via a local config file) but keep the algorithm consistent.

---

## Page Layout and Spans

### High-Level Structure

Team pages should follow a consistent layout pattern:

- **Route**: `/team` or `/the-people` (client-specific but consistent within site)
- **Layout**: a `TeamLayout` that wraps the page with:
  - Base theme layout (navigation, footer, background, etc.)
  - A main content container with a responsive grid for spans

Example high-level Astro structure:

```astro
<BaseThemeLayout>
  <BaseGridLayout>
    <!-- Role spans inserted here -->
    <ManagingPartnersSpan members={groupedTeamData.managingPartners} />
    <VerticalPartnersSpan members={groupedTeamData.verticalPartners} />
    <!-- Other spans... -->
  </BaseGridLayout>
</BaseThemeLayout>
```

### TeamLayout Component

Implement a `TeamLayout.astro` per site that:

- Sets page `<title>` and `<meta>` description
- Provides a max-width container for the content
- Uses a responsive grid for child spans, e.g.:
  - 1 column on mobile
  - 2 columns on small screens
  - 3 columns (or more) on large screens
- Slots in the span components.

This layout must be **brand-themable** but structurally consistent:

- Grid gap, padding, and breakpoints are standardized in a base design system or Tailwind config.
- Individual spans do not manage their own outer layout; they rely on the grid provided by `TeamLayout` / `BaseGridLayout`.

### Span Components

For each top-level role group, define a span component in `src/components/team/`, e.g.:

- `ManagingPartnersSpan.astro`
- `VerticalPartnersSpan.astro`
- `TrusteesSpan.astro`
- `AdvisoryBoardSpan.astro`
- `FoundingTeamSpan.astro`
- `ActiveFellowsSpan.astro`
- `PhilanthropiesSpan.astro`

Each span component must:

- Accept `members: TeamMember[]` via props
- Render a **role header** (`<h1>` or `<h2>` with `role-header` class)
- Render its children using `PersonCard` components inside a `.person-cards` container
- Import and rely on shared `team-spans.css` (or equivalent) for span styling

Span structure should be semantically valid and consistent across sites (prefer `<div class="team-span">` over nested `<span>`s for block content).

### Span Layout Behavior

- **Contiguous spans**: Each span keeps all of its `PersonCard` children grouped under its role header.
- **Flow**: Spans flow left-to-right, top-to-bottom according to the grid layout.
- **Responsive**: Span width adapts to available columns; they should not hard-code column spans unless a specific design calls for a hero member.
- **No awkward gaps**: Use grid or flex patterns that minimize white space while preserving grouping.

---

## Person Card Design

### Component: PersonCard.astro

A shared `PersonCard` component must be used across spans. It should:

- Accept `PersonProps` matching the `TeamMember` fields (plus presentation options)
  - `name`, `role`, `image`, `bio`, `socialLinks?`, and optional layout props like `class` / `className`, `maxWords`, `showBio`.
- Render:
  - An image (square or aspect-ratio constrained, lazy-loaded)
  - Name and role text
  - A truncated bio (with a `Read more` affordance if truncated)
  - Optional social icons row when social links are present

Visual requirements:

- Cards should have a consistent visual language across clients (rounded corners, shadow, hover state), with color tokens pulled from the site theme.
- Cards must be height-managed to avoid extreme vertical stretching; bios are truncated with sensible defaults and line clamping where supported.

Accessibility requirements:

- `alt` text for images in the form: `"Portrait of {name}"` or similar.
- Semantic heading levels (`<h3>` inside the card), not skipping heading hierarchy on the page.
- Focusable controls for “Read more” with appropriate aria attributes if content expands/collapses.

---

## Shared Styles and Theming

### team-spans.css (or Equivalent)

Maintain a shared stylesheet for span-level styles, similar to the existing `team-spans.css`:

- `.team-span`
  - Full-width block container
  - `break-inside: avoid` to prevent spans from splitting across columns or page breaks
  - Consistent bottom margin

- `.role-header`
  - Prominent typography (size, weight) with optional gradient or brand color
  - Margin and padding tuned for readability
  - Can include decorative underline or accent line

- `.person-cards`
  - Uses `display: contents` or a simple grid/flex container to let the outer layout handle card placement.

### Brand Customization

Per client/site, allow customization of:

- Color tokens (typography, gradients, borders)
- Spacing scale (within design system bounds)
- Optional hero treatment for a featured member (e.g., first card spans two columns)

These customizations should be controlled via:

- Theme variables (CSS custom properties, Tailwind config) rather than per-component overrides.

---

## Data and Editorial Workflows

### Adding or Editing Team Members

- Editors update a single source of truth (e.g. `team.json` or a CMS collection) using the `TeamMember` shape.
- Role assignment is handled primarily through `classifiers` (not by hardcoding lists in span components).
- Team pages automatically reflect updates on the next deploy/build.

### Reordering Spans and Members

- The **order of spans** on the page should be configurable (e.g. managing partners first, then vertical partners, etc.).
  - Implement via a `SPAN_ORDER` config array or similar.
- Within a span, default ordering is by input order or by a defined sort key (e.g. `featured` first, then alphabetical by name).

### Future-Proofing

- Keep `TeamMember` extensible so new fields (locations, pronouns, focus areas) can be added without breaking existing spans.
- Support optional deep-linking to individuals (e.g. `/team/{slug}`) in a later iteration without changing the core page structure.

---

## Performance

- Use `loading="lazy"` for all images on the team page.
- Serve appropriately sized images (e.g. via `srcset` or a media pipeline) to avoid oversized downloads on mobile.
- Minimize layout shift by specifying `width` and `height` (or aspect ratio) on images.
- Avoid heavy client-side JavaScript; interactivity should be progressive (e.g. `Read more` toggles only where needed).

---

## Accessibility

- Ensure proper heading hierarchy from page title down through role headers and card headings.
- Maintain sufficient color contrast for text and important UI elements.
- Make any interactive elements (e.g. `Read more` buttons) keyboard accessible and screen-reader friendly.
- Do not rely solely on color to convey hierarchy; use typographic scale and spacing.

---

## Acceptance Criteria (Agency Checklist)

- **Data Model**
  - [ ] `TeamMember` type implemented and used as the single source of truth
  - [ ] `TeamRole` and classifier → span mapping defined per client

- **Grouping & Layout**
  - [ ] `groupByRole` (or equivalent) used to group members into spans
  - [ ] Team page renders all configured spans in the intended order
  - [ ] Each member appears in exactly one primary span on the main team page

- **Visual & UX**
  - [ ] Spans show a clear role header and associated cards
  - [ ] Layout is responsive across mobile, tablet, and desktop
  - [ ] Person cards are visually consistent and do not become unreasonably large/tall

- **Theming**
  - [ ] Span and card styles respect the client’s brand theme
  - [ ] Shared CSS (e.g. `team-spans.css`) or design system tokens are used

- **Performance & Accessibility**
  - [ ] Images are lazy-loaded and sized appropriately
  - [ ] Page passes basic accessibility checks (headings, alt text, contrast, keyboard nav)

This specification should be used as the default blueprint for all new client team pages, with client-specific role taxonomies and theming layered on top without changing the underlying structure or data model.
