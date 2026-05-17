const FONT_CACHE_NAME = 'font-cache-v1';
const FONT_URLS = [
  '/fonts/MapleMonoNL-CN-Medium.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(FONT_CACHE_NAME).then((cache) => {
      const basePath = self.registration.scope.replace(/\/$/, '');
      const urlsToCache = FONT_URLS.map((url) => basePath + url);
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('font-cache-') && name !== FONT_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.woff2') || url.pathname.endsWith('.woff') || url.pathname.endsWith('.ttf')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(FONT_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
