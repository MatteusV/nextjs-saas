import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// export function proxy(request: NextRequest) {
//   const token = request.cookies.get("auth_token")?.value
//   const isAppRoute = request.nextUrl.pathname.startsWith("/app")
//   const isAuthRoute = ["/login", "/register"].includes(request.nextUrl.pathname)

//   // Redirect authenticated users away from auth pages
//   if (token && isAuthRoute) {
//     return NextResponse.redirect(new URL("/app", request.url))
//   }

//   // Redirect unauthenticated users to login
//   if (!token && isAppRoute) {
//     const loginUrl = new URL("/login", request.url)
//     loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
//     return NextResponse.redirect(loginUrl)
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ["/app/:path*", "/login", "/register"],
// }
