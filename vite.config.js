import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// If you deploy to GitHub Pages at https://<user>.github.io/<repo>/,
// set base to '/<repo>/'. For a custom domain or Vercel/Netlify, keep it '/'.
export default defineConfig({
  base: '/TransApp-GFB/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Live Translator for Online Meetings',
        short_name: 'Translator',
        description: 'Real-time speech translation for online meetings, powered by your browser\u2019s built-in speech recognition',
        start_url: '/TransApp-GFB/',
        scope: '/TransApp-GFB/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0F1E',
        theme_color: '#0B0F1E',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
})
