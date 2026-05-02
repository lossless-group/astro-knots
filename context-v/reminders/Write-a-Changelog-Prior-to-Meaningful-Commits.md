---
title: "Write a Changelog Prior to Meaningful Commits"
lede: "A quick reference for writing a changelog prior to meaningful commits."
date_created: 2026-04-26
date_modified: 2026-04-28
public: true
category: Reminders
tags: [Tech-Stack, Astro, Svelte, Tailwind, Preferences]
authors:
  - Michael Staton
---

# Our Commit and Ship Workflow

For our commit and ship workflow, 

**Prior** to making any meaningful commits, 
1. the AI Assistant will write a robust changelog _consistent with the patterns_ in the existing changelog. AI Assistants MUST follow frontmatter YAML patterns in order for builds and renders to work properly. 
2. After the changelog is written, I run a command to generate a companion image to changelog.  
3. Then, you stage and commit with a robust, easy to understand commit message and
  commit.  
  1. The commit message should be descriptive and easy to understand
  2. The commit message should uncomment git's default comment out of the files changed, so the commit message preserves that information.
  3. It's helpful to share the intended commit message with the user before committing. Though, sometimes the user is multi-tasking so they may not respond right away.  It is safe to commit if the user does not respond.
4. Then the user pushes the commit to the remote repository.