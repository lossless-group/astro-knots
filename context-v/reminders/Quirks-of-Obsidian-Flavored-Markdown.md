---
title: "Quirks of Obsidian Flavored Markdown"
lede: "A quick reference for the quirks of Obsidian Flavored Markdown."
date_created: 2026-04-26
date_modified: 2026-04-26
status: Published
category: Reminders
tags: [Tech-Stack, Astro, Svelte, Tailwind, Preferences]
authors:
  - Michael Staton
---

## Property Naming Convenetions

- property names use underscores instead of hyphens, spaces, or camelCase (like in Python)
- while strings can technically have any delimitter, it's best to use double quotes (we have found through many headaches that single quotes can cause issues with apostrophes)
- tags must be in an array, and phrases need hyphens as spaces and need to be Train-Case. No spaces allowed, it will break the parser. In the UI, we strip the hyphens and first letter of each word for display.

```yaml
---
slug: claude-code
conventional_name: "Claude Code"
official_name: "Claude Code"
product_of: "Anthropic"
category: AI-Coding-Assistant
subcategories: [CLI-Tools, Agentic-IDE]
official_url: https://claude.com/code
logo_light: https://ik.imagekit.io/.../logos/claude-code--light.svg
logo_dark:  https://ik.imagekit.io/.../logos/claude-code--dark.svg
oss: false
pricing: subscription
description_short: "Anthropic's CLI-native AI coding agent."
url_aliases:
  - https://www.claude.com/code
  - https://claude.ai/code
tags: [Anthropic, CLI, Agent]
---
```

## Separators

Sections in markdown typically use `---`.  However, this can cause parsing errors when markdown files also have frontmatter.  (We have scripts that do random cleanup on over 4500 Markdown files in other projects.)  And, we use Obsidian, so we prefer `***` as the section separator.

## ISO Syntax may need to be parsed and rendered as legible dates

Obsidian uses ISOish syntax `YYYY-MM-DD`, but often in frontend content rendering it should be a legible syntax, so April 26, 2026.

