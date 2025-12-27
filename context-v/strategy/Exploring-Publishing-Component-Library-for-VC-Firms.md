# Exploring Publishing a Component Library for VC Firms

**Date:** 2024-12-18
**Project:** Astro Knots / @knots packages
**Status:** Shelved for future exploration

## Background

We have an `astro-knots` monorepo with a `packages/` directory containing `@knots/*` packages (tokens, icons, astro, svelte, brand-config, tailwind). The original vision was to create a component/UI library similar to shadcn or Material UI.

Current reality: We've been focused on shipping client sites, so the packages are more like "reference patterns to copy from" rather than a proper publishable library.

## Three Goals Identified

### 1. Brand Credibility
Having a published component library signals expertise. Projects like shadcn and [WebcoreUI](https://astro.build/themes/details/webcoreui-astro-component-library/) demonstrate this approach. For our agency, a published library would reinforce positioning as experts in Astro/modern web dev.

### 2. Operational Leverage
We specialize in websites for venture capital firms. Currently serving 5, but there are ~4,000 VC firms globally. The goal is to serve significantly more without proportionally growing the team. This requires radical efficiencies - patterns like:
- Team pages
- Portfolio grids
- Investment thesis sections
- LP-gated content

### 3. CDN-Style Distribution (Ideal)
Rather than npm package dependencies, the ideal would be something like Mermaid.js or Reveal.js - include a link/script and get access to maintained components. Updates would flow automatically without sites needing to rebuild or update dependencies.

## Technical Challenge

**Astro components are server-rendered at build time, not runtime.** You can't `<script src="knots.js">` and get Astro components the way Mermaid works with diagrams.

## Potential Approaches

| Approach | How it works | Tradeoffs |
|----------|--------------|-----------|
| **Web Components** | Compile to `<knots-team-card>` custom elements, host on CDN | Works anywhere, but loses Astro's server rendering benefits |
| **shadcn-style CLI** | `npx @knots/cli add team-card` pulls source into site | No runtime dependency, version tracking, but still requires rebuilds |
| **Tailwind preset + tokens** | CDN hosts CSS, sites use class conventions | Styling stays synced, but components are still copied |
| **Hosted Astro partials** | Sites fetch pre-rendered HTML from an API at build time | Complex, but could work for truly dynamic sharing |
| **VC Starter Kit / Theme** | Fork-per-client with selective upstream merges | Less "library", more "template with updates" |

## Current State (CLAUDE.md Philosophy)

From the existing CLAUDE.md:
- `@knots/*` packages are "copyable pattern references", not shared dependencies
- Patterns flow FROM sites TO packages (extraction), then FROM packages TO sites (copying)
- No runtime dependency
- Sites must be independently deployable

This is actually closer to shadcn (copy source into your project) than Material UI (npm install and import).

## Questions to Revisit

1. Is the shadcn CLI model sufficient? (`npx @knots/cli add team-card` copies source with version tracking)
2. Could Web Components work for interactive pieces while keeping Astro components for SSR content?
3. Is the real product a "VC firm website starter kit" rather than a generic component library?
4. What's the minimum viable version that provides brand credibility without massive maintenance burden?

## Components Already Built (Candidates for Library)

From Dark Matter site work:
- `TeamMemberCard.astro` - Compact centered card for team grids
- `TeamMemberCard--Wide.astro` - Horizontal card with pillar badges
- `SocialIcons.astro` - Social link icons with platform detection
- Various narrative sections (TheAgingCrisis, ExitPotential, etc.)

## Next Steps (When Revisited)

1. Audit existing `@knots/*` packages - what's actually there vs. what's documented
2. Decide on distribution model (shadcn CLI vs Web Components vs CDN CSS)
3. Build one end-to-end example (e.g., TeamMemberCard published and consumable)
4. Evaluate maintenance overhead vs. efficiency gains

---

*Shelved to focus on current client deliverables. Return to this when bandwidth allows.*
