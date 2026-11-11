import { defineConfig } from 'astro/config';
import wasm from 'vite-plugin-wasm';

// Адрес и базовый путь сайта задаются только здесь.
export default defineConfig({
  site: 'https://izyway.github.io',
  base: '/card',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    // Физика бейджа (Rapier) поставляется как WebAssembly.
    plugins: [wasm()],
    build: { target: 'es2022' },
  },
});
