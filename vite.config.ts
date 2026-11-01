import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'path'
import { catalogFilePlugin } from './catalog-server'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
    appType: 'mpa',
    base: command === 'build' || isPreview ? '/verification-tools/' : '/',
    build: {
        rollupOptions: { input: { landing: path.resolve(__dirname, 'index.html'), tools: path.resolve(__dirname, 'tools/index.html') } },
    },
    plugins: [
        {
            name: 'workspace-dev-routes',
            configureServer(server) {
                server.middlewares.use((request, _response, next) => {
                    if (request.headers.accept?.includes('text/html') && /^\/(tools(?:\/[^?]*)?|create-tool|manage-tools)\/?(?:\?|$)/.test(request.url ?? '')) {
                        request.url = '/tools/index.html'
                    }
                    next()
                })
            },
        },
        catalogFilePlugin(),
        react(),
        tailwindcss()
    ],
    resolve: {
        alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
}))
