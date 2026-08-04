import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Статическая сборка: сайт целиком отдаётся как HTML + изображения с CDN.
// Никаких клиентских фреймворков — вся интерактивность на нескольких KB ванильного JS.
export default defineConfig({
  site: 'https://tattoodesignsco.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'auto',
    format: 'directory',
  },
  compressHTML: true,
  devToolbar: { enabled: false },

  // XML-карта собирается только при `astro build` — в dev её не бывает.
  integrations: [
    sitemap({
      // Страницы отдельных идей закрыты noindex, подборка приватная —
      // в карте им делать нечего.
      filter: (page) =>
        !page.includes('/saved/') && !/\/ideas\/[^/]+\/[^/]+\//.test(page),
      changefreq: 'weekly',
    }),
  ],
});
