import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

const bodySchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
})

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const now = new Date()
  await prisma.notificationRead.createMany({
    data: parsed.data.notificationIds.map((notificationId) => ({
      notificationId,
      userId: user.id,
      readAt: now,
    })),
    skipDuplicates: true,
  })

  return Response.json({ ok: true })
}

export async function PUT() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const notifications = await prisma.adminNotification.findMany({
    select: { id: true },
  })

  if (!notifications.length) {
    return Response.json({ ok: true })
  }

  const now = new Date()
  await prisma.notificationRead.createMany({
    data: notifications.map((notification) => ({
      notificationId: notification.id,
      userId: user.id,
      readAt: now,
    })),
    skipDuplicates: true,
  })

  return Response.json({ ok: true })
}
