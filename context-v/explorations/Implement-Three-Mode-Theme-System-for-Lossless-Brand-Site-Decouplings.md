---
type: Explorations
title: "Implement a Three-Mode Theme System for the Lossless Brand Site Decouplings"
description: "How the sites decoupled from lossless-site (changelog, toolkit, slides, client-portals) get a shared light/dark/vibrant system: vibrant keeps today's Lossless look, while light and dark become quiet reading modes that still carry the gradient and the electric cyan."
lede: >-
  Today's Lossless look is really vibrant. The open question is what a quiet
  light and dark look like that are still unmistakably ours.
publish: false
date_created: 2026-10-06
date_modified: 2026-10-06
date_authored_initial_draft: 2026-10-06
date_authored_current_draft: 2026-10-06
date_authored_final_draft:
authors:
  - Michael P. Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.1.0
status: Open
tags:
  - Exploration
  - Theme-System
  - Three-Mode-Contract
  - Lossless-Site-Rebuild
  - Design-Tokens
  - Brand-Identity
related:
  - "[[Build-a-Client-Portals-Site]]"
  - "[[Maintain-Themes-Mode-Across-CSS-Tailwind]]"
  - "[[Maintain-Design-System-and-Brandkit-Motions]]"
  - "[[Extract-the-Lossless-Brand-Layer-from-lossless-site]]"
  - "[[Opening-Strategy-Questions-for-Architecture-and-Stack]]"
site_uuid: d3bd0169-1631-48b7-a219-2c37c841e9e9
hex_code: 8ahjcu
---

# Implement a Three-Mode Theme System for the Lossless Brand Site Decouplings

> This is a working document. It grows alongside the build of
> [[Build-a-Client-Portals-Site]], which is the first site to implement it. The
> changelog, toolkit and slides sites adopt it afterwards.

## The question

Every Astro Knots site is supposed to ship three modes: light, dark and vibrant.
The Lossless sites themselves mostly don't. For the Lossless house brand:

1. **What is vibrant?** The working answer is the look `lossless-site` already
   has: electric cyan on near-black, gradient hairlines and borders, blurred
   gradient blobs, and cyan glows. That site is "dark" in name only. Its
   character is vibrant.
2. **What are light and dark?** They should be *minimal-distraction reading
   modes*, in the register of a newspaper or a longform publication. They still
   have to be unmistakably Lossless, so the **brand gradient** and the
   **electric cyan** survive in both, as identity rather than decoration.
3. **What do the decoupled sites share,** and how is it shipped to them?
   Candidates are a copied token file, a published package, or a runtime CSS URL.

Decision parameters:

- The brand kernel below must appear in all three modes.
- Body text must pass WCAG AA in every mode.
- No flash on first paint.
- The firm's `data-mode` contract holds.
- Per-site deviations are allowed only for typography.

## Decisions so far

**2026-10-06, from Michael:**

1. **Serif body in both light and dark.** Both reading modes set long-form text
   in a serif. Newsreader is the first candidate, as the slides site uses it,
   via `@fontsource-variable/newsreader` 5.3.0. Vibrant keeps a sans.
2. **Dark-mode grounds derive from the Lossless gradient.** There is no flat
   neutral black. The dark ground is the gradient pushed nearly to black, and
   surfaces are glass over it. Opacity and blur are free parameters to tune.
   See *Dark from the gradient* below.
3. **Every Lossless site defaults to vibrant.** This matches lossless.group
   today. There is no `prefers-color-scheme` fallback, because a light-OS
   visitor still lands on vibrant and the reading modes are a deliberate
   choice.
4. **The decoupled surfaces move to subdomains:** `changelog.lossless.group`,
   `toolkit.lossless.group` and `clients.lossless.group`. `lossless-site` then
   drops its redundant routes and links out to them. Two consequences follow:
   - The family has to feel like one site as a reader clicks across subdomains:
     the same mode, the same tokens and the same header.
   - Today a mode choice is stored in `localStorage`, which is **per origin**,
     so it would not carry across subdomains. See *Mechanics* below.

## Why we don't already know

- **The original site never had modes.** It has one palette. It also has
  scattered, uncoordinated `prefers-color-scheme` blocks in callouts and slides,
  and an unused shadcn `.dark` / `.water` block in `starwind.css`. There is no
  light design to "restore."
- **The changelog decided against modes, on purpose.** In
  `lossless-changelog/src/styles/theme.css:16-27` and `DESIGN.md:5` ("dark by
  decision, not by mode"), the reasoning is:
  - the cyan only reads on dark;
  - on white, "it would not be a light mode, it would be a different brand";
  - a half-authored mode is worse than none.

  That argument is correct about *text-colored cyan*. Whether it holds once the
  cyan's job changes in light mode is exactly what this exploration has to
  answer.
- **The sibling sites already went different ways:**
  - `lossless-toolkit-site` ships three distinct, working modes. Its light mode
    moves the accent from cyan to deep purple, it drops the brand gradient
    entirely, and it uses its own `--clr-*` semantic names.
  - `lossless-slides-site` ships three modes with the best mechanics in the tree.
    Its light mode is a newspaper register with a serif swap, and it **removes
    the gradients**, which is the opposite of what we want here. It also uses
    `data-theme` instead of `data-mode`.
  - The changelog uses `--color-*` and `--gradient-*` semantic names.

  So no two Lossless sites use the same semantic token names.
- **The documented references were stale** (fixed 2026-10-06, see Findings).
  - The blueprint, the Quickstart and the `theme-system` skill all name
    `hypernova-site` and `packages/ui/theme-mode` as canonical. Hypernova only
    handles two modes, and the package has no real pre-paint step.
  - The fullstack-vc vibrant line reference is wrong: the block is at lines
    162-211, not 90-130.

## The brand kernel (must survive in every mode)

| Token (Tier 1) | Value | Role |
|---|---|---|
| `--color__cyan-aqua-brightest` | `#04E5E5` | The electric cyan. Used about 225 times on the old site. |
| `--gradient__eastern-crimson` | `linear-gradient(107deg, #22A6B5 5.36%, #9138E0 23.14%, #D9233B 47.56%, #F59C49 72.33%)` | The brand gradient. The 107° version is canonical, confirmed 2026-08-08 in the changelog. |
| `--color__purple-heart` | `hsl(272 73% 55%)` ≈ `#9138E0` | The second accent, and a gradient stop. |
| `--color__white-catskill` | `hsl(184 35% 92%)` ≈ `#E3F1F2` | Ink on dark, and the base for light-mode paper. |
| `--color__github-dark` | `#0d1117` | The ground that shipped on the old site and on the changelog. |
| Fonts | Bodoni Moda / Figtree / JetBrains Mono | Shared by the changelog and the toolkit. Poppins and Krub were declared on the old site but **never loaded**, so the old site actually rendered in system sans. |
| Fonts (the old site's intent) | Poppins (`--ff-base`) / Krub (`--ff-legible`) | Both are free under OFL-1.1 and self-hostable: Fontsource `@fontsource/poppins` 5.3.0 (weights 100–900, italics) and `@fontsource/krub` 5.3.0 (weights 200–700, italics), or Google Fonts. Candidates for vibrant, if it should finally render as lossless.group intended. |

### Contrast for the cyan question (WCAG, measured)

| Color | On paper `#f8fcfc` | On github-dark `#0d1117` |
|---|---|---|
| cyan `#04E5E5` | **1.52** ✗ | **12.03** ✓ |
| eastern-blue `#22A6B5` | 2.83 ✗ | 6.48 ✓ |
| deep cyan `hsl(181 96% 27%)` `#038587` | 4.32 (large text only) | 4.24 |
| deep cyan `hsl(181 96% 24%)` `#027678` | **5.26** ✓ AA | 3.48 |
| purple-heart `#9138E0` | 5.28 ✓ AA | 3.47 |

**Conclusion:** the electric cyan can never be a *text* color on light. It can
still be the light mode's identity color if its job changes, using:

- fills and highlights
- rules, underlines and the active-state rail
- focus rings
- a cyan-to-ink deepened variant (`#027678`) for links

## Options

### Option A: Re-label, don't redesign

Today's look becomes **vibrant**, as is. **Dark** is today's look with the
effects turned off. **Light** is the toolkit's light block.

**Pros:**

- Fastest, and almost entirely copy-and-rename.

**Cons:**

- Dark becomes "vibrant minus glow", not a reading mode.
- The toolkit's light mode dropped the gradient and demoted cyan to a 22%
  fill, which is two of the things we want to keep.

### Option B: Slides-site mechanics, with Lossless reading modes designed fresh (leaning)

Copy the **mechanics** from `lossless-slides-site`:

- pre-paint in the head
- effects switched off **by token** (`--fx-*: none`), not by selector
- `@custom-variant` × 3 and `@theme inline`, if Tailwind is used
- the per-mode typography hook

(For the toggle, use a segmented control, not the slides site's cycle button;
see *Mechanics*.)

Then design the **look** of the three modes from the kernel:

- **Vibrant** is today's lossless-site look:
  - a gradient-derived ground (the same recipe as dark, at full intensity),
    cyan headings and links
  - gradient hairlines and border-image
  - blurred gradient blobs behind the hero, at 0.15–0.25 opacity
  - glass (`backdrop-filter`)
  - cyan glows, which become `--fx-*` tokens instead of hard-coded `rgba(4,229,229,…)`
- **Dark** is a reading room:
  - a ground **derived from the gradient** (see *Dark from the gradient*)
  - a serif body in catskill ink at about 88%
  - no blobs and no glow; glass only on surfaces, at low opacity
  - the gradient appears **only** as identity: a 2px hairline under the
    header, the wordmark, and the active-section rail
  - cyan is kept for links (12:1) and focus, never for large display surfaces
- **Light** is the paper:
  - catskill-paper ground `hsl(184 38% 98%)`, slate ink
  - the gradient appears in the same identity places as in dark
  - cyan is kept as **non-text identity**: link underlines and hover fills
    (cyan at 18–25% via `color-mix`), the active rail, focus rings, and
    selection highlight
  - link *text* uses deep cyan `#027678`, so it stays recognizably "the blue"
    rather than switching to the toolkit's purple
  - a serif body (Newsreader first), matching dark

**Pros:**

- Light and dark both read as Lossless (gradient plus cyan) and still get out of
  the way of longform.
- It answers the changelog's "different brand" objection directly: the cyan
  stays, only its job changes.

**Cons:**

- Two modes need actual design work, not porting.
- The wordmark needs a light-ground variant. Its near-white parts wash out on
  paper, which the slides site already hit.

### Option C: Keep the changelog's decision; vibrant only where it's earned

Lossless sites stay single-mode dark. Only client-facing surfaces (the client
portals, the slides) get three modes.

**Pros:**

- No design debt, and the house brand stays singular.

**Cons:**

- It contradicts the firm's own contract.
- It leaves readers who want light with nothing.
- The old site's look would stay labeled "dark" when it is really vibrant.
  That is the very confusion this exploration exists to fix.

### Dark from the gradient

One recipe, two dials: dark and vibrant build their ground the same way, and
differ only in intensity.

```css
/* Tier 2, set per mode. Stops are the eastern-crimson stops. */
--ground-base: var(--color__github-dark);   /* #0d1117 */
--ground-wash: linear-gradient(107deg,
  color-mix(in oklab, var(--color__eastern-blue)     var(--wash-1), transparent) 5%,
  color-mix(in oklab, var(--color__blue-purple)      var(--wash-2), transparent) 25%,
  color-mix(in oklab, var(--color__alazarin-crimson) var(--wash-3), transparent) 50%,
  color-mix(in oklab, var(--color__sundshade-yellow) var(--wash-4), transparent) 75%);
--surface-glass: color-mix(in oklab, var(--color__white-catskill) var(--glass), transparent);
--fx-backdrop: blur(var(--blur));
```

| Dial | Dark (reading) | Vibrant |
|---|---|---|
| `--wash-1…4` | about 8 / 7 / 4 / 3% | about 22 / 20 / 14 / 10%, plus blurred blobs at 0.15–0.25 |
| `--glass` | about 3–5% | about 8–12% |
| `--blur` | 8px | 18px, with `saturate(150%)` |
| glow | none | cyan glow tokens |

- The wash is a fixed `background-attachment: fixed` layer on `body`, behind
  everything, so the page reads as one tinted sheet rather than blotches.
- **Check body contrast at the wash's brightest point.** Catskill on `#0d1117`
  is 16.3:1, so there is plenty of headroom. The serif's thin strokes are the
  real risk: look at it in `/brand-kit`, not just in a contrast checker.
- Light mode does **not** use the wash on its ground (paper stays paper). It
  keeps the gradient as identity only.

## How the decoupled sites would share it

This is a sub-question, with three candidate answers:

1. **Copy a `theme.css` per site.** This is the astro-knots default ("copy and
   adapt"). Drift is guaranteed; today's three incompatible Tier-2 vocabularies
   prove it.
2. **One runtime token stylesheet, loaded by URL.** This was proposed in the
   toolkit's `Opening-Strategy-Questions-for-Architecture-and-Stack.md` (Q3):
   `lossless-brand.css`, served from one origin. Every site gets palette
   changes with no redeploy, but it adds a network dependency at first paint.
3. **A small published package** (`@lossless-group/brand-tokens` on JSR, like
   LFM). It is versioned and works offline at build time. The repo's own rule
   ("publish when multiple sites need identical logic") arguably applies here,
   since four sites need identical brand tokens.

**Leaning:** start with (1) inside `client-portals-site`, and keep the file
clean enough that promoting it to (3) is a move, not a rewrite. Decide the
promotion once the second site adopts it.

**Shared vocabulary.** Whichever answer wins, the Tier 2 names should be the
changelog's `--color-*` / `--gradient-*` / `--font-*` / `--fx-*` set:

- it matches the blueprint;
- it is the namespace Tailwind v4 maps to utilities;
- the toolkit's `--clr-*` and the slides site's shadcn-style names migrate to it.

## Mechanics (settled enough to build on)

Taken from the prior-art survey. These hold regardless of which option wins.

- **Attribute and default.** Set `data-mode` on `<html>`. The SSR default and the
  pre-paint default must be **the same value**, or first-time visitors see a
  flash (that is fullstack-vc's bug).
- **Pre-paint script.** An inline `is:inline` script at the **top of `<head>`**.
  It validates the stored value and never runs from a module or a hydrated
  island.
- **Default and `prefers-color-scheme`.** The default is **vibrant**,
  everywhere: SSR `<html data-mode="vibrant">`, and the same fallback in the
  pre-paint script. `prefers-color-scheme` is **not** consulted (decided
  2026-10-06).
- **Persistence across subdomains: a shared cookie, mirrored to `localStorage`.**
  - **Why not `localStorage` alone.** `localStorage`, `sessionStorage` and
    IndexedDB are all **per origin**. So a reader who picks light on
    `toolkit.lossless.group` would land on vibrant at `changelog.lossless.group`.
    The old cross-origin workaround (a hidden iframe on a hub origin, plus
    `postMessage`) no longer works: Safari, Firefox and Chrome now partition
    storage in third-party iframes. `document.domain` is deprecated.
  - **Why a cookie works.** A cookie scoped to the registrable domain is shared
    by every subdomain, and between `*.lossless.group` subdomains it counts as
    *first-party*, so tracking-cookie blockers don't touch it:
    `lossless-mode=<mode>; Domain=.lossless.group; Path=/; Max-Age=31536000; SameSite=Lax; Secure`.
    It isn't `HttpOnly`, so the inline pre-paint script can read it.
  - **The Safari catch.** WebKit's tracking prevention caps cookies set from
    JavaScript (`document.cookie`) at **7 days**. Two cheap mitigations:
    1. **Refresh on every page load.** The pre-paint script rewrites the cookie
       with the same value, so any reader who visits within a week never loses
       the choice.
    2. **Mirror to `localStorage`** under the same name. If the cookie has
       expired, each subdomain still remembers its own last choice, and
       reading it re-seeds the shared cookie.

    A server-set cookie (a `Set-Cookie` response header) is not capped. A site
    that already runs server-side, like `client-portals-site`, could set it from
    a tiny endpoint when the toggle changes. The static sites don't need to; the
    refresh covers them.
  - **Read order:** cookie, then `localStorage`, then `vibrant`. **On write,
    set both.**
  - **Previews:** on `*.vercel.app` the `Domain=.lossless.group` cookie is
    rejected, because the domain doesn't match. The script detects the host,
    and in that case `localStorage` alone carries the choice.
  - One name, `lossless-mode`, for the whole family, never per site. This is a
    deliberate deviation from the per-site keys used elsewhere, because these
    sites are meant to feel like one site.

  Pre-paint sketch, the first thing in `<head>` on every family site
  (`<html data-mode="vibrant">` is the SSR default):

  ```html
  <script is:inline>
    (function () {
      var K = 'lossless-mode', ok = { light: 1, dark: 1, vibrant: 1 }, m;
      try { m = (document.cookie.match(/(?:^|; )lossless-mode=([a-z]+)/) || [])[1]; } catch (e) {}
      if (!ok[m]) { try { m = localStorage.getItem(K); } catch (e) {} }
      if (!ok[m]) m = 'vibrant';
      document.documentElement.setAttribute('data-mode', m);
      var shared = /(^|\.)lossless\.group$/.test(location.hostname);
      try {
        document.cookie = K + '=' + m + '; Path=/; Max-Age=31536000; SameSite=Lax' +
          (shared ? '; Domain=.lossless.group; Secure' : '');
        localStorage.setItem(K, m);
      } catch (e) {}
    })();
  </script>
  ```

  The toggle calls the same write, setting both stores, and then updates
  `data-mode`. The browser drive gains one step: pick light on one family
  subdomain, open another, and assert `data-mode="light"` before any script
  but the pre-paint runs.
- **`color-scheme`.** Set per mode block, as the toolkit and the CVK splash do.
- **Effects as tokens.** `:root` sets every `--fx-*` to `none` or `0`. Only
  vibrant turns them on, and dark and light turn on only the identity hairline.
  Components read tokens and never branch on mode.
- **Astro scoped-style trap.** Inside a component `<style>`, use
  `:global([data-mode="vibrant"]) .x`.
  See `astro-knots/context-v/issues/Resolving-Mode-Switching-Across-Multiple-Components.md`.
- **No inline token styles on `<html>`.** They outrank every mode block; the
  slides site hit this.
- **No improvised colors.** Use `color-mix()` with tokens, never ad hoc `rgba`
  values. This is the `Improvising-within-Design-System-Color-Palettes` reminder.
- **Toggle UI.** For a reading site, prefer the splash family's
  **segmented 3-way control** with `aria-pressed`, or a labeled radiogroup,
  over a cycle button. A reader should see all three choices.
- **Brand mark.** Use a `currentColor` or two-variant wordmark switched by
  `html[data-mode]`; see blueprint §8.2–8.3 `SiteBrandMarkModeWrapper`.
- **Inspection surfaces.** `/brand-kit` and `/design-system` render all three
  modes side by side. Their screenshots are the review artifact for this
  exploration.

## Findings

*(This section is appended to as the client-portals build progresses.)*

- 2026-10-06, research pass:
  - **Old-site vibrancy comes from four things:** cyan on near-black,
    gradient hairlines and borders, blurred gradient blobs, and cyan glows.
    `animations.css` has no animated backgrounds; the "life" is all hover
    transitions plus the footnote pulse.
  - **Old-site bugs to leave behind, not port:**
    - a missing semicolon at `lossless-theme.css:39`, which kills two tokens;
    - a dead 112° gradient;
    - Poppins and Krub are never loaded, so the old site rendered in system
      sans the whole time;
    - Poor Story is loaded from a `/src/...` path that 404s in production.
  - **The wordmark** (`wordmark__The-Lossless-Group.svg`) has dark `#313131`
    letterforms plus the gradient. It needs a light-on-dark variant for dark
    and vibrant, and the current one works on paper.
  - **`lossless-slides-site` is the mechanics reference:**
    - `tokens.css`, `globals.css`, `prose.css`
    - `scripts/mode-switcher.ts`
    - `components/basics/{ModeToggle,BaseHead}.astro`
    - `layouts/BaseLayout.astro`

    Rename `data-theme` to `data-mode` when copying.
  - **The toolkit's light block** (`theme.css:90-116`) is the best starting
    palette for paper: catskill-paper, catskill-card, catskill-line and
    slate-ink.
- 2026-10-06, decisions and docs:
  - Michael decided: a serif body in light and dark; dark grounds derive from
    the gradient; every site defaults to vibrant; the surfaces move to
    `clients.` / `changelog.` / `toolkit.lossless.group`.
  - Poppins and Krub are found. Both are OFL-1.1, available as
    `@fontsource/poppins` 5.3.0 and `@fontsource/krub` 5.3.0, and on Google
    Fonts.
  - The stale docs are corrected: the blueprint, the Quickstart, the
    astro-knots `CLAUDE.md` and the `theme-system` skill now point to
    lossless-toolkit-site, the astro-knots splash, lossless-slides-site
    (Tailwind v4) and fullstack-vc `theme.css:162-211` as the mode references.
    Hypernova is marked two-mode, and the false "before first paint" claim is
    fixed.

## Tentative direction

**Option B.** Implement it first in `client-portals-site`:

- the default mode is **vibrant**, as on every Lossless site;
- light and dark are designed here as serif reading modes, and dark's ground
  derives from the gradient;
- the toggle is visible on every portal page, and the mode cookie is shared
  across `*.lossless.group`.

When the portal's `/brand-kit` shows all three modes holding up on real
recommendation and memo pages, port them, in order of the subdomain moves
(`clients.`, then `changelog.` and `toolkit.lossless.group`), to the changelog (revisiting its
dark-only decision), the toolkit (renaming `--clr-*` to `--color-*` and adding
the gradient), and the slides site (moving to `data-mode` and putting the
gradient back into light as an identity element).

**What would change our mind:**

- light mode reads as "a different brand" in side-by-side review, even with
  the gradient and deep cyan → fall back to Option C for the house sites only;
- deep cyan links feel muddy next to the gradient's `#22A6B5` stop → move light
  links to purple, the toolkit's choice, and keep cyan for non-text identity.

## Open questions

- **Which serif:** Newsreader, the slides site's choice, or another pairing?
  Pick one face for both reading modes so they read as one family.
- **Vibrant typography:** keep Bodoni Moda / Figtree, which the changelog and
  toolkit use, or finally render the old site's intended Poppins / Krub? Both
  are now available via Fontsource.
- **Wash dials:** the starting percentages above are guesses. Tune them in
  `/brand-kit`, and record the values in Findings.
- **Distribution:** at what point does the copied `theme.css` become
  `@lossless-group/brand-tokens`? The shared mode cookie is an argument for
  doing it sooner, since four sites must agree on the cookie name and the
  pre-paint script.
- **Shared header:** across the subdomains, does a header link back to
  lossless.group and across to its siblings? That would make the family
  legible.

## Outcome

(When it ends: a link to the spec or blueprint it produced. Likely candidates
are a `Lossless-Brand-Modes` section in `DESIGN.md` and an update to
`theme-system`.)

## Related

- [[Build-a-Client-Portals-Site]]: the first implementation
- `astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md`: the firm contract (some references stale)
- `astro-knots/context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md`
- `sites/lossless-changelog/context-v/specs/Extract-the-Lossless-Brand-Layer-from-lossless-site.md` and its `DESIGN.md`
- `sites/lossless-slides-site/changelog/2026-09-15_01.md`: three-mode lessons
- `sites/lossless-toolkit-site/src/styles/theme.css`: a designed light palette
- `context-v/agent-skills/theme-system/SKILL.md`, `maintain-splash-pages/SKILL.md`

[^8ahjcu]: [[Implement-Three-Mode-Theme-System-for-Lossless-Brand-Site-Decouplings]]
