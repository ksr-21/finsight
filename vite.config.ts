import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          devOptions: {
            enabled: true
          },
          registerType: 'autoUpdate',
          manifestFilename: 'manifest.json',
          includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.svg', 'assets/logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
          manifest: {
            id: 'com.finsight.ai',
            name: 'FinSight AI',
            short_name: 'FinSight AI',
            description: 'Intelligent expense management and financial insights platform',
            lang: 'en',
            categories: ['finance', 'productivity'],
            start_url: '/',
            scope: '/',
            theme_color: '#4F46E5',
            background_color: '#F3F4F6',
            display: 'standalone',
            orientation: 'portrait',
            display_override: ['window-controls-overlay', 'standalone'],
            screenshots: [
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                form_factor: 'wide',
                label: 'FinSight AI Dashboard'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'FinSight AI Mobile'
              }
            ],
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: 'Add Transaction',
                short_name: 'Add',
                description: 'Record a new expense or income',
                url: '/transactions?add=true',
                icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Insights',
                short_name: 'Insights',
                description: 'View financial analysis',
                url: '/insights',
                icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
