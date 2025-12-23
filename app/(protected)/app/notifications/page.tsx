import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const audienceByPlan = {
  FREE_TIER: ["all", "free"],
  PRO: ["all", "pro"],
  BUSINESS: ["all", "business"],
} as const

export default async function NotificationsPage() {
  const user = await getSessionUser()
  if (!user) {
    return null
  }

  const allowedAudiences =
    audienceByPlan[user.subscriptionPlan as keyof typeof audienceByPlan] ?? ["all"]

  const notifications = await prisma.adminNotification.findMany({
    where: { audience: { in: allowedAudiences } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const reads = await prisma.notificationRead.findMany({
    where: {
      userId: user.id,
      notificationId: { in: notifications.map((item) => item.id) },
    },
    select: { notificationId: true },
  })

  const readSet = new Set(reads.map((item) => item.notificationId))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Notificações</h1>
        <p className="text-sm text-muted-foreground">
          Comunicados da equipe e atualizações importantes do produto.
        </p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma notificação</CardTitle>
            <CardDescription>Quando houver novidades, elas aparecerão aqui.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  <CardDescription>{notification.body}</CardDescription>
                </div>
                {!readSet.has(notification.id) ? <Badge>Nova</Badge> : null}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {new Date(notification.createdAt).toLocaleString("pt-BR")}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
