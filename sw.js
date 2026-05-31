// ── Fitness Timer Service Worker ──────────────────────────────────────────────
const CACHE = "fit-timer-v1";

// Files to cache for offline use
const ASSETS = [
  "/fitness-timer/",
  "/fitness-timer/index.html",
  "/fitness-timer/manifest.json",
  "/fitness-timer/icons/icon-192.png",
  "/fitness-timer/icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js",
];

// Install: cache all assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app assets, network-first for everything else
self.addEventListener("fetch", e => {
  // Skip non-GET and chrome-extension requests
  if(e.request.method !== "GET") return;
  if(e.request.url.startsWith("chrome-extension")) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(response => {
        // Cache valid responses for our own assets
        if(response && response.status === 200 && response.type !== "opaque"){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if(e.request.mode === "navigate"){
          return caches.match("/fitness-timer/index.html");
        }
      });
    })
  );
});
