// @ts-check
import { defineConfig } from 'astro/config';

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
  build: {
    format: 'directory',
  },
});
