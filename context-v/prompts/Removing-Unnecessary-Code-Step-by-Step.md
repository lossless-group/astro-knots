---
title: Removing Unnecessary Code Step-by-Step
lede: We have developed a number of great patterns, components, and utilities that we use on a regular basis.  To start with a robust set of included functionality, we cloned The Water Foundation site (twf_site), but now need to strip out any code that is not directly related to the Hypernova brand and desired site functionality.
date_authored_initial_draft: 2025-11-16
date_authored_current_draft: 2025-11-16
date_authored_final_draft: "[]"
date_first_published: "[]"
date_last_updated: "[]"
at_semantic_version: 0.0.1.0
generated_with: Claude Code (Claude Sonnet 4.5)
category: Technical-Specification
date_created: 2025-11-15
date_modified: 2025-11-16
status: Proposed
tags: [Refactor]
authors:
  - Michael Staton
  - Tugce Ergul
image_prompt: A jenga tower with Hypernova branding, and a stack of code files with Astro, Svelte, and Tailwind. A robot and a hacker are taking turns removing jenga blocks.
---

# Context

## Context on the Astro-Knots monorepo
We develop and maintain multiple sites for multiple clients.  Each site needs to be independently deployed with no dependencies on the Astro-Knots monorepo.  However, we have developed patterns and boilerplate code, etc. 

## Preferred Stack

1. [[Tooling/Software Development/Frameworks/Web Frameworks/Astro|Astro]] for [[Vocabulary/Static Site Generators|Static Site Generation]]
2. [[Tooling/Software Development/Frameworks/Web Frameworks/Svelte|Svelte]] for dynamic UI.
3. [[Tooling/Software Development/Lego-Kit Engineering Tools/ImageKit|ImageKit]] for scalable image CDN.
4. [[Tooling/Software Development/Frameworks/Frontend/UI Frameworks/Tailwind|Tailwind]] with tokens edited for the brand we are building for, using our [[lost-in-public/to-hero/Customizing Tailwind|Customizing Tailwind]] best practices.
5. Preference for using documents in Markdown or in JSON in the repository over any database use.
6. Avoidance of anything React or React patterns.  HTML, CSS, Astro, and Svelte only. 

## Responsive Design
Most people will be viewing it initially from Mobile. However, analysts will usually want to "dive in" so we need laptop and large screen variants, and a clinically responsive layout.  

### Clickable Levels of Detail
Logo Clouds.
Cards of various sizes and various level of detail, expandable to more detail. Convenient collapse detail.
Full pages.


## Branded Exports and Downloads
It's common for potential investors and their analysts to want to download a PDF, and download CSV exports.  

## Multiple Layouts & Arrangements
Because it's so important for analysts to browse and find the information they need, it would be good for them to toggle different layouts with different types of cards and different levels of detail. 

## Connection to a Google Sheet for Data Variables

When displaying a portfolio, it's often helpful to have "facts" or "metrics" about any portfolio company.  I want to be able to access a Google Sheet through the Google Workspace API, and point to specific numbers or tables. 
## Strategy for Sensitive Data & Content

When displaying a portfolio, it's common to have certain financial information like "share price" or "amount invested" hidden in a layer that is only accessible to potential [[Limited Partners]].  

I can already imagine there being multiple levels of access requested by the investing partners, so it's best to think about this system smartly.  At base, we should have an accepted passwords list and put sensitive content behind a simple password authentication (note, we should avoid User Accounts unless it's a Google/Microsoft OAuth that just matches a list of authorized users or organization emails)






