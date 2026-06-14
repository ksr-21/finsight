# PWA Setup & Android Packaging Guide

FinSight AI has been converted into a fully functional Progressive Web App (PWA).

## Files Changed/Added
- `package.json`: Added `vite-plugin-pwa` and `sharp`.
- `vite.config.ts`: Configured `VitePWA` plugin with manifest and offline caching.
- `index.html`: Added mobile meta tags, PWA icons, and native-feel CSS.
- `vercel.json`: Added SPA routing configuration for Vercel.
- `public/`: Added PWA icons (`pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, `favicon.png`, `logo.svg`).
- `public/assets/`: Added `logo.png` for application-wide branding.

## 1. Installation & Build
To install dependencies:
```bash
npm install
```

To build the PWA:
```bash
npm run build
```
This will generate the `dist` folder containing the service worker (`sw.js`) and the web manifest.

## 2. Deployment to Vercel
1. Push your changes to your Git repository.
2. Connect your repository to [Vercel](https://vercel.com).
3. Vercel will automatically detect the Vite project.
4. Ensure the **Build Command** is `npm run build` and **Output Directory** is `dist`.
5. The `vercel.json` file included in the root will handle the SPA routing.

## 3. Generating Android APK (via PWABuilder)
1. Once deployed, copy your Vercel deployment URL (e.g., `https://finsight-ai.vercel.app`).
2. Go to [PWABuilder.com](https://www.pwabuilder.com).
3. Paste your URL and click **Start**.
4. PWABuilder will audit your site. You should see a "Great" or "PWA Ready" status.
5. Click **Package for Stores** and select **Android**.
6. (Optional) Customize the package name (e.g., `com.finsight.ai`).
7. Click **Generate**.
8. Download the zip file containing your `.apk` (for testing) and `.aab` (for Play Store).

## Native Mobile Optimizations Applied
- **Fullscreen Mode:** App opens in standalone mode without browser UI.
- **Splash Screen:** Configured via `background_color` and `icons` in the manifest.
- **Touch Optimizations:** Disabled elastic scrolling and unwanted zooming.
- **Offline Support:** Core UI and assets are cached via Workbox.
- **Icon Masking:** Supports Android's adaptive icons via the `maskable` purpose.

## Final PWA Checklist
✅ Manifest working
✅ Service worker working
✅ Offline support enabled
✅ Install prompt available
✅ PWABuilder compatible
✅ Ready for Android APK generation
