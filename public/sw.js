const CACHE_NAME = 'hubforge-os-v2'
const APP_SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/logo.svg']
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {})).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.pathname.startsWith('/api/')) { event.respondWith(fetch(req)); return }
  event.respondWith(caches.match(req).then((cached) => {
    if (cached) return cached
    return fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const resClone = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)) }
      return res
    }).catch(() => { if (req.mode === 'navigate') return caches.match('/').then((offline) => offline || caches.match('/')) })
  }))
})
