---
title: Reach Education Hub — `/` Index Page Brainstorm
lede: Working doc on what the hub homepage communicates, who it serves, and the order of the scroll. Brainstorm, not a spec.
date_authored_initial_draft: 2026-05-04
date_authored_current_draft: 2026-05-04
date_last_updated: 2026-05-04
at_semantic_version: 0.0.0.1
status: Brainstorm
augmented_with: Claude Code (Opus 4.7)
category: Sitemap
tags:
  - Site-Map
  - Index-Page
  - Brainstorm
  - Reach-University
  - Lossless-Group
authors:
  - Michael Staton
date_created: 2026-05-04
date_modified: 2026-05-04
from: reach-edu-hub
from_path: sitemap/Page__Index.md
---
<!-- Rolled up from reach-edu-hub/context-v/sitemap/Page__Index.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Reach Education Hub — `/` Index Page Brainstorm

> A brainstorm, not a spec. Working doc — surface intent, list candidate sections in flow order, capture open questions, and let the next pass tighten it.

## What this page is for

This is a **co-branded landing surface** — not a Reach University marketing page, not a Lossless Group portfolio page, but a private hub that says "these two are working together, and here is the work."

**Audience (best guess — confirm):**
- Reach leadership and program staff who need to find what we've built for them
- Funders and philanthropic partners Reach is actively engaging
- Lossless Group team members coming back to the work
- Visitors arriving from a shared deck link, looking for context

**Not for:** the general public. Not SEO. Not Reach's prospective students — they belong on reach.edu.

## Core message

> **Reach University** × **The Lossless Group**
> Single Point of Contact: **Michael Staton**
> Text or Whatsapp for response time. 

The page should make this triad legible without ceremony. Three names, one collaboration, one human to talk to.

## The two pillars — what we're working on together

Verbatim from the conversation, to be tightened later:

### Pillar 1 · Unlock breakthroughs in philanthropic fundraising

Through:

- **Materials generation** — decks, briefs, narratives, one-pagers
- **Process improvements** — how the fundraise actually runs week-to-week
- **Talent & team building** — roles, hires, structures
- **Strategic presence and connections** — convenings, outreach, relationship architecture

### Pillar 2 · Leapfrog legacy technology into the Agentic AI era

Past: legacy tech use, vendor lock-in, siloed solutions.

Forward: **fast-forward into the Agentic AI era** through:

- **Data preparation** — getting institutional data ready to feed agents
- **System interoperability** — making siloed tools talk
- **Precision custom design and development** — bespoke where bespoke wins
- **Best-in-class thinking** — what's good, why, and what matters
- **Procurement, adoption, training, and use** — the human side of any new system

> The bet: most institutions are choosing between vendor lock-in and DIY pain. There's a third path.

## Check it out — what we've shipped

Showcase section. One entry today, designed to grow as the work ships.

### Deck-o-Knots

- **What:** a homegrown deck ideas and slides generator with a presentation suite to boot
- **Why it belongs here:** the materials-generation pillar, made tangible
- **Status:** built and in use
- **Where on this site:** `/story` (live Reach deck, two variants — `v1 baseline` + `v2 editorial`)

*(More cards land here as the work ships. The card pattern should accommodate ~6–9 entries before needing pagination or filtering.)*

## Proposed scroll flow

A first-pass order. Each block is a candidate section; layout details TBD.

1. **Hero / Co-Branding Block**
   - "Reach University × The Lossless Group" wordmarks
   - Single line of intent (TBD — see open questions)
   - SPOC Michael Staton — name + one-click contact

2. **Pillar 1 · Fundraising Breakthroughs**
   - Headline + lede
   - Four sub-tiles for the surface areas (materials gen / process / talent / strategic presence)

3. **Pillar 2 · Agentic Leapfrog**
   - Headline + lede
   - Five sub-tiles for the surface areas (data prep / interop / custom dev / best-in-class / procurement-adoption-training-use)

4. **Check it out — what we've built**
   - Card grid, currently `[Deck-o-Knots]`
   - Each card: name, one-line value, status, link

5. **Contact / Footer**
   - Light footer with Michael's contact + the "Reach × Lossless" lockup

## Open questions

- **Visual weight:** does "co-branded" mean equal weight (Reach + Lossless side by side), or does **Reach lead** with Lossless as the build partner showing up second?
- **Pillar names:** "Pillar 1 / Pillar 2" is a placeholder. Candidates:

  - *Raise Better* + *Build Smarter*
  - *Fundraise Acceleration* + *Agentic Leapfrog*
  - Numbered ("01 / 02") with the descriptive headline doing the work
- **SPOC framing:** is "Single Point of Contact" too acronymed for non-internal readers? Alternatives: "Project lead", "Talk to", "Your contact".
- **Michael's contact card:** above the fold (anchor of the hero) or in the footer as a CTA?
- **Showcase section name:** "Click around:" (conversational, matches voice), "Agent-Harnessed Slide Generation & Decks" (descriptive), "Check our GitHub for other projects that might be relevant or applied. Food for thought."

  Pick the one that aligns with how candid the rest of the page is.
- **Deck-o-Knots routing:** does the card link directly to `/story`, or to a future tool/feature page (e.g. `/tools/deck-o-knots`) that frames the tool and then deep-links to `/story`? My lean: tool page eventually, direct link for now.
- **Mode-awareness:** the rest of the hub respects light/dark/vibrant. 
  - Should the index also?  YES 
  - But: the hero co-branding block needs to look strong in *all three* modes — that's a design constraint worth flagging early. 
- **Gating:** (Answer: No, does not need to be gated) is this page gated behind the same access mechanism as the decks (when that exists), or is the hub homepage open while specific surfaces are gated? (Calmstorm-decks gates with `PUBLIC_DECK_CODE`; Reach hub may want similar.)

## What lives elsewhere on the hub

Just so this page doesn't try to do everything:

- `/story` — the live Reach narrative deck (v1 baseline + v2 editorial)
- `/brand-kit` — Reach brand tokens for the team
- `/design-system` — component catalog
- *(future)* `/materials` — published artifacts (briefs, narratives, one-pagers)
- *(future)* `/changelog` — what shipped when
- *(future)* `/tools/deck-o-knots` — tool page if Deck-o-Knots earns its own surface

## Notes for whoever picks this up

- This is the **private side** of the hub — write candidly, no public-marketing tone
- The Header chrome already exists (`Hub · Story · Brand Kit · Design System` + variant cycler when on a deck). The index page just feeds the **Hub** link
- `BaseThemeLayout` is the right wrapper — three-mode aware out of the box
- Keep the deck-iteration-workflow phase 1/2 rule in force here too: inline Tailwind utilities, built-in tokens only. The semantic-token cleanup is a Phase 3 motion
- Eyebrows on every section (`text-xs uppercase tracking-[0.4em]`) keeps the visual rhythm consistent with the v2 deck

## Where to take this next

- Resolve the open questions, especially **visual weight** and **pillar names** — those drive the hero and the H2s
- Sketch the hero block in inline Tailwind (1–2 variants if it's worth comparing)
- Propose copy for each pillar's lede — short, the kind that earns the reader's next 8 seconds
- Decide how Michael's contact surfaces (above-fold lockup vs. footer CTA)

---

## Decisions captured (2026-05-04)

Pinned from a working session — these answers drive the v1 build.

- **Audience:** Reach University senior executives. Behind the learning curve on Human + AI collaboration, but eager. Already love us — we're wowing, not selling.
- **Headline:** *"Booting up systems for Lossless Collaboration."* (Wordplay on the Lossless Group brand.)
- **No central CTA** for v1.
- **Pillar naming:** show **both** names — plain-language headline on top, nerdy subtitle underneath. Plain version is the visual anchor; nerdy version signals depth.
  - **01 · Raise Better** / *Fundraise Acceleration*
  - **02 · Build Smarter** / *Agentic Leapfrog*
- **Contact framing:** "friendly nod" — stakeholders already have Michael's number. Mention text / WhatsApp as preferred channels (email is overload). **Do not publish the actual number** — could get scraped.
- **Gating:** none. All info is public, no fundraising regs apply, being found is good.
- **Mode-awareness:** yes. Hero must read strong in light / dark / vibrant.
- **Right now this hub is for:** presentation design iterations for the current fundraise (two variants done).
- **Where it might go:**
  - **A** — market leadership content, reports, Agent-harnessed materials generation
  - **B** — Agent-harnessed donor & sponsor targeting, using frontier techniques
  - **C** — precision upgrades in ops or teaching & learning tech stack, with cutting-edge solutions
- **"Let's rock and not get lost"** — keep v1 tight, iterate to v2 if needed.
