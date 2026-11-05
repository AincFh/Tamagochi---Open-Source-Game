import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const PAGES_BASE = process.env.GITHUB_PAGES_BASE_PATH || '/'
if (!PAGES_BASE.startsWith('/') || !PAGES_BASE.endsWith('/')) {
  throw new Error('GITHUB_PAGES_BASE_PATH must be /repo-name/ or /')
}

export default defineConfig({
  base: PAGES_BASE,
  build: {
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'offline.html'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        globIgnores: ['social-preview.png'],
        navigateFallback: PAGES_BASE + 'index.html',
      },
      manifest: {
        name: 'Tamagochi — A Tiny Virtual Pet Game',
        short_name: 'Tamagochi',
        description: 'Care for Mori, play pocket-sized games, and shape a magical browser world in an offline-friendly virtual pet game.',
        theme_color: '#f05f4f',
        background_color: '#fff5df',
        display: 'standalone',
        orientation: 'any',
        id: PAGES_BASE,
        start_url: PAGES_BASE,
        scope: PAGES_BASE,
        categories: ['games', 'entertainment'],
        icons: [
          { src: PAGES_BASE + 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: PAGES_BASE + 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: PAGES_BASE + 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: PAGES_BASE + 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})