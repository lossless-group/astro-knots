---
date_created: 2025-12-10
publish: false
title: "Managing Complex Markdown Content at Build Time"
slug: managing-complex-markdown-content-at-build-time
at_semantic_version: 0.0.0.1
authors:
  - Michael Staton
augmented_with: "Windsurf Cascade on GPT-5.1"
tags: [Astro-Knots, Markdown, Content-Architecture, Build-Pipeline]
---

# Managing Complex Markdown Content at Build Time

This document captures patterns and tradeoffs for managing **markdown content**
that lives outside an individual Astro project, but must be available at
**build time** for Astro-Knots sites (e.g. Hypernova, Dark-Matter).

We focus on teams where:

- A **content team** prefers to work in plain markdown (often in its own repo),
  without touching app code.
- A **development team** needs predictable, repeatable builds on platforms like
  Vercel.
- We want to stay close to markdown (rather than a heavy CMS) because it
  integrates well with AI assistants and developer workflows.

---

## 1. Problem Statement

We previously introduced `src/generated-content` as a workaround:

- Content was placed in a submodule or separate folder inside the Astro project because Vercel builds struggled to pull from a separate repo.
- This "hotfix" worked, but it blurred concerns between **content** and
  **application code** and made the build story brittle.

We would like a clearer model where:

- Content can live in **separate repos** or packages.
- Astro-Knots sites can still resolve markdown files at **build time**.
- The solution works reliably on Vercel and in local development.

---

## 2. Design Goals

- **Separation of concerns**
  - Content authors should be able to work in a content-focused repo/package without needing to understand or modify the Astro app repo.

- **Predictable builds**
  - Vercel should be able to build without custom, fragile steps.
  - Local development should not require complex submodule dance.

- **Markdown-first authoring**
  - Preserve plain-markdown workflows for maximum compatibility with AI tools
    and simple diffing.

- **Flexibility of source**
  - Support multiple modes of sourcing markdown:
    - Local/monorepo.
    - Package-based (via npm registry).
    - Remote/HTTP (future enhancement).

---

## 3. Modes of Sourcing Markdown at Build Time

We recognize three primary modes for sourcing markdown into Astro-Knots sites.

### 3.1 Local / Monorepo Mode

Content lives **inside the same Git repo** as the Astro project.

- Example structure:
  - `/content/**` (root-level content tree shared across sites).
  - `sites/hypernova-site/` and `sites/dark-matter/` read from `/content`.

- Pros:
  - Simplest for prototypes and early development.
  - No extra infrastructure (no package registry, no remote fetch).

- Cons:
  - Content and app code live in the same repository.
  - Content authors must either:
    - Use Git workflows in the main repo, or
    - Work via PRs, which may be more dev-centric than desired.

Local/monorepo mode is fine for early stages, but does not fully decouple
content teams from application code.

---

### 3.2 Package Mode (Recommended for Real Teams)

Treat the content repository as a **package** that is installed into the Astro
project as a dependency.

- Example:
  - Content repo: `@lossless/content-hypernova`.
    - Contains markdown under `blueprints/`, `memos/`, `notes/`, etc.
  - Astro-Knots app (Hypernova) depends on it in `package.json`:
    - `"@lossless/content-hypernova": "^0.2.0"`.

- Build behavior:
  - On Vercel (and locally), `pnpm install`/`npm install` pulls the content package into `node_modules`.
  - Astro content collections use a helper (e.g. `resolveContentPath`) to point into `node_modules/@lossless/content-hypernova/...`.

- Content workflow:
  - Content team works entirely in the content repo.
  - On merge to `main`, a CI workflow bumps the version and publishes the package (GitHub Packages, npm, or another registry).
  - App team decides when to update by bumping the dependency version.

- Pros:
  - Excellent **separation of concerns**.
  - Vercel is happy: content is just another dependency.
  - Versioning and rollback are explicit (via package versions).

- Cons:
  - Requires a package registry and a minimal CI pipeline.
  - Content updates are not "live" until the app updates its dependency.

This is a strong default pattern for Astro-Knots when working with a content team that prefers its own repo and cadence.

---

### 3.3 Submodule Mode (Acceptable, but Fussy)

Use a Git submodule to mount a content repo under a path within the Astro
project.

- Example:
  - `/content` (or `/src/generated-content`) is a submodule pointing to `git@github.com:org/content-repo.git`.

- Build behavior:
  - Locally, developers run `git submodule update --init --recursive`.
  - On Vercel:
    - Vercel must be able to access the submodule repo(permissions).
    - Builds may need a custom step to ensure submodules are initialized.

- Pros:
  - Content repo is separate, but appears as a folder in the app repo.
  - No package registry required.

- Cons:
  - Submodules are easy to misconfigure and confusing for many contributors.
  - Vercel and other CI systems may require extra setup.
  - Harder to reason about versioning of content vs app code.

Submodules can work, but given experience with flaky builds, they are best
seen as a **transitional** solution, not the long-term default.

---

### 3.4 Remote / HTTP Mode (Future Enhancement)

Fetch markdown over HTTP at build time from a separate content source:

- Possible sources:
  - Raw Git hosting (e.g. `https://raw.githubusercontent.com/...`).
  - A simple content API that serves markdown files.
  - Object storage (S3, GCS) behind a thin content gateway.

- Build-time pattern in Astro:
  - Use `fetch` or a helper library (e.g. `astro-remote` / `unified`) in:
    - `getStaticPaths` and route `get` functions, or
    - a build script that writes fetched files into a local cache.
  - Parse the fetched markdown with the same extended-markdown pipeline
    (`MarkdownArticle.astro` → `AstroMarkdown.astro`).

- Pros:
  - **Complete decoupling** of content storage from the app repo.
  - Easy to layer on access control, previews, or editorial tools.

- Cons:
  - Builds depend on external services and network reliability.
  - More moving parts to secure (tokens, rate limiting).
  - Requires careful caching and fallback strategies.

Remote/HTTP mode is powerful and should be treated as a **future-focused
pattern**. It pairs well with the extended-markdown renderer but adds
operational complexity.

---

## 4. `src/generated-content` and Historical Context

Historically, `src/generated-content` was introduced as a way to:

- Bring in markdown content that originated outside the Astro project.
- Work around Vercel limitations where pulling from a separate repo directly
  during build was unreliable.

This is best understood as a **hotfix** rather than a long-term design.
Going forward, we prefer to:

- Use **Package Mode** whenever a separate content repo is desired.
- Consider **Remote/HTTP Mode** for advanced scenarios.
- Reserve `src/generated-content` for truly generated files (build artifacts),
  not as the primary storage of authored content.

---

## 5. `resolveContentPath` and Content Collections

To keep site code simple, we centralize path resolution in a small helper.

- **Responsibility**:
  - Given a logical path (e.g. `lost-in-public/blueprints` or
    `@lossless/content-hypernova/blueprints`), return a filesystem path or
    `file://` URL that Astro content collections can use.

- **Capabilities**:
  - Understand multiple base locations:
    - Local `/content` (monorepo mode).
    - `node_modules/@lossless/...` (package mode).
    - `src/generated-content` for generated artifacts.
  - Respect environment variables for content base (e.g. `CONTENT_BASE_PATH`).

Example responsibilities (pseudocode, not actual implementation):

- If `relativePath` starts with `node_modules/` or a known package prefix:
  - Join it with the project root.
- Else if `CONTENT_BASE_PATH` is set:
  - Join `CONTENT_BASE_PATH` with `relativePath`.
- Else:
  - Default to a local `/content` folder.

This helper becomes the **single place** we change when we:

- Switch from monorepo content to package content.
- Introduce new content packages.

---

## 6. Suggested Default for Astro-Knots

For Hypernova, Dark-Matter, and similar Astro-Knots sites, a pragmatic
sequence is:

1. **Short-term (pragmatic)**
   - Use **Local/Monorepo Mode** for early development.
   - Keep `/content` in the Astro-Knots repo and wire collections to it.

2. **Medium-term (recommended)**
   - Migrate to **Package Mode** as the content team and needs grow:
     - Create content-only repos that publish markdown as packages.
     - Update Astro-Knots content collections to read from `node_modules`.

3. **Long-term (advanced)**
   - Experiment with **Remote/HTTP Mode** for certain content classes:
     - E.g. drafts, private blueprints, or dynamic decks.
   - Keep the extended-markdown renderer unchanged: only the source of the
     markdown changes, not how it is parsed and rendered.

Throughout all modes, the content team remains in markdown, and the
extended-markdown render pipeline (directives, galleries, etc.) continues to
function the same way from the app’s perspective.

---

## 7. Open Questions and Future Work

- How do we want to version content packages?
  - Semantic versioning per content domain.
  - Or a single consolidated content package for all sites?

- Do we want a central "content index" service that:
  - Knows which markdown lives where.
  - Exposes a simple API for app builds (Remote/HTTP Mode)?

- How do we want to manage preview vs published states?
  - Branch-based levels (e.g. `main` vs `preview/*`).
  - Or dedicated preview registries/endpoints.

These questions can be addressed incrementally. The key is that the
extended-markdown renderer and Astro-Knots content collections are designed
from the start to support multiple sourcing modes in a clean way.
