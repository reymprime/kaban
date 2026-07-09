// Kaban service worker — network-first with offline cache fallback.
// Bump CACHE version when you want to force a full refresh.
const CACHE = 'kaban-v14';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests (skip fonts CDN etc. — browser caches those)
  if (url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        // Offline navigation fallback to app shell
        if (request.mode === 'navigate') {
          const shell = await cache.match(new URL('./index.html', self.registration.scope).href);
          if (shell) return shell;
        }
        return Response.error();
      }
    })()
  );
});
