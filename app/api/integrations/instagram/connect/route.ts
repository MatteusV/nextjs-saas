import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSessionUser } from "@/server-actions/session"
import { buildInstagramAuthUrl } from "@/lib/integrations/instagram"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    const origin = new URL(request.url).origin
    return NextResponse.redirect(new URL("/login", origin))
  }

  const authUrl = buildInstagramAuthUrl(randomBytes(16).toString("hex"))
  if (!authUrl) {
    return NextResponse.json({ error: "Instagram não configurado" }, { status: 500 })
  }

  const state = new URL(authUrl).searchParams.get("state") ?? ""
  const cookieStore = await cookies()
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  })

  return NextResponse.redirect(authUrl)
}
