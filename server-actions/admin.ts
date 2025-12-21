"use server"

import { getSessionUser } from "@/server-actions/session"

export async function getAdminUser() {
  const user = await getSessionUser()
  if (!user) return null
  return user.role === "ADMIN" ? user : null
}
