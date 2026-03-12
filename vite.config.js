// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Floos/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'Floos',
        short_name: 'Floos',
        description: 'Personal finance tracker for OMR',
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Floos/',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true
  }
})
