import { defineConfig } from 'astro/config';

// Адрес и базовый путь сайта задаются только здесь.
export default defineConfig({
  site: 'https://izyway.github.io',
  base: '/card',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
