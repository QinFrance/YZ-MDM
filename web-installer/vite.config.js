import { defineConfig } from 'vite';

export default defineConfig({
  // The site is served below /YZ-MDM/ on GitHub Pages.
  base: './',
  publicDir: false,
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true },
});
