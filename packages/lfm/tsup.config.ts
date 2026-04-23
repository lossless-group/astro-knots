import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'parse': 'src/parse.ts',
    'preset': 'src/preset.ts',
    'types/index': 'src/types/index.ts',
    'plugins/remark-callouts': 'src/plugins/remark-callouts.ts',
    'plugins/remark-citations': 'src/plugins/remark-citations.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
});
