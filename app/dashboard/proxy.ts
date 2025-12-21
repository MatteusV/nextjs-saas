import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value

  if (!token) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    if (payload.role !== "ADMIN") {
      const appUrl = request.nextUrl.clone()
      appUrl.pathname = "/app"
      appUrl.search = ""
      return NextResponse.redirect(appUrl)
    }
    return NextResponse.next()
  } catch {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
}
