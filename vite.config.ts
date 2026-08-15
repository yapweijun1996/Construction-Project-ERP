import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this repository under a sub-path. Override via
// BASE_PATH=/ npm run build when hosting at a different root.
const basePath = process.env.BASE_PATH ?? '/Construction-Project-ERP/'

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      // User-controlled updates: the app registers via virtual:pwa-register
      // and shows an explicit update prompt (TASK-013).
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icons/icon-192.svg', 'icons/icon-512.svg', 'icons/maskable-512.svg'],
      manifest: {
        name: 'Construction Project ERP',
        short_name: 'CP ERP',
        description: 'Project-first construction ERP demo. All data is synthetic.',
        theme_color: '#1B4F8A',
        background_color: '#F6F7F9',
        display: 'standalone',
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/maskable-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
