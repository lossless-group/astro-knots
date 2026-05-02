---
title: "Develop a Slides-only Astro Site for a Fundraise Process"
lede: "A slides-only Astro site that stays consistnent with relevant Context Vigilance files fed into AI Assistant context."
date_authored_initial_draft: 2026-04-29
date_authored_current_draft: 2026-04-29
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-04-29
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags: [Astro-Framework, Slides-as-Code, Fundraise-Materials]
authors:
  - Michael Staton
image_prompt: A modern professional in causal business attire, giving a presentation to a conference table of hip looking investors who are wearing large 3D glasses and looking as if they are at an action movie premiere on Imax in 3D.  The presentation is popping out of the screen in 3D, and design objects are streamining out towards the investors.
date_created: 2026-03-25
date_modified: 2026-03-25
---

# Workflow Management
> This section is at the top for the users convenience, assure context and return when managing phases, steps, tasks.

## Slide Inventory

There is a full deck that is 33 slides, it is referenced in Phase 4 because it is not of concern now.  For context only: the 17 slides of the teaser deck are in the full deck. The full deck is just longer.  A v0.1.0 will have a way for the client to play and send links to either deck.

### Teaser Deck (17 Slides)
[Teaser / Base Deck](/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/calmstorm-decks/context-v/extra/private/2026-04-29_Calm-Storm_Fund-III_Deck--Base.pdf) meets toolcall constraint of 20 slides.

#### Teaser Deck Slide Checklist & Slugs:
- [ ] Slide 1: `disclaimer-confidential`
- [ ] Slide 2: `vision-mission`
- [ ] Slide 3: `venture-team`
- [ ] Slide 4: `identity-pillars`
- [ ] Slide 5: `problem-intro`
- [ ] Slide 6: `opportunity-intro`
- [ ] Slide 7: `market-momentum`
- [ ] Slide 8: `european-landscape`
- [ ] Slide 9: `firm-positioning`
- [ ] Slide 10: `track-record`
- [ ] Slide 11: `investment-team-LPAC`
- [ ] Slide 12: `competitive-advantage`
- [ ] Slide 13: `community-portfolio-service`
- [ ] Slide 14: `success-in-numbers`
- [ ] Slide 15: `portfolio-snapshot`
- [ ] Slide 16: `portfolio-construction-product-offering`
- [ ] Slide 17: `fund-terms`

##### Single Slide Acceptance Criteria:
- [ ] The user says it's good enough, let's move on.
- [ ] Clean layout
- [ ] Content roughly conveys the PDF intent (which may or may not include exact copies of text)
- [ ] Slide scales to hold 16:9 aspect ratio between split screen and full screen views.

# Context

We did a great job at a first iteration of _another_, _previous_ Slide Deck for a previous client's Fundraise Process. But, the designs as they were rendered were not as clean as we would have liked them to be -- little details that add up like relative font sizes, spacing, and alignment, and the many bells and whistles that can make a web page or a slide come together elegantly. 

We will use that as a reference for this project, but not at first because Claude Code has been stuck repeating patterns established in reference files.  Ordinarily, repeating patterns is a good thing our work, often strictly enforced. However, in this case, we want to start fresh and not be constrained by the patterns established in the previous project because the iteration process became arduous and time-consuming, and to be frank we are still not happy with the results.

### Now is a clean slate.
A new client has approached us to help them create a slides-only Astro site for their fundraise process.  The site should be informed by relevant Context Vigilance files mentioned here or fed into the chat interface for AI Assistant context.

**Pull from Website:** The client has a [Calm/Storm](https://www.calmstorm.vc/) website only in light mode, the client does not need the Astro ligh/dark/vibrant mode rigor. We have already curl requested and pulled from it to get a good attempt. However, we seem to have a lot of unclean design and anticipate that we would get in a loop iterating on it.  

**Pull from PDF Deck:** [Find Here](/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/calmstorm-decks/context-v/extra/private/2026-04-29_Calm-Storm_Fund-III_Deck--Base.pdf) The client has provided a relatively comprehensive deck in PDF format that we may use as a reference for inspiration for the content and structure of the slides. 

[!IMPORTANT] There is no reason we can't have many different decks, several different themes, and several different slide layouts. The Base/Teaser deck and Full/Comprehensive decks are minimum market standard.  However, as someone that has managed presentations and materials for a fundraise, I know that all firms end up with custom decks for different audiences and purposes. While not in the scope of this moment, and our first v0.1.0, we will eventually want features that make it easy to host and navigate to many different decks.

Let's start small, and iterate from there.

## Goals

The primary goal is to get a playable, clean, and error-free deck as soon as possible, that will likely neither have all the content, all the design ideas, or all the features desired. But, it will be stable and playable.

A goal of The Lossless Group, unknown to the client, but always impacts the client experience, is that when improvising it is often good to improvise several variants -- of slides, of elements, and of tags and styles.  This typically goes quickly, and will only take time if one is good enough or a client preference to iterate from there.  Most variants will be shelved, but may come back out during client review processes where they seem unfulfilled by a slide or its elements.

# Constraints
The client will ALWAYS need a "playable" deck that is clean and error free. (By playable, we mean they are proud to show it, and it loads and works. When we say playable, we do not mean a specific UI for interaction, but rather that it is stable and functional.) They would prefer to have something simple and elegant than to have something broken, embarassing, or incorrect. This means that adventures into dynamic JavaScript or complex animations should be deferred and only happen in incremental steps.

On production, certain Slide Decks will be considered private or have data that must not be exposed to search, a general audience, crafty corporate espionage, AI Research, or other nefarious to dubious purposes. We will need to implement proper access controls and authentication mechanisms to ensure that only authorized users can view these decks. HOWEVER, many of the potential capital sources will be older and not quite so tech savvy, so complex authentication mechanisms may not be well received. This should be discussed and we should have a strategy. We do not need to perfect this in the initial v0.1.0, it is only here so we don't forget this later.

# Anticipating Future Opportunities and not Creating Barriers

Sometimes early decisions can leave technical debt, create unnecessary friction, slow down development towards the larger opportunity.  We want to avoid that here as best we can.

> [!IDEA] Give the client an AI Chat interface, with the AI Code Assistant and an AI Research Assistant having access to read/write permissions with rigorous version control, easy staging environments, SCM best practices, and reversion or versioning abilities and practices.
>
> A potential recurring revenue stream could be that once a custom Astro-based slides site is built, we can offer ongoing maintenance, updates, and enhancements as a managed service -- with most of that work actually being done directly by the client through the AI Chat interface.

# Creative Generation and Variants

When creating slides, it is often good to create several variants -- of slides, of elements, and of tags and styles.  This typically goes quickly, and will only take time if one is good enough or a client preference to iterate from there.  Most variants will be shelved, but may come back out during client review processes where they seem unfulfilled by a slide or its elements.

Generate as many variants as you can reasonably create without getting stuck.  A 2-3 minute creative generation burst is worth waiting for.  Beyond that is unnecessary. 4-10 variant range is reasonable. 

## Variant Conventions. 

Astro will render in the `src/pages/` directory. 

When generating variants of a specific slide,
1. Use the base {slug} string like `overview` to create a landing page that will allow us to navigate the slide variants at `/overview/index.astro`
2. Name the slide with a pages/drafts/{slug}-{variant}.astro
 - Example: pages/drafts/overview/overview-v1.astro

As we make progress on multiple slides (unsure how many unique slides it will take....), we will start to converge on one "theme" that is feeling like the best or most preferred design style. We will then start to sort through the variants and promote the best ones to canonical status, which may or may not take a full re-render of the slide to match the theme and content hierarchy.

When we establish one or more themes, we should be consistent with the naming convention:

- `pages/theme/{theme}/{slug}-{variant}-{theme}.astro`
- Example: pages/modern/overview-v1-modern.astro

In the "official" or currently played live deck, we will remove the variant suffix from the filename. So, `overview-v1-modern.astro` becomes `overview-modern.astro`.

We well then need to generate some way for the client to "play" or review by theme, or slug, or variant. Indecision should be expected, to give the client a clear way to find options at the moment they get indecisive. 

and promote the best variants to canonical status.

Total losers will be pruned. However, many unideal slides or slides that just don't resonate may still have viable elements that can be used in other slides or themes, or as reference for future iterations. There is no dire need to delete a 10KB file that may have some good elements.

# UI and Navigation

While we are asking to NOT use Reaveal.js, we should still have a navigation system that allows for easy movement between slides.  

> We are only asking not to use Reveal.js because the painstaking and unsuccessful iterations in the past had no real true diagnoses. Was it unidentified CSS conflicts?  Was it Claude Code confusion?  Was it poor prompting?  Did Reveal.js not mesh well with our own JavaScript or GSAP?  We just don't know.  We are just avoiding painful neverending loops.

Consistent with our "Step by Step", always have something working and incrementally improve. Start as simple 
1. next/previous button, both positioned closely in the bottom right corner, low opacity by default, and changes on hover.  
  - If possible, key bindings to next/previous would be ideal.
3. a slide counter (7 / 17)

It could evolve into a more complex navigation system, it could also break the mold of Powerpoint and Keynote, eventually.

Let's assume there is a thin header on top that shows their brand, and then the remaing viewport height is for the slide content.

16:9 aspect ratio is standard for slides, so we should lock to that until we reach a point where we have satisfied all other requirements and built a deck that wows.

# Ideally, Export, Download
While HTML Decks are great, many viewing potential Limited Partners / capital allocators have their own outdated operating procedures and systems. It's highly likely some decent portion of them will want a PDF copy.  

If this is a challenge, let's worry about it later. I can even take screenshots by hand for now.

# Phases of Development

## Phase 1: Plain HTML with Inline Tailwind Slides, all at once.

No dynamic JavaScript, just plain HTML and Tailwind for inline improvisation efficiency. Our experience is that the CSS can start conflicting, things get messy, and design does not meet intent for reasons that are diffult to diagnose. We want to avoid that here as best we can. 

Previously, we would spec and build slides with Reveal.js, GSAP animations, and other dynamic elements. This most often led to constant back-and-forth iterations, debugging issues that are not breaking and have no clear errors or cause. Getting a side right aesthetically would end up taking longer than building much more complex applications.

### Styling Approach: INLINE Tailwind, Built-in Tokens Only

**Inline Tailwind utilities only.** No `@apply`, no extracted component classes, no custom CSS files, no theme extension. Every styling decision lives directly on the element where you can see it — this is the whole point of starting in HTML+Tailwind. If a class list gets long, that's fine; readability of the *rendered output* matters more than tidy class lists right now.

**Use Tailwind's built-in tokens exclusively.** Do not create a custom palette, custom font scale, or custom spacing scale yet. We are deliberately deferring the design system (see Phase 2). Pick from what Tailwind ships out of the box — that constraint is a feature, not a limitation, and it prevents premature lock-in.

**Calm/Storm visual language (use these as your defaults when reaching for a Tailwind class):**

- **Background:** Pure white (`bg-white` / `#FFFFFF`). Lots of whitespace. Generous padding and margins. The deck should feel airy, not dense.
- **Borders:** Thin (1px — plain `border` with no width modifier), mid grey (`border-gray-300` or `border-gray-400` depending on contrast need). Avoid heavy borders.
- **Primary display text** (headings, titles, slide titles): a slightly darker grey — start with `text-gray-800` or `text-gray-900`. Not pure black.
- **Detail text** (captions, labels, body copy on visual components, secondary information): lighter grey — start with `text-gray-500` or `text-gray-600`.
- **Corner radius:** Boxy-leaning. More boxy than the current rounded-everything trend, but **not hard corners**. Default to `rounded` or `rounded-sm` (2–4px). Avoid `rounded-lg`, `rounded-xl`, `rounded-2xl` unless a specific element clearly calls for it. Never `rounded-none`.

These are starting defaults of their _reference_ deck that they are not satisfied with. So, while they are brand concepts, they are not rules. Adjust per slide as the eye demands — the point of inline Tailwind is that you can.

### Iterate and Perfect with HTML and Tailwind Slides, one by one. 

**Start with Teaser Deck of 17 Slides** - [Teaser / Base Deck](/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/calmstorm-decks/context-v/extra/private/2026-04-29_Calm-Storm_Fund-III_Deck--Base.pdf)
Iterate until the design is clean and has aesthetic harmony on each slide, then move to the next slide.  Publish.

**As this is being done, we will start to build a Design System and Brand Kit, slowly -- but we will only add to it as we are honing in on the most "wow" variant of what we have generated. While our initial attempts might have an implicit design system, we _eventually_ want to make it explicit and documented and begin locking it in only AFTER we have acheived the desired aesthetic harmony. Of course this is iterative.

> [!NOTE] For unknown reasons, clever and robust design systems, tokens, and brand kits made up front often end up causing delays and struggles during iteration.  We want to avoid this here. It's not that we don't believe in Composable Architecture, but we want to build it in a way that doesn't cause delays and struggles during iteration.

## Phase: 2: Incrementally create a version in Astro, again One by One 

1. Initialize Astro. One by one, duplicate the Previous Version as is, but as Astro files. 

2. Do a first pass at cross-referencing any designs from Phase 1 with the PDF reference slide, and extract text values from the PDF to use in the Astro files -- as frontmatter properties and values.

2. Create property names in frontmatter through YAML property: value convention, following the Astro-Knots somewhat distinctive patterns. Move text values that are displayed in tags to frontmatter variables. Keep a running list in a markdown file of all the properties you create to dedupe and reason about.

2. Componentize repeating elements in the HTML and Tailwind Slides into Astro Components, without changing the HTML or Tailwind rendered output.  

3. Start a new deck of the same name. In paralle, initiate the design-system and brand-kit pages at `pages/design-system/index.astro` and `pages/brand-kit/index.astro` respectively. These are placeholder, but we will begin building them as we progress through the slides.

Study the previous version's design and rendered output with the user. Then, for components only, iterate towards a stable use of semantic tokens and design system elements as tokens or nested components, converting the target HTML and Tailwind elements into Astro + HTML, and Tailwind + CSS. Slides into Astro components, one by one.  

 - Only design elements consistently used should be turned into an Astro component. This will allow us to iterate on _surrounding_ elements more easily and make changes without them propogating to other slides.

4. If we discover that components are being irrational, or making the broader slide irrational, study the original HMTL and Tailwind code to understand why and make adjustments as needed. If necessary, revert back to the original HTML and Tailwind code. If the slide is not critical, be willing to move it to a temp file and come back to it later. Again, the goal is a stable, playable deck as soon as possible.

## Phase 3: Incremntally introduce dynamic features, interactivty, and animations.

Again, we are trying to avoid a rabbit hole of irregular or irrational behavior at the rendered output level. For some reason, this has eaten up a lot of our time.  

So, one slide at a time. Review. Improve. Move on.

1. Try to accomplish dynamic features, interactivity, and animations through use of **advanced CSS features** as much as possible.  AI Code Assistants inherently know them, but often shortcut to using libraries or frameworks that are not necessary.  We like those libraries and frameworks, too.  We just don't like neverending frustration trying to make them work while keeping the clean, stable rendered output.  

2. Try to accomplish dynamic features, interactivity, and animations through use of straight up **JavaScript** as much as possible.  AI Code Assistants inherently know them, but often shortcut to using libraries or frameworks that are not necessary.  We like those libraries and frameworks, too.  We just don't like neverending frustration trying to make them work while keeping the clean, stable rendered output.  

3. If we discover that we really desire something more advanced that CSS and JavaScript can do, then adopt the necessary library or framework, but do it with intention and purpose. We really want GSAP, but we had so many collisions and unexplained and unfixed behaviors in our last deck when we built all our fun ideas at once.  

## Phase 4: Repeat the process with the Full Deck
### Full Deck (34 Slides)
[Full/Comprehensive Deck](/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/calmstorm-decks/context-v/extra/private/2026-04-29_Calm-Storm_Fund-III_Deck--Comprehensive.pdf) for later development.




