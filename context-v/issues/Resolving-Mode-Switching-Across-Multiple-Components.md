# Resolving Mode Switching Across Multiple Components

**Date:** 2024-12-04
**Project:** Dark Matter Site
**Components Affected:** WhyNowWhyUs-v5, v6, v7 in `needs-modes/` folder

## The Problem

We had hero section components that looked great in their original "vibrant" mode with glowing purple borders, text shadows, animated effects, and gradient backgrounds. The goal was to refactor them to support three visual modes (light, dark, vibrant) that could be switched dynamically via a `data-mode` attribute on the `<html>` element.

After multiple refactoring attempts, the mode-specific styles (especially the vibrant glows and borders) weren't appearing at all. The components rendered flat with no borders visible, even when `data-mode="vibrant"` was set.

## What Didn't Work

### Attempt 1: CSS Custom Property Tokens
We added `--fx-*` effect tokens to `matter-theme.css` for each mode, hoping components could just reference these variables. While useful for some things (like the Orb color), this approach couldn't handle all the complex, component-specific styling differences between modes.

### Attempt 2: Mode-Specific CSS Selectors (Without :global)
We wrote CSS like this in the Astro component's `<style>` block:

```css
[data-mode="vibrant"] .card-inner {
  border: 1px solid rgba(102, 67, 226, 0.5);
  box-shadow: 0 0 40px rgba(102, 67, 226, 0.3);
}
```

**This didn't work** because of Astro's CSS scoping behavior (explained below).

### Attempt 3: Overly Abstract Class Names
Early refactoring attempts replaced the original vibrant-specific Tailwind classes with generic class names like `.headline-main`, `.card-inner-primary`, etc., then tried to style them per-mode. This lost the original vibrant effects and made the CSS harder to maintain.

## The Root Cause: Astro's CSS Scoping

**This was the breakthrough realization.**

Astro automatically scopes `<style>` blocks to their component by adding a unique attribute (like `data-astro-cid-xyz`) to both the HTML elements and the CSS selectors.

So when you write:
```css
[data-mode="vibrant"] .card-inner { ... }
```

Astro transforms it to something like:
```css
[data-mode="vibrant"][data-astro-cid-xyz] .card-inner[data-astro-cid-xyz] { ... }
```

**The problem:** `data-mode="vibrant"` is on the `<html>` element, which is **outside** the component and doesn't have the `data-astro-cid-xyz` attribute. The selector `[data-mode="vibrant"][data-astro-cid-xyz]` never matches anything because `<html>` only has `data-mode`, not the component's scope attribute.

## The Solution: `:global()` Wrapper

Astro provides `:global()` to opt specific parts of a selector out of scoping. The fix was simple:

```css
/* Before - doesn't work */
[data-mode="vibrant"] .card-inner {
  border: 1px solid rgba(102, 67, 226, 0.5);
}

/* After - works! */
:global([data-mode="vibrant"]) .card-inner {
  border: 1px solid rgba(102, 67, 226, 0.5);
}
```

With `:global([data-mode="vibrant"])`, Astro doesn't add the scope attribute to that part of the selector, so it correctly matches `<html data-mode="vibrant">`.

The `.card-inner` part still gets scoped (which is fine - it's inside the component), but the mode selector correctly targets the document root.

## The Fix Applied

We did a bulk replace across all three component files:

```bash
# In each needs-modes component file:
[data-mode="light"]   → :global([data-mode="light"])
[data-mode="dark"]    → :global([data-mode="dark"])
[data-mode="vibrant"] → :global([data-mode="vibrant"])
```

## Additional Lessons Learned

### 1. Start From Working Code
When refactoring, keep the original working code intact (we put ours in `vibrant/` folder) and build the new version by adding to it rather than abstracting away from it. It's easier to add light/dark mode support to a working vibrant component than to reconstruct vibrant effects from an over-abstracted skeleton.

### 2. The Orb Component Needed Separate Handling
The Three.js Orb (`ImageAbstract--Orb--Half.astro`) uses JavaScript/WebGL for rendering, not CSS. It needed:
- A `--fx-orb-color` CSS variable defined per mode in the theme
- JavaScript that reads the computed CSS variable value
- A MutationObserver watching for `data-mode` attribute changes on `<html>` to update the Three.js color uniform in real-time

### 3. Mode Selector Specificity
When using `:global([data-mode="X"])`, the resulting CSS has the same specificity as a regular attribute selector. If you have competing styles (like Tailwind classes), you may need to ensure mode-specific styles are more specific or come later in the cascade.

## File Structure After Resolution

```
src/layouts/sections/narratives/
├── vibrant/                    # Original vibrant-only designs (preserved)
│   ├── WhyNowWhyUs-v5.astro
│   ├── WhyNowWhyUs-v6.astro
│   └── WhyNowWhyUs-v7.astro
└── needs-modes/                # Mode-aware versions using :global()
    ├── WhyNowWhyUs-v5.astro
    ├── WhyNowWhyUs-v6.astro
    └── WhyNowWhyUs-v7.astro
```

## Testing the Fix

1. Navigate to `/design-system/needs-modes`
2. Use the mode switcher buttons (Light / Vibrant / Dark)
3. Verify that:
   - Light mode: Clean white background, subtle purple accents, dark text
   - Dark mode: Deep void background, moderate glows, light text
   - Vibrant mode: Glowing purple borders, text shadows, animated effects, gradient backgrounds

## Summary

| Problem | Cause | Solution |
|---------|-------|----------|
| Mode-specific CSS not applying | Astro scopes `[data-mode]` selector but `data-mode` is on `<html>` outside component | Wrap with `:global([data-mode="X"])` |
| Lost vibrant effects during refactor | Over-abstracted class names, rebuilt from scratch | Start from working vibrant code, add other modes |
| Orb invisible in light mode | Hardcoded white color | Add `--fx-orb-color` token + JS MutationObserver |
