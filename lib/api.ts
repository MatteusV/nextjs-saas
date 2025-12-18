const API_URL = process.env.NEXT_PUBLIC_API_URL

export function api(path: string, options: RequestInit = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set")
  }

  const headers = new Headers(options.headers)

  // Only add Content-Type if not already set and body is not FormData.
  if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(`${API_URL}${path}`, {
    credentials: options.credentials ?? "include",
    ...options,
    headers,
  })
}
