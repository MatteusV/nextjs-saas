const STATIC_CACHE = "ai-stylizer-static-v3"
const RUNTIME_CACHE = "ai-stylizer-runtime-v3"

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

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || "Nova notificação"
  const body = data.body || ""
  const url = data.url || "/app"

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: "/icon-light-32x32.png",
      badge: "/icon-light-32x32.png",
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || "/app"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const hadWindow = clientsArr.some((client) => {
        if (client.url.includes(targetUrl)) {
          client.focus()
          return true
        }
        return false
      })
      if (!hadWindow) {
        self.clients.openWindow(targetUrl)
      }
    })
  )
})
