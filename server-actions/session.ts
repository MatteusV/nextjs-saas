"use server"

import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

type SessionStatus =
  | "ok"
  | "missing_cookie"
  | "missing_secret"
  | "invalid_token"
  | "missing_subject"
  | "user_not_found"

export async function getSessionUser() {
  const { user } = await getSessionUserWithStatus()
  return user
}

export async function getSessionUserWithStatus() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session")?.value
  if (!sessionToken) {
    console.warn("[session] Missing session cookie")
    return { user: null, status: "missing_cookie" as SessionStatus }
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.warn("[session] JWT_SECRET is not set")
    return { user: null, status: "missing_secret" as SessionStatus }
  }

  try {
    const { payload } = await jwtVerify(sessionToken, new TextEncoder().encode(secret))
    if (!payload.sub) {
      console.warn("[session] Session token missing subject")
      return { user: null, status: "missing_subject" as SessionStatus }
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { plan: true },
    })

    if (!user) {
      return { user: null, status: "user_not_found" as SessionStatus }
    }

    return { user, status: "ok" as SessionStatus }
  } catch (error) {
    console.warn("[session] Failed to verify session token", error)
    return { user: null, status: "invalid_token" as SessionStatus }
  }
}
