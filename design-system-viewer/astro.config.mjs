import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  vite: {
    plugins: [tailwind()],
    resolve: {
      alias: {
        "@knots/tokens": fileURLToPath(new URL("../packages/tokens/src/index.ts", import.meta.url)),
        "@knots/icons": fileURLToPath(new URL("../packages/icons/src/index.ts", import.meta.url)),
        "@knots/brand-config": fileURLToPath(new URL("../packages/brand-config/src/index.ts", import.meta.url)),
        "@knots/astro": fileURLToPath(new URL("../packages/astro/src", import.meta.url)),
      }
    },
    server: {
      fs: {
        allow: [
          fileURLToPath(new URL("..", import.meta.url)),
          fileURLToPath(new URL("../packages", import.meta.url)),
        ]
      }
    }
  }
});
