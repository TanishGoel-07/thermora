/* eslint-disable no-restricted-globals */

const CACHE_NAME = "thermora-cache-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

// --- Install: pre-cache the app shell -------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// --- Activate: clean up old cache versions --------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// --- Fetch: cache-first for the built app shell/static assets, network-first
// for API calls (so dashboard data is never served stale from cache) -------
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isApiCall = url.pathname.startsWith("/api");

  if (isApiCall) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ offline: true }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => caches.match("/index.html"))
    )
  );
});

// --- Push notifications ----------------------------------------------------
self.addEventListener("push", (event) => {
  let data = { title: "Thermora Alert", body: "A new heat alert has been issued." };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // fall back to default message above
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
