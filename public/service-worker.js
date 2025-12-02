const CACHE_NAME = 'nature-bio-cache-v3';
const OFFLINE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const { origin } = new URL(request.url);
  if (origin !== self.location.origin || request.cache === 'only-if-cached') return;

  const wantsHTML = request.headers.get('accept')?.includes('text/html');

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (wantsHTML) {
          const offline = await caches.match('/index.html');
          if (offline) return offline;
        }

        return Response.error();
      }
    })()
  );
});
