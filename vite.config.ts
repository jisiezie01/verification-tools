import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'path'
import { catalogFilePlugin } from './catalog-server'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    catalogFilePlugin(),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
})
