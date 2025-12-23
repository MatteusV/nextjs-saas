import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

const bodySchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
})

const audienceByPlan = {
  FREE_TIER: ["all", "free"],
  PRO: ["all", "pro"],
  BUSINESS: ["all", "business"],
} as const

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

  const allowedAudiences =
    audienceByPlan[user.subscriptionPlan as keyof typeof audienceByPlan] ?? ["all"]

  const allowedNotifications = await prisma.adminNotification.findMany({
    where: {
      id: { in: parsed.data.notificationIds },
      audience: { in: allowedAudiences },
    },
    select: { id: true },
  })

  if (allowedNotifications.length) {
    const now = new Date()
    await prisma.notificationRead.createMany({
      data: allowedNotifications.map((notification) => ({
        notificationId: notification.id,
        userId: user.id,
        readAt: now,
      })),
      skipDuplicates: true,
    })
  }

  return Response.json({ ok: true })
}

export async function PUT() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allowedAudiences =
    audienceByPlan[user.subscriptionPlan as keyof typeof audienceByPlan] ?? ["all"]

  const notifications = await prisma.adminNotification.findMany({
    where: { audience: { in: allowedAudiences } },
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
