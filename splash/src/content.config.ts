import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { readFile, glob as fsGlob } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseFrontmatter } from '@loaders/frontmatter';

// ─── Lenient preprocessors — never throw on legacy frontmatter ──────────────

const lenientString = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().optional(),
);

const lenientStringArray = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') return [v];
    return v;
  },
  z.array(z.string()).optional(),
);

const lenientDate = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.coerce.date().optional(),
);

const lenientNumber = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.number().optional(),
);

const lenientBoolean = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.boolean().optional(),
);

// ─── Site highlights (local, curated) ───────────────────────────────────────

const siteHighlights = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/site-highlights' }),
  schema: z
    .object({
      title: lenientString,
      lede: lenientString,
      order: lenientNumber,
      status: lenientString,
      repo: lenientString,
      live_url: lenientString,
      icon: lenientString,
      banner_image: lenientString,
      featured: lenientBoolean,
      thread_color: lenientString,
      tags: lenientStringArray,
      maintained_by: lenientString,
    })
    .passthrough(),
});

// ─── Roll-up paths ──────────────────────────────────────────────────────────

const SPLASH_DIR = process.cwd();
const PARENT_DIR = resolve(SPLASH_DIR, '..');
const PARENT_CHANGELOG = resolve(PARENT_DIR, 'changelog');
const PARENT_CONTEXT_V = resolve(PARENT_DIR, 'context-v');
const ROLLUP_CHANGELOG = resolve(SPLASH_DIR, 'src', 'rollup', 'changelog');
const ROLLUP_CONTEXT_V = resolve(SPLASH_DIR, 'src', 'rollup', 'context-v');

// ─── Schemas — every field optional, passthrough preserves the rest ─────────

const provenanceFields = {
  from: lenientString,
  from_path: lenientString,
  legacy: lenientBoolean,
};

const changelogSchema = z
  .object({
    ...provenanceFields,
    title: lenientString,
    lede: lenientString,
    summary: lenientString,
    description: lenientString,
    date: lenientDate,
    date_created: lenientDate,
    date_modified: lenientDate,
    date_first_published: lenientDate,
    tags: lenientStringArray,
    authors: lenientStringArray,
    publish: lenientBoolean,
    status: lenientString,
    at_semantic_version: lenientString,
    augmented_with: lenientStringArray,
    files_changed: lenientStringArray,
  })
  .passthrough();

const contextVSchema = z
  .object({
    ...provenanceFields,
    title: lenientString,
    lede: lenientString,
    description: lenientString,
    purpose: lenientString,
    date_created: lenientDate,
    date_modified: lenientDate,
    date_updated: lenientDate,
    last_verified: lenientDate,
    authors: lenientStringArray,
    tags: lenientStringArray,
    status: lenientString,
    semantic_version: lenientString,
    publish: lenientBoolean,
    augmented_with: lenientStringArray,
    applies_to: lenientString,
  })
  .passthrough();

// ─── Function loader: union local parent + synced rollup ────────────────────

interface UnionLoaderOptions {
  localDir: string;
  rollupDir: string;
  collectionName: string;
  localProvenance?: string;
}

function unionLoader(options: UnionLoaderOptions) {
  return {
    name: `union-loader:${options.collectionName}`,
    load: async ({ store, parseData, logger }: any): Promise<void> => {
      store.clear();

      let local = 0;
      let rolled = 0;
      let skipped = 0;

      // 1. Local parent content (astro-knots' own).
      try {
        for await (const file of fsGlob('**/*.md', { cwd: options.localDir })) {
          const abs = resolve(options.localDir, file);
          const text = await readFile(abs, 'utf8');
          const { data, body } = parseFrontmatter(text);
          const provenance = options.localProvenance ?? 'astro-knots';
          const idBase = file.replace(/\.md$/, '');

          if (data.publish === false) { skipped++; continue; }

          const merged = {
            ...data,
            from: data.from ?? provenance,
            from_path: data.from_path ?? file,
          };

          const parsed = await safeParse({ id: `${provenance}/${idBase}`, data: merged }, parseData, logger);
          store.set({ id: `${provenance}/${idBase}`, data: parsed, body });
          local++;
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }

      // 2. Synced submodule rollup.
      try {
        for await (const file of fsGlob('**/*.md', { cwd: options.rollupDir })) {
          if (file === 'README.md' || file.endsWith('/README.md')) continue;
          const abs = resolve(options.rollupDir, file);
          const text = await readFile(abs, 'utf8');
          const { data, body } = parseFrontmatter(text);
          const idBase = file.replace(/\.md$/, '');

          if (data.publish === false) { skipped++; continue; }

          const id = idBase;
          const parsed = await safeParse({ id, data }, parseData, logger);
          store.set({ id, data: parsed, body });
          rolled++;
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }

      logger.info(
        `[union:${options.collectionName}] ${local} local + ${rolled} rolled-up — ${skipped} skipped(publish:false). Run \`pnpm rollup:sync\` to refresh rolled-up content.`,
      );
    },
  };
}

async function safeParse(
  args: { id: string; data: unknown },
  parseData: (a: { id: string; data: unknown }) => Promise<unknown>,
  logger: { warn: (msg: string) => void },
): Promise<Record<string, unknown>> {
  try {
    return (await parseData(args)) as Record<string, unknown>;
  } catch (err) {
    logger.warn(`schema couldn't validate ${args.id} (${(err as Error).message}); storing raw frontmatter.`);
    return { ...(args.data as Record<string, unknown>) };
  }
}

const changelog = defineCollection({
  loader: unionLoader({
    collectionName: 'changelog',
    localDir: PARENT_CHANGELOG,
    rollupDir: ROLLUP_CHANGELOG,
  }),
  schema: changelogSchema,
});

const contextV = defineCollection({
  loader: unionLoader({
    collectionName: 'context-v',
    localDir: PARENT_CONTEXT_V,
    rollupDir: ROLLUP_CONTEXT_V,
  }),
  schema: contextVSchema,
});

export const collections = {
  'site-highlights': siteHighlights,
  changelog,
  'context-v': contextV,
};
