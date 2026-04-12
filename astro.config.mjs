import { defineConfig } from 'astro/config';
import remarkSchichten from './src/plugins/remark-schichten.mjs';

export default defineConfig({
  site: 'https://gareduclou.art',
  output: 'static',
  markdown: {
    remarkPlugins: [remarkSchichten],
  },
});
