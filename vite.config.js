import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 // Subimos a 6MB por el chunk consolidado
      },
      manifest: {
        name: 'Tabar Registro Institucional',
        short_name: 'Tabar',
        description: 'Plataforma de registro y operaciones de fardos de tabaco TABAR.',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  define: {
    'process.env': {},
    'global': 'globalThis'
  },
  build: {
    // Forzamos a que el código pesado de criptografía se agrupe de forma segura
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@privy-io') || id.includes('node_modules/viem') || id.includes('node_modules/@noble')) {
            return 'privy-crypto-bundle'; // Todo lo Web3 a un solo archivo seguro
          }
        }
      }
    }
  }
})