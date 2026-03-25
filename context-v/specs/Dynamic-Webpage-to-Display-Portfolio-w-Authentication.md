---
title: Dynamic Webpage to Display Portfolio w Authentication
lede: Dynamically display portfolio information on a branded webpage, with certain types of information only displayed for certain privileges connected to authentication.
date_authored_initial_draft: 2025-11-16
date_authored_current_draft: 2025-11-16
date_authored_final_draft: "[]"
date_first_published: "[]"
date_last_updated: "[]"
at_semantic_version: 0.0.1.0
generated_with: Claude Code (Claude Sonnet 4.5)
category: Technical-Specification
date_created: 2025-11-15
date_modified: 2025-11-16
status: Proposed
tags: [Content-Automation, Digital-Footprint, Social-Media, API-Integration]
authors:
  - Michael Staton
  - Tugce Ergul
image_prompt: A nice portfolio page with logos.
---

# Context

## Context on the Astro-Knots monorepo
We develop and maintain multiple sites for multiple clients.  Each site needs to be independently deployed with no dependencies on the Astro-Knots monorepo.  However, we have developed patterns and boilerplate code, etc. 

## Preferred Stack

1. [[Tooling/Software Development/Frameworks/Web Frameworks/Astro|Astro]] for [[Vocabulary/Static Site Generators|Static Site Generation]]
2. [[Tooling/Software Development/Frameworks/Web Frameworks/Svelte|Svelte]] for dynamic UI.
3. [[Tooling/Software Development/Lego-Kit Engineering Tools/ImageKit|ImageKit]] for scalable image CDN.
4. [[Tooling/Software Development/Frameworks/Frontend/UI Frameworks/Tailwind|Tailwind]] with tokens edited for the brand we are building for, using our [[lost-in-public/to-hero/Customizing Tailwind|Customizing Tailwind]] best practices.
5. Preference for using documents in Markdown or in JSON in the repository over any database use.
6. Avoidance of anything React or React patterns.  HTML, CSS, Astro, and Svelte only. 

## Responsive Design
Most people will be viewing it initially from Mobile. However, analysts will usually want to "dive in" so we need laptop and large screen variants, and a clinically responsive layout.  

# Current Task & Prompt

`astro-knots/sites/hypernova-site/src/content/page-content` currently has the `portfolio.json` file, we should created a new dir and move it, as well as rename the file to `lpcommits-portfolio.json`. We will need to update imports in various places to assure it works.  



# Imagined Features / Approach

### Clickable Levels of Detail
Logo Clouds.
Cards of various sizes and various level of detail, expandable to more detail. Convenient collapse detail.
Full pages.

#### Levels and Interactions

- Level 1: Logo-only grid
  - Displays crisp brand marks in a responsive grid
  - Clicking a card opens the external site (if available) or a details panel
  - Alt text uses `conventionalName` or `officialName`
- Level 2: Expandable card (progressive disclosure)
  - New component: `LogoCardExpanded--Detail-1.astro`
  - Reveals `blurbShortTxt`, key facts, and team members
    - Team members: `name`, `role`, `image`, `linkedInProfile`
    - May expand the grid object to take up two columns or two rows.
  - Sensitive fields (e.g., amounts) are hidden by default and shown only after a passcode is entered
  - Close via a visible control or `Esc`; maintain keyboard focus for accessibility
- Level 3: Detail page per organization (optional)
  - Route: `src/pages/portfolio/[slug].astro`
  - Sections: Summary, Metrics (gated), Team, Links
  - SEO: unique title/description, OG image

##### Layout Detail Toggler

- [ ] For every Portfolio grid, add a toggle button to switch _the entire grid_ between Level 1 and Level 2.
- [ ] Include the logo/trademark in the Level 2 cards, refactor the design for elegant layout. 

#### Component Mapping

- Grid: `src/components/basics/grids/LogoGrid--LogoOnly.astro`
- Card: `src/components/basics/grids/grid-cards/LogoOnlyContainer.astro`
- Theme-aware image: `src/components/ui/ThemeImage.astro` (light/dark assets)
- Optional expandable card: `LogoCardExpandable.astro` (Astro island with Svelte for toggling)

#### Data Requirements

- JSON records include: names, logo paths (light/dark), external URL, optional blurb/team
- Sensitive fields are stored in separate JSON fetched only after client-side gate unlock
- Assets live under `public/trademarks`; prefer true SVG paths over raster-in-SVG

#### Accessibility

- Focus rings on cards/buttons; `Enter`/`Space` activate; `Esc` collapses
- Screen-reader friendly labels: `aria-label` on links and controls

#### Acceptance Criteria

- Two titled sections render: LP Commits and Direct Investments
- Logo grid loads with correct assets in light/dark mode
- Expandable cards display non-sensitive details; sensitive fields require passcode
- No broken links or missing assets during build; alt text present for all logos


## Branded Exports and Downloads
It's common for potential investors and their analysts to want to download a PDF, and download CSV exports.  

### Approach
- CSV: generate on client from visible fields in grid
- PDF (Phase 2): render a templated Astro page via serverless headless browser

## Multiple Layouts & Arrangements
Because it's so important for analysts to browse and find the information they need, it would be good for them to toggle different layouts with different types of cards and different levels of detail. 

### Layout Toggles (Phase 2)
- Logo cloud vs card grid
- Filters: sector, stage, region; quick search

## Connection to a Google Sheet for Data Variables

When displaying a portfolio, it's often helpful to have "facts" or "metrics" about any portfolio company.  I want to be able to access a Google Sheet through the Google Workspace API, and point to specific numbers or tables. 

### Implementation Notes (Phase 2)
- Use Google Workspace API to fetch selected cells/rows at runtime
- Protect sensitive values: fetch only after auth; do not embed in static HTML
## Strategy for Sensitive Data & Content

When displaying a portfolio, it's common to have certain financial information like "share price" or "amount invested" hidden in a layer that is only accessible to potential [[Limited Partners]].  

I can already imagine there being multiple levels of access requested by the investing partners, so it's best to think about this system smartly.  At base, we should have an accepted passwords list and put sensitive content behind a simple password authentication (note, we should avoid User Accounts unless it's a Google/Microsoft OAuth that just matches a list of authorized users or organization emails)

### Authentication Model
- Phase 1: Simple passcode gate (client-side)
  - Env var: `PUBLIC_PORTFOLIO_PASSCODE` (non-secret display gate)
  - Gate unlocks sensitive fields, fetched from a separate JSON
- Phase 2: OAuth allowlist (Google/Microsoft)
  - Unlocks the same fields via Astro islands; no backend dependency

### Data Separation
- Public JSON: names, logos, links, non-sensitive blurbs
- Private JSON: sensitive fields loaded only after unlock; excluded from static build

### Asset Standards
- Prefer SVG logos; avoid raster-in-SVG (causes blurriness on scale)
- Raster formats for photos only; when converting AVIF → PNG/WebP, preserve RGBA and correct stream mapping

### Performance & Accessibility
- Lazy-load images; preload above-the-fold logos
- Keyboard and screen-reader support for all interactive elements






