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
          includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.svg', 'assets/logo.png', 'icons/*.png'],
          manifest: {
            id: 'com.finsight.app',
            name: 'Finsight',
            short_name: 'Finsight',
            description: 'A smart campus and student management platform that helps students access mess menus, order food, receive announcements, manage events, and connect with their college community.',
            lang: 'en-US',
            categories: ['education', 'food', 'productivity', 'social'],
            start_url: '/',
            scope: '/',
            theme_color: '#4F46E5',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            display_override: ['window-controls-overlay', 'standalone'],
            screenshots: [
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                form_factor: 'wide',
                label: 'Finsight Dashboard - Campus Management'
              },
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Finsight Mobile - Student Life'
              }
            ],
            icons: [
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
                name: 'Home',
                short_name: 'Home',
                description: 'Go to Home',
                url: '/',
                icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Mess Menu',
                short_name: 'Mess',
                description: 'View today\'s mess menu',
                url: '/mess',
                icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Food Orders',
                short_name: 'Orders',
                description: 'Manage your food orders',
                url: '/orders',
                icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Events',
                short_name: 'Events',
                description: 'Check upcoming college events',
                url: '/events',
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
