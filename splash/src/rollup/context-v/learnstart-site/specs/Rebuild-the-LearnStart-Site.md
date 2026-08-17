---
title: Rebuild the LearnStart Site
lede: Rebuild LearnStart's lost Heroku site from scratch on the Astro Knots stack — a mission-forward, learn.vc-kindred VC site with the full light/dark/vibrant discipline, independently deployable from its own private repo.
date_created: 2026-08-02
date_modified: 2026-08-02
authors:
  - MP Staton
augmented_with:
  - Claude Code on Opus 4.8
semantic_version: 0.1.0.0
tags:
  - Spec
  - LearnStart
  - VC-Site
  - New-Site
status: Signed-Off
from: learnstart-site
from_path: specs/Rebuild-the-LearnStart-Site.md
---
<!-- Rolled up from learnstart-site/context-v/specs/Rebuild-the-LearnStart-Site.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Rebuild the LearnStart Site

> Derived from `[[../narratives/LearnStart-Site-Narrative]]`. The narrative carries the *why* and the *feeling*; this spec carries the *what to build*.

## Why Care?

LearnStart's website lived on Heroku and was deleted after a lapsed payment. The source is gone — only business data survived on disk, no site code. Rather than resurrect a legacy brochure, we rebuild on the **Astro Knots** stack: a fast, mission-forward VC site that shares learn.vc's family DNA, ships the light/dark/vibrant contract, deploys independently from its own private repo, and carries the build-in-public surfaces (changelog, design system, LLM-friendly index) a Heroku brochure never had.

**One-line success test:** a founder lands on the hero and thinks *"these people get me, they invest this early, and they move fast"* — with the clearest possible path to get in touch; an LP reads *aligned thesis, disciplined construction, active partnership.*

## What LearnStart is (authoritative)

The **globally-recognized Pre-Seed to Seed arm of Learn Capital, managed independently.** Global range and mandate (Silicon Valley + US *and* gems across every active market); small, fast decision process; ideal co-investor or round catalyst; responsive value-add across a wide portfolio; **prefers no board role**; ecosystem player; portfolio discipline with **promotion-to-Pre-A logic**; dedicated thesis/mission/portfolio alignment backed by supportive, active LPs. Full framing in the narrative.

## Goals

- Recreate LearnStart's public web presence, structurally modeled on learn.vc, in its own voice (seed-stage, founder-facing).
- Ship the **three-mode theme contract** (light / dark / vibrant) on two-tier tokens, with learn.vc's green as the re-pointable brand-spine accent.
- Stand up as an **independently deployable** Astro Knots site: own private repo under `lossless-group`, mounted here as a `sites/learnstart-site` submodule, deploys to Vercel from its own repo.
- Carry the required per-site reference pages: `/brand-kit` and `/design-system`.
- Ship a complete OpenGraph / SEO surface so the site unfurls cleanly and is legible to search + generative engines.

## Non-Goals

- **Not** a pixel-clone of learn.vc (we mimic *structure*, own the *voice* — see narrative).
- **Not** a dealflow or CRM surface. The confidential LearnStart business data (dealflow CSVs, co-investor exports, "DO NOT SHARE" spreadsheets) is **out of scope entirely** and never becomes site content.
- **Not** publishing a shared package. This is a leaf site; it *consumes* `@lossless-group/lfm`, it does not extract patterns (extraction is a later, if-proven concern).
- **Not** a fully-gated site. The marketing surface is public; **only the complete portfolio / track record is passcode-gated** (see *Portfolio & the passcode gate*). No per-user accounts, no OAuth, no DB — a single shared-passcode cookie.

## Audiences (two co-primary)

1. **LPs / co-investors** — read *aligned thesis, disciplined construction, active partnership, global independent judgment.* Served by thesis, portfolio, and team sections + an LP/partnership CTA.
2. **Early-stage founders** — read *fast yes, real value-add, no board-seat friction, global reach, Learn Capital behind you.* Served by hero + founder contact/apply CTA.
3. **Supporting** (press, talent, curious) — clean nav (Insights, Talent, Contact).

The design challenge: serve both co-primary audiences without forcing a choice at the door — a shared hero with a light two-path fork beneath it, **not** two separate landing pages.

## Information Architecture

Homepage is a single scroll, learn.vc-shaped, with a dual-audience fork:

| Order | Section | Purpose | Notes |
|---|---|---|---|
| 1 | Fixed nav | Wayfinding | Ventures · About · Team · Talent · **Thoughts** (→ `/streams`) · Contact (mirror learn.vc; trim to what has content) |
| 2 | Mission hero | 80% of the job | One sentence in learn.vc cadence — "Pre-Seed to Seed arm of Learn Capital, global, independent"; primary CTA |
| 3 | Two paths | Dual-audience fork | *For Founders* (fast, catalytic, no board seat, global) · *For LPs* (aligned, disciplined, active partnership) — short blocks or links into deeper sections |
| 4 | Portfolio highlights (public) | Social proof | **Curated** set MP hand-picks; presentation TBD — logo banner *or* highlight cards. Links to the gated complete portfolio. Not the confidential full roster. |
| 5 | Thesis / discipline | The earliest-stage bet | Learn Capital macro thesis → LearnStart's global, ecosystem-player, promotion-to-Pre-A discipline |
| 6 | Team | The humans | Grayscale portrait style; roster below |
| 7 | Get involved | Conversion | Dual CTA — founder contact/apply *and* LP/partnership path; **flexible newsletter** slot (provider-agnostic) |
| 8 | Footer | Nav echo + relationship | Socials; explicit link home to learn.vc |

Supporting routes (Astro Knots standard): `/brand-kit`, `/design-system`, `/changelog`, plus `/llms.txt` and `.md` sidecars for public content. Sub-pages (`/team`, `/ventures`, `/about`, `/insights`, `/contact`) added as content justifies — Phase 1 may inline them as homepage sections and promote to pages later.

## Team (authoritative)

- **Don Burton** — Managing Partner
- **Michael Staton** — General Partner
- **Investing Advisors:** Vinit Sukhija · Brook Bisrat · Rob Hutter

Rendered from `src/data/team.yaml`. Headshots + bios to source; grayscale-portrait treatment. Brook Bisrat and Rob Hutter also appear on learn.vc.

### The mark & palette

LearnStart's identity is a **radial spark** — a fan of thin rays in a **cyan → green gradient** — beside an **ink-slate** "LearnStart" wordmark (camelCase). The spark ("a spark of learning starting") is both logo and **site motif** (hero anchor, section breaks, subtle vibrant-mode animation). Its own identity — related to learn.vc, not a recolor.

Approximate palette (refine from the real SVG): ink slate `~#33404A`, spark cyan `~#12B5C9`, spark green `~#5FC24D`. The accent is the **gradient**, not a single hue. **Action item:** source/recreate a clean **SVG** of wordmark + spark.

### Tokens & modes

- **Two-tier tokens** per the theme-system skill. Tier-1 named (`--color__ink-slate`, `--color__spark-cyan`, `--color__spark-green`, plus a `--gradient__spark`); Tier-2 semantic (`--color-primary`, `--color-accent`, `--gradient-accent`, `--color-text`, `--font-heading`, `--font-body`) are what components read.
- **Three modes**, `data-mode` on `<html>`, pre-paint script to avoid FOUC. **Vibrant is dark-based** (common-error guardrail) — the spark gradient is where vibrant gets to glow.
- **Type**: clean sans-serif with italic-emphasis headline treatment (the learn.vc verbal tic). Exact pairing chosen at build; documented in `DESIGN.md`.
- **`DESIGN.md`** (Google Stitch spec) as the machine-readable design contract, including `modes:` (3-mode) and `imagery:` (OG) extensions; spark gradient is the through-line. **Draft authored** at `context-v/extra/learnstart-staging/DESIGN.md` — moves to the site root at scaffold; `theme.css` is built to match it, then it becomes the sync-with contract.
- Structural donor: `sites/fullstack-vc` (heroes, people, footer, design-system patterns) — copy-and-adapt, not import.

## Content Model

- Client-editable content lives in **YAML/JSON/markdown** (per the no-hard-validation + YAML-data-files disciplines), not TypeScript — e.g. `src/data/team.yaml`, `src/data/portfolio-highlights.yaml` (public curated set), `src/data/track-record/*.json` (gated complete portfolio), `src/content/insights/*.md`.
- Longform content rendered through **`@lossless-group/lfm`** (installed from **JSR**, per the pseudomonorepo deploy discipline) with the copied `AstroMarkdown.astro` renderer from `packages/lfm-astro/components/`.
- Rosters are **filled by MP or from public facts** — never generated, never from confidential exports.

### Streams (the "Thoughts" content system)

A flexible, self-organizing content area — LearnStart's answer to a newsletter/blog, built to grow.

- **Self-association by frontmatter.** Each markdown entry declares `publish_to_streams:` — an **array of strings**, so one entry can appear in several streams at once. Entries automatically group into each named stream — no manual index-wrangling. A new stream exists the moment an entry tags it. (Lenient: a bare string is coerced to a one-item array, per the `lenientStringArray` preprocessor pattern.)
- **Surface:** `src/pages/streams/index.astro`, nav label **"Thoughts"**. Renders one **tab per stream** (union of all values seen across entries), each tab's entries **sorted by most recent** (`date_modified` / `date_published`, via the `toDate()` defensive helper). Detail pages render through LFM.
- **Newsletter is just a stream + a signup.** Keep the email provider swappable (Substack embed, Buttondown, ConvertKit, plain form → later) — the *content* lives as streams regardless of who sends the email.
- **Lenient by mandate.** Per astro-knots, the loader is a **passthrough glob — never hard-validate.** A malformed or incomplete entry must **not break the build**; it's skipped/degraded and surfaced in **build logs**, not thrown. Tags Train-Case; keys `snake_case`. See the reminder `[[YAML-Frontmatter-Parsing-Must-Be-Lenient]]`.
- **Frontmatter contract:** MP will provide a codified definition later. Until then, treat frontmatter as open passthrough and document observed fields; don't gatekeep.

## Portfolio & the passcode gate

Two tiers, deliberately separated by sensitivity:

**Public — curated highlights.** A hand-picked set of companies MP chooses to feature. Presentation deferred (logo banner vs. highlight cards — pick after scaffold is up). Data: `src/data/portfolio-highlights.yaml`. Safe for anyone.

**Gated — the complete portfolio / track record.** The full, data-driven roster, modeled on **`sites/mpstaton-site`'s track-record pattern**: `deals.json` + `funds.json` (per-deal fields like company, vehicle, sector, stage, dates, cost, multiple, valuation, tags), loaded into a grouped, filterable table (`portfolio/index.astro` groups by company, extracts filter facets). This carries financial detail, so it sits **behind a passcode**.

**Gate mechanism — adapted from `dididecks-ai/client-sites/reach-edu-hub`:**

- `src/middleware.ts` + `src/lib/gate.ts`. A single **HttpOnly cookie** (`ls_gate=granted`, ~90-day max-age). No DB, no OAuth, no per-user accounts.
- Two ways in (phrase-match, same trust level): a shared **passcode** (`LEARNSTART_GATE_PASSCODE`) or an allowed **email domain** (`LEARNSTART_ALLOWED_EMAIL_DOMAIN`).
- **Scoped, not whole-site:** middleware gates only the complete-portfolio prefix (e.g. `/portfolio` or `/track-record`); the marketing site stays public. `/gate` + `/api/unlock` are always reachable; `sanitizeNext` guards the post-unlock redirect (same-site relative only).
- **Load-bearing rule (astro-knots):** the site runs `output: "server"`, so **every gated route must `export const prerender = false`.** A prerendered gated route is served straight from the CDN and bypasses middleware entirely — a silent bypass *and* a dev-mode auth loop. Non-negotiable.
- **Secrets** via `~/.secrets` sourced from `.zshenv` (never committed); documented in `.env.example` with placeholder values only.

## Tech & Deploy

- **Astro** in **`output: "server"`** (required by the passcode gate), zero-JS-by-default for content. No React, no JSX, no MDX. Svelte only if genuine reactivity is needed. CSS-first per the tech hierarchy.
- **Middleware gate** (`src/middleware.ts` + `src/lib/gate.ts`); gated routes carry `export const prerender = false`. Public marketing routes may prerender.
- **pnpm** exclusively. No `packageManager` pin in `package.json` (breaks Vercel). No `workspace:*` deps.
- Site-local `pnpm-lock.yaml`; `vercel.json` with frozen-lockfile install; `.npmrc` for `@lossless-group` if any GH-Packages dep is used (LFM via JSR needs no token).
- **Repo:** private, `lossless-group/learnstart-site`; mounted as submodule at `sites/learnstart-site`; added to `pnpm-workspace.yaml` for dev convenience only; its own real `.git` (old-style submodule layout, per submodule-git-layout discipline).
- **Deploy:** **Vercel**, from the site's own repo, `@astrojs/vercel` adapter (SSR). Matches the fleet; best fit for a low-traffic SSR marketing site with a cookie gate (no always-on process, no colocated DB). *Railway (`@astrojs/node`, always-on) is the natural next step only if LearnStart later grows a founder portal with a real DB / live features; Fly.io if multi-region containers are ever needed. Not now.*
- **Domain:** **learnstart.vc** (registered at iwantmyname). Canonical + OG base URL = `https://learnstart.vc`. DNS at iwantmyname → Vercel (apex `A` + `www` `CNAME` per Vercel's domain panel, or delegate nameservers). Echoes the `.vc` family tie to learn.vc.

## Phases

**Phase 0 — Docs & sign-off (this document).** Narrative ✓, spec (here), sign-off gate.

**Phase 1 — Repo + scaffold.** Create private repo, wire submodule, `pnpm create astro`, base layout, theme.css with two-tier tokens + three modes, ModeToggle, fonts, `DESIGN.md`. Deploy config (Vercel, vercel.json). *Verifiable: `pnpm build` green; site deploys; mode toggle works without FOUC.*

**Phase 2 — Homepage spine.** Nav, hero (mission + CTA), footer with learn.vc link. Placeholder portfolio/team/philosophy sections wired to YAML data files. *Verifiable: full homepage scroll renders in all three modes.*

**Phase 3 — Content + proof.** Curated public portfolio highlights (presentation chosen here — logo banner vs. cards), team roster, philosophy copy (from MP). Insights via LFM if wanted. OG/SEO system (`seo.ts` + `MetaTags.astro`), OG image. *Verifiable: unfurls in iMessage/Slack/LinkedIn; content accurate.*

**Phase 3.5 — Passcode gate + complete portfolio.** `output: "server"`, `middleware.ts` + `gate.ts`, `/gate` + `/api/unlock`, scoped to the complete-portfolio prefix with `prerender = false`. Port the mpstaton-site track-record table (`deals.json`/`funds.json`, grouped + filterable) behind it. *Verifiable: gated route redirects to `/gate` without cookie, unlocks with passcode, persists; prerendered marketing routes unaffected; no confidential data on any public route.*

**Phase 4 — Streams + reference surfaces + polish.** `/streams` ("Thoughts") with `publish_to_streams:` self-association, tabs sorted by recency, LFM detail pages, lenient passthrough loader; provider-agnostic newsletter signup. `/brand-kit`, `/design-system`, `/changelog`, `/llms.txt` + `.md` sidecars. Accessibility + responsive pass. *Verifiable: a malformed stream entry is skipped + logged, never breaks the build; acceptance checklist (below) fully green.*

## Acceptance Criteria

- [ ] Private repo `lossless-group/learnstart-site` exists; mounted as submodule at `sites/learnstart-site`; in `pnpm-workspace.yaml`.
- [ ] `pnpm install && pnpm build` succeeds from the site dir alone (independent deployability).
- [ ] No `workspace:*` deps, no `packageManager` pin.
- [ ] Light / dark / vibrant all render without FOUC and persist across reloads; vibrant is dark-based.
- [ ] Two-tier tokens: components read only semantic tokens; learn.vc green re-pointable in one line.
- [ ] Homepage delivers the learn.vc-shaped spine; hero + primary CTA present.
- [ ] `/brand-kit` and `/design-system` exist, use BaseThemeLayout, render in all modes, `noindex`.
- [ ] `DESIGN.md` at repo root with `imagery:` block; OG image generated; share preview unfurls.
- [ ] Public portfolio highlights are MP-curated/public; **zero confidential data on any public route.**
- [ ] Passcode gate: gated portfolio route redirects to `/gate` without cookie, unlocks via passcode/allowed-domain, persists ~90 days; every gated route has `prerender = false`; no gated route is CDN-served.
- [ ] Secrets live in `~/.secrets`, not committed; `.env.example` has placeholders only.
- [ ] Deploys to Vercel from its own repo (`output: "server"`).

## Open Questions

- ~~Mandate + relationship to Learn Capital~~ — **resolved:** Pre-Seed to Seed arm, managed independently, global mandate. (See *What LearnStart is*.)
- ~~Team roster~~ — **resolved:** Burton (MP), Staton (GP), advisors Sukhija / Bisrat / Hutter. (Headshots + bios still to source.)
- ~~Portfolio roster~~ — **direction set:** public = MP-curated *highlights* (presentation TBD after scaffold); complete/track-record portfolio lives **behind the passcode gate** (mpstaton-site pattern). Highlight picks + gated dataset from MP.
- ~~Deploy domain / host~~ — **resolved:** domain `learnstart.vc` (iwantmyname); host **Vercel** (SSR). Railway/Fly deferred unless live features arrive.
- ~~Brand art~~ — **resolved:** radial-spark, cyan→green gradient, ink-slate wordmark. Still need a clean **SVG** of the mark (action item, not a blocker).
- ~~Newsletter~~ — **resolved:** modeled as a **Stream** ("Thoughts" → `/streams`) with a provider-agnostic signup; content self-associates via `publish_to_streams:` (array of strings). Email provider chosen later, kept swappable.
- **Stream frontmatter contract** — MP to provide a codified definition; until then, open passthrough (lenient).

## See also

- `[[../narratives/LearnStart-Site-Narrative]]` — the story this spec formalizes
- `astro-knots` skill → `references/playbooks/new-site-setup.md` (12-step setup, post-sign-off)
- `theme-system` skill · `maintain-splash-pages` skill · `context-v/prompts/New-Site-Quickstart-Guide.md`
- `sites/fullstack-vc` — structural donor
