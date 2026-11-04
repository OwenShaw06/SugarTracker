/* Offline support.
 * To ship an update: change any file, then bump CACHE_VERSION below. The phone sees the new
 * service-worker.js, downloads everything fresh, deletes the old cache and reloads the app.
 */
var CACHE_VERSION = 1;
var CACHE = 'pink-tracker-v' + CACHE_VERSION;

var FILES = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/streak.js',
  './js/fasting.js',
  './js/storage.js',
  './js/ui-common.js',
  './js/ui-today.js',
  './js/ui-week.js',
  './js/ui-settings.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // cache: 'reload' skips the browser's HTTP cache so an update never caches stale files
      return Promise.all(FILES.map(function (url) { return cache.add(new Request(url, { cache: 'reload' })); }));
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).catch(function () {
        return req.mode === 'navigate' ? caches.match('./index.html') : Response.error();
      });
    })
  );
});
