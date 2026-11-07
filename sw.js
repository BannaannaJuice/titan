/* Titan service worker: keeps the app itself on the phone so it opens with no signal.
   Your parts are not cached here: the app keeps its own copy and a queue of unsaved changes. */
const CACHE = 'titan-d4a80b5d29';
const SHELL = ['./', 'manifest.webmanifest', 'logo.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('titan-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // saving goes straight to the network
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // the Google Sheet connection is never cached
  const scope = self.registration.scope;
  // The page itself (with ?api=…&key=… on the address): the copy on the phone first, the network if there's none.
  if (req.mode === 'navigate') {
    e.respondWith(caches.match(scope).then((hit) => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
