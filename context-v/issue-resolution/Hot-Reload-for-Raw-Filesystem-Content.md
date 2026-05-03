# Hot Reload for Raw-Filesystem Content (across astro-knots sites)

**Date:** 2026-05-03
**Project/System:** Any astro-knots site that loads markdown / YAML / JSON via `node:fs` outside Astro's content layer
**Reference implementation:** `sites/mpstaton-site/astro.config.mjs` and `sites/mpstaton-site/src/lib/promote/opportunities.ts`

## The problem

Astro 6's content layer (`glob({ pattern, base })` in `content.config.ts`) gives you HMR for free — edit a file under a registered collection's base path and the browser updates without a refresh.

But sites in this monorepo also load files **outside** the content layer for cases the layer doesn't fit:

- `mpstaton-site` loads `/promote` opportunity / variants / data YAML and memo markdown via `readFileSync` because the `/promote` directory tree is multi-typed and gitignored except for `_`-prefixed seeds — registering it as a single content collection would either expose all opportunity content publicly or force every directory to share one schema.
- `calmstorm-decks` loads narrative markdown per slide via `import.meta.glob` so the slide registry can compose against shared YAML data.
- Any future site that wants editorial content alongside operational config in the same tree (sections + variants + data) will hit the same shape.

For these reads, two annoying behaviours show up in dev:

1. **Edits to the file don't surface in the browser without a manual refresh.** With `output: 'server'` (every astro-knots site that uses `@astrojs/vercel`) the page re-renders on every request, so `readFileSync` reads fresh — but Vite has no module-graph reason to ping the browser's HMR WebSocket. The author has to Cmd+R after every save.
2. **Edits to YAML registry files (e.g. `opportunity.yaml`, `variants.yaml`) don't surface even after a refresh.** Because the loader caches the parsed registry in a module-level `let cache` for production performance, the cache survives across dev requests and serves stale data until the dev server restarts.

## The fix — two parts, both small

### Part 1: tell Vite to push a browser reload when the raw-fs paths change

Add a tiny Vite plugin in `astro.config.mjs` that listens to chokidar events on the watched paths and emits Vite's full-reload WebSocket message. `apply: 'serve'` scopes it to `astro dev` only.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

const watchRawContent = {
  name: 'watch-raw-content',
  apply: 'serve',
  configureServer(server) {
    const handler = (file) => {
      // Adjust the path filter to whichever raw-fs trees this site reads.
      if (file.includes('/src/content/promote/')) {
        server.ws.send({ type: 'full-reload', path: '*' });
      }
    };
    server.watcher.on('change', handler);
    server.watcher.on('add', handler);
    server.watcher.on('unlink', handler);
  },
};

export default defineConfig({
  // ...
  vite: {
    plugins: [tailwind(), watchRawContent],
  },
});
```

**Why this and not just `vite.server.watch`:**

- `vite.server.watch.ignored` controls what Vite watches, not what triggers HMR. Vite already watches the project root by default; the issue is that files outside the module graph don't generate HMR signals.
- `server.ws.send({ type: 'full-reload', path: '*' })` is Vite's official "reload all clients" message, the same one Astro sends when an `.astro` HMR boundary fails to update incrementally.
- Hooking `change`, `add`, **and** `unlink` covers creating a new file, deleting one, and editing existing ones — common when authoring new memo versions or new opportunities.

**Per-site path filter to use:**

| Site | Filter substring (in `file.includes(...)`) |
|---|---|
| `mpstaton-site` | `/src/content/promote/` |
| `calmstorm-decks` | `/src/content/decks/` (or wherever narrative + data live) |
| Future sites authoring multi-typed content trees | the directory their `readFileSync` / `import.meta.glob` pattern reads |

If a site reads from multiple raw-fs trees, `OR` them in the filter:

```js
if (file.includes('/src/content/promote/') || file.includes('/src/content/decks/')) {
  server.ws.send({ type: 'full-reload', path: '*' });
}
```

**Don't include paths Astro's content layer already handles** (changelog, notes, context-v, essays, etc.) — those reload through the glob loader. Adding them to this filter just double-fires the WS.

### Part 2: bypass module-level caches in dev

Any registry loader that follows the "build once, cache forever" pattern needs a one-line bypass for `astro dev`:

```ts
// before
let cache: Map<string, Opportunity> | null = null;
function load(): Map<string, Opportunity> {
  if (cache) return cache;
  cache = new Map();
  // ... read files ...
}

// after
let cache: Map<string, Opportunity> | null = null;
function load(): Map<string, Opportunity> {
  if (cache && !import.meta.env.DEV) return cache;
  cache = new Map();
  // ... read files ...
}
```

`import.meta.env.DEV` is `true` under `astro dev` and `false` for `astro build` / `astro preview`. Production keeps the cache (the build runs the loader once anyway, no benefit to busting it). Dev re-reads each request — negligible cost given these registries are small (single-digit YAML files in practice).

**Where this pattern lives in current sites:**

| File | What it caches |
|---|---|
| `sites/mpstaton-site/src/lib/promote/opportunities.ts` | the `Map<slug, Opportunity>` registry |
| `sites/calmstorm-decks/...` (any registry loader) | check for `let cache` at module scope |
| Any future loader written following the `opportunities.ts` shape | apply preemptively |

Look for the giveaway pattern: `let cache: ... | null = null` followed by `if (cache) return cache`. Add the `&& !import.meta.env.DEV` check.

### Why both parts together

Part 1 alone reloads the browser, but the page re-fetches the registry from a stale module-level cache, so the visible content doesn't change.

Part 2 alone keeps the cache fresh, but the browser still won't refresh until you Cmd+R.

You need both for the "save → instantly see the change" experience.

## What this does NOT fix

- **Content-collection markdown** (changelog, notes, essays, context-v): these already hot-reload through Astro's glob loader. If they're not, the bug is upstream in Astro 6 / the loader config, not here.
- **Build-time-fetched content** (mpstaton-site's context-v fetcher, the essays fetcher): the dev server runs `pnpm fetch-all` once at startup. Editing the locally-written copies in `src/content/context-v/...` works for the current dev session but gets clobbered by the next fetch run. Source-of-truth edits should happen upstream (in `astro-knots/context-v/` or `lossless-content/essays/`) and propagate via re-fetch.
- **Module-level state outside loaders**: middleware-level caches, in-process session stores, runtime-built indexes. Apply the same `!import.meta.env.DEV` pattern wherever it shows up; the `opportunities.ts` example is the canonical shape.
- **TypeScript / Astro config edits**: those still require a dev server restart.

## Quick adoption checklist

For an existing astro-knots site that authors content via raw-fs reads:

- [ ] Identify the raw-fs content directory or directories (`grep -rn "readFileSync" src/lib`).
- [ ] Add the `watchRawContent` Vite plugin to `astro.config.mjs` with the right path filter.
- [ ] Find every module-level `let cache` in those loaders and add `&& !import.meta.env.DEV` to the gate.
- [ ] Restart the dev server (config changes don't HMR themselves).
- [ ] Test: edit a YAML / markdown file under the watched tree, save, watch the browser tab refresh by itself.

## Reference commits

- `mpstaton-site` — `astro.config.mjs` + `lib/promote/opportunities.ts` adoption (May 2026, this round of work).
