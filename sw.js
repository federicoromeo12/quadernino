// Offline support: network first (always fresh when online), cached copy when offline.
const CACHE = 'quadernino';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'logic.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // place search goes straight to the network
  e.respondWith(
    fetch(e.request, { cache: 'reload' }) // skip the browser's own cache, or a stale 404/old file outlives a deploy
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
