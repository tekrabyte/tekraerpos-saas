import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      manifest: {
        name: 'TekraPOS Mobile',
        short_name: 'TekraPOS',
        theme_color: '#ffffff',
        display: 'standalone', // Ini membuat tampilan seperti aplikasi native (tanpa URL bar)
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      } 
    })
  ],
})