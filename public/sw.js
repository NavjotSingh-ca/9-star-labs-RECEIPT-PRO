// 9 Star Labs — Service Worker (Offline-First PWA)
// Caches app shell and provides offline scan queue capability

const CACHE_VERSION = '9sl-v2026-06-01';
const STATIC_CACHE = '9sl-static-v2026-06-01';

const APP_SHELL = [
  '/',
  '/privacy',
  '/terms',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only cache http(s) URLs — chrome-extension, blob, data, etc are unsupported
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // Network-only for API and auth-sensitive calls
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase') || url.pathname.includes('auth')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Cache-first for Next.js static build output (content-addressed, immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (!response.ok) return response;
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {});
            return response;
          })
      )
    );
    return;
  }

  // Cache-first for static assets by extension
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (!response.ok) return response;
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {});
            return response;
          })
      )
    );
    return;
  }

  // Navigation: network-first with offline fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response.ok) return response;
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  );
});

// Offline sync is handled by the client-side online detection
// in useScannerState.ts. Background Sync in the SW cannot process
// receipts without auth context, so we rely on the app's own
// reconnection logic instead.
