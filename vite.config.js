import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: 'public', // Vite looks here for index.html
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: '../dist', // Output to dist in project root
        emptyOutDir: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
