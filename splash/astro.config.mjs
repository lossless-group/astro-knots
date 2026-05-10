// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Splash for the astro-knots pseudomonorepo.
// Hosted on GitHub Pages from lossless-group/astro-knots.
// Live URL: https://lossless-group.github.io/astro-knots/
//
// If a custom domain is added later, set `site` to that domain and `base` to '/'.
// (Distinct from any future custom-domain marketing site — that would live elsewhere.)
export default defineConfig({
  site: 'https://lossless-group.github.io',
  base: '/astro-knots/',
  trailingSlash: 'ignore',

  integrations: [
    // @astrojs/sitemap auto-generates sitemap-index.xml + sitemap-0.xml from
    // every page Astro emits. Filter excludes the llms.txt endpoints (those
    // serve LLMs, not search engines) and the 404 page.
    sitemap({
      filter: (page) =>
        !page.includes('/llms.txt') &&
        !page.includes('/llms-full.txt') &&
        !page.endsWith('/404/') &&
        !page.endsWith('/404'),
    }),
  ],

  build: {
    format: 'directory',
  },
});
