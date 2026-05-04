---
title: "Fetch Brand and Tokens from Client Site"
lede: "Extract colors, fonts, and design tokens from a client's existing website to bootstrap theme.css with brand-aligned values. Uses curl/fetch to grab CSS and design assets."
date_authored_initial_draft: 2026-05-04
date_authored_current_draft: 2026-05-04
date_authored_final_draft: "[]"
date_first_published: "[]"
date_last_updated: "[]"
at_semantic_version: 0.1.0.0
augmented_with: Pi on Claude Sonnet 4.5
category: Prompts
tags: [Theme, Tokens, Brand, Client, Fetch, CSS]
authors:
  - Michael Staton
---

# Fetch Brand and Tokens from Client Site

## Purpose

When setting up an Astro Knots site for a client, we want the initial theme to feel close to their existing brand. Rather than guesswork, we can **fetch their site's CSS and design assets** to extract colors, fonts, logos, and other design tokens.

**This is a starting point, not strict rules.** We're giving the client something familiar while building in our three-mode architecture (light/dark/vibrant). The extracted tokens inform the light mode; we'll improvise complementary dark and vibrant variants.

**Current use case:** `reach-edu-hub` → fetch from `https://reach.edu/`

## When to Use This

- **Initial setup** of a new client site (after Phase 1-5 of setup, before finalizing Phase 6 tokens)
- Client has an existing website with identifiable brand colors/fonts
- You want to bootstrap `theme.css` with brand-aligned values instead of generic placeholders

**When NOT to use this:**
- Client is rebranding (rare) — developer will specify new brand or ignore fetch
- Client site is inaccessible (behind auth, broken, or nonexistent)
- Developer explicitly says "use generic tokens for now"

## Technical Approach

### Step 1: Fetch the Client's Homepage

Use `bash` tool with `curl` to grab the HTML and inline styles:

```bash
curl -L -A "Mozilla/5.0" https://reach.edu/ > /tmp/client-site.html
```

Flags:
- `-L` follows redirects
- `-A "Mozilla/5.0"` sets user agent (some sites block curl default)

### Step 2: Extract Linked CSS Files

Parse the HTML for `<link rel="stylesheet">` tags and fetch those CSS files:

```bash
# Example: if HTML contains <link href="/wp-content/themes/reach/style.css">
curl -L https://reach.edu/wp-content/themes/reach/style.css > /tmp/client-styles.css
```

**Heuristic:** Look for theme-specific CSS files, not CDN links (Bootstrap, Tailwind CDN, etc.). Focus on files hosted on the client's domain.

### Step 3: Parse CSS for Design Tokens

**Look for:**

1. **CSS Custom Properties** (most valuable if they exist)
   ```css
   :root {
     --primary-color: #2563eb;
     --heading-font: 'Lato', sans-serif;
   }
   ```

2. **Repeated color values** (if no CSS vars)
   - Hex codes appearing frequently (e.g., `#2563eb` appears 15+ times)
   - RGB values used for brand colors

3. **Font families**
   - `font-family:` declarations in headers, body
   - Look for `@font-face` or Google Fonts imports

4. **Spacing/sizing patterns** (optional, lower priority)
   - Common padding values, border-radius patterns

**Tool:** Use `bash` with `grep`, `sed`, or parse in-memory:

```bash
# Extract hex colors
grep -oE '#[0-9a-fA-F]{6}' /tmp/client-styles.css | sort | uniq -c | sort -rn | head -10

# Extract CSS custom properties
grep -E '^\s*--[a-z-]+:' /tmp/client-styles.css

# Extract font-family declarations
grep -i 'font-family:' /tmp/client-styles.css | head -10
```

### Step 4: Fetch Design Assets (Logos, Favicons)

**Look for in HTML:**
- `<link rel="icon">` or `<link rel="shortcut icon">` (favicon)
- `<img>` tags in header/nav (likely logo)
- Open Graph images: `<meta property="og:image">`

**Fetch examples:**
```bash
# Favicon
curl -L https://reach.edu/favicon.ico > public/reach-favicon.ico

# Logo (if found in HTML, e.g., <img src="/assets/logo.png">)
curl -L https://reach.edu/assets/logo.png > public/reach-logo.png
```

**Note:** You may find both light and dark logo variants. Look for filenames like `logo-light.png`, `logo-dark.svg`, or images in different sections of the site.

### Step 5: Analyze and Summarize

Present extracted tokens to the user for confirmation:

**Example summary format:**

```
Fetched from https://reach.edu/

Primary colors (by frequency):
- #2563eb (appears 47 times) → likely primary blue
- #1e3a8a (appears 23 times) → likely darker blue
- #f8fafc (appears 18 times) → likely light background

Fonts:
- Headings: 'Lato', sans-serif
- Body: 'Open Sans', system-ui, sans-serif

Assets found:
- Favicon: /favicon.ico
- Logo: /wp-content/uploads/2023/reach-logo.svg

Recommendation:
- Use #2563eb as --color__primary-blue (named token)
- Use Lato for headings, Open Sans for body
- Fetch logo for light mode, we'll need a dark variant (or invert)

Proceed with these tokens?
```

## Inserting Tokens into theme.css

Once tokens are confirmed, update the site's `src/styles/global.css` or `theme.css`:

### Update Named Tokens (Tier 1)

Replace placeholder values:

```css
:root {
  /* BEFORE (placeholder) */
  --color__blue-azure: #2563eb;
  
  /* AFTER (client brand) */
  --color__primary-blue: #2563eb;   /* from reach.edu */
  --color__dark-blue: #1e3a8a;      /* from reach.edu */
  --color__light-surface: #f8fafc;  /* from reach.edu */
  
  /* Fonts */
  --font__lato: 'Lato', sans-serif;
  --font__open-sans: 'Open Sans', system-ui, sans-serif;
}
```

### Wire Semantic Tokens (Tier 2)

Map client colors to semantic roles:

```css
.theme-default {
  --color-primary: var(--color__primary-blue);
  --color-primary-700: var(--color__dark-blue);
  --font-heading: var(--font__lato);
  --font-body: var(--font__open-sans);
}
```

### Define Light Mode with Client Colors

```css
[data-mode="light"] {
  --color-background: #ffffff;
  --color-surface: var(--color__light-surface);  /* client's light gray */
  --color-text: #1a1a1a;
  --color-border: #e5e7eb;
  --color-primary: var(--color__primary-blue);   /* client's brand blue */
}
```

### Improvise Dark Mode

Use the client's colors as reference, but adapt for dark background:

```css
[data-mode="dark"] {
  --color-background: #0a0a0a;
  --color-surface: #1a1a1a;
  --color-text: #f8fafc;  /* client's light surface becomes text */
  --color-border: #2a2a2a;
  --color-primary: var(--color__primary-blue);  /* keep client blue, works on dark */
}
```

### Improvise Vibrant Mode

Use client's primary as base, make it louder:

```css
[data-mode="vibrant"] {
  --color-background: #000000;
  --color-surface: color-mix(in srgb, var(--color__dark-blue) 20%, #0a0a0a);
  --color-text: #ffffff;
  --color-border: var(--color__primary-blue);  /* neon border */
  --fx-headline-gradient: linear-gradient(
    120deg,
    var(--color__primary-blue) 0%,
    #06b6d4 50%,      /* improvised cyan complement */
    var(--color__dark-blue) 100%
  );
}
```

## Tool Call Sequence (Example)

### Fetch Homepage

```bash
curl -L -A "Mozilla/5.0" https://reach.edu/ -o /tmp/reach-home.html
```

### Examine HTML for CSS Links

```bash
grep '<link.*stylesheet' /tmp/reach-home.html | head -10
```

Output might show:
```html
<link rel="stylesheet" href="/wp-content/themes/reach/dist/styles/main.css">
```

### Fetch Primary Stylesheet

```bash
curl -L https://reach.edu/wp-content/themes/reach/dist/styles/main.css -o /tmp/reach-main.css
```

### Extract Colors

```bash
grep -oE '#[0-9a-fA-F]{6}' /tmp/reach-main.css | sort | uniq -c | sort -rn | head -10
```

Output:
```
     47 #2563eb
     23 #1e3a8a
     18 #f8fafc
     12 #e5e7eb
     ...
```

### Extract Fonts

```bash
grep -i 'font-family:' /tmp/reach-main.css | grep -oE "'[^']+'" | sort | uniq -c | sort -rn | head -5
```

Output:
```
     12 'Lato'
      8 'Open Sans'
      3 'Roboto'
```

### Check for CSS Variables

```bash
grep -E '^\s*--[a-z-]+:' /tmp/reach-main.css | head -20
```

If CSS variables exist, extract them directly. If not, use the frequency analysis above.

### Fetch Logo

```bash
grep -i '<img.*logo' /tmp/reach-home.html
```

Might show:
```html
<img src="/wp-content/uploads/2023/04/reach-logo.svg" alt="Reach University">
```

Fetch:
```bash
curl -L https://reach.edu/wp-content/uploads/2023/04/reach-logo.svg -o public/reach-logo.svg
```

## Caveats and Limitations

### 1. Most Clients Don't Have Modes

The client's site likely only has one "mode" (usually light). We're extracting that, then **improvising** dark and vibrant variants that feel cohesive with their brand.

**Improvisation guidelines:**
- Keep the client's primary color across all modes
- Invert surface/text for dark mode
- Make vibrant mode "louder" — higher saturation, neon accents, multi-color gradients

### 2. CSS Obfuscation

Some sites use minified CSS with obfuscated class names or inline critical CSS only. In those cases:

- Inspect the **rendered page** via browser devtools (manual step)
- Look for inline `<style>` tags in the HTML
- Check for CSS-in-JS (less common, harder to extract)

### 3. Font Licensing

**Fetching fonts from the client's site may violate licensing.** Instead:

- **Note the font family name** (e.g., "Lato")
- **Install from a legitimate source** (Google Fonts, Adobe Fonts, or purchase license)
- Do NOT download `.woff2` files directly from the client's site unless you have permission

### 4. Logo Usage Rights

**Assumption:** We have permission to use the client's logo (we're building their site). If not explicitly discussed, confirm with the client before using their assets.

### 5. Starting Point, Not Gospel

These tokens are **suggestive**, not strict. If the designer or developer says "actually let's use a different blue," do that. The fetch is about speed-to-familiarity, not lock-in.

## After Fetching: Verify in Brand Kit

Once tokens are inserted, visit `/brand-kit` and toggle through modes to verify:

- Light mode uses client's colors
- Dark mode feels cohesive (not jarring)
- Vibrant mode is visibly distinct (neon, loud, glassmorphic)

Update the Brand Kit page to show:
- Client logo (with mode-aware swap if you have light/dark variants)
- Named tokens with their source ("from reach.edu")
- Semantic tokens wired to those named tokens

## Example: Complete Flow for reach-edu-hub

```bash
# 1. Fetch homepage
curl -L -A "Mozilla/5.0" https://reach.edu/ -o /tmp/reach-home.html

# 2. Extract CSS link
grep 'stylesheet' /tmp/reach-home.html | grep -oE 'href="[^"]+\.css"' | head -1
# Output: href="/wp-content/themes/reach/style.css"

# 3. Fetch CSS
curl -L https://reach.edu/wp-content/themes/reach/style.css -o /tmp/reach-style.css

# 4. Extract top colors
grep -oE '#[0-9a-fA-F]{6}' /tmp/reach-style.css | sort | uniq -c | sort -rn | head -5
# Output:
#   52 #003366  (dark blue)
#   38 #0066cc  (bright blue)
#   21 #f4f4f4  (light gray)

# 5. Extract fonts
grep -i 'font-family:' /tmp/reach-style.css | grep -oE "'[^']+'" | sort | uniq
# Output: 'Merriweather', 'Open Sans'

# 6. Fetch logo
grep -i '<img.*logo' /tmp/reach-home.html | grep -oE 'src="[^"]+"'
# Output: src="/assets/images/reach-logo.png"

curl -L https://reach.edu/assets/images/reach-logo.png -o public/reach-logo.png

# 7. Summarize for user
echo "Found:
- Primary: #003366 (dark blue, 52 occurrences)
- Secondary: #0066cc (bright blue, 38 occurrences)
- Surface: #f4f4f4 (light gray)
- Headings: Merriweather
- Body: Open Sans
- Logo: /assets/images/reach-logo.png

Proceed with these tokens?"
```

User confirms, then update `sites/reach-edu-hub/src/styles/global.css`:

```css
:root {
  /* Named tokens from reach.edu */
  --color__reach-navy: #003366;
  --color__reach-blue: #0066cc;
  --color__reach-light-gray: #f4f4f4;
  --font__merriweather: 'Merriweather', serif;
  --font__open-sans: 'Open Sans', sans-serif;
}

.theme-default {
  --color-primary: var(--color__reach-navy);
  --color-secondary: var(--color__reach-blue);
  --font-heading: var(--font__merriweather);
  --font-body: var(--font__open-sans);
}

[data-mode="light"] {
  --color-background: #ffffff;
  --color-surface: var(--color__reach-light-gray);
  --color-text: var(--color__reach-navy);
  --color-primary: var(--color__reach-blue);
}

[data-mode="dark"] {
  --color-background: #0a0a0a;
  --color-surface: #1a1a1a;
  --color-text: #f4f4f4;
  --color-primary: var(--color__reach-blue);  /* bright blue works on dark */
}

[data-mode="vibrant"] {
  --color-background: #000000;
  --color-surface: color-mix(in srgb, var(--color__reach-navy) 30%, #000000);
  --color-text: #ffffff;
  --color-border: var(--color__reach-blue);
  --fx-headline-gradient: linear-gradient(120deg, var(--color__reach-blue) 0%, #06b6d4 50%, var(--color__reach-navy) 100%);
}
```

Commit with message:
```
feat(theme): Bootstrap tokens from reach.edu brand

Fetched colors, fonts, and logo from https://reach.edu/ to align initial
theme with client's existing brand.

Named tokens extracted:
- --color__reach-navy: #003366 (52 occurrences)
- --color__reach-blue: #0066cc (38 occurrences)
- --color__reach-light-gray: #f4f4f4
- --font__merriweather: Merriweather (headings)
- --font__open-sans: Open Sans (body)

Light mode uses client colors directly. Dark and vibrant modes improvised
to feel cohesive with brand.

Assets fetched:
- public/reach-logo.png

Files changed:
- src/styles/global.css
- public/reach-logo.png
```

## Cross-References

- **New Site Quickstart Guide** (`New-Site-Quickstart-Guide.md`) — Phase 6 mentions brand fetch step
- **Theme System Skill** (`~/.pi/agent/skills/theme-system/`) — two-tier token architecture
- **Astro Knots playbook** (`astro-knots/references/playbooks/new-site-setup.md` §8) — theme/brand decisions

## Future Enhancements

**Potential improvements to this prompt (TBD):**

- Automated parsing script (`scripts/fetch-brand-tokens.sh`) that does all steps
- AI-assisted color palette generation (complementary colors for dark/vibrant modes)
- Logo format conversion (SVG → PNG, PNG → optimized WebP)
- Font weight detection (is body 400 or 300? are headings 700 or 600?)
- Accessibility contrast checking (does extracted palette meet WCAG AA?)

For now, manual fetch + analysis + insertion is fast enough.
