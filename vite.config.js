import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                welcome: resolve(__dirname, 'welcome.html'),
                login: resolve(__dirname, 'login.html'),
                signup: resolve(__dirname, 'signup.html')
            }
        }
    }
});
