/**
 * Site-wide SEO + OpenGraph registry for the astro-knots splash.
 *
 * One source of truth for titles and descriptions. The OG image is local
 * (public/og-knot.svg) since astro-knots doesn't have a CDN-hosted banner;
 * GitHub Pages will serve it. Some unfurlers may struggle with SVG OG —
 * if that becomes a problem, swap for a generated PNG.
 */

import { getCollection } from 'astro:content';

export const SITE_NAME = 'astro-knots';

export const SITE_TAGLINE =
  'A workspace of Astro sites tied loosely together by shared patterns and one published package.';

export const DEFAULT_OG_IMAGE = '/og-knot.svg';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_TYPE = 'image/svg+xml';
export const DEFAULT_OG_IMAGE_ALT =
  'astro-knots — interlocking threads representing a workspace of Astro sites.';

export const TITLE_SUFFIX = 'astro-knots';

export const CHAR_LIMITS = {
  title: 60,
  description: 155,
} as const;

export interface SeoEntry {
  title: string;
  description: string;
  ogImage?: string;
}

export const STATIC_SEO = {
  root: {
    title: 'A small lattice of Astro sites',
    description:
      "A pseudomonorepo of Astro websites, tied together by a two-tier token system, a three-mode contract, and one real published package — Lossless Flavored Markdown.",
  } satisfies SeoEntry,
  changelogIndex: {
    title: 'Changelog',
    description:
      'Ship notes from across the astro-knots workspace — what each site landed and when.',
  } satisfies SeoEntry,
  contextVIndex: {
    title: 'Notes (context-v)',
    description:
      "Specs, blueprints, prompts, reminders. The thinking that underwrites the code, kept in each repo's context-v/ and rolled up here when marked publishable.",
  } satisfies SeoEntry,
};

export function buildPageTitle(title: string): string {
  if (!title) return TITLE_SUFFIX;
  if (title === TITLE_SUFFIX) return title;
  return `${title} — ${TITLE_SUFFIX}`;
}

export function truncate(s: string, limit: number): string {
  if (!s || s.length <= limit) return s;
  const cut = s.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/**
 * Map a `from` provenance value to the originating site's banner_image
 * (if any) from the site-highlights collection. Returns undefined for
 * 'astro-knots' or any slug not in the collection — callers fall back to
 * DEFAULT_OG_IMAGE.
 */
export async function getSiteOgImage(from: string | undefined): Promise<string | undefined> {
  if (!from || from === 'astro-knots') return undefined;
  try {
    const sites = await getCollection('site-highlights');
    const match = sites.find((s) => s.id === from);
    const banner = match?.data?.banner_image;
    return typeof banner === 'string' && banner.length > 0 ? banner : undefined;
  } catch {
    return undefined;
  }
}
