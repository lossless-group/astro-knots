---
title: Understanding the JavaScript Runtime and Package Manager Landscape
lede: A ground-up exploration of what Node, Deno, Bun, npm, pnpm, Yarn, Vite, tsup, and esbuild actually are, why they exist, how they relate to each other, and when to use which — because the JavaScript ecosystem never explains itself.
date_authored_initial_draft: "2026-03-26"
date_authored_current_draft: "2026-03-26"
date_created: "2026-03-26"
date_modified: "2026-03-26"
at_semantic_version: "0.0.0.1"
status: Draft
augmented_with: Claude Code (Opus 4.6)
category: Explorations
tags: [JavaScript, Node, Deno, Bun, pnpm, npm, Vite, Package-Management, Runtimes, Build-Tools, Developer-Experience]
authors:
  - Michael Staton
  - AI Labs Team
---

# Understanding the JavaScript Runtime and Package Manager Landscape

## The Problem This Document Solves

If you've been building websites and applications with JavaScript/TypeScript for any length of time, you've accumulated a graveyard of tools in your workflow that you use daily but have never actually understood. You type `pnpm install` and things appear. You type `pnpm dev` and a server starts. You know Deno exists and is supposedly better. You've heard Bun is fast. You have a `vite.config.ts` file you mostly don't touch. You've never once thought about what `node_modules` actually is or why it's 400MB for a blog.

This document is a ground-up explanation of every layer in the stack, what it does, why it exists, and how it relates to the others. No assumed knowledge beyond "JavaScript runs in browsers and also on servers somehow."

---

## 1. The Two Places JavaScript Runs

JavaScript was invented in 1995 to run inside web browsers. For its first 14 years, that was the only place it ran. Every browser shipped its own **JavaScript engine** — the program that reads JavaScript code and executes it:

| Browser | Engine | Who Maintains It |
|---------|--------|-----------------|
| Chrome | V8 | Google |
| Firefox | SpiderMonkey | Mozilla |
| Safari | JavaScriptCore (JSC) | Apple |
| Edge (old) | Chakra | Microsoft |
| Edge (new) | V8 | Google (via Chromium) |

These engines are massive, performance-critical C++ codebases. V8 alone is ~10 million lines of code. They compile JavaScript to machine code, manage memory, handle garbage collection, and optimize hot code paths. Writing a JavaScript engine from scratch is a multi-year, multi-team undertaking.

In 2009, Ryan Dahl had an idea: what if you took V8 out of Chrome and wrapped it in a program that could run on your computer directly — not inside a browser? That program was **Node.js**, and it changed everything.

---

## 2. Runtimes: The Foundation Layer

A **runtime** is the program that executes your JavaScript/TypeScript code outside of a browser. It's what you're talking to when you type a command in your terminal.

### 2.1 Node.js (2009)

**What it is:** V8 (Chrome's JS engine) + a set of APIs for doing things browsers can't do: reading files, starting HTTP servers, accessing the network, spawning processes.

**Why it matters:** Before Node, you couldn't write JavaScript that read a file from disk or started a web server. Node added those capabilities by wrapping V8 in C++ code that bridges JavaScript to the operating system. When you write `fs.readFileSync('file.txt')` in Node, you're calling C++ code that talks to your OS kernel.

**What it looks like:**
```bash
node script.js          # Run a JavaScript file
node -e "console.log(1+1)"  # Evaluate an expression
```

**The good:** Enormous ecosystem. Every JavaScript library ever written works on Node. 15 years of battle-testing. Every hosting platform supports it.

**The bad:** Designed in 2009 with decisions that can't be undone:
- `require()` instead of `import` (CommonJS vs ES Modules — a schism that haunts the ecosystem to this day)
- `node_modules` — a nested dependency folder that can grow to hundreds of megabytes
- No TypeScript support — you must compile TS to JS before Node can run it
- No built-in security model — any script you run has full access to your filesystem, network, and environment
- The standard library is thin — you need packages for basic things like fetching a URL (until recently)

**When to use it:** You don't choose Node directly anymore. You choose a **framework** (Astro, Next.js, SvelteKit) and it runs on Node under the hood. Node is the engine in the car — you drive the car, not the engine. But it's important to know it's there because when things break, the error messages come from Node.

### 2.2 Deno (2018/2020)

**What it is:** Ryan Dahl's do-over. The same person who created Node looked at what he'd built, catalogued its design mistakes in a famous talk called ["10 Things I Regret About Node.js"](https://www.youtube.com/watch?v=M3BM9TB-8yA), and built a replacement.

**The engine:** Also V8 (same as Node), but the wrapper around V8 is written in **Rust** instead of C++, and everything is designed differently.

**What it fixes:**

| Node Problem | Deno Solution |
|-------------|---------------|
| No TypeScript support | TypeScript runs natively, no compilation step |
| No security model | Explicit permissions: `--allow-read`, `--allow-net`, etc. |
| CommonJS vs ESM confusion | ESM only. No `require()`. Ever. |
| `node_modules` bloat | No `node_modules` by default — downloads and caches dependencies globally |
| No built-in tooling | Ships with formatter, linter, test runner, bundler |
| No standard library for basics | Rich standard library (HTTP server, file watching, etc.) |

**What it looks like:**
```bash
deno run script.ts              # Run TypeScript directly
deno run --allow-read script.ts  # With file read permission
deno fmt                         # Format code
deno test                        # Run tests
deno lint                        # Lint code
```

**The catch:** For its first 2 years, Deno was incompatible with npm packages. If a library wasn't rewritten for Deno, you couldn't use it. This made it a non-starter for most real projects.

**Deno 2.0 (2024)** fixed this by adding full npm compatibility. You can now `import express from "npm:express"` or use a `package.json` with `node_modules` — Deno became a "better Node that also runs Node code." This is the version worth paying attention to.

**When to use it:**
- Scripts and tools (it runs TypeScript with zero config — incredible for one-off scripts)
- New projects where you control the full stack
- Publishing packages to JSR (Deno's modern package registry)
- NOT yet great for: Astro, Vite, or any framework that deeply assumes Node internals

### 2.3 Bun (2022)

**What it is:** A competitor to both Node AND npm, built from scratch in **Zig** (a low-level systems language), using **JavaScriptCore** (Safari's engine) instead of V8.

**Why JavaScriptCore?** V8 prioritizes peak performance after warmup (JIT compilation). JSC prioritizes fast startup and lower memory. For CLI tools and dev servers that start and stop constantly, JSC's tradeoff is better. This is why Bun feels faster for `bun install` and `bun run` — it's not just optimized code, it's a fundamentally different engine choice.

**What it looks like:**
```bash
bun run script.ts        # Run TypeScript directly
bun install              # Install packages (replaces npm/pnpm)
bun test                 # Run tests
bun build ./src/index.ts # Bundle code
```

**What makes it different:**
- **Speed.** Everything is noticeably faster — installs, script startup, test execution. Not 10% faster. 5-10x faster for some operations.
- **All-in-one.** Runtime + package manager + bundler + test runner in a single binary.
- **Native TypeScript.** Like Deno, runs `.ts` files directly.
- **Node-compatible.** Aims to be a drop-in replacement for Node. Most Node code works.

**The catch:** Bun is younger and less battle-tested. Edge cases exist where Node code doesn't work identically. Some native Node addons (C++ extensions) don't compile. Ecosystem support is growing but not universal.

**When to use it:**
- Running TypeScript scripts (your `fetch-context-v.ts` runs on Bun — that's why it's `bun scripts/fetch-context-v.ts`)
- Package installs when speed matters
- Test runners
- NOT yet reliable for: production SSR, Astro builds (works sometimes, breaks on edge cases)

### 2.4 Runtime Comparison Summary

| | Node | Deno | Bun |
|---|---|---|---|
| **Engine** | V8 (Chrome) | V8 (Chrome) | JavaScriptCore (Safari) |
| **Language** | C++ | Rust | Zig |
| **TypeScript** | No (needs compiler) | Yes, native | Yes, native |
| **Package manager** | Separate (npm/pnpm) | Built-in | Built-in |
| **Speed** | Baseline | ~Same as Node | 5-10x faster startup |
| **npm compatibility** | 100% (it's the original) | ~95% (Deno 2.0+) | ~97% |
| **Maturity** | 15 years | 6 years | 4 years |
| **Used by Astro** | Yes (primary) | Experimental | Experimental |

---

## 3. Package Managers: How Libraries Get Into Your Project

A **package manager** does three things:
1. **Resolves** — figures out which versions of which packages satisfy your `package.json` requirements (and their dependencies' requirements, recursively)
2. **Downloads** — fetches the package tarballs from a registry
3. **Links** — puts the files somewhere your runtime can find them (usually `node_modules/`)

### 3.1 npm (2010)

**What it is:** The original package manager for Node. Ships with Node — when you install Node, you get npm.

**The registry:** npm isn't just a CLI tool. It's also the **npm registry** at `registry.npmjs.org` — the world's largest collection of JavaScript packages (~3 million packages). When anyone says "publish to npm," they mean uploading to this registry. Every other package manager (pnpm, Yarn, Bun) downloads from this same registry by default.

**What it looks like:**
```bash
npm install            # Install all dependencies from package.json
npm install express    # Add a package
npm run dev            # Run a script defined in package.json
npm publish            # Publish your package to the registry
```

**The problems:**
- **Slow.** Downloads packages sequentially. Writes tons of files.
- **`node_modules` hell.** Each package gets its own copy of its dependencies, nested inside each other. A project with 50 direct dependencies can have 500+ folders in `node_modules`, totaling hundreds of megabytes. The same package at the same version can exist in 10 different places on disk.
- **Phantom dependencies.** If package A depends on package B, and you `require('B')` in your code, it works — even though you never declared B as your dependency. Then A updates and drops B, and your code breaks. You were accidentally using a transitive dependency.
- **Non-deterministic.** Two developers running `npm install` on the same `package.json` could get different versions of transitive dependencies, depending on when they ran it. `package-lock.json` was added later to fix this, but the damage to trust was done.

**When to use it:** You mostly shouldn't anymore. It's the Internet Explorer of package managers — it works, it's everywhere, but better options exist. The one exception: publishing packages still often goes through npm's infrastructure (the registry), even if you use pnpm to manage your local project.

### 3.2 Yarn (2016)

**What it is:** Facebook's answer to npm's problems. Faster installs, deterministic resolution (via `yarn.lock`), better caching.

**Why it mattered:** Yarn proved that npm's problems were solvable and forced npm to improve. The lockfile concept, parallel downloads, and offline caching were all pioneered by Yarn and later adopted by npm.

**Yarn Berry (v2+):** A controversial rewrite that introduced "Plug'n'Play" (PnP) — eliminating `node_modules` entirely and loading packages from a cache via a runtime patch. Clever but broke compatibility with many tools. The ecosystem rejected it and most people stuck with Yarn Classic (v1) or switched to pnpm.

**When to use it:** Legacy projects that already use it. No reason to choose it for new projects.

### 3.3 pnpm (2017)

**What it is:** "Performant npm." A package manager that solves the `node_modules` problem without breaking compatibility.

**The key insight: content-addressable storage + symlinks.**

When you `pnpm install express`, here's what actually happens:

1. pnpm downloads `express` and all its dependencies
2. Each package version is stored **once** in a global store on your machine (`~/.pnpm-store/`)
3. Your project's `node_modules` contains **symlinks** (shortcuts) to the global store, not actual files
4. Dependencies are **flat** — no nesting. Each package only sees its declared dependencies (no phantom deps)

This means:
- A package that appears in 10 projects on your machine exists on disk **once**
- `node_modules` is small (it's mostly symlinks)
- Installs are fast (if the package is already in the store, it's just creating a symlink)
- Phantom dependencies are impossible (strict linking)

**What it looks like:**
```bash
pnpm install           # Install all dependencies
pnpm add express       # Add a package
pnpm dev               # Run "dev" script from package.json
pnpm -r build          # Run "build" in all workspace packages
```

**Workspaces:** pnpm has first-class support for **monorepos** — multiple packages in one git repo that can depend on each other. This is what `pnpm-workspace.yaml` configures. When you run `pnpm install` at the root of a workspace, it installs dependencies for all packages and links internal packages to each other.

**When to use it:** Always. It's strictly better than npm in every measurable way — faster, smaller disk usage, safer dependency resolution, better monorepo support. The only reason not to use it is if a deployment platform doesn't support it (rare — Vercel, Netlify, Railway all support pnpm).

### 3.4 Bun (as a package manager)

**What it is:** Bun includes a package manager that's a drop-in replacement for npm/pnpm.

**Why it's fast:** Bun's install is written in Zig with aggressive optimizations: parallel network requests, parallel file writes, symlinks like pnpm, and it resolves the entire dependency tree before writing anything to disk.

**What it looks like:**
```bash
bun install            # Install all dependencies
bun add express        # Add a package
```

**The tradeoff:** Bun's installer is fast but less battle-tested than pnpm for complex workspace setups and edge cases. For a single project, it's great. For a monorepo with 15 workspace members, pnpm is more reliable today.

### 3.5 Package Manager Comparison

| | npm | Yarn | pnpm | Bun |
|---|---|---|---|---|
| **Speed** | Slow | Medium | Fast | Fastest |
| **Disk usage** | Huge (copies everywhere) | Huge | Small (symlinks + store) | Small |
| **Phantom deps** | Yes (dangerous) | Yes | No (strict) | No |
| **Monorepo support** | Basic | Good | Excellent | Growing |
| **Lockfile** | package-lock.json | yarn.lock | pnpm-lock.yaml | bun.lockb |
| **Our recommendation** | Avoid | Avoid | Use this | Use for scripts |

---

## 4. Package Registries: Where Packages Live

A package manager is a client. A **registry** is the server it talks to. They're different things, even though npm (the tool) and npm (the registry) share a name.

### 4.1 npm Registry (registry.npmjs.org)

The default. ~3 million packages. Every package manager can download from it. When you `pnpm add express`, pnpm talks to this registry. It's owned by GitHub (which is owned by Microsoft).

**Publishing:** `pnpm publish` pushes your package here. Requires an npm account. Free for public packages.

### 4.2 GitHub Packages (npm.pkg.github.com)

GitHub's registry. Tied to your GitHub org. Free for public packages, included with GitHub plans for private packages.

**How it works:** Same wire protocol as npm. You add a line to `.npmrc` telling pnpm to look for `@your-org/*` packages at GitHub instead of npm:

```
@lossless-group:registry=https://npm.pkg.github.com
```

Then `pnpm add @lossless-group/lfm` fetches from GitHub Packages instead of npm.

**Tradeoff:** Requires a `GITHUB_TOKEN` for private packages or authenticated installs. More setup than npm, but your packages live next to your code.

### 4.3 JSR (jsr.io)

**The modern option.** Built by the Deno team, launched 2024. Key differences from npm:

| npm | JSR |
|-----|-----|
| Publishes compiled JavaScript | Publishes TypeScript source directly |
| No type checking on publish | Checks your types on publish |
| Auto-generated docs: none | Auto-generates API documentation from your TypeScript |
| Works with npm/pnpm | Works with npm/pnpm/Deno/Bun |
| Package names: `package-name` or `@scope/name` | Always scoped: `@scope/name` |
| 15 years of legacy | Clean slate, modern conventions |

**Why we like it:** You publish TypeScript source. JSR serves it as TypeScript to Deno and auto-compiles to JavaScript for Node/pnpm consumers. No build step needed on the publisher's side. The type checking on publish catches bugs before your users do.

**How it works with pnpm:** JSR packages are installed via a compatibility layer. Add to `.npmrc`:
```
@jsr:registry=https://npm.jsr.io
```

Then you can install JSR packages. The import looks slightly different: `import { foo } from "@jsr/scope__package"` or you can use JSR's pnpm integration directly.

### 4.4 Registry Comparison

| | npm | GitHub Packages | JSR |
|---|---|---|---|
| **Cost** | Free (public) | Free (public) | Free |
| **Auth required to install** | No (public) | Yes (token) | No |
| **TypeScript-first** | No | No | Yes |
| **Auto-docs** | No | No | Yes |
| **Works with pnpm** | Yes | Yes | Yes |
| **Maturity** | 15 years | 5 years | 2 years |
| **Our packages** | Not yet | `@lossless-group/lfm` | Planned |

---

## 5. Build Tools: Compiling and Bundling

You write TypeScript. Browsers and Node understand JavaScript. Something needs to bridge that gap. That's what build tools do.

### 5.1 The Problem Build Tools Solve

Your source code (TypeScript, JSX, `.astro` files, `.svelte` files) is not what runs in production. It needs to be:

1. **Compiled** — TypeScript → JavaScript, JSX → `createElement()` calls, Astro → HTML
2. **Bundled** — hundreds of small source files → a few optimized files
3. **Optimized** — dead code removed, minified, code-split for lazy loading
4. **Served** — during development, files need to be served to the browser with hot reload

Different tools handle different parts of this:

### 5.2 tsc (TypeScript Compiler)

**What it does:** Checks your types and compiles `.ts` → `.js`. Nothing else. No bundling, no minification, no serving.

**When to use it:** Type checking only (`tsc --noEmit`). Let other tools handle the actual compilation — they're faster because they skip type checking and just strip the types away.

### 5.3 esbuild (2020)

**What it is:** A JavaScript/TypeScript bundler written in **Go**. 10-100x faster than previous-generation bundlers (webpack, Rollup) because Go compiles to native code and can parallelize heavily.

**What it does:** Compiles TS → JS, bundles multiple files into one, minifies. Does NOT type-check (it just strips types — fast, but won't catch errors).

**Why it matters:** esbuild's speed reset expectations for the entire ecosystem. Vite, tsup, and Bun's bundler all use esbuild internally or are inspired by it.

### 5.4 Vite (2020)

**What it is:** A **dev server and build tool** created by Evan You (creator of Vue.js). The name means "fast" in French.

**The key insight:** During development, don't bundle anything. Instead:
1. Serve your source files directly to the browser using native ES module `import` statements
2. Transform individual files on-demand (compile TypeScript, process CSS, etc.) using esbuild
3. Only bundle for production (using Rollup, which optimizes better than esbuild for final output)

This is why `pnpm dev` starts in under a second even for large projects. Vite isn't bundling your entire application at startup — it's transforming files one at a time as the browser requests them.

**What it looks like in your project:**
```javascript
// astro.config.mjs — Astro uses Vite under the hood
export default defineConfig({
  vite: {
    plugins: [tailwind()],  // Vite plugins
    resolve: {
      alias: { '@brand': '...' }  // Vite aliases
    }
  }
})
```

Every Astro project is a Vite project. When you run `pnpm dev`, Astro starts Vite. When you run `pnpm build`, Astro runs Vite's production build. The `vite` key in your Astro config is raw Vite configuration.

**Vite plugins** are the extension mechanism. Tailwind, Svelte, MDX — they all integrate via Vite plugins that know how to transform their respective file types.

### 5.5 tsup (2021)

**What it is:** A minimal bundler for **libraries** (not applications). Built on esbuild. Designed for building npm packages.

**Why it exists:** Vite is great for applications (websites, apps). But if you're building a library that other people install — like `@lossless-group/lfm` — you need a different tool. tsup takes your TypeScript source, compiles it, generates `.d.ts` type declaration files, and outputs clean ESM (and optionally CommonJS) bundles.

**What it looks like:**
```typescript
// tsup.config.ts
export default defineConfig({
  entry: { 'index': 'src/index.ts' },
  format: ['esm'],
  dts: true,   // Generate .d.ts files
  clean: true,
});
```

Run `pnpm build` → tsup produces `dist/index.js` and `dist/index.d.ts`. That's what gets published to the registry.

### 5.6 Rollup, webpack, Parcel, SWC, Turbopack...

**Rollup:** The OG ES module bundler. Still used by Vite for production builds. Slower than esbuild but produces better-optimized output with tree-shaking (dead code elimination). You don't interact with it directly — Vite wraps it.

**webpack:** The previous generation's dominant bundler (2014-2020). Extremely powerful, extremely complex. Still used by Next.js internally but losing ground to Vite. You shouldn't choose it for new projects.

**SWC:** A Rust-based TypeScript/JavaScript compiler. Used by Next.js (Turbopack). Competitor to esbuild with different tradeoffs. You probably won't interact with it directly.

**Turbopack:** Vercel's Rust-based successor to webpack, used inside Next.js. Not relevant for Astro projects.

### 5.7 Build Tool Map

```
Your Source Code (.ts, .astro, .svelte, .css)
        │
        ├── During Development ──▶ Vite dev server
        │                          (transforms files on-demand via esbuild)
        │                          (serves to browser via native ES imports)
        │                          (hot module replacement — edits appear instantly)
        │
        ├── Production Build ───▶ Vite build
        │                          (bundles via Rollup)
        │                          (optimizes, minifies, code-splits)
        │                          (outputs to dist/)
        │
        └── Library Build ──────▶ tsup
                                   (bundles via esbuild)
                                   (generates .d.ts type declarations)
                                   (outputs to dist/ for publishing)
```

---

## 6. How It All Fits Together in Our Stack

Here's the complete picture of what happens when you work on mpstaton-site:

### `pnpm install`
1. pnpm reads `package.json` to find what you depend on
2. Checks `.npmrc` to know which registries to use (`@lossless-group` → GitHub Packages)
3. Resolves all dependency versions (including transitive deps)
4. Downloads any packages not already in the global store (`~/.pnpm-store/`)
5. Creates `node_modules/` with symlinks to the store
6. Writes `pnpm-lock.yaml` (the exact resolved versions for reproducibility)

### `pnpm dev`
1. Runs the `dev` script from `package.json`: `pnpm fetch-context && astro dev`
2. `fetch-context` runs `bun scripts/fetch-context-v.ts` (Bun runtime, TypeScript directly)
3. `astro dev` starts the Astro dev server which:
   - Starts Vite under the hood
   - Vite starts an HTTP server
   - Vite transforms files on-demand using esbuild
   - Your browser loads the page, requesting files via ES module imports
   - Vite intercepts each request, transforms the file (TS → JS, Astro → HTML, etc.), and serves it
   - When you edit a file, Vite pushes the update to the browser via WebSocket (HMR)

### `pnpm build`
1. Runs `pnpm fetch-context && astro build`
2. Astro runs Vite's production build:
   - All pages are rendered (SSR or static, depending on config)
   - All JavaScript is bundled by Rollup into optimized chunks
   - CSS is extracted and minified
   - Output goes to `dist/` (or `.vercel/output/` for Vercel adapter)

### `import { parseMarkdown } from '@lossless-group/lfm'`
1. At build time, Vite sees this import
2. Vite finds `@lossless-group/lfm` in `node_modules/` (symlinked by pnpm)
3. The package's `exports` field in `package.json` points to `dist/index.js`
4. Vite loads that file and bundles it into the output
5. At runtime (in Vercel's serverless function), `parseMarkdown` is called, which runs the unified/remark pipeline

### Publishing `@lossless-group/lfm`
1. You edit code in `packages/lfm/src/`
2. `pnpm build` runs tsup, which compiles TS → JS and generates `.d.ts` files in `dist/`
3. `pnpm publish` packs the `dist/` and `src/` directories into a tarball and uploads to GitHub Packages
4. For JSR: `pnpx jsr publish` uploads the TypeScript source directly (no build step — JSR handles it)
5. Consumers run `pnpm add @lossless-group/lfm` and get the latest version

---

## 7. The Philosophical Split: Node World vs. Deno World

There's a genuine philosophical divide in the JavaScript ecosystem, and it's helpful to understand it because it explains why things feel fragmented.

### The Node World

**Philosophy:** Backward compatibility above all. Don't break existing code. The ecosystem is the value — 3 million packages on npm, all working together (mostly). Stability over innovation.

**The result:**
- CommonJS (`require()`) still exists alongside ESM (`import`) because removing it would break millions of packages
- `node_modules` still exists because replacing it would break deployment pipelines
- TypeScript still needs compilation because adding native TS to Node would be a runtime change
- npm the registry is a commercial product (owned by GitHub/Microsoft) with legacy architectural decisions

**Tools in this world:** Node, npm, Yarn, webpack, Rollup, tsc

### The Deno World

**Philosophy:** Start clean. Learn from Node's mistakes. TypeScript is the default language. Security is opt-in, not opt-out. The standard library should handle common tasks. Package management shouldn't require a `node_modules` folder.

**The result:**
- ESM only — no dual module confusion
- TypeScript natively — no compilation step for developers
- URL imports or JSR — no centralized corporate registry required
- Permissions model — scripts can't access your filesystem by default
- But: ecosystem incompatibility (mostly solved in Deno 2.0)

**Tools in this world:** Deno, JSR, `deno fmt`, `deno test`, `deno lint`

### The Bun World

**Philosophy:** Pragmatism and speed. Don't care about philosophical purity — just make everything faster. Be compatible with Node (so the existing ecosystem works) but be faster at everything. One binary that does everything.

**The result:**
- Drop-in Node replacement (mostly) — existing code works
- Dramatically faster installs, startup, and execution
- Native TypeScript like Deno, but without the permissions model
- Built-in test runner, bundler, package manager — but none are as mature as dedicated tools

**Tools in this world:** Bun (it's the whole world)

### Where We Sit

We use tools from all three worlds:

| Layer | Tool | World |
|-------|------|-------|
| Runtime (websites) | Node (via Astro) | Node |
| Runtime (scripts) | Bun | Bun |
| Package manager | pnpm | Node (but better) |
| Dev server | Vite | Node |
| Library bundler | tsup | Node |
| Package registry | GitHub Packages + JSR | Both |
| TypeScript | Native via Bun/Deno for scripts, compiled via Vite for web | Both |

This is fine. The tools interoperate. pnpm installs packages that Bun published. Vite bundles code that was written for Deno. The philosophical divide is real but the practical walls between the worlds are falling.

---

## 8. What's Likely to Change

**Node will add native TypeScript support.** It's already in experimental. When it ships, one major advantage of Deno/Bun disappears — but by then, Deno and Bun will have moved further ahead on other fronts.

**Vite will support Deno and Bun as runtimes.** Vite 7 is explicitly targeting multi-runtime support. When this lands, you'll be able to run `deno run vite dev` or `bun vite dev` and everything works. This is the unlock that lets Astro projects switch runtimes.

**JSR will grow.** As more packages publish to JSR, the npm registry's monopoly weakens. JSR's TypeScript-first approach is strictly better for TypeScript consumers. The migration is slow but directionally clear.

**`node_modules` will eventually die.** Deno already doesn't need it. Bun can work without it. pnpm's symlink approach minimizes the damage. Eventually, some combination of import maps + global caches will replace the concept entirely. But "eventually" in the JavaScript ecosystem means 5-10 years because backward compatibility is sacred.

**The convergence.** All three runtimes are converging toward the same feature set: native TypeScript, fast startup, built-in tools, ESM only. The differences will become more about performance characteristics and ecosystem integration than fundamental capability. In 3-5 years, "which runtime" may matter as little as "which browser engine" — they'll all support the same APIs via the WinterCG standard.

---

## 9. Glossary

| Term | What It Actually Means |
|------|----------------------|
| **Runtime** | Program that executes JavaScript outside a browser (Node, Deno, Bun) |
| **Engine** | The core component that compiles and runs JS (V8, JavaScriptCore, SpiderMonkey) |
| **Package manager** | Tool that downloads and organizes dependencies (pnpm, npm, Yarn, Bun) |
| **Registry** | Server that hosts published packages (npm registry, GitHub Packages, JSR) |
| **Bundler** | Tool that combines many source files into few output files (Rollup, esbuild, webpack) |
| **Transpiler** | Tool that converts one flavor of JS/TS to another (tsc, SWC, esbuild) |
| **CommonJS (CJS)** | Node's original module system: `const x = require('x')`. Legacy. |
| **ES Modules (ESM)** | The standard module system: `import x from 'x'`. Modern. Use this. |
| **`node_modules`** | Directory where packages are installed. pnpm fills it with symlinks. npm fills it with copies. |
| **Lockfile** | File that records exact resolved versions of all dependencies for reproducibility |
| **Workspace** | Multiple packages in one repo that can depend on each other (managed by pnpm-workspace.yaml) |
| **Tree-shaking** | Removing unused code from the final bundle. Only works with ESM. |
| **HMR** | Hot Module Replacement — updating code in the browser without a full page reload |
| **SSR** | Server-Side Rendering — generating HTML on the server instead of in the browser |
| **Symlink** | A filesystem shortcut that points to another file/folder. How pnpm avoids duplicating packages. |

---

## 10. Related Documents

- `Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md` — The LFM spec, which led to publishing our first package
- `Preferred-Stack.md` — Our preferred tools and frameworks
