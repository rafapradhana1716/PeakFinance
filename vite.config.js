import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: './public/css/input.css'
        },
        outDir: 'dist',
        manifest: true,
    },
    server: {
        origin: 'http://localhost:5173',
    }
});