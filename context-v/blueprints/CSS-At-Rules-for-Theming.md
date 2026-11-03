---
title: CSS At-Rules for Theming with Tailwind
lede: "Understanding and leveraging CSS at-rules for effective theming in Tailwind projects"
date_authored_initial_draft: 2025-05-15
date_authored_current_draft: 2025-05-15
date_authored_final_draft: null
date_first_published: null
date_last_updated: null
at_semantic_version: 0.0.0.1
publish: true
status: Reference
augmented_with:
  - Windsurf Cascade on Claude 3.7 Sonnet
category: Frontend-Development
date_created: 2025-05-15
date_modified: 2026-11-02
tags: 
  - CSS
  - Tailwind
  - Themes
  - At-Rules
  - Design-Systems
  - Frontend-Development
authors:
  - Michael Staton
image_prompt: "A stylized CSS code editor showing at-rules with color themes being applied."
banner_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/reminders/2025-05-25_banner_image_CSS-At-Rules-for-Theming_971e15ea-2a34-4e94-acf3-1396dff9cc8b_0HNL2uZlC.webp
portrait_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/reminders/2025-05-25_portrait_image_CSS-At-Rules-for-Theming_2678b27c-ff11-4496-b4b8-0ffaafd683d1_Wf_hZaJ-d.webp
site_uuid: fddacff3-cadb-45aa-b8ee-3ec7bee809e5
hex_code: jbap91
description: "An explanation of the CSS at-rules used for theming in Tailwind projects."
type: Blueprints
---

# Understanding CSS At-Rules for Theming

CSS at-rules (prefixed with `@`) provide powerful mechanisms for organizing and applying themes. Here's how to leverage them effectively:

## @layer

The `@layer` directive is part of the CSS Cascade Layers specification, which allows you to control the cascade and specificity of your styles:

```css
@layer structure, theme, components, mode;

@import "./structure.css" layer(structure);
@import "./lossless-theme.css" layer(theme);
@import "./components.css" layer(components);
@import "./mode.css" layer(mode);
```

This defines the order of precedence for your CSS layers, with later layers having higher priority. Styles in the `mode` layer will override conflicting styles in the `theme` layer, which will override styles in the `structure` layer.

## @apply

In Tailwind, the `@apply` directive lets you extract common patterns into custom CSS classes by applying Tailwind's utility classes directly in your CSS:

```css
.btn-primary {
  @apply bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark;
}
```

This is useful for creating reusable components while still leveraging Tailwind's utility classes.

## theme() Function

When Tailwind refers to `@theme`, they're typically talking about accessing theme values from your `tailwind.config.js` file within CSS using the `theme()` function:

```css
.custom-element {
  color: theme('colors.primary');
  padding: theme('spacing.4');
}
```

This allows you to access your Tailwind theme configuration directly in your CSS, ensuring consistency between your utility classes and custom CSS.

## Best Practices for Using These Features

### 1. Organize with @layer

```css
/* Define your layers */
@layer base, components, utilities, themes;

/* Base styles */
@layer base {
  :root {
    --sys-color-primary: #4a6cf7;
  }
}

/* Component styles */
@layer components {
  .btn {
    @apply py-2 px-4 rounded;
    background-color: var(--sys-color-primary);
  }
}

/* Theme overrides */
@layer themes {
  [data-theme="client1"] {
    --sys-color-primary: #e63946;
  }
}
```

### 2. Use theme() for consistency

```css
.custom-element {
  /* Access your Tailwind theme values */
  margin: theme('spacing.4');
  color: theme('colors.primary');
  
  /* For responsive designs */
  @screen md {
    margin: theme('spacing.6');
  }
}
```

### 3. Combine with CSS variables for theming

```css
@layer base {
  :root {
    --color-primary: theme('colors.blue.500');
  }
  
  [data-theme="dark"] {
    --color-primary: theme('colors.blue.300');
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white;
    /* You can also use CSS variables directly */
    border-color: var(--color-primary);
  }
}
```

### 4. Extend your Tailwind config for custom themes

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--sys-color-primary)',
        // You can also use opacity modifiers with CSS variables
        'primary-50': 'color-mix(in srgb, var(--sys-color-primary) 50%, transparent)',
      },
    },
  },
}
```

## Integration with Existing Theme System

When working with our existing theme system, these at-rules can be integrated with our current approach of using CSS variables for theming. The key is to maintain a consistent naming convention and layer structure across all projects.

Our current system uses a layered approach with structure, theme, components, and mode layers, which aligns perfectly with the cascade layers specification. By leveraging `@layer` and the theme() function, we can enhance our existing system while maintaining backward compatibility.
