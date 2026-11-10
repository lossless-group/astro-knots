---
title: "Thrifty Energy: A Consumer Site for Lower Household Energy Bills"
lede: "A consumer site that helps households spend less on energy, built as its own independently deployed Astro Knots project."
date_created: 2026-11-01
date_modified: 2026-11-02
authors:
  - Michael Staton
augmented_with:
  - "Claude Code on Opus 5.5"
semantic_version: 0.0.1.0
publish: false
tags:
  - Spec
status: Implementing
---

# Thrifty Energy: A Consumer Site for Lower Household Energy Bills

## Context

- The client's current site sells a facilities platform to commercial and institutional buyers. This is a new consumer site rather than a reskin.
- The client thinks its current product would have product-market fit for homes and wants to test it with consumers.
- The client wraps a simplified version of its offering in a consumer mobile app via Tauri. The app is the client's build, not part of this site.

## Goals

1. **Create the test.** Demonstrate consumer interest and whether it's valid to support.
2. **Build a content farm for SEO and GEO** that evolves into a brain or wiki rather than a blog.

If consumer support turns out not to be valid, the site continues as a content site that points back to the client. The sign-up path must be removable without restructuring the site.

## Decisions

- **Offer at launch:** content, plus a simple tool that runs in the browser. No bill uploads.
- **Brand:** Thrifty Energy leads, with a clear "by [client]" endorsement in the footer and on About. The client's name is not part of the logo.
- **Repo:** `lossless-group/thrifty-energy`, private, added as a submodule at `sites/thrifty-energy`.
- **Look:** a new, household-friendly identity. Each direction is one theme file and one route.
- **Audience:** moms are likely to be the savers, especially those who think about the environment. The client chose Sunny, inspired by a family finance app, which is the site at `/`. Two alternates stay on the same content layer: `/alts/shelf/` and `/alts/sunny-tag/`, listed at `/alts/`.
- **Domain:** `thrifty.energy`. It lives in one config value, `site` in `astro.config.mjs`.
- **Analytics:** PostHog, set up later. Traffic and conversion matter, so sign-up records capture source page and UTM values from the start.
- **Sign-up storage:** a database of sign-ups for now, likely Turso through `@libsql/client` as in other sites. The client's HubSpot gets them eventually.
- **Publishing:** the client team, Michael, and content-farm tools create content. No editorial staff; whoever creates it publishes through git commit and push.
- **Content source:** files in the repo first. Cloudflare Artifacts is the likely source later instead of the GitHub content API, so content loading stays behind one module.
- **Cross-references:** seed links where relevant, including back to the client. Not spammy, and no gaming Google.

## Sign-up behavior

- Households on the first supported utility can connect their bill, get automated reads paired with the client's models, and get suggested ways to save.
- Households anywhere else can still sign up. Other providers are never a dead end, because organic demand can force the dev team to figure out the provider's API.
- The form records the household's energy provider, so sign-ups can be counted per provider.

## Launch scope

- **Pages:** home, sign-up, wiki index and entries, the tool, About, privacy, `/changelog`, `/brand-kit`, `/design-system`.
- **Wiki:**
  - Markdown collections rendered through `@lossless-group/lfm`.
  - Organized by topic and links rather than a date-ordered feed.
  - Wikilinks between entries, with generated backlinks and related entries.
  - Hex-code citations, `llms.txt`, `.md` sidecars, sitemap, and structured data.
- **Tool:** a home savings checklist. A household answers a few questions about its home and bill, then gets a ranked list of actions with rough dollar ranges.
  - Runs entirely in the browser; answers are sent only if the household opts in through the form.
  - Savings assumptions live in a client-editable YAML file, each with a source.

## Constraints

- Deploys independently from its own repo: JSR for LFM, site-local `pnpm-lock.yaml`, `netlify.toml` with a frozen lockfile. The client publishes sites on Netlify, so this site stays there.
- Sign-ups need one server endpoint; every other page stays static.
- Follows the full theme and mode contract in `Maintain-Themes-Mode-Across-CSS-Tailwind.md`, using the canonical files from `packages/ui/theme-mode`.

## Phases

1. **Foundation:** repo, submodule, scaffold, Tailwind, LFM, changelog, deploy config.
2. **Identity:** spike the look on the home page and `/brand-kit`, then codify tokens and `/design-system` once approved.
3. **Sign-ups:** home and sign-up pages, form, database, About, privacy, domain cutover.
4. **Wiki:** collections, templates, wikilinks and backlinks, machine-readable outputs, first batch of content.
5. **Tool:** checklist logic, sourced assumptions, results view, link into the form.
6. **Analytics:** PostHog, once the client's account is ready.

## Open questions

- Which topics come first?
