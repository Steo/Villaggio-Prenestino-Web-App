const CACHE_NAME = 'cdq-prenestino-v1.6.1';
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

const isDevHost = self.location.hostname.includes('ais-dev-') || 
                  self.location.hostname === 'localhost' || 
                  self.location.hostname === '127.0.0.1';

self.addEventListener('install', (event) => {
  if (isDevHost) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  if (isDevHost) {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
    return;
  }

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Non intercettare mai in ambiente di sviluppo, né richieste api, sorgenti o dipendenze Vite
  if (
    isDevHost ||
    url.pathname.includes('/wp-json/') || 
    url.pathname.includes('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.searchParams.has('v')
  ) {
    return;
  }

  // Network-first per la pagina principale index.html per garantire sempre l'ultimo bundle aggiornato
  if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
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
