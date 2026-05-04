import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'parse': 'src/parse.ts',
    'preset': 'src/preset.ts',
    'types/index': 'src/types/index.ts',
    'plugins/remark-callouts': 'src/plugins/remark-callouts.ts',
    'plugins/remark-citations': 'src/plugins/remark-citations.ts',
    'plugins/og-fetcher': 'src/plugins/og-fetcher.ts',
    'plugins/remark-link-preview': 'src/plugins/remark-link-preview.ts',
    'utils/classify-link': 'src/utils/classify-link.ts',
    'utils/og-cache': 'src/utils/og-cache.ts',
    'utils/og-dispatcher': 'src/utils/og-dispatcher.ts',
    'utils/og-backends/index': 'src/utils/og-backends/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
});
