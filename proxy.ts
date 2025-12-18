import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Keep this file minimal: calling the backend from proxy/middleware can add latency
// because it may run on every navigation. Route protection is handled in server
// components (see `app/(protected)/app/layout.tsx`).
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  // Match a non-existent route to effectively disable this proxy.
  matcher: ["/__proxy_disabled__"],
}
