---
title: Converge on an Animations Playbook
lede: A short, well-made motion loop can do work that a paragraph and a screenshot can't — but the tooling that produces Lottie files is concentrated in a few mostly proprietary places. This is a tour of the format, the production tools, the honest lock-in, and a tiered playbook for the Astro Knots family.
date_authored_initial_draft: "2026-05-06"
date_authored_current_draft: "2026-05-06"
date_created: "2026-05-06"
date_modified: "2026-05-06"
at_semantic_version: "0.0.0.1"
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Explorations
tags: [Lottie, Animations, Motion-Design, Bodymovin, After-Effects, Lottielab, Rive, SVG, Astro, Svelte, Open-Format, Design-Tooling, Symbolic-Illustration, Astro-Knots]
authors:
  - Michael Staton
  - AI Labs Team
---

# Converge on an Animations Playbook

## The Problem This Document Solves

A short, well-made motion loop can do work that a paragraph and a screenshot together can't. Adopt.ai's homepage is the shape — a two-second stylized lightning bolt that says "fast, agentic, kinetic" without a word of copy. This kind of *symbolic animated illustration* is one of the highest-leverage moves on a landing page, a deck slide, or a product explainer. You don't need ten of them. You need one or two, in the right place, doing real explanatory work.

The catch — and the reason this is an exploration and not a blueprint — is that **producing them is structurally awkward.** Lottie, the format that won, is genuinely open: the spec is published, the players are open-source, and the JSON ships at sane sizes. But the *means of production* is concentrated in a small number of tools, most of them proprietary and most of them paid:

- **After Effects + Bodymovin** — the original path; Adobe-rented at ~$23/mo; requires real motion-design skill.
- **Lottielab, Jitter, SVGator** — newer browser tools; proprietary SaaS; lower skill floor; subscription either way.
- **LottieFiles Creator** — the format-owner's first-party tool; also SaaS.
- **Cavalry** — pro motion design, free tier, exports Lottie; still proprietary.

There is no widely-adopted FOSS tool that takes you from "blank canvas" to "shippable Lottie." Synfig and Blender's Grease Pencil exist; neither has a clean Lottie export path. So the *format* is open, but you cannot stay fully in the open-source stack and still produce Lottie cleanly. **This is a real lock-in we should name out loud.**

The question this doc tries to answer: given that constraint, what is the cheapest, highest-leverage motion-design playbook for the Astro Knots family — and where, honestly, should we escape Lottie entirely?

---

## The Mental Model: Three Sources of Animated Illustration

Most of the disagreements about "which animation tool" are actually disagreements about which of these three sources you're solving for.

### 1. Library-sourced (zero design work)

You go to **LottieFiles** or **Lordicon**, search for the concept ("rocket launch", "AI sparkle", "data sync"), download the `.lottie` or `.json`, embed it. Often free, sometimes paid, often attribution-required. **The 70% solution for most sites.** The asset on adopt.ai is exactly this flavor of generic, decorative loop; it could plausibly be either custom-made or library-sourced and most visitors couldn't tell.

### 2. Designed in a tool, exported to format

You sit down in After Effects, Lottielab, Jitter, SVGator, or Cavalry; design the motion; export to Lottie JSON. The skill investment ranges from *several afternoons* (Lottielab — Figma-like, animation-friendly) to *a serious craft* (After Effects — a small career). **The custom-hero tier; cost is real, output is differentiated.**

### 3. Hand-coded animation

CSS keyframes, SMIL on inline SVG, GSAP timelines, Framer Motion, Svelte's `transition:` directives. **No design file at all.** The motion lives in the source code. This is what most "subtle marketing motion" actually is — fade-up on scroll, hover lifts, gradient drifts. We already do this implicitly across our sites and rarely call it out as "animation."

The mental error is conflating these. A site that needs *one symbolic loop in the hero* (#1 or #2) is not the same problem as a site that needs *every section to gently breathe as you scroll* (#3). They want different solutions, and the conversation derails the moment we treat them as one decision.

---

## The Format Question: Why Lottie Won, and When to Escape It

Lottie won the symbolic-illustration market for three honest reasons:

1. **It's resolution-independent vector**, so it scales from a 24px icon to a 1600px hero without bloat.
2. **The runtime is small** — `lottie-web` is ~250KB, `dotlottie-web` is leaner — and it renders to SVG, Canvas, or HTML.
3. **The ecosystem of pre-built assets is enormous.** LottieFiles alone hosts hundreds of thousands of files, and most popular icon sets now ship Lottie variants alongside SVG.

But Lottie has weaknesses worth naming, because each one is a reason to consider a *different* tool for a specific job:

- **No first-class interactivity.** A Lottie plays. It can be triggered ("play on scroll", "play on hover", "play and reverse"), but it cannot really *respond* — there's no state machine, no "if user hovers, transition to state B." This is exactly the gap **Rive** fills, and Rive is the right answer for animated UI elements that need to react to user state.
- **The colors are baked into the file.** A Lottie that was designed for a light background looks wrong on a vibrant-mode page. There are runtime tricks (re-coloring layers via the JS API) but they're fragile. For us, with a strict three-mode contract per [[blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]], this is a real friction.
- **The production tools are SaaS or Adobe.** Already covered above. The format is open; the keyboard time is not.
- **For *photorealistic* or *complex shaded* motion, raster video is honest.** A 4-second autoplay `.webm` of a real product UI is sometimes the right answer, not a Lottie attempt at the same thing.

So: Lottie for symbolic loops, Rive for interactive icons, raster video for product/lifestyle motion, hand-coded CSS for ambient marketing motion. Don't force everything through one pipe.

---

## What "By Default" Could Look Like for Astro Knots

The shape of a useful playbook, written as if we were going to ship it tomorrow:

**1. Library-first, every site, no debate.** Default to LottieFiles for any decorative loop need. Add a one-line note in `[[prompts/New-Site-Quickstart-Guide]]` pointing at the licensing-safe categories. The free assets are good enough for ~70% of needs and cost nothing beyond attribution where required.

**2. One subscription, one designated "hero motion" tool.** Pick *one* of {Lottielab, Jitter, SVGator}, pay for it, and let any of us produce 1–2 custom hero loops per site without a learning-curve discussion every time. Initial bias: **Lottielab** — it's the most Lottie-native of the three (made by ex-LottieFiles people, format-first instead of marketing-feature-bag), browser-based, Figma-like UX. Jitter is a strong runner-up if marketing-motion presets matter more than format fidelity.

**3. A `LottieEmbed.svelte` (or `.astro`) copy-pattern.** One canonical wrapper that:
   - Uses `@lottiefiles/dotlottie-web` (the smaller `.lottie` archive, not raw `.json`)
   - Lazy-loads on `IntersectionObserver` so off-screen Lotties don't decode
   - Honors `prefers-reduced-motion` — pauses on the first frame and shows a static poster
   - Accepts a `mode`-aware prop, or uses `currentColor` tricks where the Lottie is monochrome
   - Lives in the same copy-pattern shape as `AstroMarkdown.astro` — copy into the site, adapt as needed; not a runtime dependency on `@knots/*`

**4. A blueprint that codifies when to escape Lottie.** Rive for interactive icons. Inline SVG + CSS for hover micro-interactions. `<video autoplay muted loop playsinline>` for product/lifestyle motion. Don't pretend Lottie is the answer for all four shapes.

**5. An honest licensing note.** Many free LottieFiles assets require attribution; some are paid; some are "free for personal use" only. Before any *client* site ships a library asset, check the license. This is the kind of thing easy to skip and embarrassing to discover later.

---

## The Alternatives, Briefly

### Rive — the right answer when interactivity matters

Newer, smaller team, strong design. The `.riv` format is binary, the editor is proprietary (free tier exists), the runtime is excellent. **Pick this for animated UI elements that respond to user state** — a button that morphs on hover, a toggle with personality, a tutorial element with discrete steps. Don't pick it for static decorative loops where Lottie's library-asset advantage dominates.

### After Effects + Bodymovin — the legacy, gold-standard path

If you already know AE, this is still the highest-fidelity production path. For us, the honest answer is *we don't, and we shouldn't learn it just for this.* Reach for it only if a client engagement explicitly funds a motion designer.

### LottieFiles' AI generator — watch, don't adopt yet

Their text-to-Lottie tool has been steadily improving. Quality is fine for filler decorative pieces, rough for anything we'd want as a hero. **Treat as a starting point you tweak in Lottielab, not a finished asset.** Worth re-evaluating quarterly — this is the part of the landscape moving fastest.

### Pure SVG + CSS animation — undersold

For monochrome marks, brand glyphs, and small hover affordances, animated inline SVG with a `<style>` block is often the right answer. No runtime, no JSON, no SaaS, fully theme-aware via `currentColor`. **Use for the "small ambient motion" tier; don't try to push it to the hero tier where Lottie genuinely wins.**

### Spline / Three.js / WebGL — out of scope, for now

3D in-browser is its own large topic. Nothing in the Astro Knots family currently needs it. Park.

---

## Tentative Direction

**Adopt a tiered playbook**, then ship the smallest version of it:

- **Tier 0 (ambient marketing motion):** hand-coded CSS animation on inline SVG. Already in our muscle memory.
- **Tier 1 (symbolic loops, library-sourced):** LottieFiles. Pay attention to licenses.
- **Tier 2 (custom hero motion):** Lottielab subscription, designed by whoever needs it that day. One paid tool, not three.
- **Tier 3 (interactive UI motion):** Rive when state machines matter.
- **Tier 4 (product/lifestyle motion):** short autoplay video.

The minimum-viable next step is tiny: write the `LottieEmbed.svelte` pattern, drop it into one site, and try Lottielab on a free trial for one custom hero piece before subscribing. The most likely first proving ground is `sites/calmstorm-decks` — fundraise decks are exactly the surface where one well-placed motion piece earns its weight in viewer attention.

This is still an exploration, not a decision. The unknowns I'd want to clear before promoting this to a spec or blueprint:

- **How does a Lottie's baked-in palette interact with our three-mode contract?** Worth one prototype where we re-color layers via the JS API and see how fragile it actually is across light/dark/vibrant.
- **`prefers-reduced-motion` strategy** — pause on first frame, swap to a static poster, or skip rendering entirely? Probably "swap to poster," but worth testing what feels right on a real page.
- **License hygiene for LottieFiles assets in client deliverables** — a one-page `reminders/` artifact may be the right output, separate from the playbook itself.
- **Is the LottieFiles AI generator good enough yet to be a real Tier 1.5?** Re-test in three months; the curve here is steep.

## Outcome

(Pending. This exploration ends when we either a) write the blueprint and ship the `LottieEmbed` pattern + a chosen subscription, or b) discover during the first prototype that Lottie's mode-contract friction or the SaaS lock-in is bad enough to push us toward a Rive-first or SVG-first stance.)

## Related

- [[blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]] — the three-mode contract any animated asset has to honor
- [[explorations/Choosing-an-Image-Generator-for-Text-on-Background-Banners]] — adjacent question on the static-image side of the same illustration problem
- [[prompts/New-Site-Quickstart-Guide]] — where the "add LottieEmbed" step would land if we promote this to a blueprint
- `sites/calmstorm-decks/` — the most likely first proving ground for a Tier 2 hero motion piece
