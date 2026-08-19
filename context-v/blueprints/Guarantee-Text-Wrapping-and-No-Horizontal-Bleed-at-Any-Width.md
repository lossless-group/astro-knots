---
title: "Guarantee Text Wrapping and No Horizontal Bleed at Any Width"
lede: >-
  One Tailwind class caused it: `mx-auto` on a flex item disables stretch, so `<main>` sized to its content instead of its parent.
site_uuid: 582fcb03-bad5-43b0-9e5d-6eb4bbb468ce
hex_code: ce6anu
date_created: 2026-08-17
date_modified: 2026-08-17
status: Published
category: Blueprints
tags:
  - Responsive-Design
  - CSS
  - Flexbox
  - Layout
  - Debugging
  - Tailwind
  - Markdown-Rendering
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 5, 1M context)
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
publish: true
---

# Guarantee Text Wrapping and No Horizontal Bleed at Any Width

## Why Care?

Drag any astro-knots window to its narrowest and the content bleeds off the right edge — headings clipped mid-word, paragraphs running under the viewport, tables sliced through a column. It reads as "responsive text wrapping stopped working," which is the wrong diagnosis and sends you hunting in the wrong file.

**The invariant this blueprint establishes:**

> The page never scrolls horizontally. Wide content scrolls inside its own box. Prose always wraps. Code and ASCII never wrap.

Four clauses, and the last two are in tension with the first — which is the whole reason this needs writing down.

## The bug, and why it fooled us three times

The symptom looked content-shaped, so we fixed content three times and were wrong three times:

| Attempt | Theory | Outcome |
|---|---|---|
| 1 | `.ak-table-wrap` had no CSS, so wide tables clip | **A real bug**, fixed — but not this one |
| 2 | A wide descendant won't shrink → `min-width: 0` on `.docs-layout` | Correct guard, wrong level |
| 3 | Same, one level up → `min-w-0` on `<main>` | Still 637px. Nothing was being shrunk |

The actual cause, once measured:

```
viewport=500  scrollWidth=637
--- ancestors of main ---
637px  main.flex-1.min-w-0.px-6      ← the only element wider than its parent
500px  div.min-h-screen.flex.flex-col
500px  body
500px  html
```

`html`, `body`, and the flex wrapper were all correctly 500px. **Nothing inside `<main>` exceeded its content box.** `<main>` was sizing *itself*.

### The cause: auto margins defeat stretch

```html
<div class="min-h-screen flex flex-col">
  <main class="flex-1 px-6 py-12 max-w-6xl mx-auto">
```

A flex item with `width: auto` normally fills the cross axis via `align-items: stretch`. **An auto margin on the cross axis cancels that.** Auto margins absorb free space, so the item is sized to fit-content instead — and fit-content grew to `<main>`'s max-content width (637px), capped only by `max-w-6xl` (1152px), which never bound.

`mx-auto` is doing exactly what it's for in a block layout: centre a `max-width` column. Inside a flex parent it means something else entirely. **This is the trap: the class is correct, the context changes its meaning, and nothing warns you.**

`min-width: 0` cannot help, because nothing was being shrunk.

## The fix

### 1. Give the flex item a definite width

```astro
<main class={`flex-1 w-full min-w-0 ${containerClass}`}>
```

- **`w-full`** restores a definite width (`100%` of the parent). `max-w-*` still caps it and `mx-auto` still centres it once there is genuine free space.
- **`min-w-0`** covers the *separate* flex case where a wide descendant refuses to shrink below its min-content size. Not the cause here, but a real guard.

**Both, in the shared layout.** Any page passing `mx-auto` through `containerClass` — which is most of them — inherits the bug otherwise.

### 2. Repeat the guard on nested layout containers

```css
.docs-layout   { min-width: 0; max-width: 100%; overflow-x: clip; }
.docs-article,
.docs-prose    { min-width: 0; max-width: 100%; }
```

**`overflow-x: clip`, never `hidden`.** `hidden` creates a scroll container, which breaks `position: sticky` for anything nested inside it — you would fix the bleed and silently kill the sticky ToC rail. `clip` does not create one.

**Never put `overflow-x: hidden` on `html` or `body`.** Same sticky breakage, site-wide, and it hides the symptom rather than fixing the cause.

### 3. Give every wide block its own scroller

| Content | Rule |
|---|---|
| **Tables** | `.ak-table-wrap { overflow-x: auto }` **plus** a `min-width` on the table |
| **Code** | `pre { overflow-x: auto }`; never `white-space: pre-wrap` |
| **ASCII / tree outlines** | Same as code — they *are* code fences |
| **Mermaid** | Wrapper with `overflow-x: auto`; `max-width: 100%` on the SVG |
| **Images** | `max-width: 100%; height: auto` |
| **Long strings** | `overflow-wrap: break-word` on cells and prose |

The table pairing is the non-obvious one. **`overflow-x: auto` alone does nothing** — with `width: 100%` and no floor, the table keeps shrinking and you get crushed columns instead of a scrollbar. The `min-width` is what creates overflow for the wrapper to scroll.

And size that floor against **the narrowest window a browser allows, not the narrowest phone**. We first set `min-width: 34rem` (544px) — wider than Chrome's ~500px minimum window on macOS, so the scroller itself became the overflow. 26rem holds three legible columns and fits.

### 4. Prose wraps; code does not

Wrapping code, ASCII diagrams, or filesystem trees to dodge a scrollbar destroys the content to protect the layout. A wrapped tree outline is not a tree. **Let them scroll.**

## The diagnostic: measure, don't reason

The lesson worth more than the fix. Three plausible cascade theories cost three round-trips; one measurement ended it.

No Playwright needed — Chrome is already on every machine:

```bash
# 1. serve the build
cp -r dist/client /tmp/probe
cd /tmp/probe && python3 -m http.server 8899 &
```

Append to the page under test:

```html
<script>
window.addEventListener('load', () => setTimeout(() => {
  const vw = document.documentElement.clientWidth;
  const nm = el => el.tagName.toLowerCase() +
    (typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\s+/).slice(0,3).join('.') : '');

  // Ancestor chain from the suspect element up to <html>
  const chain = [];
  let el = document.querySelector('main');
  while (el) { chain.push(Math.round(el.getBoundingClientRect().width) + 'px  ' + nm(el)); el = el.parentElement; }

  const out = document.createElement('pre');
  out.id = 'PROBE';
  out.textContent = 'viewport=' + vw +
    ' scrollWidth=' + document.documentElement.scrollWidth + '\n' + chain.join('\n');
  document.body.prepend(out);
}, 500));
</script>
```

```bash
# 2. render headless at a narrow width and read the probe back
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --window-size=420,900 \
  --virtual-time-budget=4000 --dump-dom \
  "http://localhost:8899/guides/some-guide/index.html" \
  | grep -A20 'id="PROBE"'
```

**Read it as: find the first element wider than its own parent.** That element is the culprit; everything below it is just filling the box it was given. In our case `<main>` at 637px inside a 500px parent, with every ancestor correct — which immediately rules out every descendant and every "content is too wide" theory.

Chrome enforces a ~500px minimum window on macOS, so `--window-size=420` still yields a 500px viewport. That is the real floor to design against.

### Regression check

```
viewport=500  scrollWidth=500
HORIZONTAL OVERFLOW: NO
elements wider than viewport: NONE
```

Run it against several page types, not just the one that was reported — the fix lives in the shared layout, so its blast radius is every page.

## Anti-patterns

- **`overflow-x: hidden` on `html`/`body`.** Breaks sticky everywhere; hides the cause.
- **`overflow-x: hidden` on a container with sticky children.** Same, locally.
- **`white-space: pre-wrap` on code.** Protects the layout by corrupting the content.
- **`overflow-x: auto` on a table with no `min-width`.** Does nothing; you get crushed columns.
- **A `min-width` wider than ~500px on any always-present element.** Exceeds the narrowest real window.
- **Reasoning about the cascade instead of measuring it.** Three wrong fixes say this louder than the rule does.

## Checklist for a new site or layout

- [ ] Shared layout's `<main>` (or equivalent flex item) has **`w-full min-w-0`**
- [ ] Nested layout containers carry `min-width: 0; max-width: 100%`
- [ ] `overflow-x: clip` where clipping is needed — never `hidden` near sticky
- [ ] Tables wrapped in a scroller **with a `min-width` on the table**
- [ ] `pre` scrolls horizontally and does not wrap
- [ ] Mermaid wrapped in a scroller
- [ ] `overflow-wrap: break-word` on table cells and prose
- [ ] Probe run at 500px across at least four page types; `scrollWidth == clientWidth`

## See also

- [[Standard-Table-of-Contents-for-Every-Markdown-Collection]] — depends on this; implement this first
- [[Codeblock-Syntax-Highlighting-with-Shiki]] — the `pre` this blueprint requires to scroll
- `context-v/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md` — the reading column these rules protect
