const CACHE_NAME = 'cdq-prenestino-v2';
const ASSETS_TO_CACHE = [
  './',
  './manifest.webmanifest',
  './manifest.json',
  './pwa-icon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './apple-touch-icon.png',
  './favicon-32x32.png',
  './logoo-cdq-2019-BIANCO-ORIZZONTALE.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Gestione richieste GET per file statici e navigazione
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Non cachare chiamate API WordPress o server esterno
  if (url.pathname.includes('/wp-json/') || url.pathname.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Restituisci la cache e aggiorna in background (stale-while-revalidate per shell)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Offline, niente da fare
        });
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback offline di navigazione
        if (event.request.mode === 'navigate') {
          return caches.match('./');
        }
      });
    })
  );
});
