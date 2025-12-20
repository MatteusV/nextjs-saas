import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Keep this file minimal: calling the backend from proxy/middleware can add latency.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = request.cookies.get("session")?.value

  if (!token) {
    if (path === "/login" || path === "/register" || path === "/") {
      return NextResponse.next()
    }
    if (!path.startsWith("/app")) {
      return NextResponse.next()
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return NextResponse.json({ error: "JWT_SECRET is not set" }, { status: 500 })
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    if (path === "/login" || path === "/register") {
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

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
}
