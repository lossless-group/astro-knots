---
title: "Design System Pages Per Site"
lede: "Every site should have a design-system route with browsable pages for components, flare, and layouts — built with zero-friction by Code Assistants, not a third-party documentation tool."
date_created: 2026-04-20
date_modified: 2026-04-20
status: Published
category: Reminders
tags: [Design-System, Site-Convention, Components, Flare, Layouts]
authors:
  - Michael Staton
---

## Convention

Every site we develop either has or should have a **design system accessible at `/design-system/`**. This is a browsable set of pages that display the site's components, flare, and layout options in isolation.

## Route Structure

```
src/pages/design-system/
  index.astro              — Overview / table of contents linking to subsections
  flare/
    index.astro            — Gallery of all flare components
    [component-name].astro — Individual flare demo pages (e.g., planet-rising.astro)
  components/
    index.astro            — Gallery of UI components (buttons, cards, nav, etc.)
    [component-name].astro — Individual component demo pages
  layouts/
    index.astro            — Gallery of layout patterns
    [layout-name].astro    — Individual layout demo pages
```

Subsections are added as needed — not every site needs all three from day one.

## Why Not Storybook / Docz / etc.

We have intentionally broken from the industry standard of using a dedicated design-system manager (Storybook, Docz, Histoire, etc.) because:

1. **Zero friction** — Code Assistant AI can improvise demo pages with the same tech stack the site already uses (Astro components, same CSS, same build). No extra tooling, config, or maintenance.

2. **No version drift** — the design system pages use the actual components, not a parallel rendering context. What you see is what the site renders.

3. **Client-facing** — clients find it engaging that they can click a small link (typically in the footer) and browse visual options. It doubles as a lightweight approval/review surface.

4. **Iteration-friendly** — when exploring flare or component variations, the Code Assistant creates demo pages as part of the creative workflow. The design system route is where those iterations live until one is chosen.

## Implementation Notes

- The design system index page should list and link to all subsections with brief descriptions.
- Demo pages should show the component in multiple configurations (different props, colors, sizes) so the team can compare.
- Include a small code snippet or prop table when helpful, but don't over-document — these pages are for visual browsing, not API reference.
- A footer link to `/design-system/` should be present (or easily addable) on every site.
