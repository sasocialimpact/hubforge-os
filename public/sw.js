// HubForge OS Service Worker
// Strategy:
//   - Navigation requests (HTML pages): NETWORK-FIRST with cache fallback.
//     This ensures users always get the latest code after a deploy, while
//     still working offline. (A stale cache here was causing the org page
//     to show an old version where the Continue button didn't work.)
//   - Static assets (_next/static, icons, manifest): CACHE-FIRST.
//     These have content hashes in filenames so caching is safe.
//   - API requests: always network (no caching).
const CACHE_NAME = 'hubforge-os-v3'
const APP_SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/logo.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // API calls: always hit the network, never cache.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req))
    return
  }

  // Static assets with content hashes: cache-first is safe and fast.
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|ttf|css)$/i)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const resClone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone))
        }
        return res
      }))
    )
    return
  }

  // Navigation requests (HTML pages): NETWORK-FIRST so users always get the
  // latest code. Falls back to cache (then to cached '/') when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache the latest version of the page.
          if (res.ok) {
            const resClone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone))
          }
          return res
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    )
    return
  }

  // Everything else: cache-first, fall back to network.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') {
        const resClone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone))
      }
      return res
    }))
  )
})
