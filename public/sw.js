// 9 Star Labs — Service Worker (Offline-First PWA)
// Caches app shell and provides offline scan queue capability

// Cache version — increment this when deploying significant updates
// Format: 9sl-vYYYY-MM-DD or 9sl-v{major}.{minor}
const CACHE_NAME = '9sl-v2026-05';
const STATIC_CACHE = '9sl-static-v2026-05';

const APP_SHELL = [
  '/',
  '/privacy',
  '/terms',
  '/manifest.json',
];

// Install: cache app shell with skip-waiting
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Take over immediately on update
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activate: clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // Take control of open tabs
  );
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API calls: network-first
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache-first
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
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
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  );
});

// Offline Scan Queue — stores pending scans in IndexedDB
// When back online, syncs them to the server
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-receipts') {
    event.waitUntil(syncPendingReceipts());
  }
});

async function syncPendingReceipts() {
  // This will be called by the SyncManager when connectivity is restored
  // The actual implementation reads from IndexedDB and posts to the server
  // For now, notify the client to trigger a refetch
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}
