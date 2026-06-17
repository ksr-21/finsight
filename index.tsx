import React from 'react';
import ReactDOM from 'react-dom/client';
import Site from './Site';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      // Using a simple confirm is standard for now,
      // but 'autoUpdate' in vite.config.ts handles the actual update.
      if (confirm('New version available! Refresh to update?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App is ready for offline use.');
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Site />
  </React.StrictMode>
);