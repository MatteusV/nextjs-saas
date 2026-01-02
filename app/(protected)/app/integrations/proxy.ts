import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const appUrl = request.nextUrl.clone()
  appUrl.pathname = "/app"
  appUrl.search = ""
  return NextResponse.redirect(appUrl)
}
