import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'public/dist',
        manifest: true,
        rollupOptions: {
            input: './public/css/input.css',
            output: {
                assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css')
                    ? 'assets/styles.css'
                    : 'assets/[name]-[hash][extname]'
            }
        },
    },
    server: {
        origin: 'http://localhost:5173',
    }
});
