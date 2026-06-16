# Finsight PWA Integration Instructions

This document provides instructions for integrating the Finsight PWA manifest and service worker into a React/Vite application, along with settings for successful APK generation via PWA Builder.

## 1. Folder Structure
Ensure the following structure in your `public` directory:
```
public/
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── maskable-512.png
├── manifest.json
└── ...
```

## 2. Vite Configuration
We use `vite-plugin-pwa` for automatic service worker generation and manifest handling.

**File:** `vite.config.ts`
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        // ... (copied from the manifest.json content)
      }
    })
  ]
});
```

## 3. Service Worker Registration
In your entry point (e.g., `index.tsx` or `main.tsx`), add the following code to register the service worker:

```typescript
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}
```

## 4. PWA Builder / APK Generation Settings
To generate a high-quality Android APK using [PWA Builder](https://www.pwabuilder.com/):

- **Package ID:** `com.finsight.app` (Matches the `id` in `manifest.json`)
- **App Name:** `Finsight`
- **Launcher Name:** `Finsight`
- **Theme Color:** `#4F46E5`
- **Navigation Color:** `#4F46E5`
- **Status Bar Color:** `#4F46E5`
- **Splash Screen:** PWA Builder will automatically generate this from your 512x512 icon.
- **Maskable Icon:** Ensure the `maskable-512.png` has a safe zone (10-15% padding) for best results on Android.
- **Orientation:** Set to `portrait` in the manifest for a consistent mobile experience.

## 5. Offline-First Support
The application is configured with `workbox` (via `vite-plugin-pwa`) to cache essential assets (`js`, `css`, `html`, `images`) and Google Fonts, ensuring the app loads even without an active internet connection.
