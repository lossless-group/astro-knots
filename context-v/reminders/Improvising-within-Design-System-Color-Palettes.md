---
title: "Improvising within Design System Color Palettes"
lede: "A reminder to AI code assistants and developers: use named colors and design tokens; when improvising raw hex or rgba values, reintegrate them into the system."
date_created: 2026-04-20
date_modified: 2026-04-20
status: Published
category: Reminders
tags: [Design-System, Colors, Tokens, CSS, Themes, Modes]
authors:
  - Michael Staton
augmented_with: Claude Code on Opus 4.7
---

# Don't Improvise Colors — Use the Design System

When working within an Astro-Knots site's theme and mode system, there is a clear hierarchy for how colors should be referenced. Violating this hierarchy leads to unmaintainable CSS that breaks across modes and drifts from the brand.

## The Color Hierarchy

### 1. Named Colors (Source of Truth)

Every color in the system starts as a **named color** defined in `:root` with a memorable, conventional name and a single hex value:

```css
:root {
  --color-brand-blue: #0052E6;
  --color-haiti-blue: #141531;
  --color-electric: #60A5FA;
  --color-graphite-300: #D4D4D4;
  --color-snow: #FFFFFF;
}
```

These are **the only place hex values should appear**. If you need a new color, add it here with a proper name — don't scatter hex values through mode definitions or component styles. Sometimes, improvising may involve experimentation at the component, layout, or page level.  If you find something that works, add it to the system as a named color.  If it works so well you want to update a mode of the theme, update the semantic tokens accordingly.

### 2. Semantic Tokens (Theme Layer)

Mode-specific selectors (`[data-theme="emblem"][data-mode="vibrant"]`) reference named colors to define semantic roles:

```css
--color-primary: var(--color-brand-blue);
--color-surface: color-mix(in srgb, var(--color-haiti-blue) 80%, transparent);
--color-muted-foreground: var(--color-graphite-300);
```

### 3. Opacity and Gradients via `color-mix()`

When you need opacity variants or blends, use `color-mix()` with named colors — never raw rgba:

```css
/* CORRECT — uses named color with opacity */
--color-border: color-mix(in srgb, var(--color-snow) 20%, transparent);
--fx-card-bg: color-mix(in srgb, var(--color-haiti-blue) 85%, transparent);

/* WRONG — improvised rgba that doesn't adapt across modes */
--color-border: rgba(255, 255, 255, 0.2);
--fx-card-bg: rgba(10, 10, 30, 0.6);
```

### 4. Component Styles Reference Semantic Tokens

Components should only use semantic tokens (`--color-primary`, `--color-surface`, `--color-border`, etc.) or `color-mix()` with those tokens:

```css
/* CORRECT — adapts automatically when mode changes */
.tag-highlight {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
  color: var(--color-accent);
}

/* WRONG — hardcoded values that ignore the active mode */
.tag-highlight {
  background: rgba(0, 82, 230, 0.12);
  color: #0052E6;
}
```

## Why This Matters

When a site has 3 modes (light, dark, vibrant) with different background colors:

- **Raw rgba values don't adapt.** `rgba(0, 82, 230, 0.12)` looks fine on a dark background but disappears on a bright blue one.
- **Named colors adapt automatically.** `color-mix(in srgb, var(--color-accent) 20%, transparent)` uses whatever `--color-accent` is in the current mode.
- **Debugging is possible.** When something looks wrong, you can trace `--color-accent` back to a named color. You can't trace `rgba(10, 10, 30, 0.55)` to anything.

## The Rule

1. **Hex values only in `:root` named color definitions.** Nowhere else.
2. **Semantic tokens reference named colors.** Always via `var()`.
3. **Opacity via `color-mix()`.** Always with a named color or semantic token, never raw rgba.
4. **Components use semantic tokens only.** Never hex, never rgba, never hardcoded fallbacks that bypass the mode system.
5. **When you need a new color, name it.** Add it to `:root` with a memorable name, then reference it. Don't inline a hex value and move on.

## When AI Assistants Improvise

Code assistants (including Claude) tend to reach for raw rgba and hex values when they need a quick color that "looks right." This is the fastest way to create technical debt in a multi-mode theme system.

**Before writing any color value, check:**
- Does a named color already exist for this? → Use it.
- Does a semantic token cover this role? → Use it.
- Do I need a new opacity variant? → Use `color-mix()` with an existing named color.
- Do I genuinely need a new color? → Add it to `:root` with a proper name first, then reference it.

The extra 30 seconds to do it right saves hours of debugging when the client says "vibrant mode looks weird."
