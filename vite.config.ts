import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
      VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa_192x192.png', 'pwa_512x512.png'],
      manifest: {
        id: '/',
        name: 'مدیریت قیمت و فروشگاه',
        short_name: 'مدیریت قیمت',
        description: 'مدیریت قیمت، موجودی و محصولات',
        lang: 'fa',
        dir: 'rtl',
        theme_color: '#faf3ea',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa_192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa_512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa_512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})




