---
title: LearnStart — Site Narrative
lede: "The globally-recognized Pre-Seed to Seed arm of Learn Capital, managed independently — told in two voices: one for LPs, one for founders."
date_created: 2026-08-02
date_modified: 2026-08-02
authors:
  - MP Staton
augmented_with:
  - Claude Code on Opus 4.8
semantic_version: 0.1.0.0
tags:
  - Narrative
  - LearnStart
  - VC-Site
  - Brand-Story
status: Signed-Off
site_uuid: 7c6f6865-66b9-445f-ba27-c50f84a03899
hex_code: 8kpu8u
date_authored_initial_draft: 2026-08-02
date_authored_current_draft: 2026-08-02
publish: true
from: learnstart-site
from_path: narratives/LearnStart-Site-Narrative.md
---
<!-- Rolled up from learnstart-site/context-v/narratives/LearnStart-Site-Narrative.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# LearnStart — Site Narrative

> A narrative, not a spec. This is the story the site has to tell — the *why* and the *feeling* — written before the *what to build*. The spec (`[[../specs/Rebuild-the-LearnStart-Site]]`) is derived from this.

## Why Care?

LearnStart had a website. It lived on Heroku, and when a payment lapsed, Heroku deleted it. The old code is gone — a search of every surviving copy on disk turned up only business data (dealflow exports, portfolio spreadsheets, quarterly updates), no site source. So this is a clean rebuild, and a clean rebuild is a chance to do it *right*: on the Astro Knots stack, with the light/dark/vibrant discipline, publishing in public, and legible to both humans and agents.

The site's job is simple to state and hard to do well: **make a stranger understand, in one screen, that LearnStart backs the earliest believable version of a learning company — and make them want to talk to us.**

## Who LearnStart is (authoritative)

LearnStart is the **globally-recognized Pre-Seed to Seed arm of Learn Capital — managed independently.** Learn Capital (learn.vc) is the parent thesis: a mission-driven venture firm whose belief is that *learning is the foundation of a thriving society*, with a portfolio (Coursera, Udemy, Andela, Amplify, NewGlobe, and more) as the proof. LearnStart is where that thesis begins — at the earliest stage, everywhere.

Its defining characteristics, stated plainly:

- **Pre-Seed to Seed arm of Learn Capital**, but **managed independently** — the brand and thesis recognition of Learn Capital, with its own decision-making.
- **Global range and mandate.** Covers Silicon Valley and the US, *and* finds and invests in gems across every active market, worldwide.
- **Small and fast decision process** — global reach without the drag of a slow committee.
- **Ideal co-investor or round catalyst.** Responsive, value-add across a wide portfolio; **prefers no board role**; an **ecosystem player** rather than a lead-and-control investor.
- **Portfolio discipline** — the judgment to run a *wide* portfolio while applying clear **promotion-to-Pre-A logic** that concentrates follow-on where conviction is due to preference alignment rather than hard company momentum.
- **Aligned by design** — dedicated thesis / mission / portfolio alignment, backed by **supportive, active LPs** who keep building relationships with and adding value to the portfolio.

## The two narratives

The site tells one story in **two voices**. These are not two sites — they're two lenses on the same firm, and the homepage should let each reader find theirs quickly.

### For LPs — *alignment and discipline*

The LP story is about **trust and construction.** LearnStart offers dedicated thesis-mission-portfolio alignment: LPs aren't passive capital, they're supportive and active partners who continue to build relationships and add value across the portfolio. It is recognized globally as the Pre-Seed to Seed arm of Learn Capital, yet managed independently — the credibility of the parent with the agility of a focused vehicle. The discipline is the differentiator: the judgment to run a wide, global portfolio while applying clear promotion-to-Pre-A logic, so breadth at entry becomes concentration where it's earned.

LearnStart and Learn Capital team members are available for insights, share knowledge, and even provide ad-hoc consulting.

> LP takeaway: *aligned thesis, disciplined construction, active partnership, global reach with independent judgment.*

### For founders — *fast, global, catalytic*

The founder story is about **momentum and access.** LearnStart moves fast — a small, quick decision process, not a months-long committee. It's the ideal co-investor or round catalyst: responsive value-add, an ecosystem player, and it prefers no board seat, so it helps without taking control. Its reach is genuinely global — based in the Valley and the US, but actively hunting gems in every active market — and it carries the recognition of Learn Capital behind it. For a founder at the earliest stage, LearnStart is the catalyst that helps the round come together and opens the door to the wider Learn Capital ecosystem.

> Founder takeaway: *fast yes, real value-add, no board-seat friction, global reach, Learn Capital behind you.*

## The relationship to learn.vc — sibling, not clone

The design decision is **mimic structure, own the voice.** The site should feel unmistakably part of the Learn Capital family — a visitor who knows learn.vc should recognize the kinship in five seconds — while reading as its own thing: earlier, hungrier, closer to the founder.

What we borrow from learn.vc:

- The **section architecture**: fixed nav → bold mission hero → portfolio proof → philosophy → team → newsletter/contact → footer.
- The **verbal tic** that gives the brand its warmth: strong verbs with *italicized emphasis* words (*"back"*, *"build"*, *"learn"*).
- The **restraint**: generous whitespace, clean sans-serif, imagery doing the emotional work.

What we make our own:

- **Voice tilted to the seed stage.** learn.vc speaks from a position of established proof. LearnStart speaks from the beginning of the journey — to founders who have an insight and not yet a company. Less "look what we built," more "let's build it."
- **Its own mark and palette.** LearnStart isn't recolored learn.vc — it has its own identity (see *The mark* below): an ink-slate wordmark and a **cyan → green spark gradient**, richer than learn.vc's flat green. Related, not derivative.
- **The three-mode contract.** learn.vc is single-mode (black / white / green). LearnStart ships **light / dark / vibrant** per the Astro Knots theme-system discipline. The spark gradient is the brand-spine accent, re-pointed cleanly through two-tier tokens so a future palette shift is a one-line change — and it's what lets vibrant mode genuinely *glow*.
- **Build-in-public surfaces.** A changelog, a design system, an LLM-friendly index — the things an Astro Knots site carries that a legacy Heroku brochure site never did.

## The mark

LearnStart's logo is a **radial spark** — a fan of thin rays bursting upward, in a **cyan → green gradient** — set beside a clean **ink-slate** "LearnStart" wordmark (camelCase compound). The spark reads as *a spark of learning starting*: the earliest moment of ignition, which is exactly LearnStart's stage.

Approximate palette (refine from the real SVG/asset):

- **Ink slate** (wordmark / text): ~`#33404A`
- **Spark cyan** (left rays): ~`#12B5C9`
- **Spark green** (right rays): ~`#5FC24D`
- The accent is the **gradient between them**, not a single hue.

The spark is more than a logo — it's the site's **ornament and motif**: radiating lines can anchor the hero, mark section breaks, and animate (subtly) in vibrant mode. It's the visual through-line that makes the site unmistakably LearnStart.

> Source asset: LinkedIn company logo (200×200 JPEG). We'll want a clean **SVG** wordmark + spark for crisp rendering and gradient control — to source or recreate.

## The feeling

If learn.vc feels like a **firm**, LearnStart should feel like a **launchpad**. Composed but energetic. Credible because of the parent, but pointed at the future rather than the résumé. The vibrant mode is where that energy gets to shout; the light mode is where a limited partner or a co-investor takes it seriously.

## What the site has to accomplish

**Two co-primary audiences** — LPs and founders — plus a supporting tier:

1. **Founders** at the earliest stage — should finish the hero and think *"these people get me, they invest this early, and they move fast."* Clearest possible path to "get in touch / apply / share a deck."
2. **LPs and co-investors** — should read *aligned thesis, disciplined construction, active partnership, global independent judgment.* Portfolio, thesis, and team sections carry this.
3. **Supporting** (press, talent, the curious) — served by clean navigation to Insights, Talent, and Contact.

The design challenge: serve both co-primary audiences without forcing a choice at the door. Options to resolve in the spec — a shared hero with two clear paths below it, or a single hero whose sections speak to each in turn. Not two separate landing pages.

## The spine of the page (narrative order)

1. **Hero** — one mission sentence in the learn.vc cadence, LearnStart-specific, with a primary CTA. Establishes the "Pre-Seed to Seed arm of Learn Capital, global, independent" identity in one screen. This is 80% of the site's job.
2. **The two paths** — a light fork right under the hero: *For Founders* (fast, catalytic, no board-seat friction, global) and *For LPs* (aligned, disciplined, active partnership). Each a short block or a link into a deeper section.
3. **Portfolio proof — two tiers.** *Public:* a curated set of highlight companies MP hand-picks (logo banner or cards — decided later). *Gated:* the **complete** portfolio / track record — the full data-driven roster with financial detail — sits behind a **passcode** (mpstaton-site's track-record pattern + reach-edu-hub's cookie gate). The confidential exports never appear on a public route.
4. **Thesis / discipline** — why the earliest stage, why global, and the promotion-to-Pre-A discipline. Bridges Learn Capital's macro thesis to LearnStart's earliest-stage, ecosystem-player bet.
5. **Team** — the humans, in grayscale-portrait learn.vc style. *(Roster to confirm.)*
6. **Get involved** — dual CTA: founder contact/apply path *and* an LP/partnership path; newsletter if there's a list. The learn.vc analog is the "Venture to Learn" Substack CTA.
7. **Footer** — nav echo, socials, the Learn Capital relationship made explicit (a link home to learn.vc).

## Team (authoritative)

Grayscale-portrait treatment per learn.vc. Bios below drafted from public sources — **MP to verify/edit, especially his own.** These seed `src/data/team.yaml` at scaffold time.

### Don Burton — Managing Partner

Don Burton founded LearnStart in 2017 and leads it as Managing Partner. He backs seed-stage edtech, human-capital / HR-tech, and education-SaaS companies — the earliest believable version of a learning company — with a global lens. A lifelong education builder, Don has founded and operated edtech ventures both independently and inside large organizations: he created A-Ha! Learning Center, a play-and-learning center for children and families in New York City, and eebee's Adventures, a baby-media company; co-built Parent Partners (acquired by The Washington Post & Kaplan Education); and led education innovation initiatives inside The Walt Disney Company and Kaplan. He holds a B.A. from Duke University and an M.B.A. from Harvard Business School.

### Michael Staton — General Partner

Michael Staton is a General Partner at LearnStart and a Partner at Learn Capital, where he has helped lead investments into companies including Coursera, Minerva, and Brilliant. A former public-school teacher, Michael brings an operator's intuition for education to early-stage investing. He founded and was CEO of Uversity, a pioneer of social enrollment-management technology in higher education, where he secured the first venture investment from the Bill & Melinda Gates Foundation's U.S. programs into a private company. He served as a Venture Partner and Community Advisor to NewSchools Venture Fund's Seed Fund (now Reach Capital), and led Teach For America's Social Entrepreneurship & Innovation Initiative, where he supported and invested in 200+ early-stage education entrepreneurs. He was named to Forbes' 2015 "30 Under 30 in Education," and more recently founded CoLearn, building infrastructure that makes homeschooling and co-learning dramatically easier for families.

### Profile links (favicon row)

Each team member carries a row of reputable external profile links, rendered with hand-authored, self-contained SVG favicons (no remote images, per Astro Knots). Contact-scraper sites (ZoomInfo, RocketReach) are deliberately excluded — they expose personal email/phone. Favicons staged at `context-v/extra/learnstart-staging/profile-icons/`; migrate to `sites/learnstart-site/public/icons/profiles/` at scaffold. This block seeds `src/data/team.yaml`:

```yaml
# src/data/team.yaml (draft)
- name: Don Burton
  title: Managing Partner
  profiles:
    - { label: Crunchbase, icon: crunchbase, url: "https://www.crunchbase.com/person/don-durton" }
    - { label: "LearnStart on VC Sheet", icon: vcsheet, url: "https://www.vcsheet.com/fund/learnstart" }
    - { label: "Behind Company Lines (podcast)", icon: podcast, url: "https://www.hireotter.com/behindcompanylines/episode-279-don-burton-founder-managing-partner-of-learnstart" }
    # - { label: LinkedIn, icon: linkedin, url: "TBD" }
- name: Michael Staton
  title: General Partner
  profiles:
    - { label: "The Org", icon: theorg, url: "https://theorg.com/org/learn-capital?p=michael-staton" }
    - { label: Crunchbase, icon: crunchbase, url: "https://www.crunchbase.com/person/michael-staton" }
    - { label: Wellfound, icon: wellfound, url: "https://wellfound.com/p/mpstaton" }
    - { label: "VC Sheet", icon: vcsheet, url: "https://www.vcsheet.com/who/michael-staton" }
    - { label: Bloomberg, icon: bloomberg, url: "https://www.bloomberg.com/profile/person/18854607" }
    # Meet Education Project removed 2026-08-02 — site dead (HTTP 503).
    # - { label: LinkedIn, icon: linkedin, url: "TBD" }
```

*(LinkedIn slots left as `TBD` — I won't fabricate URLs. Send me the two LinkedIn URLs and I'll drop them in; the `linkedin.svg` favicon is already authored.)*

### Investing Advisors

**Vinit Sukhija · Brook Bisrat · Rob Hutter.** *(Bios + headshots + profile links to source. Brook Bisrat and Rob Hutter also appear on learn.vc — reinforcing the LearnStart ↔ Learn Capital family tie.)*

## Boundaries and open questions

- **Confidential data stays out.** The surviving `LearnStart/` folder holds dealflow CSVs, co-investor exports, and files literally marked "DO NOT SHARE." None of it is site content. Portfolio and team rosters come from *public* facts or from MP explicitly, never from those exports.
- **Publishing note.** Astro Knots specs can roll up into public splash pages and the local corpus. Everything here is drawn from learn.vc's public marketing surface, so that's fine — but flag if any of it should be treated as private.
- **Open:** Portfolio roster — the early-stage companies to feature (from MP / public facts).
- ~~Deploy domain~~ — **resolved:** `learnstart.vc` (iwantmyname), on Vercel. The `.vc` echoes the learn.vc family tie.
- ~~Brand art~~ — **resolved:** radial-spark mark, cyan→green gradient, ink-slate wordmark (see *The mark*). Still need a clean **SVG** version of the mark.
- **Open:** Newsletter — shared "Venture to Learn" Substack, or a LearnStart-specific list?

## See also

- Spec derived from this: `[[../specs/Rebuild-the-LearnStart-Site]]`
- Parent site reference: <https://www.learn.vc/>
- Structural donor in-repo: `sites/fullstack-vc` (mature VC site, vibrant-mode reference)
- Theme discipline: `theme-system` skill · Framework rules: `astro-knots` skill
