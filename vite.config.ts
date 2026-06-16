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
          includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.svg', 'assets/logo.png', 'icons/*.png', 'screenshots/*.png'],
          manifest: {
            id: 'com.finsight.app',
            name: 'FinSight AI',
            short_name: 'FinSight',
            description: 'An intelligent expense management and financial insights platform that tracks income and expenses, analyzes spending patterns with AI, provides budget predictions, and offers personalized financial advice via an AI chatbot.',
            lang: 'en-US',
            dir: 'ltr',
            categories: ['finance', 'productivity'],
            start_url: '/',
            scope: '/',
            theme_color: '#4F46E5',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            display_override: ['window-controls-overlay', 'standalone'],
            icons: [
              {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            screenshots: [
              {
                src: '/screenshots/desktop-dashboard.png',
                sizes: '1280x800',
                type: 'image/png',
                form_factor: 'wide',
                label: 'FinSight AI Desktop Dashboard'
              },
              {
                src: '/screenshots/desktop-transactions.png',
                sizes: '1280x800',
                type: 'image/png',
                form_factor: 'wide',
                label: 'FinSight AI Desktop Transactions'
              },
              {
                src: '/screenshots/mobile-dashboard.png',
                sizes: '390x844',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'FinSight AI Mobile Dashboard'
              },
              {
                src: '/screenshots/mobile-transactions.png',
                sizes: '390x844',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'FinSight AI Mobile Transactions'
              }
            ],
            shortcuts: [
              {
                name: 'Dashboard',
                short_name: 'Dashboard',
                description: 'View your financial summary',
                url: '/dashboard',
                icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Transactions',
                short_name: 'Transactions',
                description: 'View and add transactions',
                url: '/transactions',
                icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'AI Chat',
                short_name: 'AI Chat',
                description: 'Talk to your financial assistant',
                url: '/chat',
                icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
              }
            ],
            related_applications: [
              {
                platform: 'play',
                url: 'https://play.google.com/store/apps/details?id=com.finsight.app',
                id: 'com.finsight.app'
              }
            ],
            prefer_related_applications: false
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            navigateFallback: 'index.html',
            navigateFallbackDenylist: [/^\/api/],
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
