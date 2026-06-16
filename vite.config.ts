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
          includeAssets: [
            'assets/logo.png',
            'icons/icon-192.png',
            'icons/icon-512.png',
            'icons/maskable-512.png'
          ],
          manifest: {
            id: 'com.finsight.app',
            name: 'Finsight',
            short_name: 'Finsight',
            description: 'A smart expense tracking and financial management platform that provides intelligent insights and helps you achieve your financial goals.',
            lang: 'en-US',
            categories: ['finance', 'productivity'],
            start_url: '/',
            scope: '/',
            theme_color: '#4F46E5',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            display_override: ['window-controls-overlay', 'standalone'],
            screenshots: [
              {
                src: 'assets/logo.png',
                sizes: '1024x1024',
                type: 'image/png',
                form_factor: 'wide',
                label: 'Finsight Dashboard'
              },
              {
                src: 'assets/logo.png',
                sizes: '1024x1024',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Finsight Mobile'
              }
            ],
            icons: [
              {
                src: 'assets/logo.png',
                sizes: '1024x1024',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'icons/maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: 'Dashboard',
                short_name: 'Dashboard',
                description: 'Go to Dashboard',
                url: '/',
                icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Transactions',
                short_name: 'Trans',
                description: 'View Transactions',
                url: '/transactions',
                icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Insights',
                short_name: 'Insights',
                description: 'View Financial Insights',
                url: '/insights',
                icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Budgets',
                short_name: 'Budgets',
                description: 'Manage Budgets',
                url: '/budgets',
                icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
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
