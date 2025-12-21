import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminUser } from "@/server-actions/admin"

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const bodyText = typeof body.body === "string" ? body.body.trim() : ""
  const audience = typeof body.audience === "string" ? body.audience : "all"

  if (!title || !bodyText) {
    return NextResponse.json({ error: "Missing title or body" }, { status: 400 })
  }

  const notification = await prisma.adminNotification.create({
    data: {
      title,
      body: bodyText,
      audience,
    },
  })

  return NextResponse.json({ ok: true, notification })
}
