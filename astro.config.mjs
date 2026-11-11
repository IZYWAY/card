import { defineConfig } from 'astro/config';
import { SITE_URL } from './site.config.mjs';

const url = new URL(SITE_URL);

export default defineConfig({
  site: url.origin,
  // Базовый путь берётся из SITE_URL (site.config.mjs), отдельно его задавать не нужно.
  base: url.pathname,
  trailingSlash: 'always',
  build: {
    // Стили встраиваются прямо в страницу: меньше запросов при первой загрузке.
    inlineStylesheets: 'always',
  },
});
