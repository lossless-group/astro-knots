---
title: "Context-V — Context Vigilance for AI-Native Software Teams"
lede: "A working library of the documents we feed to Claude Code so we can build sites, apps, and design systems at remarkable speed — and a directory schema that keeps that library legible as it grows."
date_created: 2026-04-29
date_modified: 2026-04-29
status: Published
category: Index
tags: [Context-Vigilance, Documentation, AI-Collaboration, Claude-Code, Knowledge-Management, Index]
authors:
  - Michael Staton
---

# Context-V

> **Context Vigilance** — the discipline of writing, organizing, and curating the documents an AI Code Assistant reads so that each new conversation starts smarter than the last.

The public framing of this idea lives at **<https://www.lossless.group/projects/gallery/context-vigilance>**. This folder is what it looks like in practice, in one repo, on one team.

If you are an AI assistant reading this for the first time: **start here, then descend into the subfolder that matches the kind of work being asked of you.** If you are a human collaborator: this is the map.

---

## Why this folder exists

A small team using Claude Code can now ship at a pace that surprises even seasoned engineers — designs, sites, apps, documentation pipelines, the works. The bottleneck is no longer typing or remembering syntax. The bottleneck is **giving the model the right context, fast.**

So the work moves from "writing code" toward "writing the inputs that let the assistant write the right code." Specs. Blueprints. Reminders. Prompts. Issue post-mortems. Sitemaps.

Then the second-order problem appears: **we now have so many of these files that finding the right one is its own challenge.** This README is the index that makes the rest of the library navigable — by humans, by Claude Code, and by future-us six months from now.

---

## How to use this folder

### If you are a human author or reviewer

- Author and edit in **Obsidian**. The vault is configured to honor wikilinks like `[[context-v/specs/My-Spec.md]]`, which is why the index below uses that syntax everywhere.
- File names are **Train-Case** (`Maintain-Themes-Mode-Across-CSS-Tailwind.md`). Tags are also Train-Case (`Design-Tokens`, never `design_tokens` or `designTokens`). See [[context-v/reminders/Tags-Must-Use-Train-Case.md]].
- Frontmatter uses **`under_score` property names**, **double-quoted strings**, and **arrayed tags**. The full quirks list is at [[context-v/reminders/Quirks-of-Obsidian-Flavored-Markdown.md]].
- Every meaningful document gets a `title`, `lede`, `status`, `category`, `tags`, and `date_modified`. The lede is the one-liner that lets a future reader (or assistant) decide in two seconds whether to keep reading.

### If you are Claude Code (or any assistant) reading this

Read in this order:

1. **This README** — you are here.
2. **`reminders/`** — short, durable rules that should shape every response in this repo (e.g. "tags are Train-Case", "this is not a true monorepo", "use pnpm not npm").
3. The **specific category folder** matching the user's request — `specs/` for new feature work, `blueprints/` for implementation patterns to follow, `issue-resolution/` to avoid re-debugging the same thing, etc.
4. Only then start looking at code in `sites/*` or `packages/*`.

The root `CLAUDE.md` (one level up at `../CLAUDE.md`) governs how to *build*. The files in here govern *what to build, why, and from which decisions already made*.

---

## The directory schema

`context-v/` is organized **by document type, not by feature**. A feature might span a spec, a blueprint, a reminder, and an issue-resolution; we keep them together by purpose so the assistant can sweep the right shelf for the right kind of help.

```
context-v/
├── specs/             — what to build (intent + acceptance)
├── blueprints/        — how to build it (implementation patterns)
├── prompts/           — reusable Claude Code prompts and recipes
├── reminders/         — durable rules and project-wide invariants
├── issue-resolution/  — incidents, root causes, fixes worth remembering
├── explorations/      — open questions, landscape scans, decisions in progress
├── strategy/          — business and product strategy notes (private context)
├── sitemap/           — page/section/component breakdowns for sites in flight
└── extra/             — long-form source material we draw on but don't render
```

Each category is described below with current contents and the kinds of additions we expect over time.

---

## `specs/` — what we are building

A **Spec** describes a feature, a page, a system, or a package well enough that a human or assistant can implement it without further interrogation. Specs lead with intent, then acceptance criteria, then concrete file-level direction.

The canonical template to copy when authoring a new spec: [[context-v/prompts/Author-a-Specification-Markdown-File-in-Context-V.md]].

Current contents (relative to `context-v/`):

- `specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md` — the master spec for **Lossless Flavored Markdown (LFM)** — what the flavor is, what it borrows from GFM/Obsidian/MDX, and how it gets shipped as `@lossless-group/lfm`. → [[context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md]]
- `specs/Context-V-GitHub-Fetcher-for-Multi-Repo-Content-Aggregation.md` — build-time fetcher that pulls context-v files from many repos so `lossless.group` and `mpstaton.com` can render current docs without submodules. → [[context-v/specs/Context-V-GitHub-Fetcher-for-Multi-Repo-Content-Aggregation.md]]
- `specs/Remark-Citations-Plugin-for-Hex-Code-Footnote-Management.md` — the citation plugin that renumbers `[^a1b2c3]`-style footnotes and emits a structured citation dataset. Companion to LFM. → [[context-v/specs/Remark-Citations-Plugin-for-Hex-Code-Footnote-Management.md]]
- `specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md` — reading experience spec for long-form documents. → [[context-v/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md]]
- `specs/Dynamic-OpenGraph-Images.md` — per-page OG image generation. → [[context-v/specs/Dynamic-OpenGraph-Images.md]]
- `specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md` — gated portfolio with auth (in flight; first hand-rolled OAuth pass shipped against `fullstack-vc`). → [[context-v/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md]]
- `specs/Maintain-an-Image-Heavy-Portfolio-Site.md` — image-forward portfolio mechanics. → [[context-v/specs/Maintain-an-Image-Heavy-Portfolio-Site.md]]
- `specs/Maintain-an-Interactive-Stack-Display.md` — the interactive stack-of-tools display used on portfolio pages. → [[context-v/specs/Maintain-an-Interactive-Stack-Display.md]]
- `specs/Maintain-a-Dynamic-Multi-Product-Changelog.md` — changelog system spanning multiple products. → [[context-v/specs/Maintain-a-Dynamic-Multi-Product-Changelog.md]]
- `specs/Maintain-a-Rigorous-Test-Suite.md` — testing posture and coverage targets. → [[context-v/specs/Maintain-a-Rigorous-Test-Suite.md]]
- `specs/Portfolio-Wide-Job-Aggregator.md` — aggregator that surfaces jobs across the portfolio. → [[context-v/specs/Portfolio-Wide-Job-Aggregator.md]]
- `specs/In-The-News.md` — press / mentions feed surface. → [[context-v/specs/In-The-News.md]]

---

## `blueprints/` — how we build it

A **Blueprint** captures an implementation pattern that has been proven once and is ready to be copied into the next site or feature. Where a spec answers "what?", a blueprint answers "how, given the way *this* codebase actually works." Many blueprints are extracted *after* the first implementation lands.

Current contents:

- `blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md` — the two-tier token system (named tokens with `__` and semantic tokens with `-`), Tailwind v4 wiring, theme/mode runtime utilities. The single most-referenced blueprint. → [[context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md]]
- `blueprints/Maintain-Design-System-and-Brandkit-Motions.md` — conventions for the `/design-system` and `/brand-kit` pages every site ships, with the maintenance motion that replaces Storybook in our workflow. → [[context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md]]
- `blueprints/Maintain-Extended-Markdown-Render-Pipeline.md` — how to wire `@lossless-group/lfm` into a new site (the practical companion to the spec). → [[context-v/blueprints/Maintain-Extended-Markdown-Render-Pipeline.md]]
- `blueprints/Citation-System-Architecture.md` — how citations flow from `parseMarkdown()` through `AstroMarkdown.astro` into the `Sources` component. → [[context-v/blueprints/Citation-System-Architecture.md]]
- `blueprints/Codeblock-Syntax-Highlighting-with-Shiki.md` — the codeblock rendering pattern with Shiki. → [[context-v/blueprints/Codeblock-Syntax-Highlighting-with-Shiki.md]]
- `blueprints/Confidential-Content-Access-Control-Blueprint.md` — gating private/portfolio content behind auth. → [[context-v/blueprints/Confidential-Content-Access-Control-Blueprint.md]]
- `blueprints/GitHub-Secure-Content-Pattern.md` — fetching content from private GitHub repos at build time without leaking tokens. → [[context-v/blueprints/GitHub-Secure-Content-Pattern.md]]
- `blueprints/Maintain-an-Elegant-Open-Graph-System.md` — the OG image and meta-tag pipeline. → [[context-v/blueprints/Maintain-an-Elegant-Open-Graph-System.md]]
- `blueprints/Managing-Complex-Markdown-Content-at-Build-Time.md` — patterns for handling large or unusual markdown collections. → [[context-v/blueprints/Managing-Complex-Markdown-Content-at-Build-Time.md]]
- `blueprints/Slides-System-for-Astro-and-Markdown.md` and `blueprints/Maintain-Embeddable-Slides.md` — the slide-deck rendering system (the second is a newer iteration; expect them to merge). → [[context-v/blueprints/Slides-System-for-Astro-and-Markdown.md]] · [[context-v/blueprints/Maintain-Embeddable-Slides.md]]
- `blueprints/Maintain-an-Interactive-Polling-System.md` and `blueprints/Maintain-an-Interactive-Polling-System--v2.md` — the polling/feedback widgets (v1 and v2; v2 supersedes). → [[context-v/blueprints/Maintain-an-Interactive-Polling-System.md]] · [[context-v/blueprints/Maintain-an-Interactive-Polling-System--v2.md]]
- `blueprints/Jumbotron-Popdown-Patterns.md` — the hero / popdown interaction pattern used across site landing pages. → [[context-v/blueprints/Jumbotron-Popdown-Patterns.md]]
- `blueprints/Styles-Architecture-Blueprint.md` — the broader CSS / styles architecture this monorepo lands on. → [[context-v/blueprints/Styles-Architecture-Blueprint.md]]

---

## `prompts/` — the reusable conversations

A **Prompt** is a Claude Code conversation starter that has already paid off enough times to be worth keeping. Some are recipes ("set up a new site"), some are templates ("author a spec like ours"), some are creative briefs ("design a flare component for X"). Treat them as starting moves rather than scripts.

Current contents:

- `prompts/Author-a-Specification-Markdown-File-in-Context-V.md` — the prompt we use to draft new specs in this folder. **Use this when adding to `specs/`.** → [[context-v/prompts/Author-a-Specification-Markdown-File-in-Context-V.md]]
- `prompts/New-Site-Quickstart-Guide.md` — the long-form quickstart for spinning up a new site in `sites/*` (referenced from `CLAUDE.md`). → [[context-v/prompts/New-Site-Quickstart-Guide.md]]
- `prompts/Set-Up-Index-and-Basic-Components-using-Brand-Theme.md` — first-pass scaffolding once a brand theme is selected. → [[context-v/prompts/Set-Up-Index-and-Basic-Components-using-Brand-Theme.md]]
- `prompts/Implement-Context-V-Fetcher-for-mpstaton-site.md` — implementation prompt for the multi-repo fetcher spec. → [[context-v/prompts/Implement-Context-V-Fetcher-for-mpstaton-site.md]]
- `prompts/Implement-Portfolio-with-Confidential-Access-in-new-Site.md` — paired with the confidential-content blueprint. → [[context-v/prompts/Implement-Portfolio-with-Confidential-Access-in-new-Site.md]]
- `prompts/Introducing-Features-and-UI-Components.md` — the shape of a "introduce a new component" request. → [[context-v/prompts/Introducing-Features-and-UI-Components.md]]
- `prompts/Discuss-how-to-Publish-Long-Form-like-eBook.md` — open-ended conversation starter for long-form publishing. → [[context-v/prompts/Discuss-how-to-Publish-Long-Form-like-eBook.md]]
- `prompts/Sequential-Steps-or-Tasks-to-Workthrough.md` — meta-prompt for breaking a large request into a sequenced TaskList. → [[context-v/prompts/Sequential-Steps-or-Tasks-to-Workthrough.md]]
- `prompts/Removing-Unnecessary-Code-Step-by-Step.md` — careful refactor / deletion conversation. → [[context-v/prompts/Removing-Unnecessary-Code-Step-by-Step.md]]
- `prompts/Page__Partner-with-Us.md` — page-level brief for a "Partner with Us" page. → [[context-v/prompts/Page__Partner-with-Us.md]]
- `prompts/Flare__Concentric-Wobble-Rings.md` — creative brief for a "flare" decorative component (concentric wobble rings). → [[context-v/prompts/Flare__Concentric-Wobble-Rings.md]]

The `Page__` and `Flare__` prefixes are conventional namespaces — they say "this prompt produces a thing of this shape." Expect to see more of them.

---

## `reminders/` — the rules that don't change

**Reminders** are the smallest, most durable documents in the library. Each one should fit on a screen and answer one question: "What rule keeps tripping us up?" An assistant should be able to skim every reminder in under five minutes before starting work.

Current contents:

- `reminders/Astro-Knots-is-not-a-True-Monorepo.md` — the philosophical clarification at the heart of this repo. Sites must deploy independently; only `@lossless-group/*` packages are real shared dependencies. → [[context-v/reminders/Astro-Knots-is-not-a-True-Monorepo.md]]
- `reminders/Preferred-Stack.md` — the default stack choices and why. → [[context-v/reminders/Preferred-Stack.md]]
- `reminders/Tags-Must-Use-Train-Case.md` — strict naming rule for tags. → [[context-v/reminders/Tags-Must-Use-Train-Case.md]]
- `reminders/Quirks-of-Obsidian-Flavored-Markdown.md` — frontmatter quoting, underscore property names, tag arrays. The "frontmatter rules" reference. → [[context-v/reminders/Quirks-of-Obsidian-Flavored-Markdown.md]]
- `reminders/Design-System-Pages-Per-Site.md` — every site ships `/design-system` and `/brand-kit`; updates land in the same change as the component. → [[context-v/reminders/Design-System-Pages-Per-Site.md]]
- `reminders/Improvising-within-Design-System-Color-Palettes.md` — how to honor the two-tier token system when you have to invent a new color. → [[context-v/reminders/Improvising-within-Design-System-Color-Palettes.md]]
- `reminders/Flare-Components-Creative-Workflow.md` — how we develop "flare" decorative components. → [[context-v/reminders/Flare-Components-Creative-Workflow.md]]
- `reminders/Rule-to-Assure-Collection-Schema-is-Flexible.md` — content collections should not gatekeep with strict Zod; document shape, don't enforce it. → [[context-v/reminders/Rule-to-Assure-Collection-Schema-is-Flexible.md]]
- `reminders/Write-a-Changelog-Prior-to-Meaningful-Commits.md` — changelog discipline before commits that matter. → [[context-v/reminders/Write-a-Changelog-Prior-to-Meaningful-Commits.md]]

---

## `issue-resolution/` — bugs we don't want to fight twice

Each file documents a specific incident: what broke, why, what we tried, what actually fixed it, and any breadcrumbs (commit hashes, error strings) that would help an assistant recognize the same thing recurring. Future-us reads these so we don't burn an afternoon re-discovering the same root cause.

Current contents:

- `issue-resolution/Documentation-Gaps-Blocking-New-Site-Onboarding.md` — what was missing the last time we onboarded a new site, and what was added in response. → [[context-v/issue-resolution/Documentation-Gaps-Blocking-New-Site-Onboarding.md]]
- `issue-resolution/Issue-of-Saving-Stack-Edits.md` — `error:1E08010C:DECODER routines::unsupported` while saving stack edits on `fullstack-vc.com`. → [[context-v/issue-resolution/Issue-of-Saving-Stack-Edits.md]]
- `issue-resolution/Resolving-Mode-Switching-Across-Multiple-Components.md` — coordinating the mode (light/dark/vibrant) toggle across many components without flicker or drift. → [[context-v/issue-resolution/Resolving-Mode-Switching-Across-Multiple-Components.md]]
- `issue-resolution/Scripting-across-Multiple-Tables-in-NocoDB.md` — gotchas working across tables in NocoDB. → [[context-v/issue-resolution/Scripting-across-Multiple-Tables-in-NocoDB.md]]
- `issue-resolution/SSH-Key-Passphrase-Prompts.md` — taming repeated SSH passphrase prompts. → [[context-v/issue-resolution/SSH-Key-Passphrase-Prompts.md]]

---

## `explorations/` — open questions and landscape scans

**Explorations** are notes from before a decision is made. They survey options, weigh tradeoffs, and end without committing to one path. When an exploration *does* commit, it usually graduates into a spec or blueprint and the exploration stays as the receipt of that decision.

Current contents:

- `explorations/Choosing-the-Right-DataStores.md` — which datastore for which content shape (Obsidian-style queries included). → [[context-v/explorations/Choosing-the-Right-DataStores.md]]
- `explorations/Choosing-an-Image-Generator-for-Text-on-Background-Banners.md` — image-generation API landscape (Ideogram, etc.). → [[context-v/explorations/Choosing-an-Image-Generator-for-Text-on-Background-Banners.md]]
- `explorations/Web-Research-Agents-for-Content-Augmentation.md` — survey of agentic web-research tools we might integrate. → [[context-v/explorations/Web-Research-Agents-for-Content-Augmentation.md]]
- `explorations/Exploring-GitHub-Actions-for-Package-Publishing.md` — automation options for publishing `@lossless-group/*` packages. → [[context-v/explorations/Exploring-GitHub-Actions-for-Package-Publishing.md]]
- `explorations/Understanding-the-JavaScript-Runtime-and-Package-Manager-Landscape.md` — Bun / Deno / Node / pnpm landscape and tradeoffs. → [[context-v/explorations/Understanding-the-JavaScript-Runtime-and-Package-Manager-Landscape.md]]
- `explorations/New-Homebrew-Formulae-Worth-Knowing-About.md` — a running list of CLI tools worth adopting. → [[context-v/explorations/New-Homebrew-Formulae-Worth-Knowing-About.md]]

---

## `strategy/` — business and product strategy

This subfolder holds the "why we are doing this at all" notes — distribution, positioning, market. They are referenced sparingly during implementation but they anchor every other folder.

- `strategy/Exploring-Publishing-Component-Library-for-VC-Firms.md` — strategic exploration of publishing `@knots/*` as a component library aimed at VC firms (Web Components vs. shadcn-CLI distribution, etc.). → [[context-v/strategy/Exploring-Publishing-Component-Library-for-VC-Firms.md]]

---

## `sitemap/` — site, page, section, and component breakdowns

The `sitemap/` subtree mirrors a site's structure (`pages/`, `layouts/sections/`, `components/`) with one document per artifact. Each file is the brief that produces the artifact — the message hierarchy, the default copy, the props, the section composition. Filenames use a `Type__Name.md` prefix so the artifact type is visible at a glance.

- `sitemap/dojo_index.md` — brief for `dojo/index.astro`. → [[context-v/sitemap/dojo_index.md]]
- `sitemap/pages/team/Team-Pages-Specification.md` — the team pages spec. → [[context-v/sitemap/pages/team/Team-Pages-Specification.md]]
- `sitemap/pages/team/Team-Spans-Page-Spec.md` — team-spans page spec. → [[context-v/sitemap/pages/team/Team-Spans-Page-Spec.md]]
- `sitemap/layouts/sections/Section__Areas-of-Venture.md` — the "Areas of Venture" section composition. → [[context-v/sitemap/layouts/sections/Section__Areas-of-Venture.md]]
- `sitemap/components/Component__Message-Hierachy-Bare-Component.md` — bare message-hierarchy component (default copy, supporting text, CTA conventions). → [[context-v/sitemap/components/Component__Message-Hierachy-Bare-Component.md]]

(`Component__` and `Section__` are intentional double-underscore prefixes; they let Obsidian sort by artifact type within a flat list.)

---

## `extra/` — long-form source material

Background reading and source documents we *draw from* but do not render or ship. Helpful when an assistant needs deeper context on a topic that informs many specs.

- `extra/background-content/Perspectives & Practice (Voodoo Handbook) Class 20 Living Draft.md` — long-form source draft used as source material for several content surfaces. → [[context-v/extra/background-content/Perspectives & Practice (Voodoo Handbook) Class 20 Living Draft.md]]

---

## Loose at the root

A small number of documents live at the top level of `context-v/` because they don't yet fit a category neatly:

- `Papermark-Self-Hosted-Dataroom-Deployment.md` — self-hosting Papermark for a virtual data room (sharing memos, decks, due-diligence). Currently classified as a Blueprint draft; will likely move into `blueprints/`. → [[context-v/Papermark-Self-Hosted-Dataroom-Deployment.md]]

When a root file finds its category, move it. Don't let the root accumulate.

---

## Conventions worth absorbing in one pass

These are the conventions you'll see applied across the library. They are codified in `reminders/` but are summarized here so a fresh assistant doesn't need to context-switch on the first read:

1. **Train-Case file names and tags.** `Maintain-Themes-Mode-Across-CSS-Tailwind.md`, `tags: [Design-Tokens, Theme-Modes]`.
2. **Underscored frontmatter property names.** `date_modified`, `at_semantic_version`, `augmented_with` — never camelCase or kebab-case in YAML keys.
3. **Lede always present.** A one-line description that lets a reader (or assistant) decide in two seconds whether this is the right document.
4. **`status` is one of:** `Draft`, `Published`, `Superseded`. We do not gatekeep with stricter validation; status is a hint, not a contract.
5. **Wikilinks for cross-reference.** Inside any context-v document, prefer `[[context-v/path/to/File.md]]` over relative markdown links — Obsidian handles them natively and they survive moves better.
6. **Train-Case versioning when used.** `at_semantic_version: 0.0.2.0` (four-part where it matters: epoch, major, minor, patch).
7. **Author once, copy when needed.** A blueprint is the one place a pattern is *described*; sites *copy and adapt* the pattern. Don't dual-source.
8. **Update the index in the same change.** When you add a meaningful document to a category, add it to the relevant section of this README in the same commit. Otherwise the index rots.

---

## When this folder is doing its job, you should be able to:

- Hand a fresh Claude Code session this README and the relevant `reminders/` files and watch it produce work that *feels like the rest of the codebase* on the first try.
- Pull up a six-month-old decision and remember why we made it without paging through git history.
- Spin up a new site in an afternoon by reading [[context-v/prompts/New-Site-Quickstart-Guide.md]] and copying from the named reference sites it points to.
- Avoid re-fighting any bug that already has a file in `issue-resolution/`.

When it stops doing those things, the fix is almost always: **write the missing document, then add it to this index.**

---

## Companion reading

- The repo-level `CLAUDE.md` (one level up at `../CLAUDE.md`) — governs *how to build* (workspace commands, package vs. pattern, deployment constraints).
- The public framing of Context Vigilance — <https://www.lossless.group/projects/gallery/context-vigilance>.
- The first published artifact this library produced — `@lossless-group/lfm` on GitHub Packages and JSR. Spec: [[context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md]].
