// Leduc Receipt Pro — Service Worker (Offline-First PWA)
// Caches app shell and provides offline scan queue capability

const CACHE_VERSION = 'lrp-v2026-06-13';
const STATIC_CACHE = 'lrp-static';
const FONT_CACHE = 'lrp-fonts';
const IMAGE_CACHE = 'lrp-images';

const APP_SHELL = [
  '/',
  '/privacy',
  '/terms',
  '/manifest.json',
];

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|webp|avif|gif|svg|ico)$/;
const FONT_EXTENSIONS = /\.(woff2?|ttf|otf|eot)$/;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Background Sync for offline receipt queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-receipts') {
    event.waitUntil(syncPendingReceipts());
  }
});

async function syncPendingReceipts() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'SYNC_PENDING' });
    }
  } catch {
    // Client may be offline or closed — retry on next sync event
  }
}

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

  // Cache-first for fonts (separate cache to avoid eviction)
  if (url.pathname.match(FONT_EXTENSIONS)) {
    event.respondWith(
      caches.match(event.request, { cacheName: FONT_CACHE }).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (!response.ok) return response;
            const clone = response.clone();
            caches.open(FONT_CACHE).then((cache) => cache.put(event.request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Cache-first for images with size limit (2MB)
  if (url.pathname.match(IMAGE_EXTENSIONS)) {
    event.respondWith(
      caches.match(event.request, { cacheName: IMAGE_CACHE }).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (!response.ok) return response;
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) return response;
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(event.request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Cache-first for other static assets
  if (url.pathname.match(/\.(js|css)$/)) {
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

// Offline sync enhancement with IndexedDB message passing
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'PROCESS_SYNC_QUEUE') {
    event.waitUntil(processSyncQueue(event.data.orgId));
  }
});

async function processSyncQueue(orgId) {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'SYNC_STARTED', orgId });
    }
  } catch {
    // Silent fail - clients may be offline
  }
}
