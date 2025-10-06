import preset from "@knots/tailwind/preset.mjs";
import plugin from "@knots/tailwind/plugin.mjs";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "src/**/*.{astro,md,mdx,svelte,ts,tsx}",
    "node_modules/@knots/**/*.{astro,ts,js}"
  ],
  presets: [preset],
  plugins: [plugin],
  theme: { extend: {} }
};