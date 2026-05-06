---
from: dark-matter
from_path: blueprints/Jumbotron-Popdown-Patterns.md
---
<!-- Rolled up from dark-matter/context-v/blueprints/Jumbotron-Popdown-Patterns.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Jumbotron Popdown Patterns

Design and implementation patterns for consistent jumbotron popdown menus in the Dark Matter UI.

## Overview

Jumbotron popdowns are large, content-rich dropdown menus that appear when hovering over navigation items. They provide a visually engaging way to present multiple navigation options in an organized, scannable format.

This pattern is intended for use in the Header component and any navigation elements requiring expanded content previews.

## Implementation Pattern

### Component Structure

```
src/components/
  basics/
    JumboDropdown.astro      # Generic dropdown component
    GetLostDropdown.astro    # Custom "Get Lost" dropdown (if needed)
    ProjectsDropdown.astro   # Custom "Projects" dropdown
  dropdowns/                 # Alternative location for dropdown variants
```

### Props Interface

```typescript
interface DropdownItem {
  href: string;
  title: string;
  description: string;
  icon?: string;  // Optional icon URL or path
}

interface DropdownProps {
  label: string;
  items: DropdownItem[] | Record<string, DropdownItem>;
  isCustomDropdown?: boolean;
}
```

### Styling Conventions

Following the dark-matter theme system:

- **Container**: Fixed width with max-width, uses `var(--color-background)` and `var(--color-foreground)`
- **Grid Layout**: Responsive grid that adapts to content (2-3 columns typically)
- **Animation**: Subtle fade-in and slide-up on hover using CSS transforms
- **Typography**: Uses `--font-family-primary` for body, `--font-family-display` for titles
- **Hover States**: Uses `var(--color-accent)` for highlights
- **Spacing**: Consistent with site's spacing scale

## Implementation Example

### Basic Usage (JumboDropdown.astro)

```astro
---
interface DropdownItem {
  href: string;
  title: string;
  description: string;
  icon?: string;
}

interface Props {
  label: string;
  items: DropdownItem[];
}

const { label, items } = Astro.props;
---

<div class="dropdown-wrapper">
  <button class="dropdown-trigger">{label}</button>
  <div class="jumbo-dropdown">
    <div class="dropdown-grid">
      {items.map(item => (
        <a href={item.href} class="dropdown-item">
          <div class="item-title">{item.title}</div>
          <div class="item-description">{item.description}</div>
        </a>
      ))}
    </div>
  </div>
</div>

<style>
  .dropdown-wrapper {
    position: relative;
  }

  .dropdown-trigger {
    background: transparent;
    border: none;
    color: var(--color-foreground);
    font-family: var(--font-family-primary);
    cursor: pointer;
  }

  .jumbo-dropdown {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, transform 0.2s ease;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    min-width: 400px;
    padding: 1.5rem;
  }

  .dropdown-wrapper:hover .jumbo-dropdown,
  .dropdown-wrapper:focus-within .jumbo-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }

  .dropdown-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .dropdown-item {
    display: block;
    padding: 0.75rem;
    border-radius: 6px;
    text-decoration: none;
    color: var(--color-foreground);
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover {
    background: var(--color-accent-subtle, rgba(105, 226, 227, 0.1));
  }

  .item-title {
    font-family: var(--font-family-display);
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .item-description {
    font-size: 0.875rem;
    opacity: 0.8;
    line-height: 1.4;
  }
</style>
```

### Custom Dropdown (PortfolioDropdown.astro)

```astro
---
// Import portfolio data from content collection or JSON
import { getCollection } from 'astro:content';

const portfolioItems = await getCollection('portfolio');
const sortedItems = portfolioItems
  .slice(0, 6)
  .sort((a, b) => a.data.title.localeCompare(b.data.title));
---

<div class="dropdown-wrapper">
  <button class="dropdown-trigger">Portfolio</button>
  <div class="portfolio-dropdown">
    <div class="dropdown-header">Our Portfolio</div>
    <div class="dropdown-grid">
      {sortedItems.map(item => (
        <a href={`/portfolio/${item.slug}`} class="dropdown-item">
          <div class="item-title">{item.data.title}</div>
          <div class="item-description">{item.data.description}</div>
        </a>
      ))}
    </div>
    <a href="/portfolio" class="view-all">View All Portfolio &rarr;</a>
  </div>
</div>
```

## Best Practices

### Content Organization

- Group related items together
- Use clear, concise titles (2-3 words)
- Keep descriptions brief (1 short sentence)
- Limit to 6-8 items maximum per dropdown

### Visual Design

- Use consistent spacing and alignment
- Maintain color contrast for readability (check against both dark and light modes)
- Include subtle hover/focus states using `var(--color-accent)`
- Ensure touch targets are at least 44x44px

### Mode Compatibility

Ensure dropdowns work in all three visual modes:

```css
html[data-mode="dark"] .jumbo-dropdown {
  background: var(--vulcan-blue);
  border-color: var(--madison-blue);
}

html[data-mode="light"] .jumbo-dropdown {
  background: var(--lilly-white);
  border-color: rgba(0, 0, 0, 0.1);
}

html[data-mode="vibrant"] .jumbo-dropdown {
  background: var(--yankee-blue);
  border-color: var(--nova-cyan);
}
```

### Performance

- Lazy load images/icons if included
- Optimize animations for 60fps using CSS transforms
- Use `will-change: transform, opacity` sparingly
- Implement proper ARIA attributes

## Accessibility

- Use `role="menu"` on dropdown container and `role="menuitem"` on items
- Implement keyboard navigation (arrow keys, Escape to close)
- Add proper focus management (trap focus within open dropdown)
- Include screen reader text where visual-only cues exist
- Ensure sufficient color contrast in all modes

```astro
<div
  class="jumbo-dropdown"
  role="menu"
  aria-label="Portfolio navigation"
>
  {items.map(item => (
    <a href={item.href} role="menuitem" class="dropdown-item">
      ...
    </a>
  ))}
</div>
```

## Responsive Behavior

- Stack items vertically on mobile (single column)
- Adjust grid columns based on viewport
- Consider a mobile-specific slide-out pattern for small screens
- Ensure touch targets remain tappable (min 44px)

```css
@media (max-width: 768px) {
  .jumbo-dropdown {
    position: fixed;
    left: 0;
    right: 0;
    top: var(--header-height, 60px);
    transform: none;
    min-width: unset;
    border-radius: 0;
  }

  .dropdown-grid {
    grid-template-columns: 1fr;
  }
}
```

## Testing Checklist

- [ ] Hover/focus states work as expected
- [ ] Keyboard navigation functions properly (Tab, Enter, Escape, Arrow keys)
- [ ] Content is readable at all breakpoints
- [ ] Animations are smooth and performant
- [ ] Screen readers announce content correctly
- [ ] Works correctly in dark mode
- [ ] Works correctly in light mode
- [ ] Works correctly in vibrant mode
- [ ] Touch interactions work on mobile

## Integration with Header

The jumbotron popdown integrates with the existing Header component:

```astro
---
// In Header.astro
import JumboDropdown from './JumboDropdown.astro';

const portfolioItems = [
  { href: '/portfolio/fintech', title: 'Fintech', description: 'Financial technology investments' },
  { href: '/portfolio/ai-ml', title: 'AI/ML', description: 'Artificial intelligence ventures' },
  // ...
];
---

<nav class="main-nav">
  <JumboDropdown label="Portfolio" items={portfolioItems} />
  <!-- Other nav items -->
</nav>
```

## Related Components

- `Header.astro` - Main navigation component (contains dropdowns)
- `MobileMenu.astro` - Mobile-specific navigation (alternative to dropdown on small screens)
- `InternalLinkWrapper.astro` - Link wrapper with hover animations

## Future Considerations

- Support for dynamic content loading via API
- Animation customization through props
- Nested dropdowns for hierarchical navigation (if needed)
- Integration with content collections for auto-generated dropdowns
