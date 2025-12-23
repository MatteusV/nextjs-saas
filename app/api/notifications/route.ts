import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

const audienceByPlan = {
  FREE_TIER: ["all", "free"],
  PRO: ["all", "pro"],
  BUSINESS: ["all", "business"],
} as const

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allowedAudiences =
    audienceByPlan[user.subscriptionPlan as keyof typeof audienceByPlan] ?? ["all"]

  const notifications = await prisma.adminNotification.findMany({
    where: {
      audience: { in: allowedAudiences },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const reads = await prisma.notificationRead.findMany({
    where: {
      userId: user.id,
      notificationId: { in: notifications.map((item) => item.id) },
    },
    select: { notificationId: true, readAt: true },
  })

  const readMap = new Map(reads.map((item) => [item.notificationId, item.readAt]))

  const items = notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    audience: notification.audience,
    createdAt: notification.createdAt,
    readAt: readMap.get(notification.id) ?? null,
  }))

  return Response.json({ notifications: items })
}
