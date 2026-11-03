---
title: Implement Dynamic Sort & Filter with Svelte
lede: Technical specification for migrating the TagColumn and filtering functionality to Svelte components
date_authored_initial_draft: 2025-04-15
date_authored_current_draft: 2025-04-15
date_authored_final_draft: null
date_first_published: null
date_last_updated: null
at_semantic_version: 0.0.0.1
publish: true
status: Draft
augmented_with:
  - Windsurf Cascade on Claude 3.5 Sonnet
category: Technical-Specifications
date_created: 2025-04-16
date_modified: 2026-11-02
site_uuid: 1e30bfb4-8613-4ebc-ad72-90fe2f462314
tags: [Svelte, Component-Architecture, State-Management, UI-Design, TypeScript]
authors:
  - Michael Staton
image_prompt: "Interactive UI panels with sortable and filterable lists, animated with smooth transitions. The design is sleek and modern, highlighting user empowerment and flexibility."
banner_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/specs/2025-05-05_banner_image_Implement-Dynamic-Sort--Filter-with-Svelte_800f8658-473a-4608-a7df-0feb2ddba767_Vxz0dBDMS.webp
portrait_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/specs/2025-05-05_portrait_image_Implement-Dynamic-Sort--Filter-with-Svelte_9ca47a52-0206-4742-8a25-1e7a464aae16_vtLL9e5jQ.webp
hex_code: rqhu3k
description: "A spec for moving the tag column and its filtering to Svelte components."
type: Specs
---
# Overview

This specification outlines the migration of the TagColumn and filtering functionality from vanilla JavaScript in Astro to Svelte components. The goal is to leverage Svelte's reactive state management and component system to create a more maintainable and performant implementation.

# Current Implementation Analysis

The current implementation in Astro uses vanilla JavaScript for:
1. Managing tag selection state
2. Updating the URL with selected tags
3. Filtering and sorting cards based on tag matches
4. Manual DOM manipulation for reordering cards

Key pain points:
- Manual DOM manipulation is error-prone and complex
- State management requires significant boilerplate
- Event handling is verbose and requires manual setup
- UI updates need explicit handling

# Proposed Svelte Implementation

## Component Structure

```
site/src/components/
├── tag-components/
│   ├── TagColumn.svelte       # Main tag filtering component
│   ├── TagChip.svelte        # Individual tag display
│   ├── TagSearch.svelte      # Tag search input
│   └── SortControls.svelte   # Sort type controls
└── tool-components/
    ├── CardGrid.svelte       # Grid layout for tool cards
    └── ToolCard.svelte       # Individual tool card
```

## Component Interfaces

### TagColumn.svelte
```typescript
interface TagColumnProps {
  tags: Array<{
    tag: string;
    count: number;
  }>;
  initialSelectedTags?: string[];
  onTagsChange?: (selectedTags: string[]) => void;
}
```

### TagChip.svelte
```typescript
interface TagChipProps {
  tag: string;
  count?: number;
  selected?: boolean;
  interactive?: boolean;
}
```

### CardGrid.svelte
```typescript
interface CardGridProps {
  tools: Tool[];
  selectedTags: string[];
  sortType: 'relevance' | 'alpha-asc' | 'alpha-desc' | 'date';
}

interface Tool {
  id: string;
  title: string;
  description: string;
  tags: string[];
  // ... other tool properties
}
```

## State Management

### Store Definition
```typescript
// stores/tagStore.ts
import { writable, derived } from 'svelte/store';

interface TagState {
  availableTags: Array<{tag: string; count: number}>;
  selectedTags: string[];
  sortType: 'alpha-asc' | 'alpha-desc' | 'frequency-asc' | 'frequency-desc';
}

export const tagState = writable<TagState>({
  availableTags: [],
  selectedTags: [],
  sortType: 'frequency-desc'
});

// Derived store for sorted tags
export const sortedTags = derived(tagState, ($state) => {
  const { availableTags, selectedTags, sortType } = $state;
  return getSortedTags(availableTags, sortType, selectedTags);
});
```

## Key Features

### 1. Reactive Tag Selection
```svelte
<!-- TagColumn.svelte -->
<script lang="ts">
  import { tagState } from '../stores/tagStore';
  import TagChip from './TagChip.svelte';
  
  $: sortedTags = getSortedTags(
    $tagState.availableTags,
    $tagState.sortType,
    $tagState.selectedTags
  );
  
  function toggleTag(tag: string) {
    tagState.update(state => ({
      ...state,
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter(t => t !== tag)
        : [...state.selectedTags, tag]
    }));
  }
</script>

<div class="tag-column">
  <SortControls />
  <TagSearch />
  
  {#each sortedTags as {tag, count}}
    <TagChip
      {tag}
      {count}
      selected={$tagState.selectedTags.includes(tag)}
      on:click={() => toggleTag(tag)}
    />
  {/each}
</div>
```

### 2. URL Synchronization
```typescript
// utils/urlSync.ts
import { tagState } from '../stores/tagStore';
import { browser } from '$app/env';

// Subscribe to state changes and update URL
tagState.subscribe(state => {
  if (!browser) return;
  
  const url = new URL(window.location.href);
  if (state.selectedTags.length > 0) {
    url.searchParams.set('tags', state.selectedTags.join(','));
  } else {
    url.searchParams.delete('tags');
  }
  
  history.pushState({}, '', url);
});

// Initialize state from URL
export function initFromUrl() {
  if (!browser) return;
  
  const url = new URL(window.location.href);
  const tags = url.searchParams.get('tags')?.split(',') || [];
  
  if (tags.length > 0) {
    tagState.update(state => ({
      ...state,
      selectedTags: tags
    }));
  }
}
```

### 3. Dynamic Card Filtering
```svelte
<!-- CardGrid.svelte -->
<script lang="ts">
  import { tagState } from '../stores/tagStore';
  import type { Tool } from '../types';
  
  export let tools: Tool[];
  
  $: filteredTools = filterTools(tools, $tagState.selectedTags);
  $: sortedTools = sortToolsByRelevance(filteredTools, $tagState.selectedTags);
  
  function filterTools(tools: Tool[], selectedTags: string[]): Tool[] {
    if (selectedTags.length === 0) return tools;
    
    return tools.filter(tool => 
      selectedTags.some(tag => tool.tags.includes(tag))
    );
  }
  
  function sortToolsByRelevance(tools: Tool[], selectedTags: string[]): Tool[] {
    return [...tools].sort((a, b) => {
      const aMatches = selectedTags.filter(tag => a.tags.includes(tag)).length;
      const bMatches = selectedTags.filter(tag => b.tags.includes(tag)).length;
      return bMatches - aMatches;
    });
  }
</script>

<div class="card-grid">
  {#each sortedTools as tool (tool.id)}
    <ToolCard {tool} matchCount={getMatchCount(tool.tags)} />
  {/each}
</div>
```

## Integration with Astro

## Astro Islands Architecture

The migration to Svelte components will leverage Astro's Islands Architecture, which provides several key benefits:

1. **Partial Hydration**
   - Only interactive components are hydrated with JavaScript
   - Static content remains as lightweight HTML/CSS
   - Each component is hydrated independently

2. **Client Directives**
   - `client:load` - Hydrate component immediately on page load
   - `client:idle` - Hydrate when browser is idle
   - `client:visible` - Hydrate when component enters viewport
   - Choose the most appropriate directive for each component's use case

3. **Component Implementation**
```astro
---
// TagColumn.astro
import TagColumnSvelte from './TagColumnSvelte.svelte';
---

<TagColumnSvelte client:load />
```

## Svelte Integration Setup

1. **Installation and Configuration**
```bash
pnpm astro add svelte
```

2. **Configuration Files**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [svelte()]
});

// svelte.config.js
import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess()
};
```

3. **TypeScript Support**
```typescript
// src/env.d.ts
/// <reference types="astro/client" />
/// <reference types="svelte" />
```

## Component Hydration Strategy

1. **TagColumn Component**
   - Use `client:load` for immediate interactivity
   - Critical for user interaction with filtering

2. **TagChip Components**
   - Use `client:visible` for performance optimization
   - Only hydrate chips when they enter viewport

3. **CardGrid Component**
   - Use `client:idle` for non-critical interactivity
   - Allow initial page load to prioritize tag interaction

```astro
---
import TagColumn from '../components/TagColumn.svelte';
import CardGrid from '../components/CardGrid.svelte';
---

<div class="layout">
  <TagColumn client:load />
  <CardGrid client:idle tools={tools} />
</div>
```

## Accessibility Enhancements

1. **Keyboard Navigation**
```svelte
<!-- TagChip.svelte -->
<button
  role="checkbox"
  aria-checked={selected}
  tabindex="0"
  on:click
  on:keydown={e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      dispatch('click');
    }
  }}
>
  {tag}
  {#if count}
    <span class="tag-count" aria-label="used {count} times">{count}</span>
  {/if}
</button>
```

2. **Screen Reader Support**
```svelte
<!-- TagColumn.svelte -->
<div 
  class="tag-column"
  role="region"
  aria-label="Tag filters"
>
  <div class="selected-tags" role="group" aria-label="Selected tags">
    {#each $tagState.selectedTags as tag}
      <TagChip {tag} selected />
    {/each}
  </div>
</div>
```

## Styling and Animation Guidelines

### Component Styling

1. **Direct Component Styling**
```scss
<!-- TagChip.svelte -->
<style lang="scss">
  .tag-chip {
    // Direct component styling for consistent behavior
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
      transform: var(--transform-elevation-medium);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
  }
</style>
```

2. **Container Spacing for Hover Effects**
```scss
<!-- TagColumn.svelte -->
<style lang="scss">
  .tag-column {
    // Ensure hover effects aren't clipped
    padding: 1rem;
    gap: 0.75rem;
    overflow-y: auto;
    
    // Prevent hover effects from being cut off
    .tag-list {
      padding: 0.5rem;
      margin: -0.5rem;
    }
  }
</style>
```

3. **Text Wrapping for Markdown Content**
```scss
<!-- ToolCard.svelte -->
<style lang="scss">
  .text-wrapper {
    display: inline-block;
    width: 100%;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  
  .tool-card__header {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.5em;
  }
</style>
```

### Animation System

1. **Hover Animations**
```scss
<!-- animations.scss -->
:root {
  --transform-elevation-medium: translateY(-4px);
  --transform-elevation-small: translateY(-2px);
  --shadow-elevation: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.hover-elevate {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: var(--transform-elevation-medium);
    box-shadow: var(--shadow-elevation);
  }
}
```

2. **Transition Properties**
```scss
<!-- transitions.scss -->
.tag-transition {
  transition: 
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

// Respect user preferences
@media (prefers-reduced-motion: reduce) {
  .tag-transition {
    transition: none;
  }
}
```

3. **Z-Index Hierarchy**
```scss
<!-- z-index.scss -->
:root {
  --z-index-tag-hover: 2;
  --z-index-tag-column: 1;
  --z-index-base: 0;
}

.tag-chip {
  position: relative;
  z-index: var(--z-index-base);
  
  &:hover {
    z-index: var(--z-index-tag-hover);
  }
}
```

These styling guidelines ensure:
1. Consistent hover effects across components
2. Proper handling of Markdown content
3. Accessible animations with reduced motion support
4. Clear z-index hierarchy for nested components
5. Proper spacing for hover effect visibility

## Mobile Responsiveness

```scss
.tag-column {
  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    transform: translateY(calc(100% - 3rem));
    transition: transform 0.3s ease;
    
    &.expanded {
      transform: translateY(0);
    }
  }
}
```

# Migration Strategy

1. **Phase 1: Component Setup**
   - Create new Svelte component files
   - Set up TypeScript interfaces
   - Implement basic store structure

2. **Phase 2: Core Functionality**
   - Implement tag selection and filtering
   - Add sorting controls
   - Set up URL synchronization

3. **Phase 3: UI Polish**
   - Add animations and transitions
   - Implement mobile responsiveness
   - Enhance accessibility features

4. **Phase 4: Testing & Integration**
   - Write unit tests for components
   - Test browser compatibility
   - Verify accessibility compliance

# Benefits

1. **Development Experience**
   - Reduced boilerplate code
   - Better type safety with TypeScript
   - Easier state management
   - More maintainable codebase

2. **Performance**
   - Less manual DOM manipulation
   - Optimized reactivity
   - Better memory management

3. **User Experience**
   - Smoother transitions
   - More responsive interface
   - Better accessibility
   - Improved mobile experience

# Dependencies

- Svelte
- TypeScript
- svelte-preprocess
- @sveltejs/kit (for routing and SSR)

# Testing Requirements

1. **Unit Tests**
   - Component rendering
   - State management
   - URL synchronization
   - Sorting and filtering logic

2. **Integration Tests**
   - Component interactions
   - Store updates
   - URL handling
   - Mobile responsiveness

3. **Accessibility Tests**
   - Screen reader compatibility
   - Keyboard navigation
   - ARIA attributes
   - Color contrast

# Deployment Considerations

1. **Build Process**
   - Update vite.config.js for Svelte
   - Configure TypeScript
   - Set up component preprocessing

2. **Performance Monitoring**
   - Add metrics for component rendering
   - Track state updates
   - Monitor bundle size

3. **Browser Support**
   - Verify compatibility with target browsers
   - Add necessary polyfills
   - Test in different environments