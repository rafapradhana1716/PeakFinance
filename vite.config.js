import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './public/css/input.css'
      },
      output: {
        // Fixed filename so server.js can reliably find and serve it
        assetFileNames: () => 'public/css/styles.css',
      }
    }
  }
});
