---
title: AI Photo-to-Illustration Transform for Arthouse
lede: Exploring how to take a real client photograph — sometimes NSFW-sensitive — and return an obviously AI-generated illustrative version (anime, painterly, or stylized) that is safe to publish on the public arthouse-site portfolio.
date_created: 2026-05-18
date_modified: 2026-05-18
at_semantic_version: 0.0.0.1
status: Draft
category: Exploration
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7)
tags:
  - Image-Generation
  - Photo-Transformation
  - Image-Privacy
  - Arthouse-Site
  - Ideogram
  - Replicate
---

# AI Photo-to-Illustration Transform for Arthouse

**Parent spec:** [[Polish-Pass-for-Arthouse-Site]] · [[Maintain-an-Image-Heavy-Portfolio-Site]]
**Status:** Draft — destination unclear, need to evaluate tools

---

## 1. The problem

The arthouse client's body of work includes photography that is racy / NSFW. To showcase that work publicly without exposing the original imagery, we want a pipeline that:

1. Takes a source photograph as input
2. Returns an output that is **clearly AI-generated** (so no reasonable viewer mistakes it for the original photo)
3. Preserves the *composition*, *mood*, and *subject pose* of the source — these are what the artist wants to be hired for
4. Has a consistent visual style across a shoot (multiple transformed images read as a series, not random outputs)
5. Is fast/cheap enough to iterate at the volume of a portfolio shoot (50–200 images)

The output style should read as **illustration**, not photo-realism — anime, painterly, ink-and-wash, or graphic novel. Photo-realistic style transfer would defeat the privacy purpose.

---

## 2. Why this is its own document

The polish pass on the home page can ship without solving this. But this is a load-bearing capability for the *portfolio* surface — without it, large swaths of the client's actual work cannot be shown.

---

## 3. Candidate tools

### 3.1 Ideogram v3 (already wired)
- Already used by [[generate-consistent-og-images]] skill
- `IDEOGRAM_API_KEY` already in `~/.secrets`
- Supports **style reference images** and **character reference** (consistency across a series)
- **Open question:** Does Ideogram do meaningful image-to-image conditioning on a *source photo*, or only style-reference (where the source guides aesthetic, not composition)? Need to verify against current API docs.

### 3.2 Replicate
- Many models, pay-per-call, no infra
- Strong candidates:
  - **flux-dev / flux-schnell** with image conditioning + LoRA for anime style
  - **sdxl** + ControlNet (pose / canny / depth) — best for composition fidelity
  - Dedicated anime models: **animagine-xl**, **anything-v5**, **counterfeit-xl**
- Trade-off: more control, more knobs, longer iteration loop

### 3.3 Stability AI direct API
- SD 3 / SDXL with strength-controlled img2img
- Style fidelity good, composition-preservation requires ControlNet
- More setup than Replicate

### 3.4 Local (ComfyUI / Automatic1111)
- Full control, zero per-call cost after setup
- High overhead for one-off creative pipelines
- Probably overkill for a single-client portfolio

---

## 4. The composition-vs-style tradeoff

Two failure modes to design against:

- **Too faithful to source:** output reads as "a photo with a filter" — the NSFW essence isn't actually obscured, just stylized. Defeats the privacy purpose.
- **Too liberal with source:** output reads as "generic anime girl" — loses the specific pose, composition, lighting that makes the client's work *theirs*.

The right control point is probably ControlNet pose/depth on a strongly anime-styled base model — keeps the silhouette and composition, replaces the rendering.

---

## 5. Series consistency

A portfolio shoot is 20–50 images of the same subject. They need to read as a series. Options:

- Train a small LoRA on the subject (overkill for one-off)
- Use a character reference image across all calls (Ideogram supports this)
- Use the same seed + prompt scaffold across the batch with only pose changing
- Manually curate the most consistent outputs and discard outliers (most pragmatic)

---

## 6. Privacy-of-the-pipeline question

If we send the source photos to a third-party API (Ideogram, Replicate, Stability), the source photo *leaves the local machine*. Depending on the provider's data-retention policy, this may or may not be acceptable for genuinely sensitive material. Worth checking each provider's policy before this is more than a prototype.

Local-only inference (option 3.4) is the only way to fully eliminate this risk.

---

## 7. Next moves

1. **Pick one candidate to prototype against** — recommend Ideogram first because it's already wired and the lift to test is minimal. If style-reference-only is the constraint, fall back to Replicate flux+ControlNet.
2. **Test on a single non-sensitive source photo** — verify composition preservation and "obviously AI" output before exposing any real NSFW source.
3. **Document the data-retention finding** for whichever provider we pick.
4. **Sketch the directory flow** — `private/transform-source/<name>.jpg` → script call → `public/images/ai-rendered/<name>.webp`.
5. **Decide where the transform script lives** — `sites/arthouse-site/scripts/`? Or a shared utility?

This is the exploration phase. No commitments yet.

---

## 8. References

- [[Polish-Pass-for-Arthouse-Site]] — parent
- [[generate-consistent-og-images]] skill — current Ideogram usage
- [[crawl-fetch-ingest]] skill — `~/.secrets` API key pattern
