## Scope
Implements the “Clickable Levels of Detail” section (lines 54–68):
- Level 1: Logo-only grid with crisp assets and alt text
- Level 2: Expandable card (`LogoCardExpanded--Detail-1.astro`) with progressive disclosure and a simple gate for sensitive fields
- Level 3: Optional detail page route (`src/pages/portfolio/[slug].astro`) with SEO fields

## Files to Add/Update
- Add: `src/components/basics/grids/grid-cards/LogoCardExpanded--Detail-1.astro`
  - Props: `{ brand, lightMode, darkMode, urlToPortfolioSite, blurbShortTxt?, team?: TeamMember[], sensitive?: SensitiveFields? }`
  - Behavior: expands/collapses in place; supports col-span-2/row-span-2 when expanded
  - Accessibility: focus management, Escape to close, aria-controls/expanded
  - Gate: small passcode input; if matches `import.meta.env.PUBLIC_PORTFOLIO_PASSCODE`, reveals sensitive fields (placeholder now)

- Update: `src/components/basics/grids/grid-cards/LogoOnlyContainer.astro`
  - Add an “Expand” affordance (button) that toggles rendering of `LogoCardExpanded--Detail-1.astro` below the logo
  - Maintain external link on the card while keeping the expand control separate and accessible

- Update: `src/components/basics/grids/LogoGrid--LogoOnly.astro`
  - Accept optional flags: `{ expandable?: boolean, expandSpan?: { cols?: number; rows?: number } }`
  - When expandable, mount expanded card with Tailwind classes `col-span-2`/`row-span-2` per props

- Add: `src/pages/portfolio/[slug].astro` (optional, scaffold)
  - Generates `slug` from `conventionalName`/`officialName`
  - Sections: Summary, Metrics (gated placeholder), Team, Links
  - SEO: title/description/OG image passed from layout

- Add: `src/utils/slug.ts`
  - Simple slugifier to normalize names to URL-safe slugs

## Data & Mapping
- Existing JSON records remain source of truth (lpcommits/directs)
- Mapping adds optional `team` and `blurbShortTxt` when present
- Sensitive fields are not embedded in static HTML; for Phase 1 we show placeholders after gate. Phase 2 will fetch private data on demand.

## UI Details
- Level 1: logo grid
  - Use existing `ThemeImage.astro` for light/dark assets
  - Alt text from `conventionalName || officialName`

- Level 2: expanded card
  - Shows blurb, team list (name, role, image, LinkedIn)
  - Expand control: keyboard focusable, `aria-expanded` bound to state; `Esc` closes
  - Expanded card increases grid footprint (`col-span-2` or `row-span-2`) for readability
  - Passcode gate: input + button; toggles a `unlocked` state; no secret is exposed server-side in Phase 1

- Level 3: detail page
  - Route uses slug; loads matching record and renders sections
  - SEO: set unique title/description/OG

## Accessibility & Performance
- Keyboard: Enter/Space expand; Escape collapse; focus returned to trigger
- Screen readers: labels and state announced via `aria-expanded`
- Performance: SVG preferred; lazy-load raster assets

## Acceptance Criteria
- Grid renders crisp logos with correct alt text
- Clicking “Expand” opens in-place details with blurb/team; “Close” and `Esc` collapse
- Expanded card spans multiple grid units when configured
- Passcode input reveals gated placeholders; no sensitive data in prerendered HTML
- Detail page route compiles; basic content loads by slug

## Next Steps (after approval)
1. Implement `LogoCardExpanded--Detail-1.astro`
2. Wire expand/collapse in `LogoOnlyContainer.astro` and `LogoGrid--LogoOnly.astro`
3. Add `slug.ts` and scaffold `[slug].astro`
4. Validate with `pnpm build`; check `/portfolio` interactions
5. Iterate on gate and private-data fetch in Phase 2