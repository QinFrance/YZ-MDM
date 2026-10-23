import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages hosts the site below /YZ-MDM/.
  base: './',
  publicDir: false,
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: 'index.html',
        install: 'install.html',
      },
    },
  },
});
