import { defineConfig } from 'vite';

// Relative base ('./') keeps the build portable: it works at the domain root,
// in a subpath, and when embedded in an <iframe>.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    // three's modules push the main chunk over the default 500 kB warning.
    chunkSizeWarningLimit: 1500,
  },
});
