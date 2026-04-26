---
title: Choosing an Image Generator for Text-on-Background Banners
lede: A snapshot of the AI image-generation landscape as of April 2026, focused on the specific job of producing release-banner-style images with legible title text and brand-consistent visual style — the kind of asset Anthropic, Windsurf, Linear, and Vercel attach to changelog entries and release announcements.
date_authored_initial_draft: "2026-04-25"
date_authored_current_draft: "2026-04-26"
date_created: "2026-04-25"
date_modified: "2026-04-26"
at_semantic_version: "0.0.0.3"
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Explorations
tags: [Image-Generation, AI-APIs, Banner-Design, Brand-Consistency, Changelog-Banners, Ideogram, OpenAI-Image, Flux, Tooling-Decisions, Theme-Tokens, Single-Source-of-Truth, Build-Time-Tooling]
authors:
  - Michael Staton
  - AI Labs Team
---

# Choosing an Image Generator for Text-on-Background Banners

## The Problem This Document Solves

Companies like Anthropic, Windsurf, Linear, and Vercel attach a custom banner image to each release announcement and changelog entry. Each banner is unique, but they all share a recognizable brand feel. The question this document answers: **what's actually under the hood for that, and which tool should we use for FullStack VC's release banners specifically?**

This was originally a small question — "can the OpenAI image API put text on banners?" — and the honest answer required a quick tour of how the landscape changed in 2025–2026. Both the *technique* of getting brand-consistent output and the *tools* that can render legible text inside an image have shifted significantly. Documenting it before the details fade.

---

## What Changed

Anyone who tried image generation between 2022 and mid-2025 carries one strong memory: **diffusion models could not do text**. DALL-E 2/3, the original Midjourney, the original Stable Diffusion — all produced jumbled letterforms when asked for a word in an image. This was the universal experience and the universal joke.

Two things changed:

1. **OpenAI shipped `gpt-image-1` (April 2025), then `gpt-image-1.5` (December 2025), then `gpt-image-2` / "Images 2.0" (April 2026).** Each release improved text rendering substantially. By 1.5, captions were reliably legible. By 2.0, banner-shaped 3:1 outputs with embedded titles became practical.
2. **Ideogram entered the market with text rendering as its primary focus.** Ideogram 3.0 is now the best-in-class for legible typography in generated images — independent benchmarks rate it 90–95% accurate for text inside an image, with explicit understanding of font families, kerning, and alignment.

Other models (Flux 2 Pro, Recraft V3, Imagen 4, Seedream) also handle text adequately now, but Ideogram and gpt-image-2 are the two that matter for the banner use case.

---

## Brand Consistency Is a Technique, Not a Feature

The "brand-consistent" feel that a Linear or Windsurf changelog has is **not something you get from picking the right model**. It's produced by one of three techniques applied on top of whatever model you use:

### 1. Style-reference conditioning
Pass a "style anchor" image with every generation. The model is told to match its colors, composition, and finish to that reference. **OpenAI's `gpt-image-2`** supports this via the edit/variations endpoint with a reference image. **Flux** supports it via its `image_prompt` parameter on Replicate / fal.ai. Best when you have one or two reference images you want every output to echo.

### 2. Custom LoRA fine-tune
Train a small (~$3–5 on Replicate) fine-tune of Flux against 10–20 brand reference images. After training, every generation that uses your LoRA "looks like you" — your color palette, your composition language, your texture. **This is what Windsurf, most YC company changelogs, and Linear's release banners are doing.** Highest fidelity, requires the upfront training step, locks you into the Flux ecosystem.

### 3. Locked prompt template
The simplest. A prompt skeleton with a fixed style description and only the subject varying:

```
{subject}, isometric vector illustration, color palette:
violet #7c5cff, lime #b6ff5c, obsidian #0b0d12,
soft gradients, no text, cinematic composition, 16:9 banner
```

Only `{subject}` changes per release. Works surprisingly well for Astro Knots–scale projects. Doesn't require a training step. Easy to iterate on. The downside is that drift between generations is real — even with an identical style block, two adjacent generations will differ in noticeable ways.

### Anthropic's Approach (For Reference)

The geometric pastel illustrations on the Claude blog are **not generated**. They are hand-illustrated by Anthropic's design team in Figma/Procreate, one per post. If the goal is to match that exact aesthetic, no API will produce it consistently — the path would be either (a) hire an illustrator on retainer, or (b) train a Flux LoRA on your *own* style developed initially with a human illustrator. The "Anthropic look" cannot currently be cloned via API alone.

---

## Tool Landscape (April 2026)

| Tool | Best at | Weak at | Pricing per image |
|---|---|---|---|
| **Ideogram 3.0** | Legible typography in image, banners with title text, posters, logos | Free-form illustration variety | $0.03 (Turbo) / **$0.09 (Quality)** |
| **OpenAI `gpt-image-2`** | Instruction following, edits, mixed text+illustration, native 3:1 aspect ratios | Style consistency without LoRA-equivalent | ~$0.04 |
| **Flux 2 Pro** (Replicate / fal.ai) | Style consistency via custom LoRA, raw aesthetic quality, photorealism | Text in image (second to Ideogram) | ~$0.04 + LoRA training $3–5 once |
| **Midjourney v7** | Raw aesthetic quality, illustration polish | API access (must use Discord or third-party scrapers; no first-party REST API) | Subscription only ($10/mo+) |
| **Recraft V3** | Built-in style preset controls, vector outputs | Slightly more generic outputs | ~$0.04 |
| **Imagen 4** (Google) | Photorealism, factual accuracy | Brand consistency tooling lags competitors | ~$0.04 |

**For the specific job of "banner with the release title visibly embedded":** Ideogram 3.0 wins on text accuracy. For "brand-consistent illustration without text": Flux + LoRA wins. For "general-purpose, one vendor, decent at both": gpt-image-2 wins.

---

## Recommendation for FullStack VC

**Lead with Ideogram 3.0 Quality tier ($0.09/image).** Reasons specific to this site:

1. Release banners for the Agentic VC Dojo will likely want the session title (or "Dojo · 2026-05") visibly embedded. That's Ideogram's home turf.
2. Single banner per monthly session = ~12 banners/year × $0.09 = ~$1/year. Cost is irrelevant.
3. Ideogram supports the 3:1 aspect ratio natively.
4. Setup is fast — separate vendor, separate key, but the API is straightforward.

**Fallback to gpt-image-2** if you want one-vendor consolidation under your existing OpenAI account. Slightly worse text rendering but workable, and you avoid a second billing relationship.

**Consider Flux + brand LoRA later** once FullStack VC has 10–15 banners that establish a coherent visual language. At that point you can train a LoRA on those banners as seed data and use it for all subsequent generation.

---

## Setup Notes for Ideogram

**Where:** [ideogram.ai/manage-api](https://ideogram.ai/manage-api)

**Account:**
- Sign in (Google or email)
- "Create API key" — payment info required up front, no charge until first key is created
- Key is shown **once** — copy and store in a password manager immediately. Cannot be retrieved later, only revoked and regenerated.

**Billing:**
- Auto top-up: minimum balance $10, top-up to $20 by default. Both adjustable.
- Quality tier: $0.09/image
- Turbo tier: $0.03/image (fast, lower fidelity — fine for drafts)
- Character-reference calls bill at a different rate (slightly higher).

**API basics:** see the full [API Reference (Ideogram v3)](#api-reference-ideogram-v3) section below for endpoints, parameters, and code snippets. The short version: REST, multipart/form-data, `Api-Key` header, returns ephemeral image URLs that you must download immediately.

**Docs:** [developer.ideogram.ai](https://developer.ideogram.ai/ideogram-api/api-setup)

---

## API Reference (Ideogram v3)

The Ideogram v3 API surfaces several endpoints; for our banner-generation workflow the two that matter are **Generate** (create an image from a prompt) and **Layerize Text** (strip text from an image so we can composite our own crisp typography over it). All v3 endpoints share auth, content-type, and the ephemeral-URL contract below.

### Universal contract

| | |
|---|---|
| **Base URL** | `https://api.ideogram.ai` |
| **Auth header** | `Api-Key: <YOUR_KEY>` |
| **Content type** | `multipart/form-data` for all v3 generate-family endpoints |
| **Image URLs in responses** | **Ephemeral** — download immediately and persist locally. Ideogram does not guarantee long-term hosting. |
| **Errors** | 400 invalid input · 401 unauthorized · 422 prompt failed safety check · 429 rate-limited |

> **Important parameter-name change vs older docs.** The v3 endpoint uses `magic_prompt` (with values `AUTO` / `ON` / `OFF`), not the older v2 name `magic_prompt_option`. URLs also moved under `/v1/ideogram-v3/*`. If you see the old names in a snippet anywhere, it predates v3.

---

### Endpoint 1 — Generate (`POST /v1/ideogram-v3/generate`)

Create a new image from a text prompt. This is the workhorse for banner generation.

**Full URL:** `https://api.ideogram.ai/v1/ideogram-v3/generate`

#### Required parameters

| Parameter | Type | Notes |
|---|---|---|
| `prompt` | string | The text prompt. Wrap with your brand-consistency style template before sending. |

#### Optional parameters (the ones worth knowing)

| Parameter | Type | Default | Allowed values / notes |
|---|---|---|---|
| `aspect_ratio` | string | `1x1` | `1x3`, `3x1`, `1x2`, `2x1`, `9x16`, `16x9`, `10x16`, `16x10`, `2x3`, `3x2`, `3x4`, `4x3`, `4x5`, `5x4`, `1x1`. **Use `3x1` for changelog banners.** |
| `resolution` | string | — | 70+ explicit pixel dimensions (e.g. `1536x512`). Mutually exclusive with `aspect_ratio` — pick one. |
| `rendering_speed` | string | `DEFAULT` | `FLASH`, `TURBO`, `DEFAULT`, `QUALITY`. **Use `QUALITY` ($0.09) for production banners; `TURBO` ($0.03) for drafts.** |
| `style_type` | string | `GENERAL` | `AUTO`, `GENERAL`, `REALISTIC`, `DESIGN`, `FICTION`. **`DESIGN` is the right pick for branded illustration.** |
| `style_preset` | string | — | One of 50+ named presets (e.g. `80S_ILLUSTRATION`, `WOODBLOCK_PRINT`). Mutually exclusive with `style_codes` and `style_reference_images`. |
| `style_codes` | array | — | 8-character hex codes that pin a specific visual style. Mutually exclusive with `style_type` and `style_reference_images`. |
| `style_reference_images` | binary[] | — | Up to 10MB total across JPEG/PNG/WebP files. **This is the "match this look" lever** — pass 1–3 brand seed images. |
| `character_reference_images` | binary[] | — | Currently 1 image max. Special pricing tier (more expensive). |
| `color_palette` | object | — | Either `{name: <preset>}` or `{members: [{color_hex, color_weight}]}`. Useful but the prompt is usually clearer. |
| `magic_prompt` | string | — | `AUTO`, `ON`, `OFF`. Lets Ideogram rewrite your prompt for better results. **Default to `OFF` for branded work** — predictable beats clever. |
| `negative_prompt` | string | — | What to avoid. Prompt takes precedence on conflicts. |
| `num_images` | integer | `1` | Bumps cost linearly. |
| `seed` | integer | — | For reproducible generations. **Useful when iterating on a prompt** — fix the seed, vary the prompt, see what each word changes. |
| `custom_model_uri` | string | — | Format `model/<name>/version/<version>`. For pointing at a custom-trained model (LoRA-equivalent). |

#### Response

```json
{
  "created": "2026-04-25T20:14:33Z",
  "data": [
    {
      "url": "https://ideogram-prod.s3.amazonaws.com/...",
      "prompt": "the (possibly magic-rewritten) prompt that was used",
      "resolution": "1536x512",
      "upscaled_resolution": "1536x512",
      "is_image_safe": true,
      "seed": 1234567890,
      "style_type": "DESIGN"
    }
  ]
}
```

The `url` is **ephemeral** — fetch it and save locally before it expires.

#### curl example

```bash
curl -X POST https://api.ideogram.ai/v1/ideogram-v3/generate \
  -H "Api-Key: $IDEOGRAM_API_KEY" \
  -F "prompt=Isometric vector illustration of stacked code editors with violet glow, no text, cinematic 3:1 banner" \
  -F "aspect_ratio=3x1" \
  -F "rendering_speed=QUALITY" \
  -F "style_type=DESIGN" \
  -F "magic_prompt=OFF"
```

#### TypeScript example (Node 22 native, zero deps)

```ts
async function generate(prompt: string, key: string): Promise<Buffer> {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('aspect_ratio', '3x1');
  form.append('rendering_speed', 'QUALITY');
  form.append('style_type', 'DESIGN');
  form.append('magic_prompt', 'OFF');

  const res = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: { 'Api-Key': key },
    body: form,
  });
  if (!res.ok) throw new Error(`Generate ${res.status}: ${await res.text()}`);

  const json = await res.json() as {
    data: Array<{ url: string; seed: number; is_image_safe: boolean }>;
  };
  const url = json.data[0]?.url;
  if (!url) throw new Error('No image URL returned');

  const img = await fetch(url);
  return Buffer.from(await img.arrayBuffer());
}
```

---

### Endpoint 2 — Layerize Text (`POST /v1/ideogram-v3/layerize-text`)

Take an existing image and return a version with **all detected text removed**. Detection is automatic — you don't need to specify where the text is.

**Full URL:** `https://api.ideogram.ai/v1/ideogram-v3/layerize-text`

**Why this matters for our use case:** even with `magic_prompt=OFF` and a "no text" instruction in the prompt, Ideogram occasionally bakes incidental letterforms into a generated image (a sign, a label, a screen showing UI). Layerize gives a clean base. More fundamentally, it unlocks a **better authoring pattern**: generate the *visual layer* via Ideogram, render the *text layer* via Astro/CSS in our own brand fonts. Title text becomes:

- Pixel-perfect (HTML/CSS/SVG, not pixels)
- Brand-correct (uses our actual `--font-display` / `--font-code` tokens)
- Edit-without-regen (changing a release title is a `.md` frontmatter update, not an API call)
- Mode-aware (text color shifts with light/dark/vibrant via the `--color-text` token)
- Accessible (real text, indexable, screen-reader-friendly, copy-pasteable)

#### Required parameters

| Parameter | Type | Notes |
|---|---|---|
| `image` | binary | JPEG / PNG / WebP, max 10MB. The image to strip text from. |

#### Optional parameters

| Parameter | Type | Notes |
|---|---|---|
| `prompt` | string | Text description of the image. Auto-generated if omitted — only set this if auto-description is producing poor results. |
| `seed` | integer | For reproducible generations. |

#### Response

```json
{
  "base_image_url": "https://ideogram-prod.s3.amazonaws.com/.../base.png",
  "original_image_url": "https://ideogram-prod.s3.amazonaws.com/.../original.png",
  "seed": 1234567890
}
```

`base_image_url` is the text-stripped version. `original_image_url` is the input echoed back (may be `null`). Both are **ephemeral** — same download-immediately rule.

#### curl example

```bash
curl -X POST https://api.ideogram.ai/v1/ideogram-v3/layerize-text \
  -H "Api-Key: $IDEOGRAM_API_KEY" \
  -F "image=@./generated-banner.png"
```

#### TypeScript example

```ts
import { readFileSync } from 'node:fs';

async function layerizeText(imagePath: string, key: string): Promise<Buffer> {
  const form = new FormData();
  const file = new Blob([readFileSync(imagePath)], { type: 'image/png' });
  form.append('image', file, 'input.png');

  const res = await fetch('https://api.ideogram.ai/v1/ideogram-v3/layerize-text', {
    method: 'POST',
    headers: { 'Api-Key': key },
    body: form,
  });
  if (!res.ok) throw new Error(`Layerize ${res.status}: ${await res.text()}`);

  const json = await res.json() as { base_image_url: string };
  const img = await fetch(json.base_image_url);
  return Buffer.from(await img.arrayBuffer());
}
```

---

### The Generate → Layerize → Overlay Pattern

This is the recommended pipeline for changelog banners on Astro Knots sites:

```
┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ Frontmatter  │    │ Build script     │    │ Public asset       │
│ image_prompt │───▶│ 1. Generate      │───▶│ {slug}__base.webp  │
│ image_text   │    │ 2. Layerize text │    │ (no text)          │
└──────────────┘    │ 3. Save base PNG │    └─────────┬──────────┘
                    └──────────────────┘              │
                                                      ▼
                                          ┌──────────────────────┐
                                          │ Astro page renders   │
                                          │ banner with image as │
                                          │ background +         │
                                          │ image_text as crisp  │
                                          │ HTML overlay         │
                                          └──────────────────────┘
```

**Cost per banner:** $0.09 (Generate at QUALITY) + Layerize cost (not published; assume comparable). Budget ~$0.12–0.18 per release banner. At one banner/week that's ~$8/year.

**When to skip Layerize:** if Ideogram's first generation comes back genuinely text-free (you can spot-check in dev), the second call is unnecessary. The script can be made conditional later — for now, run both unconditionally for predictability.

---

### Error handling and rate limits

- **400** — usually a malformed parameter. Log the response body verbatim; Ideogram's error messages are specific.
- **401** — wrong or missing `Api-Key` header.
- **422** — the prompt failed Ideogram's safety check. Rephrase. (Unlikely for branded illustration but possible if a release name is ambiguous.)
- **429** — rate limited. Ideogram doesn't publish exact rate limits; back off with exponential delay (1s, 2s, 4s, 8s) and retry up to 3 times.
- **Image fetch failure** — the ephemeral URL has already expired. Re-call the generate endpoint; cheaper than building a retry queue.

A minimal retry wrapper:

```ts
async function withRetry<T>(fn: () => Promise<T>, max = 3): Promise<T> {
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = (err as Error).message.includes('429');
      if (attempt === max - 1 || !isRateLimit) throw err;
      const delayMs = 1000 * Math.pow(2, attempt);
      console.warn(`Rate limited, waiting ${delayMs}ms before retry ${attempt + 2}/${max}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('unreachable');
}
```

---

### Useful endpoint URLs

| Purpose | URL |
|---|---|
| API setup / get a key | [ideogram.ai/manage-api](https://ideogram.ai/manage-api) |
| Pricing | [ideogram.ai/features/api-pricing](https://ideogram.ai/features/api-pricing) |
| Developer docs index | [developer.ideogram.ai/api-reference](https://developer.ideogram.ai/api-reference) |
| Generate v3 endpoint docs | [developer.ideogram.ai/api-reference/api-reference/generate-v3](https://developer.ideogram.ai/api-reference/api-reference/generate-v3) |
| Layerize Text v3 endpoint docs | [developer.ideogram.ai/api-reference/api-reference/layerize-text-v3](https://developer.ideogram.ai/api-reference/api-reference/layerize-text-v3) |
| LLM-friendly full docs dump | [developer.ideogram.ai/api-reference/api-reference/layerize-text-v3/llms-full.txt](https://developer.ideogram.ai/api-reference/api-reference/layerize-text-v3/llms-full.txt) |

---

## Pattern: Pulling Brand Tokens Into Build-Time Tooling

The first version of the prompt builder hardcoded the brand palette directly in the script:

```ts
'Color palette: violet #7c5cff (primary), lime #b6ff5c (accent), cyan #5cf2ff (secondary), obsidian #0b0d12 (background), bone #f6f3ec (highlights).'
```

That's two sources of truth — the same hex values appear in `src/styles/theme.css` (where the site UI consumes them) and in the build script (where the AI prompt consumes them). When a designer iterates on the brand, both places have to change in lockstep, and the script silently drifts the moment someone forgets.

The cleaner pattern: **the brand source of truth lives in `theme.css`. Build-time tools read it.** This works because the firm-wide two-tier token convention from [`Maintain-Themes-Mode-Across-CSS-Tailwind.md`](../blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md) §2.1 already isolates raw hex values to **Tier 1 named tokens** with a predictable syntax:

```css
:root {
  --color__violet-electric: #7c5cff;     /* Tier 1 — literal hex, parseable */
  --color__lime-terminal:  #b6ff5c;
  /* ... */
}

.theme-default {
  --color-primary: var(--color__violet-electric);  /* Tier 2 — semantic, opaque to parsers */
}

[data-mode="dark"] {
  --fx-card-shadow: 0 0 0 1px var(--color__graphite-800), ...;  /* Effect — opaque */
}
```

The `--color__name: #hex;` shape is grep-friendly. A 30-line build-time reader extracts every named color into a flat map.

### The reader: `src/lib/theme-tokens.ts`

```ts
import { readFileSync } from 'node:fs';

const DEFAULT_THEME_PATH = new URL('../styles/theme.css', import.meta.url).pathname;

// Anchored to start of line so it doesn't catch hex values inside var() or color-mix() args.
const NAMED_COLOR_RE = /^\s*--color__([a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/gm;

export function readNamedColors(path: string = DEFAULT_THEME_PATH): Record<string, string> {
  const css = readFileSync(path, 'utf8');
  const palette: Record<string, string> = {};
  NAMED_COLOR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NAMED_COLOR_RE.exec(css)) !== null) {
    palette[m[1]] = m[2];
  }
  return palette;
}

export function getNamedColor(palette: Record<string, string>, token: string): string {
  const value = palette[token];
  if (!value) {
    throw new Error(
      `Brand color "${token}" not found in theme.css. Either add it as ` +
      `--color__${token}: #...;  or remove the reference from your prompt palette.`
    );
  }
  return value;
}
```

Two functions. No deps. Reads the file once per script run. **Fail-loud** by design — `getNamedColor` throws if the script references a token that's been renamed or deleted in `theme.css`, so the tooling can't silently drift.

### The script's prompt palette

The script declares which tokens it wants surfaced to the AI and the role label each plays. The hex values are NOT here — they're resolved from `theme.css` at runtime:

```ts
import { readNamedColors, getNamedColor } from '../src/lib/theme-tokens.ts';

const PROMPT_PALETTE: Array<{ token: string; label: string; role: string }> = [
  { token: 'violet-electric', label: 'violet',   role: 'primary'    },
  { token: 'lime-terminal',   label: 'lime',     role: 'accent'     },
  { token: 'cyan-vapor',      label: 'cyan',     role: 'secondary'  },
  { token: 'obsidian',        label: 'obsidian', role: 'background' },
  { token: 'bone',            label: 'bone',     role: 'highlights' },
];

function buildStylePrompt(subject: string, palette: Record<string, string>): string {
  const colorList = PROMPT_PALETTE
    .map(p => `${p.label} ${getNamedColor(palette, p.token)} (${p.role})`)
    .join(', ');
  return [
    subject + '.',
    'Do not include any text, letterforms, words, captions, signs, or labels.',
    'Style: isometric vector illustration, devtools-meets-dojo aesthetic.',
    `Color palette: ${colorList}.`,
    'Soft gradients, subtle glow, cinematic composition, no people, no faces.',
  ].join(' ');
}
```

The script's `main()` loads the palette once per run and passes it down:

```ts
const palette = readNamedColors();
console.log(`Loaded ${Object.keys(palette).length} brand colors from theme.css`);
// ... per entry:
const fullPrompt = buildStylePrompt(fm.image_prompt, palette);
```

### What the AI actually sees

The `Color palette: ...` line is generated at runtime. For FullStack VC right now it produces:

```
Color palette: violet #7c5cff (primary), lime #b6ff5c (accent), cyan #5cf2ff (secondary), obsidian #0b0d12 (background), bone #f6f3ec (highlights).
```

If a designer changes `--color__violet-electric: #7c5cff` to `--color__violet-electric: #9b6cff` in `theme.css`, the very next `pnpm gen:banners` run sends the new value. **Zero script edits. The site UI and the AI-generated banners stay in lockstep automatically.**

### Two-step motion to add a brand color to AI prompts

1. **Add the named token in `theme.css`:**
   ```css
   --color__amber-flare: #ffb84d;
   ```
2. **Add an entry to `PROMPT_PALETTE` in the script:**
   ```ts
   { token: 'amber-flare', label: 'amber', role: 'highlight-accent' },
   ```

That's it. The CSS edit is the source of truth; the script edit declares "this token participates in AI prompts." Forgetting step 2 is fine (the new color just doesn't appear in prompts yet). Forgetting step 1 throws a build error from `getNamedColor` — fail-loud.

### Why this matters beyond banners

`theme-tokens.ts` is a generic build-time reader. **Anything else that needs the brand palette at build time can import the same function:**

- **OG image generation** (Open Graph share previews) — same palette, same fail-loud guarantee.
- **Email template renderers** — transactional emails should match site colors.
- **Social-share auto-generated cards** (Twitter / LinkedIn / Bluesky preview cards).
- **PDF report generators** (the kind of weekly-summary PDF a VC firm might want).
- **Future tooling we haven't thought of** — anything that takes brand colors as input and runs at build time.

Each of these would otherwise re-hardcode the same hex values in its own script. With the reader pattern, they all stay synced through one CSS file.

### Where this pattern fits

This is a small, localized example of the broader principle the Astro Knots two-tier token architecture enables: **CSS is the canonical source of brand truth, even for non-CSS consumers.** The named-token convention (`--color__name: #hex;`) was designed to make Tier 1 values easy to swap during client iteration; making them parseable for build tooling is a happy second-order benefit.

For sites that want to expose this pattern as a shared utility (so other Astro Knots sites don't reinvent it), the natural extraction is `packages/lib/theme-tokens/` — parallel to `packages/ui/theme-mode/`. Premature today; warranted once a second site adopts the pattern.

---

## Suggested Wiring for Astro Knots Sites

Pattern for any Astro-Knots site that wants generated banners on changelog entries:

1. **Frontmatter additions** in each `changelog/*.md`:
   ```yaml
   image_prompt: "Isometric illustration of stacked code editors with violet glow, no text, cinematic"
   image_text: "v0.0.1 — Site Scaffold"   # what should appear inside the banner
   ```
2. **Build script** at `sites/{site}/scripts/generate-changelog-banners.ts`:
   - Walk `changelog/*.md`
   - Read `image_prompt` and `image_text` from frontmatter
   - Hit Ideogram `/generate` with style template + the prompt
   - Save result to `public/changelog/{slug}.webp`
   - **Idempotent:** skip if the output file already exists. Re-runs are cheap and safe.
3. **Env:** `IDEOGRAM_API_KEY` in a gitignored `.env`. Never committed.
4. **Style template** (the "brand consistency" lever): a function in the script that wraps every prompt with the site's visual language. The color palette portion is **dynamically generated from `theme.css`** at runtime via the [`theme-tokens.ts` reader pattern](#pattern-pulling-brand-tokens-into-build-time-tooling) — so brand iterations in CSS automatically propagate into AI prompts without script edits. The non-color stylistic language (illustration aesthetic, "no text" instruction, composition rules) stays as a literal string.
5. **Pages** that render changelog entries pull `/changelog/{slug}.webp` as the hero image.

This keeps the human authoring loop tight: write the changelog, drop in an `image_prompt`, run `pnpm gen:banners`, commit. The build server doesn't need the API key — generated images are committed to `public/`.

---

## Open Questions

- Do we want a **shared style template** across all Astro Knots sites, or per-site visual language? Per-site is more brand-honest; shared is more efficient.
- Should the generation script live **per site** (`sites/*/scripts/`) or as a **shared package** (`packages/changelog-banner-gen/`)? If three sites adopt it, extraction becomes worth it. Today: per-site is fine.
- **Cache invalidation:** if we change the `image_prompt`, the script currently won't re-generate (idempotent on filename). Should we hash the prompt into the filename so prompt edits trigger regeneration? Probably yes — `{slug}__{promptHash}.webp`.
- **Aspect ratios:** is 3:1 right for changelog hero, or do we want square / 16:9 for social-share embeds? Likely both; generate two crops or two prompts per entry.

---

## Sources

- [GPT Image Generation Models Prompting Guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide) — OpenAI
- [GPT Image 2: Complete Guide to OpenAI's Latest Image Model (2026)](https://createvision.ai/guides/gpt-image-2-complete-guide) — createvision
- [ChatGPT Image 2.0 Guide After April 2026 Update](https://phygital.plus/blog/chatgpt-image-2-0-guide-april-2026-update/) — Phygital+
- [Ideogram API Setup | Ideogram Documentation](https://developer.ideogram.ai/ideogram-api/api-setup)
- [Ideogram API Pricing](https://ideogram.ai/features/api-pricing)
- [Ideogram 3: Prompt Adherence, Pricing & API Guide (2026)](https://ucstrategies.com/news/ideogram-3-prompt-adherence-pricing-api-guide-2026/) — UC Strategies
- [Best AI Image Models 2026: 14 Generators Ranked](https://www.teamday.ai/blog/best-ai-image-models-2026) — TeamDay
- [Best AI Image Models 2026: FLUX, GPT Image 2, Seedream, Ideogram, Imagen 4, Recraft Compared](https://melies.co/compare/ai-image-models) — Melies
- [Text to Image AI: 15 Generators Tested and Ranked (2026)](https://nestcontent.com/blog/text-to-image-ai) — NestContent
