# astro-knots

> {{SITE_NAME}}

A small lattice of Astro sites. astro-knots is a pseudomonorepo that aggregates {{SITE_COUNT}} independent Astro websites — client work, personal sites, and one published package — tied loosely together by a two-tier design token system, a three-mode contract (light · dark · vibrant), and `@lossless-group/lfm` (Lossless Flavored Markdown). Each site deploys from its own repo; the workspace exists so patterns can be compared and shared deliberately. This file rolls up {{CHANGELOG_COUNT}} changelog entries and {{CONTEXTV_COUNT}} context-v notes from {{REPO_COUNT}} member repos for LLMs that want to learn the workspace in a single fetch.

## Reference

- [Full corpus content]({{LLMS_FULL_URL}}): every published changelog and context-v entry concatenated as raw markdown — the preferred ingest target for LLMs that handle a single large document.
- [Source repository](https://github.com/lossless-group/astro-knots): the umbrella repo, with each site attached as a submodule.
- [Lossless Group](https://lossless.group): the org that maintains this practice.

## Sites

The family of sites this workspace coordinates. Each is independently deployable; the link below points at the live deployment when one exists, otherwise the source repository.

{{SITES_INDEX}}

## Changelog

Ship notes rolled up from each member site, grouped by source. Use these to track what landed where and when across the lattice.

{{CHANGELOG_INDEX}}

## Context-V

Specs, blueprints, prompts, reminders, and explorations — the thinking that underwrites the code. Each member site keeps its own `context-v/`; publishable entries are rolled up here.

{{CONTEXTV_INDEX}}
