// public/sw.js
self.addEventListener('install', () => {
  // Skip waiting is essential for development and for ensuring the new SW
  // activates immediately after an update.
  self.skipWaiting();
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
  // clients.claim() allows an activated service worker to take control of the page
  // without requiring a reload.
  event.waitUntil(self.clients.claim());
  console.log('Service Worker: Activated and claimed clients');
});

// Optional: Caching logic for model files can be added here in the fetch event listener
// for improved performance on subsequent loads. For now, it's a pass-through.
self.addEventListener('fetch', (event) => {
  // This service worker doesn't intercept fetches by default.
  // It's primarily here to satisfy same-origin requirements.
  return;
});
