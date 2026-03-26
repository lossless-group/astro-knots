---
title: "Tags Must Use Train-Case"
lede: "All tags in YAML frontmatter must use Train-Case — capitalize each word, hyphens between words, no spaces, no underscores, no all-lowercase."
date_created: 2026-03-26
date_modified: 2026-03-26
status: Published
category: Reminders
tags: [Tags, Frontmatter, Conventions, Obsidian, Train-Case]
authors:
  - Michael Staton
---

# Tags Must Use Train-Case

All `tags:` values in YAML frontmatter use **Train-Case**: every word capitalized, hyphens between words.

## Correct

```yaml
tags: [Content-Rendering, Dark-Mode, Best-Practices, Data-as-a-Service]
```

## Incorrect

```yaml
tags: [content-rendering, dark-mode, best-practices, data-as-a-service]   # snake-case — wrong
tags: [content_rendering, dark_mode, best_practices]                       # snake_case — wrong
tags: [contentrendering, darkmode]                                         # no separator — wrong
```

## Why

We use Obsidian extensively and have filter, search, and tag-based navigation across several tools and frontend libraries. Tags need to be consistent across all repositories, all sites, and all tools. Train-Case is the convention we've standardized on.

## Rules

- Every word capitalized: `Best-Practices` not `best-practices`
- Hyphens between words: `Content-Rendering` not `Content_Rendering`
- Proper nouns stay as-is: `Astro`, `Svelte`, `GitHub`, `RevealJS`, `Three.js`
- Acronyms stay uppercase: `SSR`, `SEO`, `CSS`, `API`
- Multi-word modifiers use hyphens: `Data-as-a-Service`, `Build-Time`
- No spaces ever: `Open-Graph` not `Open Graph`

## Applies To

Every markdown file with YAML frontmatter across all repositories, all context-v documents, all content collections, and all sites.
