/**
 * Site-wide SEO + OpenGraph registry for the astro-knots splash.
 *
 * One source of truth for titles, descriptions, and og:image overrides.
 *
 * Banner / portrait / square come from the Image-Gin pipeline, hosted on
 * ImageKit. Convention: the `banner_image` (~1200×630) is the default
 * og:image; `portrait_image` and `square_image` are exported for the rare
 * platform that prefers a different aspect.
 *
 * Content-type note: the ImageKit URLs end in `.webp` but the CDN
 * content-negotiates via `Vary: Accept` and serves `image/jpeg` to clients
 * that don't advertise webp support — which is the case for most link
 * unfurlers (iMessage, WhatsApp, Slack, LinkedIn). We therefore declare
 * `image/jpeg` for og:image:type so the type matches the bytes those
 * clients actually receive.
 *
 * Local fallback at /public/og-knot.svg is kept around for emergencies
 * (CDN outage, etc.) but no longer the default.
 */

import { getCollection } from 'astro:content';

export const SITE_NAME = 'astro-knots';

export const SITE_TAGLINE =
  'A workspace of Astro sites tied loosely together by shared patterns and one published package.';

/* ──────────────────────────────────────────────────────────────────────
   Default OG image — banner aspect (~1.91:1)
   ────────────────────────────────────────────────────────────────────── */

export const DEFAULT_OG_IMAGE =
  'https://ik.imagekit.io/xvpgfijuw/Image-Gin/2026-05/Agent_Development_Kit_banner_image_1778013903566_nGqvMx_SX.webp';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_TYPE = 'image/jpeg';
export const DEFAULT_OG_IMAGE_ALT =
  'astro-knots — a workspace of Astro sites tied loosely together by shared patterns.';

/* ──────────────────────────────────────────────────────────────────────
   Aspect variants — exported for any page that wants a non-banner share
   ────────────────────────────────────────────────────────────────────── */

/** Tall (~3:4 / Pinterest, Stories). */
export const PORTRAIT_OG_IMAGE =
  'https://ik.imagekit.io/xvpgfijuw/Image-Gin/2026-05/Agent_Development_Kit_portrait_image_1778013904536_GYatYiHaq.webp';

/** Square (1:1 / older Twitter, some embed cards). */
export const SQUARE_OG_IMAGE =
  'https://ik.imagekit.io/xvpgfijuw/Image-Gin/2026-05/Agent_Development_Kit_square_image_1778013904829_0Y_T9fanGF.webp';

/** Local SVG fallback. Not the default — kept for CDN-outage emergencies. */
export const FALLBACK_OG_IMAGE = '/og-knot.svg';

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
