---
title: "Wikilink Path Audit — mpstaton-site"
lede: "Every Obsidian-style wikilink in mpstaton-site's content, grouped by top-level prefix. Edit each entry to set `path_resolved: true` and fill in `resolved_url`; the collected mappings become the EXTERNAL_DESTINATIONS config for the site's wikilink resolver."
date_generated: 2026-05-08
date_modified: 2026-05-08
status: Generated
category: Audits
tags: [LFM, Wikilinks, Audit, Generated, mpstaton-site]
related:
  - "[[Wikilink-Resolution-System]]"
total_unique_paths: 354
total_occurrences: 495
generated_by: scripts/audit-wikilinks.ts
---

# Wikilink Path Audit — mpstaton-site

Generated automatically by `sites/mpstaton-site/scripts/audit-wikilinks.ts`. Re-run to refresh: `pnpm --filter mpstaton-site audit-wikilinks` (or `bun scripts/audit-wikilinks.ts` from the site root).

This file is the worklist for the wikilink resolution effort described in `[[Wikilink-Resolution-System]]`. Each unique wikilink path appears exactly once (case-insensitive — variant casings collapse into one entry), even if it shows up in multiple essays.

**For prefix-grouped entries** (the bulk of this doc):

1. Decide whether the path resolves locally (a content collection on this site) or externally (lossless.group, sibling Astro Knots site, etc.).
2. Set `resolved_url:` to the destination URL or local route.
3. Flip `path_resolved: true`.
4. Use the `notes:` field to capture decision rationale, ambiguities, or follow-ups.

Once enough entries within a prefix group resolve consistently, the prefix-level pattern is obvious — that's when the site's `EXTERNAL_DESTINATIONS` config gets written from this audit.

**For bare wikilinks and absolute-path wikilinks** (the two sections at the top): these are not destined for the config — they're triage-worklist items the author addresses in source content (or accepts as unresolvable). Per the operating principle codified in `[[Wikilink-Resolution-System]]`, **unresolved wikilinks render as plain text** in essays. Supporting 40% of the intended wikilinks is better than supporting none.

## Summary

- **Unique wikilink paths:** 354
- **Total occurrences across content:** 495
- **Distinct top-level prefixes:** 15
- **Resolved (rules in `scripts/wikilink-rules.ts`):** 208 / 354 (59%)
- **Deferred (deliberately parked):** 44
- **Remaining to triage:** 102
- **Active rules:** 7 prefix rules, 0 exact rules, 2 deferred prefixes

| Prefix | Unique | Occurrences | Resolved | Deferred | % |
|---|---|---|---|---|---|
| `(bare — no prefix)` | 91 | 120 | 0 | 0 | 0% |
| `(absolute filesystem paths)` | 1 | 1 | 0 | 0 | 0% |
| `client-content/` | 2 | 2 | 0 | 0 | 0% |
| `concepts/` | 48 | 71 | 48 | 0 | 100% |
| `context-v/` | 6 | 12 | 0 | 0 | 0% |
| `essays/` | 11 | 14 | 11 | 0 | 100% |
| `lost-in-public/` | 1 | 3 | 1 | 0 | 100% |
| `organizations/` | 41 | 59 | 0 | 41 | 0% |
| `projects/` | 24 | 29 | 24 | 0 | 100% |
| `slides/` | 1 | 1 | 0 | 0 | 0% |
| `sources/` | 6 | 6 | 6 | 0 | 100% |
| `specs/` | 1 | 2 | 0 | 0 | 0% |
| `tooling/` | 77 | 104 | 77 | 0 | 100% |
| `vertical-toolkits/` | 3 | 3 | 0 | 3 | 0% |
| `vocabulary/` | 41 | 68 | 41 | 0 | 100% |

## Bare wikilinks (no prefix)

These are legacy artifacts from before an Obsidian setting that requires path-prefixed wikilinks was enabled. Many point to "stub files" at the vault root that haven't been moved into a folder yet. **The resolver will not attempt to resolve these** — they render as plain text in essays. Three triage options:

1. Open the source file in Obsidian and let Obsidian auto-update the wikilink when you move the stub into a proper folder (`Vocabulary/`, `concepts/`, etc.).
2. Run a future `scripts/fix-bare-wikilinks.ts` (not yet built) that takes a content folder + target prefix and rewrites bare wikilinks in source.
3. Accept that the wikilink renders as plain text until the underlying stub is organized.

You can leave `path_resolved: false` on every entry in this section — they're intentionally non-resolvable. Use `notes:` to flag any specific stub that's a priority to organize.

```yaml
- path: ...sign-in
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/blueprints/Confidential-Content-Access-Control-Blueprint.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: 2024-09-12
  display_examples: []
  occurrences: 1
  files:
    - "essays/The New New Founder Stack.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "acceptance testing"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: agentfarm
  display_examples: []
  occurrences: 1
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "ai jason"
  display_examples: []
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: aider
  display_examples: []
  occurrences: 1
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "alexander cowan"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Consistent Go-to-Market.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "api as a service"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: appgen
  display_examples: []
  occurrences: 1
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "arch linux"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Why Everyone needs to become a Linux User.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: axioshq
  display_examples: []
  occurrences: 1
  files:
    - "essays/The New New Founder Stack.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "b.j. fogg"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: baidu
  display_examples: []
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "behavioral economics"
  display_examples: []
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "buckminster fuller"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Give them a Tool.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: citation-system-architecture
  display_examples: ["citation spec", "citation system"]
  occurrences: 2
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "clayton christensen"
  display_examples: []
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: codifying-a-comprehensive-extended-markdown-flavor-and-shared-package
  display_examples: []
  occurrences: 3
  files:
    - context-v/astro-knots/specs/Versatile-Component-Library-for-Video-Players.md  # 3×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: containerd
  display_examples: []
  occurrences: 1
  files:
    - "essays/How Docker Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: cursor
  display_examples: []
  occurrences: 1
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "decision heuristics"
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "deployment automation"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "development environment"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: devpost
  display_examples: []
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "disciplined entrepreneurship"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Consistent Go-to-Market.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: divas
  display_examples: []
  occurrences: 1
  files:
    - "essays/Embrace Pirates or See Mutiny.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "eelco dolstra"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: eleutherai
  display_examples: []
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "enabling technology accelerants"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Tectonic Shifts and Business Configuration.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: enzymedica
  display_examples: []
  occurrences: 4
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 4×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "ephemeral environments"
  display_examples: []
  occurrences: 2
  files:
    - "essays/How Docker Changed Everything.md"  # 1×
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: filename.md
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: firecrawl
  display_examples: []
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: github
  display_examples: []
  occurrences: 10
  files:
    - "essays/How GitHub Changed Everything.md"  # 10×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "gpt-series models"
  display_examples: [GPT3]
  occurrences: 2
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: holacracy
  display_examples: []
  occurrences: 1
  files:
    - "essays/Holacracy-Inspired Reorganization.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "image.png\"
  display_examples: [300]
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: img_2246.png
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: img_2248.png
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: jina.ai
  display_examples: []
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "kauffman fellows"
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: kibala
  display_examples: []
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "knowledge augmented generation"
  display_examples: [KAG]
  occurrences: 1
  files:
    - "essays/From Rags to Riches.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "large language models"
  display_examples: []
  occurrences: 2
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "legend state"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "limited partners"
  display_examples: []
  occurrences: 3
  files:
    - context-v/astro-knots/prompts/Introducing-Features-and-UI-Components.md  # 1×
    - context-v/astro-knots/prompts/Removing-Unnecessary-Code-Step-by-Step.md  # 1×
    - context-v/astro-knots/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: links
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "loss aversion"
  display_examples: []
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: maintain-themes-mode-across-css-tailwind
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Versatile-Component-Library-for-Video-Players.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: meta-rag
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "metadata catalogs"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "mimetic theory"
  display_examples: []
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "model wrappers"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "o-series models"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "open source"
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: openai
  display_examples: []
  occurrences: 2
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "operational security"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "other chapter"
  display_examples: []
  anchors: [Section]
  occurrences: 2
  files:
    - context-v/astro-knots/prompts/Discuss-how-to-Publish-Long-Form-like-eBook.md  # 1×
    - context-v/astro-knots/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: other-book
  display_examples: []
  anchors: [Chapter]
  occurrences: 1
  files:
    - context-v/astro-knots/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: other-document.md
  display_examples: []
  anchors: [specific-heading]
  occurrences: 2
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "page name"
  display_examples: []
  occurrences: 2
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "page name\"
  display_examples: ["Display Text"]
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "page that does not exist"
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "page title"
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "pasted image 20250216184410_github_chart--repository-growth.png"
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "poe ai"
  display_examples: []
  occurrences: 2
  files:
    - "essays/How Docker Changed Everything.md"  # 1×
    - "essays/Tectonic Shifts and Business Configuration.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "proxy chains"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "related document title"
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "reverse shells"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "roy fielding"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "rs build"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "ryan dahl"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "screenshot 2025-02-02 at 12.49.07 pm_dart-eval--github.png"
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: spider
  display_examples: []
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "sqale index"
  display_examples: []
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "standards organizations"
  display_examples: ["Standards Organization"]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "strangler fig pattern"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "the idea factory"
  display_examples: []
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: ubuntu
  display_examples: []
  occurrences: 1
  files:
    - "essays/Why Everyone needs to become a Linux User.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: uv
  display_examples: []
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: versatile-component-library-for-video-players
  display_examples: []
  occurrences: 3
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 3×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: vite
  display_examples: []
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: vitest
  display_examples: []
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "web standards"
  display_examples: ["Web Standard"]
  occurrences: 2
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: wikilinks
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: wikipedia
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "workflow management"
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: yamedi
  display_examples: []
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "yifan - beyond the hype"
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: youtube
  display_examples: []
  occurrences: 2
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
    - "essays/On Data Gathering.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "zero day markets"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~
```

## Absolute filesystem paths (Obsidian artifacts)

Wikilinks containing absolute Unix paths, almost certainly from a non-Obsidian move/rename of a vault file (an IDE rename, a `git mv`, etc.). Obsidian only auto-updates wikilinks when it observes the move itself; these were stranded. **The resolver treats them as unresolved** (renders as plain text). Fix in source by editing the offending file; Obsidian won't help here.

```yaml
- path: /users/mpstaton/content-md/lossless/specs/search-and-summarize-obsidian-app.md
  display_examples: [Search-and-Summarize-Obsidian-App]
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~
```

## `client-content/` — 2 unique paths

```yaml
- path: "client-content/laerdal/sources/laerdal entities/data & analytics"
  display_examples: []
  occurrences: 1
  files:
    - "essays/From Rags to Riches.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: "client-content/laerdal/sources/laerdal entities/executive management"
  display_examples: []
  occurrences: 1
  files:
    - "essays/From Rags to Riches.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~
```

## `concepts/` — 48 unique paths

```yaml
- path: "concepts/abstract syntax trees"
  display_examples: [AST, "Abstract Syntax Trees"]
  occurrences: 2
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/abstract-syntax-trees"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: concepts/carbs
  display_examples: [CARBS]
  occurrences: 2
  files:
    - "essays/From Rags to Riches.md"  # 1×
    - "essays/Load up on CARBS.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/carbs"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/continuous integration and continuous delivery"
  display_examples: [CI/CD, "Continuous Integration and Continuous Delivery"]
  occurrences: 2
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/continuous-integration-and-continuous-delivery"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/contrarian talent"
  display_examples: ["Contrarian Talent"]
  occurrences: 1
  files:
    - "essays/Embrace Pirates or See Mutiny.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/contrarian-talent"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: concepts/devsecops
  display_examples: []
  occurrences: 2
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/devsecops"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/ai assistants"
  display_examples: ["Virtual Assistants"]
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/ai-assistants"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/ai powered content generation"
  display_examples: ["AI Powered Content Generation"]
  occurrences: 1
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/ai-powered-content-generation"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/ai powered data capture"
  display_examples: ["AI Powered Data Capture"]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/ai-powered-data-capture"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/ai reasoning"
  display_examples: [Reasoning-based-Models]
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/ai-reasoning"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/artificial intelligence"
  display_examples: [AI, "Artificial Intelligence"]
  occurrences: 5
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 2×
    - "essays/From Rags to Riches.md"  # 1×
    - "essays/On Data Gathering.md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/artificial-intelligence"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/chain of draft"
  display_examples: ["Chain of Draft"]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/chain-of-draft"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/code generators"
  display_examples: ["Code Generator AI", "Code Generators"]
  occurrences: 3
  files:
    - "essays/Non-Engineers become Prototypers..md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/code-generators"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/constitutional ai"
  display_examples: ["Constitutional AI"]
  occurrences: 1
  files:
    - "essays/AI is Full of Hot Air.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/constitutional-ai"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/conversational rag"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/conversational-rag"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/home labs"
  display_examples: ["Home Labs"]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/home-labs"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/knowledge base ai"
  display_examples: ["Knowledge Base AI"]
  occurrences: 1
  files:
    - "essays/From Rags to Riches.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/knowledge-base-ai"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/mcp servers"
  display_examples: ["MCP Servers"]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/mcp-servers"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/model api"
  display_examples: ["Model API"]
  occurrences: 1
  files:
    - "essays/Why Vertical Wrappers have better Odds for Investors.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/model-api"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/model context protocol"
  display_examples: ["Model Context Protocol"]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/model-context-protocol"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/structured outputs"
  display_examples: ["Structured Outputs"]
  occurrences: 1
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/structured-outputs"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for ai/tokens"
  display_examples: [Tokens]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-ai/tokens"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for tooling/advanced documents"
  display_examples: ["Advanced Documents"]
  occurrences: 1
  files:
    - "essays/The New New Founder Stack.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-tooling/advanced-documents"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for tooling/enterprise resource planning"
  display_examples: ["Enterprise Resource Planning"]
  occurrences: 1
  files:
    - "essays/Are Code Generators really the Death of SaaS.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-tooling/enterprise-resource-planning"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for tooling/knowledge management"
  display_examples: ["Knowledge Management"]
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-tooling/knowledge-management"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for tooling/learning experience platforms"
  display_examples: ["Learning Experience Platforms"]
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-tooling/learning-experience-platforms"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for tooling/predictive analytics"
  display_examples: ["Predictive Analytics"]
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-tooling/predictive-analytics"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/explainers for tooling/test pyramid architecture"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/explainers-for-tooling/test-pyramid-architecture"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/hypothesis-driven development"
  display_examples: ["Hypothesis-Driven Development"]
  occurrences: 1
  files:
    - "essays/Consistent Go-to-Market.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/hypothesis-driven-development"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: concepts/infrastructure-as-code
  display_examples: ["Infrastructure as Code"]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/infrastructure-as-code"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/legacy system modernization"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/legacy-system-modernization"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: concepts/lossless
  display_examples: [Lossless]
  occurrences: 6
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 6×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/lossless"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/minimum viable product"
  display_examples: [MVPs]
  occurrences: 1
  files:
    - "essays/From Qualitative Love to Quantitative Love.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/minimum-viable-product"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/naming conventions"
  display_examples: ["Naming Conventions"]
  occurrences: 2
  files:
    - "essays/From Rags to Riches.md"  # 1×
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/naming-conventions"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/open innovation"
  display_examples: ["Open Innovation"]
  occurrences: 1
  files:
    - "essays/Embrace Pirates or See Mutiny.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/open-innovation"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/open specifications"
  display_examples: ["Open Specification"]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/open-specifications"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/persuasive technology"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/persuasive-technology"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/platform engineering"
  display_examples: ["Platform Engineering"]
  occurrences: 2
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/platform-engineering"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/product marketing"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Jaded Product Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/product-marketing"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/product-led growth"
  display_examples: ["Product-Led Growth"]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/product-led-growth"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/psychological safety"
  display_examples: ["Psychological Safety"]
  occurrences: 2
  files:
    - "essays/Embrace Pirates or See Mutiny.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/psychological-safety"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/repository management"
  display_examples: ["Repository Management"]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/repository-management"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/security-first development"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/security-first-development"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/standardized workspaces"
  display_examples: ["Standardized Workspaces"]
  occurrences: 1
  files:
    - "essays/How Docker Changed Everything.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/standardized-workspaces"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/state of the art"
  display_examples: ["State of the Art"]
  occurrences: 2
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/state-of-the-art"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/technical debt"
  display_examples: ["Technical Debt"]
  occurrences: 2
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/technical-debt"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/test-driven development"
  display_examples: ["Test-Driven Development"]
  occurrences: 2
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/test-driven-development"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/venture design"
  display_examples: []
  anchors: ["^7a07f1"]
  occurrences: 2
  files:
    - "essays/Consistent Go-to-Market.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/venture-design"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "concepts/version control"
  display_examples: ["Version Control"]
  occurrences: 2
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
    - "essays/How Docker Changed Everything.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/version-control"
  is_local: false
  destination: "Lossless More-About"
  notes: ~
```

## `context-v/` — 6 unique paths

```yaml
- path: context-v/blueprints/maintain-design-system-and-brandkit-motions
  display_examples: ["Design System maintenance motion"]
  occurrences: 3
  files:
    - context-v/astro-knots/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md  # 1×
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: context-v/blueprints/maintain-themes-mode-across-css-tailwind
  display_examples: ["two-tier token convention"]
  occurrences: 3
  files:
    - context-v/astro-knots/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md  # 1×
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: context-v/prompts/discuss-how-to-publish-long-form-like-ebook
  display_examples: []
  occurrences: 2
  files:
    - context-v/astro-knots/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: context-v/specs/codifying-a-comprehensive-extended-markdown-flavor-and-shared-package
  display_examples: []
  occurrences: 2
  files:
    - context-v/astro-knots/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: context-v/specs/dynamic-webpage-to-display-portfolio-w-authentication
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~

- path: context-v/specs/remark-citations-plugin-for-hex-code-footnote-management
  display_examples: []
  occurrences: 1
  files:
    - context-v/astro-knots/specs/An-Internet-Friendly-Responsive-UI-for-Longform-Writing.md  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~
```

## `essays/` — 11 unique paths

```yaml
- path: "essays/a theory of lossless innovation"
  display_examples: ["A Theory of Lossless Innovation"]
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/a-theory-of-lossless-innovation
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: "essays/back to the future"
  display_examples: ["Back to the Future"]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/back-to-the-future
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: essays/chapter1.md
  display_examples: ["Chapter 1: Getting Started", "Chapter 2"]
  occurrences: 2
  files:
    - context-v/astro-knots/blueprints/Maintain-Embeddable-Slides.md  # 2×
  status: resolved
  path_resolved: true
  resolved_url: /essays/chapter1.md
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: essays/chapter2.md
  display_examples: ["Chapter 2: Advanced Topics"]
  occurrences: 1
  files:
    - context-v/astro-knots/blueprints/Maintain-Embeddable-Slides.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/chapter2.md
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: essays/deep-learning.md
  display_examples: ["Deep Learning Fundamentals"]
  occurrences: 1
  files:
    - context-v/astro-knots/blueprints/Maintain-Embeddable-Slides.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/deep-learning.md
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: essays/intro.md
  display_examples: [Introduction]
  occurrences: 2
  files:
    - context-v/astro-knots/blueprints/Maintain-Embeddable-Slides.md  # 2×
  status: resolved
  path_resolved: true
  resolved_url: /essays/intro.md
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: essays/my-presentation.md
  display_examples: ["Introduction to AI"]
  occurrences: 1
  files:
    - context-v/astro-knots/blueprints/Maintain-Embeddable-Slides.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/my-presentation.md
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: essays/neural-networks.md
  display_examples: ["Neural Network Architecture"]
  occurrences: 1
  files:
    - context-v/astro-knots/blueprints/Maintain-Embeddable-Slides.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/neural-networks.md
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: "essays/technology wants to be emergent"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/technology-wants-to-be-emergent
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: "essays/the ai model wars"
  display_examples: ["The AI Model Wars"]
  occurrences: 2
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
    - "essays/Why Vertical Wrappers have better Odds for Investors.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/the-ai-model-wars
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~

- path: "essays/the power of challenges"
  display_examples: ["The Power of Challenges"]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: /essays/the-power-of-challenges
  is_local: true
  destination: "mpstaton-site (local)"
  notes: ~
```

## `lost-in-public/` — 1 unique path

```yaml
- path: "lost-in-public/to-hero/customizing tailwind"
  display_examples: ["Customizing Tailwind"]
  occurrences: 3
  files:
    - context-v/astro-knots/prompts/Introducing-Features-and-UI-Components.md  # 1×
    - context-v/astro-knots/prompts/Removing-Unnecessary-Code-Step-by-Step.md  # 1×
    - context-v/astro-knots/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/learn-with/to-hero/customizing-tailwind"
  is_local: false
  destination: "Lossless Learn-With"
  notes: ~
```

## `organizations/` — 41 unique paths

```yaml
- path: organizations/amazon
  display_examples: [Amazon]
  occurrences: 1
  files:
    - "essays/The Irony of UI Stability.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/antler
  display_examples: [Antler]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/apple
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/atlassian\"
  display_examples: [Atlassian]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/bell labs"
  display_examples: ["Bell Labs"]
  occurrences: 3
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 3×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/codeium\"
  display_examples: [Codeium]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/darpa
  display_examples: [DARPA]
  occurrences: 3
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 2×
    - "essays/The Power of Challenges.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/deepmind
  display_examples: []
  occurrences: 2
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 2×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/deepmind\"
  display_examples: [DeepMind]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/devzero
  display_examples: []
  occurrences: 1
  files:
    - "essays/How Docker Changed Everything.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/facebook
  display_examples: [Facebook]
  occurrences: 1
  files:
    - "essays/The Irony of UI Stability.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/framework
  display_examples: [Framework]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/google
  display_examples: [Google]
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/google research"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/harvard business school"
  display_examples: ["Harvard Business School"]
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/ibm
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/internet engineering task force"
  display_examples: []
  occurrences: 2
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/iso
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/kodak
  display_examples: [Kodak]
  occurrences: 3
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 3×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/meta
  display_examples: [Meta]
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/microsoft\"
  display_examples: [Microsoft]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/moore threads"
  display_examples: ["Moore Threads"]
  occurrences: 1
  files:
    - "essays/The AI Model Wars.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/national institute of standards and technology"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/nixos
  display_examples: [NixOS]
  occurrences: 2
  files:
    - "essays/How Docker Changed Everything.md"  # 1×
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/nvidia
  display_examples: [NVIDIA]
  occurrences: 2
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 2×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/oasis open"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/paani foundation"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/parc
  display_examples: [PARC]
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/protein structure prediction center"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/reddit
  display_examples: [Reddit]
  occurrences: 1
  files:
    - "essays/The Irony of UI Stability.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/society for human resource management"
  display_examples: []
  occurrences: 2
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 2×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/stanford university"
  display_examples: ["Stanford University"]
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/texas instruments"
  display_examples: ["Texas Instruments"]
  occurrences: 4
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
    - "essays/Timeline of Milestones in Technology.md"  # 3×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/the apache software foundation"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/the internet society"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: "organizations/the linux foundation"
  display_examples: [Linux, "The Linux Foundation"]
  occurrences: 3
  files:
    - "essays/Technology wants to be Emergent.md"  # 2×
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/transcend
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/tsmc
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/whatsapp
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Irony of UI Stability.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/x
  display_examples: [Twitter]
  occurrences: 1
  files:
    - "essays/The Irony of UI Stability.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~

- path: organizations/xerox
  display_examples: [Xerox]
  occurrences: 3
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 3×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Organization profiles aren't published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them)."
  notes: ~
```

## `projects/` — 24 unique paths

```yaml
- path: projects/augment-it/high-level-architecture/api
  display_examples: [API]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/augment-it/high-level-architecture/api"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/context-vigilance/philosophy/best-practices
  display_examples: [Best-Practices]
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/context-vigilance/philosophy/best-practices"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/examples/adams prize"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/examples/adams-prize"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/examples/casp prize"
  display_examples: []
  occurrences: 2
  files:
    - "essays/The Power of Challenges.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/examples/casp-prize"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/examples/darpa grand challenge"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/examples/darpa-grand-challenge"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/examples/farmer cup"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/examples/farmer-cup"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/examples/kremer prize"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/examples/kremer-prize"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/examples/vesuvius challenge"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/examples/vesuvius-challenge"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/examples/volta prize"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Power of Challenges.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/examples/volta-prize"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/standards/(ssh) secure shell"
  display_examples: []
  occurrences: 2
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/(ssh)-secure-shell"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/standards/compute unified device architecture"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/compute-unified-device-architecture"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/standards/extensible markup language"
  display_examples: [XML]
  occurrences: 1
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/extensible-markup-language"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/https
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/https"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/json
  display_examples: [JSON]
  occurrences: 1
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/json"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/markdown
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/markdown"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/oauth
  display_examples: []
  occurrences: 2
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/oauth"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/ocsp
  display_examples: []
  occurrences: 2
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/ocsp"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/standards/one-time password"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/one-time-password"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/standards/open graph protocol"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Jaded Product Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/open-graph-protocol"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/opencl
  display_examples: ["Open Computing Language"]
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/opencl"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/rsa
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/rsa"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/slsa
  display_examples: [SLSA]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/slsa"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: "projects/emergent-innovation/standards/wi-fi protected access"
  display_examples: [WPA]
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/wi-fi-protected-access"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~

- path: projects/emergent-innovation/standards/xacml
  display_examples: []
  occurrences: 2
  files:
    - "essays/Web Security is about Preventing Naivety.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/projects/gallery/emergent-innovation/standards/xacml"
  is_local: false
  destination: "Lossless Project Gallery"
  notes: ~
```

## `slides/` — 1 unique path

```yaml
- path: slides/git-basics
  display_examples: ["Git Basics for Teams"]
  occurrences: 1
  files:
    - "essays/Consistent Go-to-Market.md"  # 1×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~
```

## `sources/` — 6 unique paths

```yaml
- path: sources/books/originals
  display_examples: [Originals]
  occurrences: 1
  files:
    - "essays/Embrace Pirates or See Mutiny.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/sources/books/originals"
  is_local: false
  destination: "Lossless Sources"
  notes: ~

- path: "sources/books/the lean startup"
  display_examples: ["The Lean Startup"]
  occurrences: 1
  files:
    - "essays/From Qualitative Love to Quantitative Love.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/sources/books/the-lean-startup"
  is_local: false
  destination: "Lossless Sources"
  notes: ~

- path: sources/media/youtube
  display_examples: [YouTube]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/sources/media/youtube"
  is_local: false
  destination: "Lossless Sources"
  notes: ~

- path: "sources/people/aaron swartz"
  display_examples: []
  occurrences: 1
  files:
    - "essays/The Irony of UI Stability.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/sources/people/aaron-swartz"
  is_local: false
  destination: "Lossless Sources"
  notes: ~

- path: "sources/people/andrej karpathy"
  display_examples: ["Andrej Karpathy"]
  occurrences: 1
  files:
    - "essays/Non-Engineers become Prototypers..md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/sources/people/andrej-karpathy"
  is_local: false
  destination: "Lossless Sources"
  notes: ~

- path: "sources/people/james clerk maxwell"
  display_examples: ["James Clerk Maxwell"]
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/sources/people/james-clerk-maxwell"
  is_local: false
  destination: "Lossless Sources"
  notes: ~
```

## `specs/` — 1 unique path

```yaml
- path: specs/ai-powered-link-aggregator-for-product-digital-footprint
  display_examples: [AI-Powered-Link-Aggregator-for-Product-Digital-Footprint]
  occurrences: 2
  files:
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 2×
  status: unresolved
  path_resolved: false
  resolved_url: ~
  notes: ~
```

## `tooling/` — 77 unique paths

```yaml
- path: "tooling/ai-toolkit/agentic ai/agentic workspaces/n8n"
  display_examples: [n8n]
  occurrences: 1
  files:
    - "essays/Consistent Go-to-Market.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/agentic-ai/agentic-workspaces/n8n"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/ai infrastructure/coreweave"
  display_examples: [CoreWeave]
  occurrences: 1
  files:
    - "essays/The AI Model Wars.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/ai-infrastructure/coreweave"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/ai infrastructure/crusoe"
  display_examples: [Crusoe]
  occurrences: 1
  files:
    - "essays/The AI Model Wars.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/ai-infrastructure/crusoe"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/data augmenters/apify"
  display_examples: []
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/data-augmenters/apify"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/data augmenters/diffbot"
  display_examples: [Diffbot]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/data-augmenters/diffbot"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/data augmenters/gretel.ai"
  display_examples: [Gretel.ai]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/data-augmenters/gretel.ai"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/data augmenters/scaleai"
  display_examples: []
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/data-augmenters/scaleai"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/data augmenters/scrapegraphai"
  display_examples: [ScrapeGraphAI]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/data-augmenters/scrapegraphai"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/data augmenters/tavily ai"
  display_examples: ["Tavily AI"]
  occurrences: 3
  files:
    - "essays/AI is Full of Hot Air.md"  # 1×
    - "essays/On Data Gathering.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/data-augmenters/tavily-ai"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/generative ai/clarice"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/generative-ai/clarice"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/generative ai/code generators/appmap"
  display_examples: [AppMap]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/generative-ai/code-generators/appmap"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/generative ai/code generators/zed\"
  display_examples: [Zed]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/generative-ai/code-generators/zed\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/knowledge ai/cohere"
  display_examples: [Cohere]
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/knowledge-ai/cohere"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/anthropic"
  display_examples: [Anthropic]
  occurrences: 4
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
    - "essays/AI is Full of Hot Air.md"  # 1×
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/anthropic"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/anthropic\"
  display_examples: [Anthropic]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/anthropic\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/deepseek"
  display_examples: [DeepSeek]
  occurrences: 2
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/deepseek"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/deepset\"
  display_examples: [Deepset]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/deepset\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/graphon"
  display_examples: [Graphon]
  occurrences: 1
  files:
    - "essays/The AI Model Wars.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/graphon"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/mistral"
  display_examples: [Mistral]
  occurrences: 2
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/mistral"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/openai"
  display_examples: [OpenAI]
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/openai"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/model producers/openai\"
  display_examples: [OpenAI]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/model-producers/openai\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: tooling/ai-toolkit/models/claude
  display_examples: [Claude]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/models/claude"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: tooling/ai-toolkit/models/gemini
  display_examples: [Gemini]
  occurrences: 2
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/models/gemini"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/models/gpt-series models"
  display_examples: [GPT, "GPT-Series Models"]
  occurrences: 2
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/models/gpt-series-models"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/models/ibm watson"
  display_examples: ["IBM Watson"]
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/models/ibm-watson"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: tooling/ai-toolkit/models/llama
  display_examples: [LLaMA]
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/models/llama"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/ai-toolkit/models/o-series models"
  display_examples: [o]
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/models/o-series-models"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: tooling/ai-toolkit/models/qwen
  display_examples: [Qwen]
  occurrences: 1
  files:
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/ai-toolkit/models/qwen"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: tooling/creative/canva
  display_examples: [Canva]
  occurrences: 1
  files:
    - "essays/Load up on CARBS.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/creative/canva"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/brightdata"
  display_examples: [BrightData]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/brightdata"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/browserless"
  display_examples: [browserless]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/browserless"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/datawrapper"
  display_examples: []
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/datawrapper"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/flourish studio"
  display_examples: ["Flourish Studio"]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/flourish-studio"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/jupyter notebooks"
  display_examples: ["Jupyter Notebooks"]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/jupyter-notebooks"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/kafka"
  display_examples: [Kafka]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/kafka"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/lakefs"
  display_examples: [LakeFS]
  occurrences: 2
  files:
    - "essays/AI is first a Trojan Horse.md"  # 1×
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/lakefs"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/marimo"
  display_examples: [Marimo]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/marimo"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/powerbi"
  display_examples: [PowerBI]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/powerbi"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/data utilities/tableau"
  display_examples: [Tableau]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/data-utilities/tableau"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/enterprise jobs-to-be-done/apollo\"
  display_examples: [Apollo]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/enterprise-jobs-to-be-done/apollo\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/enterprise jobs-to-be-done/plotly"
  display_examples: [Plotly]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/enterprise-jobs-to-be-done/plotly"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/enterprise jobs-to-be-done/rossum aurora"
  display_examples: ["Rossum Aurora"]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/enterprise-jobs-to-be-done/rossum-aurora"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/enterprise jobs-to-be-done/trello"
  display_examples: [Trello]
  occurrences: 1
  files:
    - "essays/Load up on CARBS.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/enterprise-jobs-to-be-done/trello"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/productivity/async communication/microsoft teams"
  display_examples: ["Microsoft Teams"]
  occurrences: 1
  files:
    - "essays/Load up on CARBS.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/productivity/async-communication/microsoft-teams"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: tooling/productivity/omakub
  display_examples: [Omakub]
  occurrences: 1
  files:
    - "essays/Why Everyone needs to become a Linux User.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/productivity/omakub"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/productivity/web meetings/zoom"
  display_examples: [Zoom]
  occurrences: 1
  files:
    - "essays/Load up on CARBS.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/productivity/web-meetings/zoom"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: tooling/products/git
  display_examples: [Git]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/products/git"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/cloud infrastructure/amazon web services\"
  display_examples: [AWS]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/cloud-infrastructure/amazon-web-services\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/cloud infrastructure/cloudflare\"
  display_examples: [Cloudflare]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/cloud-infrastructure/cloudflare\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/cloud infrastructure/replit\"
  display_examples: [Replit]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/cloud-infrastructure/replit\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/databases/supabase"
  display_examples: [Supabase]
  occurrences: 1
  files:
    - "essays/Win the Market on Getting Started.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/databases/supabase"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devops/docker"
  display_examples: [Docker]
  occurrences: 3
  files:
    - "essays/How Docker Changed Everything.md"  # 3×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devops/docker"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devops/grafana labs"
  display_examples: [Grafana]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devops/grafana-labs"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devops/pulumi"
  display_examples: [Pulumi]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devops/pulumi"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devops/sapling scm"
  display_examples: ["Sapling SCM"]
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devops/sapling-scm"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devops/sourcegraph"
  display_examples: [Sourcegraph]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devops/sourcegraph"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devops/sourcegraph\"
  display_examples: [Sourcegraph]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devops/sourcegraph\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devtools/bazel"
  display_examples: []
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devtools/bazel"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devtools/playwright"
  display_examples: [Playwright]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devtools/playwright"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devtools/puppeteer"
  display_examples: [Puppeteer]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devtools/puppeteer"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/devtools/vega"
  display_examples: [Vega]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/devtools/vega"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/developer experience/github\"
  display_examples: [GitHub]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/developer-experience/github\"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/devops/developer experience/garuda linux"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Why Everyone needs to become a Linux User.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/devops/developer-experience/garuda-linux"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/devops/developer experience/linear"
  display_examples: []
  occurrences: 1
  files:
    - "essays/How GitHub Changed Everything.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/devops/developer-experience/linear"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/devops/upsun"
  display_examples: [Upsun]
  occurrences: 3
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
    - "essays/Non-Engineers become Prototypers..md"  # 1×
    - "essays/Software Development with Code Generators.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/devops/upsun"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/devtools/node.js"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Timeline of Milestones in Technology.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/devtools/node.js"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/frameworks/frontend/ui frameworks/tailwind"
  display_examples: [Tailwind]
  occurrences: 4
  files:
    - context-v/astro-knots/prompts/Introducing-Features-and-UI-Components.md  # 1×
    - context-v/astro-knots/prompts/Removing-Unnecessary-Code-Step-by-Step.md  # 1×
    - context-v/astro-knots/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md  # 1×
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/frameworks/frontend/ui-frameworks/tailwind"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/frameworks/vitest"
  display_examples: [Vitest]
  occurrences: 1
  files:
    - "essays/Software Development with Code Generators.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/frameworks/vitest"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/frameworks/web frameworks/astro"
  display_examples: [Astro]
  occurrences: 4
  files:
    - context-v/astro-knots/prompts/Introducing-Features-and-UI-Components.md  # 1×
    - context-v/astro-knots/prompts/Removing-Unnecessary-Code-Step-by-Step.md  # 1×
    - context-v/astro-knots/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md  # 1×
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/frameworks/web-frameworks/astro"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/frameworks/web frameworks/mermaid.js"
  display_examples: [Mermaid.js]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/frameworks/web-frameworks/mermaid.js"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/frameworks/web frameworks/svelte"
  display_examples: [Svelte]
  occurrences: 4
  files:
    - context-v/astro-knots/prompts/Introducing-Features-and-UI-Components.md  # 1×
    - context-v/astro-knots/prompts/Removing-Unnecessary-Code-Step-by-Step.md  # 1×
    - context-v/astro-knots/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md  # 1×
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/frameworks/web-frameworks/svelte"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/lego-kit engineering tools/imagekit"
  display_examples: [ImageKit]
  occurrences: 4
  files:
    - context-v/astro-knots/prompts/Introducing-Features-and-UI-Components.md  # 1×
    - context-v/astro-knots/prompts/Removing-Unnecessary-Code-Step-by-Step.md  # 1×
    - context-v/astro-knots/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md  # 1×
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/lego-kit-engineering-tools/imagekit"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/programming languages/html"
  display_examples: [HTML]
  occurrences: 1
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/programming-languages/html"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/programming languages/javascript"
  display_examples: [JavaScript]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/programming-languages/javascript"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/programming languages/libraries/beautiful soup"
  display_examples: ["Beautiful Soup"]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/programming-languages/libraries/beautiful-soup"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/programming languages/libraries/d3.js"
  display_examples: [D3.js]
  occurrences: 2
  files:
    - "essays/We need better Charts.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/programming-languages/libraries/d3.js"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~

- path: "tooling/software development/programming languages/php"
  display_examples: [PHP]
  occurrences: 1
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/toolkit/software-development/programming-languages/php"
  is_local: false
  destination: "Lossless Toolkit"
  notes: ~
```

## `vertical-toolkits/` — 3 unique paths

```yaml
- path: vertical-toolkits/fintech/square
  display_examples: []
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Vertical toolkit pages don't exist yet; revisit when they're published."
  notes: ~

- path: "vertical-toolkits/venture-capital-firms/500 global"
  display_examples: ["500 Global"]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Vertical toolkit pages don't exist yet; revisit when they're published."
  notes: ~

- path: "vertical-toolkits/venture-capital-firms/y combinator"
  display_examples: ["Y Combinator"]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: deferred
  path_resolved: false
  resolved_url: ~
  deferred_reason: "No current public destination. Vertical toolkit pages don't exist yet; revisit when they're published."
  notes: ~
```

## `vocabulary/` — 41 unique paths

```yaml
- path: "vocabulary/advanced spreadsheets"
  display_examples: ["Advanced Spreadsheets"]
  occurrences: 1
  files:
    - "essays/The New New Founder Stack.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/advanced-spreadsheets"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/agentic ai"
  display_examples: ["Agentic AI"]
  occurrences: 1
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/agentic-ai"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/agile software development"
  display_examples: ["Agile Software Development"]
  occurrences: 1
  files:
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/agile-software-development"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/ai models"
  display_examples: ["AI Models"]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/ai-models"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/build systems"
  display_examples: ["Build Systems"]
  occurrences: 2
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/build-systems"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/citizen developers"
  display_examples: ["Citizen Developers"]
  occurrences: 7
  files:
    - "essays/Are Code Generators really the Death of SaaS.md"  # 1×
    - "essays/Embrace Pirates or See Mutiny.md"  # 1×
    - "essays/Non-Engineers become Prototypers..md"  # 1×
    - "essays/Software Development with Code Generators.md"  # 1×
    - "essays/Technology wants to be Emergent.md"  # 1×
    - "essays/The Jaded Product Development Playbook.md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/citizen-developers"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/cognitive diversity"
  display_examples: ["Cognitive Diversity"]
  occurrences: 1
  files:
    - "essays/Embrace Pirates or See Mutiny.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/cognitive-diversity"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/continuous refactoring"
  display_examples: ["Continuous Refactoring", "Continuous Rewrites"]
  occurrences: 2
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/continuous-refactoring"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/crm
  display_examples: [CRM]
  occurrences: 1
  files:
    - "essays/Are Code Generators really the Death of SaaS.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/crm"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/data labeling"
  display_examples: ["Data Labeling"]
  occurrences: 1
  files:
    - "essays/On Data Gathering.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/data-labeling"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/design systems"
  display_examples: ["Design Systems"]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/design-systems"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/dev ops"
  display_examples: [DevOps]
  occurrences: 2
  files:
    - "essays/How Docker Changed Everything.md"  # 1×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/dev-ops"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/disruptive innovation"
  display_examples: ["Disruptive Innovation"]
  occurrences: 1
  files:
    - "essays/Tectonic Shifts and Business Configuration.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/disruptive-innovation"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/documentation
  display_examples: [Documentation]
  occurrences: 1
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/documentation"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/email deliverability"
  display_examples: ["Email Deliverability"]
  occurrences: 1
  files:
    - "essays/The Jaded Product Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/email-deliverability"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/extended reality"
  display_examples: ["Extended Reality"]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/extended-reality"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/hardware
  display_examples: [Hardware]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/hardware"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/knowledge augmented generation"
  display_examples: ["Knowledge Augmented Generation"]
  occurrences: 1
  files:
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/knowledge-augmented-generation"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/knowledge bases"
  display_examples: ["Knowledge Base", "Knowledge Bases"]
  occurrences: 2
  files:
    - "essays/A New Standard for Chaining AI Operations called Model Context Protocol.md"  # 1×
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/knowledge-bases"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/large language models"
  display_examples: [LLMs]
  occurrences: 1
  files:
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/large-language-models"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/machine learning"
  display_examples: ["Machine Learning"]
  occurrences: 2
  files:
    - "essays/The New Software Development Playbook.md"  # 1×
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/machine-learning"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/microfrontend architecture"
  display_examples: ["Microfrontend Architecture"]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/microfrontend-architecture"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/microservices
  display_examples: [Microservice, "Microservice Architecture", Microservices, "Microservices Architecture"]
  occurrences: 4
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 2×
    - "essays/The New Software Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/microservices"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/monolith
  display_examples: [Monolithic]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/monolith"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/monorepo
  display_examples: [Monorepo, Monorepos]
  occurrences: 4
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 4×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/monorepo"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/multi-modal databases"
  display_examples: ["Multi-Modal Databases"]
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/multi-modal-databases"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/net promoter score"
  display_examples: ["Net Promoter Score"]
  occurrences: 2
  files:
    - "essays/From Qualitative Love to Quantitative Love.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/net-promoter-score"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/network attached storage servers"
  display_examples: ["Network Attached Storage Servers"]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/network-attached-storage-servers"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/onboarding walkthrough"
  display_examples: ["Onboarding Walkthrough"]
  occurrences: 1
  files:
    - "essays/The Jaded Product Development Playbook.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/onboarding-walkthrough"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/opinionated
  display_examples: [opinionated]
  occurrences: 1
  files:
    - "essays/Why Everyone needs to become a Linux User.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/opinionated"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/packages and libraries"
  display_examples: [Library]
  occurrences: 1
  files:
    - "essays/We need better Charts.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/packages-and-libraries"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/polyrepo
  display_examples: [Polyrepo, Polyrepos]
  occurrences: 2
  files:
    - "essays/From Software Engineering to Managing Large Codebases.md"  # 2×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/polyrepo"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/retrieval-augmented generation"
  display_examples: [RAG, "Retrieval-Augmented Generation"]
  occurrences: 6
  files:
    - "essays/AI is first a Trojan Horse.md"  # 1×
    - "essays/Can Organizations Know what their People have Known.md"  # 1×
    - "essays/From Rags to Riches.md"  # 1×
    - "essays/On Data Gathering.md"  # 1×
    - "essays/Someone's Gotta Keep Up with It.md"  # 1×
    - "essays/Why Text Manipulation is Now Mission Critical.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/retrieval-augmented-generation"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: vocabulary/self-hosting
  display_examples: [Self-Host]
  occurrences: 1
  files:
    - "essays/Build Your Own PC.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/self-hosting"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/separation of concerns"
  display_examples: []
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/separation-of-concerns"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/software architecture"
  display_examples: ["Software Architecture"]
  occurrences: 1
  files:
    - "essays/Evolutions in Managing Large Codebases.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/software-architecture"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/static site generators"
  display_examples: ["Static Site Generation"]
  occurrences: 4
  files:
    - context-v/astro-knots/prompts/Introducing-Features-and-UI-Components.md  # 1×
    - context-v/astro-knots/prompts/Removing-Unnecessary-Code-Step-by-Step.md  # 1×
    - context-v/astro-knots/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md  # 1×
    - context-v/astro-knots/specs/Maintain-an-Interactive-Stack-Display.md  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/static-site-generators"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/support vector machines"
  display_examples: []
  occurrences: 1
  files:
    - "essays/A Theory of Lossless Innovation.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/support-vector-machines"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/vector databases"
  display_examples: ["Vector Databases"]
  occurrences: 1
  files:
    - "essays/AI is first a Trojan Horse.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/vector-databases"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/vibe coding"
  display_examples: ["Vibe Coding"]
  occurrences: 1
  files:
    - "essays/Non-Engineers become Prototypers..md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/vibe-coding"
  is_local: false
  destination: "Lossless More-About"
  notes: ~

- path: "vocabulary/web standards"
  display_examples: ["Web Standards"]
  occurrences: 1
  files:
    - "essays/Technology wants to be Emergent.md"  # 1×
  status: resolved
  path_resolved: true
  resolved_url: "https://www.lossless.group/more-about/web-standards"
  is_local: false
  destination: "Lossless More-About"
  notes: ~
```

---

*Last regenerated: 2026-05-08. To refresh, re-run `bun scripts/audit-wikilinks.ts` from the site root. Edits to `resolved_url` / `path_resolved` / `notes` are preserved as long as the script merges with the existing file (TODO: not yet implemented; first regeneration overwrites).*
