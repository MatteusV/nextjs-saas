import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminUser } from "@/server-actions/admin"
import { sendPushToUsers } from "@/server-actions/push"

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

  const audienceFilter =
    audience === "pro"
      ? "PRO"
      : audience === "business"
        ? "BUSINESS"
        : audience === "free"
          ? "FREE_TIER"
          : null

  const users = await prisma.user.findMany({
    where: audienceFilter ? { subscriptionPlan: audienceFilter } : {},
    select: { id: true },
  })

  const userIds = users.map((user) => user.id)
  if (userIds.length) {
    await sendPushToUsers({
      userIds,
      payload: {
        title,
        body: bodyText,
        url: "/app",
        notificationId: notification.id,
      },
    })
  }

  return NextResponse.json({ ok: true, notification })
}
