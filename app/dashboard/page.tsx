import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminPriceForm } from "@/components/admin-price-form"
import { AdminPlanBenefitsForm } from "@/components/admin-plan-benefits-form"
import { AdminNotificationForm } from "@/components/admin-notification-form"
import { AdminPromotionForm } from "@/components/admin-promotion-form"
import { AdminPriceHistoryDialog } from "@/components/admin-price-history-dialog"
import { AdminNotificationHistoryDialog } from "@/components/admin-notification-history-dialog"
import { AdminPromotionHistoryDialog } from "@/components/admin-promotion-history-dialog"
import { prisma } from "@/lib/prisma"
import { getStripePricesByIds } from "@/lib/stripe"
import { getAdminUser } from "@/server-actions/admin"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  Bell,
  CreditCard,
  Crown,
  Gauge,
  Sparkles,
  Tag,
  Users,
} from "lucide-react"

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value)
}

export default async function AdminDashboardPage() {
  const admin = await getAdminUser()
  if (!admin) {
    redirect("/app")
  }

  const [userTotal, activeSubscribers, uploads30d, plans, recentNotifications, recentPromotions] =
    await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionPlan: { not: "FREE_TIER" } } }),
    prisma.userUpload.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        },
      },
    }),
    prisma.plan.findMany(),
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const notificationItems = recentNotifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    audience: notification.audience,
  }))

  const promotionItems = recentPromotions.map((promo) => ({
    id: promo.id,
    code: promo.code,
    discountPercent: promo.discountPercent,
    maxRedemptions: promo.maxRedemptions,
    expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
  }))

  const pricesById = await getStripePricesByIds(
    plans.map((plan) => plan.stripePriceId).filter(Boolean) as string[]
  )

  const planCounts = await prisma.user.groupBy({
    by: ["subscriptionPlan"],
    _count: { _all: true },
  })

  const planById = Object.fromEntries(plans.map((plan) => [plan.id, plan]))
  const totalAccounts = planCounts.reduce((sum, item) => sum + item._count._all, 0)

  const planBreakdown = planCounts.map((item) => ({
    plan: planById[item.subscriptionPlan]?.name ?? item.subscriptionPlan,
    count: item._count._all,
    color:
      item.subscriptionPlan === "FREE_TIER"
        ? "bg-muted"
        : item.subscriptionPlan === "PRO"
          ? "bg-primary/80"
          : "bg-chart-4/80",
  }))

  const estimatedMrr = planCounts.reduce((sum, item) => {
    if (item.subscriptionPlan === "FREE_TIER") {
      return sum
    }
    const plan = planById[item.subscriptionPlan]
    if (!plan?.stripePriceId) {
      return sum
    }
    const price = pricesById[plan.stripePriceId]
    if (!price?.unit_amount) {
      return sum
    }
    return sum + (price.unit_amount / 100) * item._count._all
  }, 0)

  const metrics = [
    { label: "Usuários totais", value: userTotal.toLocaleString("pt-BR") },
    { label: "Assinantes ativos", value: activeSubscribers.toLocaleString("pt-BR") },
    {
      label: "MRR estimado",
      value: formatCurrency(estimatedMrr, "BRL"),
    },
    {
      label: "Imagens geradas (30d)",
      value: uploads30d.toLocaleString("pt-BR"),
    },
  ]

  const plansWithPrices = plans.map((plan) => {
    const price = plan.stripePriceId ? pricesById[plan.stripePriceId] : null
    const amount = price?.unit_amount
    const currency = price?.currency?.toUpperCase()
    const interval = price?.recurring?.interval
    const intervalLabel =
      interval === "month"
        ? "mês"
        : interval === "year"
          ? "ano"
          : interval === "week"
            ? "semana"
            : interval === "day"
              ? "dia"
              : interval
    const priceLabel =
      amount != null && currency
        ? `${formatCurrency(amount / 100, currency)}${intervalLabel ? ` / ${intervalLabel}` : ""}`
        : plan.id === "FREE_TIER"
          ? "R$ 0,00 / mês"
          : null

    return {
      id: plan.id,
      name: plan.name,
      priceLabel,
      stripePriceId: plan.stripePriceId ?? null,
    }
  })

  const stripeDashboardUrl = process.env.STRIPE_DASHBOARD_URL ?? "https://dashboard.stripe.com"

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <Gauge className="h-3 w-3 text-primary" />
            Painel administrativo
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance">Resumo da plataforma</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Acompanhe métricas, planos e ações administrativas em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary">
            <Sparkles className="h-4 w-4" />
            Exportar relatório
          </Button>
          <Button asChild>
            <a href={stripeDashboardUrl} target="_blank" rel="noreferrer">
              <ArrowUpRight className="h-4 w-4" />
              Ver painel financeiro
            </a>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="shadow-xl border-border/50 bg-card/95">
            <CardHeader className="space-y-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold">{metric.value}</CardTitle>
            </CardHeader>
            <CardFooter>
              <Badge variant="secondary">Atualizado agora</Badge>
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Users className="h-5 w-5 text-primary" />
              Distribuicao por plano
            </CardTitle>
            <CardDescription>Usuários ativos separados por tipo de assinatura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planBreakdown.map((item) => (
              <div key={item.plan} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.plan}</span>
                  <span className="text-muted-foreground">{item.count} usuários</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{
                      width: `${totalAccounts ? Math.min(100, (item.count / totalAccounts) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              Total de contas ativas:{" "}
              <span className="text-foreground font-medium">
                {totalAccounts.toLocaleString("pt-BR")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Crown className="h-5 w-5 text-primary" />
              Status da receita
            </CardTitle>
            <CardDescription>Resumo rapido dos pagamentos deste mes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pagamentos confirmados</span>
                <span className="font-medium">{formatCurrency(estimatedMrr, "BRL")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pendencias</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cancelamentos</span>
                <span className="font-medium">-</span>
              </div>
            </div>
            <Button variant="secondary" className="w-full" asChild>
              <a href={stripeDashboardUrl} target="_blank" rel="noreferrer">
                <CreditCard className="h-4 w-4" />
                Abrir painel Stripe
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-xl border-border/50 bg-card/95 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <CreditCard className="h-5 w-5 text-primary" />
              Ajustar preços
            </CardTitle>
            <CardDescription>Atualize valores e destaque planos em promoção.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminPriceForm plans={plansWithPrices.filter((plan) => plan.id !== "FREE_TIER")} />
          </CardContent>
          <CardFooter className="border-t border-border/60">
            <AdminPriceHistoryDialog plans={plansWithPrices} />
          </CardFooter>
        </Card>

        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>Envie comunicados para sua base.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminNotificationForm />
          </CardContent>
          <CardFooter className="border-t border-border/60">
            <AdminNotificationHistoryDialog notifications={notificationItems} />
          </CardFooter>
        </Card>
      </section>

      <section>
        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Sparkles className="h-5 w-5 text-primary" />
              Benefícios dos planos
            </CardTitle>
            <CardDescription>Atualize os benefícios exibidos no site e na área logada.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminPlanBenefitsForm plans={plansWithPrices} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Tag className="h-5 w-5 text-primary" />
              Promoções e cupons
            </CardTitle>
            <CardDescription>Crie campanhas para aumentar conversoes.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminPromotionForm />
          </CardContent>
          <CardFooter className="border-t border-border/60">
            <AdminPromotionHistoryDialog promotions={promotionItems} />
          </CardFooter>
        </Card>

        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Sparkles className="h-5 w-5 text-primary" />
              Ações rápidas
            </CardTitle>
            <CardDescription>Atalhos para o dia a dia do time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
              <span>Atualizar changelog</span>
              <Badge variant="secondary">Hoje</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
              <span>Revisar tickets abertos</span>
              <Badge variant="outline">12 pendentes</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
              <span>Planejar campanha mensal</span>
              <Badge variant="secondary">Em andamento</Badge>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60">
            <Button variant="secondary" className="w-full">
              Abrir tarefas
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
