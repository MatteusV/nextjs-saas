import { PlanSelector } from "@/components/plan-selector"
import { CreditPackCard } from "@/components/credit-pack-card"
import { prisma } from "@/lib/prisma"
import { getStripePricesByIds } from "@/server-actions/stripe"
import { getSessionUserWithStatus } from "@/server-actions/session"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldCheck, Sparkles } from "lucide-react"

export default async function PlansPage() {
  const { user, status } = await getSessionUserWithStatus()
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Sessao invalida
            </CardTitle>
            <CardDescription>
              Não foi possível validar sua sessão. Faça login novamente ou verifique as variáveis
              de ambiente no servidor.
            </CardDescription>
          </CardHeader>
          {process.env.NODE_ENV !== "production" ? (
            <CardContent>
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                Diagnostico: <span className="text-foreground font-medium">{status}</span>
              </div>
            </CardContent>
          ) : null}
          <CardFooter className="border-t border-border/60">
            <Button asChild className="w-full">
              <Link href="/login">Ir para login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const plans = await prisma.plan.findMany()
  const orderedPlans = ["FREE_TIER", "PRO", "BUSINESS"]
  const sortedPlans = plans.sort(
    (a, b) => orderedPlans.indexOf(a.id) - orderedPlans.indexOf(b.id)
  )

  const userPlan = sortedPlans.find((plan) => plan.id === user.subscriptionPlan) ?? null
  const pricesById = await getStripePricesByIds(
    [
      ...sortedPlans.map((plan) => plan.stripePriceId),
      userPlan?.creditPackPriceId,
    ].filter(Boolean) as string[]
  )

  const plansWithPrices = sortedPlans.map((plan) => {
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
        ? new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency,
          }).format(amount / 100) + (intervalLabel ? ` / ${intervalLabel}` : "")
        : plan.id === "FREE_TIER"
          ? "R$ 0,00 / mês"
          : null

    return {
      ...plan,
      priceLabel,
    }
  })

  const creditPackPrice = userPlan?.creditPackPriceId
    ? pricesById[userPlan.creditPackPriceId]
    : null
  const creditPackAmount = userPlan?.creditPackAmount ?? null
  const creditPackLabel =
    creditPackPrice?.unit_amount != null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: creditPackPrice.currency.toUpperCase(),
        }).format(creditPackPrice.unit_amount / 100)
      : null

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Upgrade com checkout seguro
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance">Escolha seu plano</h1>
        <p className="text-lg text-muted-foreground text-pretty">
          Selecione um plano para iniciar o checkout e cadastrar seu cartao no Stripe.
        </p>
      </header>

      <PlanSelector plans={plansWithPrices} currentPlanId={user.subscriptionPlan} />

      <CreditPackCard
        packAmount={creditPackAmount}
        priceLabel={creditPackLabel ? `${creditPackLabel} por pacote` : null}
        stripeEnabled
        canBuy={Boolean(creditPackAmount && userPlan?.creditPackPriceId)}
      />

      <div className="flex justify-start">
        <Button variant="ghost" asChild>
          <Link href="/app/profile">Voltar para perfil</Link>
        </Button>
      </div>
    </div>
  )
}
