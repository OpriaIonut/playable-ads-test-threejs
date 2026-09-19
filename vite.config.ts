import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 8080,
        open: false,
        hmr: true,
        watch: {
            usePolling: true,
            interval: 100,
        },
    },
})