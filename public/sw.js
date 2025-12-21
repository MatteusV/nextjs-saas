const STATIC_CACHE = "ai-stylizer-static-v2"
const RUNTIME_CACHE = "ai-stylizer-runtime-v2"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        "/",
        "/app",
        "/manifest.webmanifest",
        "/icon.svg",
        "/apple-icon.png",
      ])
    )
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const request = event.request
  const url = new URL(request.url)
  const isNavigate = request.mode === "navigate"

  if (isNavigate) {
    event.respondWith(fetch(request).catch(() => caches.match("/app")))
    return
  }

  if (url.pathname.startsWith("/api")) {
    return
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/fonts") ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|css|js|woff2)$/)

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone))
            return response
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone()
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone))
        return response
      })
      .catch(() => caches.match(request))
  )
})
