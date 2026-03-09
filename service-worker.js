/**
 * aBest.co Service Worker
 * PWA Offline-Support · Cache-First für Assets · Network-First für HTML
 */

const CACHE_NAME    = 'abest-v2';
const STATIC_ASSETS = [
    '/',
    '/app.js',
    '/index.css',
    '/favicon.png',
    '/manifest.json',
    '/de/',
    '/en/',
    // Core fonts (Google Fonts are cached on first load)
];

// ── Install: Pre-cache static assets ────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Ignore failures for individual resources
            });
        })
    );
    self.skipWaiting();
});

// ── Activate: Clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: Stale-While-Revalidate Strategy ────────────────────────────────────
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET, API calls, and cross-origin requests
    if (request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/')) return;
    if (!url.origin.includes('abest.co') && !url.hostname.includes('localhost')) {
        // Still cache fonts from Google
        if (!url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
            return;
        }
    }

    // HTML pages: Network-first, fallback to cache, fallback to /de/ offline page
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request)
                        .then(cached => cached || caches.match('/de/'))
                )
        );
        return;
    }

    // Assets: Cache-first, then network (stale-while-revalidate)
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(request).then(cached => {
                const networkFetch = fetch(request).then(response => {
                    if (response.ok) cache.put(request, response.clone());
                    return response;
                }).catch(() => cached);

                return cached || networkFetch;
            })
        )
    );
});

// ── Background sync (future: sync behavior data when back online) ─────────────
self.addEventListener('sync', event => {
    if (event.tag === 'sync-behavior') {
        // handled in app.js
    }
});
