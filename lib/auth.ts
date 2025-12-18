import "server-only"

import { cookies, headers } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export type SessionUser = {
  id?: string
  email?: string
  name?: string
  [key: string]: unknown
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!API_URL) return null

  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ")
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent") ?? undefined

  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      cookie: cookieHeader,
      ...(userAgent ? { "user-agent": userAgent } : {}),
    },
    cache: "no-store",
  })

  if (!response.ok) return null

  const data = (await response.json().catch(() => null)) as SessionUser | null
  return data
}
