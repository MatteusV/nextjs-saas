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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StripePortalButton } from "@/components/stripe-portal-button"
import { ProfileEditor } from "@/components/profile-editor"
import { PasswordResetCard } from "@/components/password-reset-card"
import { prisma } from "@/lib/prisma"
import { getSessionUserWithStatus } from "@/server-actions/session"
import { getStripeBillingSummary } from "@/lib/stripe"
import Link from "next/link"
import { Crown, Receipt, ShieldCheck, Sparkles, User } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  trialing: "Periodo de teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelado",
  unpaid: "Inadimplente",
  paid: "Pago",
  open: "Aberto",
  void: "Cancelado",
  uncollectible: "Inadimplente",
  incomplete: "Incompleto",
  incomplete_expired: "Expirado",
  paused: "Pausado",
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value)
}

function getInitials(name: string) {
  const [first, last] = name.trim().split(" ")
  const firstInitial = first?.[0] ?? ""
  const lastInitial = last?.[0] ?? ""
  return `${firstInitial}${lastInitial}`.toUpperCase() || "US"
}

function formatInterval(interval?: string | null) {
  if (interval === "year") return "ano"
  if (interval === "week") return "semana"
  if (interval === "day") return "dia"
  return "mes"
}

export default async function ProfilePage() {
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
              Nao foi possivel validar sua sessao. Faca login novamente ou verifique as variaveis
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

  const uploadsCount = prisma.userUpload
    ? await prisma.userUpload.count({ where: { userId: user.id } })
    : 0


  const billing = await getStripeBillingSummary({
    email: user.email,
    name: user.name,
  })

  const subscription = billing.subscription
  const subscriptionStatus = subscription?.status ? STATUS_LABELS[subscription.status] : "Sem assinatura ativa"
  const subscriptionPrice = subscription?.items.data[0]?.price
  const subscriptionAmount =
    subscriptionPrice?.unit_amount != null
      ? formatCurrency(subscriptionPrice.unit_amount / 100, subscriptionPrice.currency.toUpperCase())
      : null
  const subscriptionInterval = subscriptionPrice?.recurring?.interval
    ? formatInterval(subscriptionPrice.recurring.interval)
    : null
  const subscriptionPlanName = subscriptionPrice?.nickname ?? user.plan?.name ?? "Plano Free"
  const nextBillingDate = subscription?.current_period_end
    ? formatDate(new Date(subscription.current_period_end * 1000))
    : null
  const renewalLabel = subscription
    ? subscription.cancel_at_period_end
      ? "Cancela ao fim do periodo"
      : "Renovacao automatica"
    : "Sem cobranca"

  const usageLimit = user.plan?.stylizeLimit ?? null
  const usageCount = user.stylizeUsageCount ?? 0
  const usagePercent = usageLimit ? Math.min(100, Math.round((usageCount / usageLimit) * 100)) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-balance">Perfil e plano</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Gerencie seus dados e controle sua assinatura com o Stripe.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" asChild>
            <Link href="/app/plans">
              <Sparkles className="h-4 w-4" />
              Atualizar plano
            </Link>
          </Button>
          <StripePortalButton
            leadingIcon={<ShieldCheck className="h-4 w-4" />}
            disabled={!billing.enabled}
          >
            Abrir portal Stripe
          </StripePortalButton>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <User className="h-5 w-5 text-primary" />
              Seu perfil
            </CardTitle>
            <CardDescription>Informacoes basicas da conta e status atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src="/placeholder-user.jpg" alt="Foto do usuario" />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.pendingEmail ? (
                  <p className="text-xs text-muted-foreground">
                    Novo email pendente: <span className="text-foreground">{user.pendingEmail}</span>
                  </p>
                ) : null}
              </div>
              <Badge variant={user.verifiedAt ? "default" : "secondary"} className="ml-auto">
                {user.verifiedAt ? "Ativo" : "Pendente"}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Conta desde</p>
                <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano atual</p>
                <p className="text-sm font-medium">{subscriptionPlanName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Imagens geradas neste periodo</span>
                  <span className="font-medium">
                    {usageLimit ? `${usageCount} / ${usageLimit}` : `${usageCount} / ilimitado`}
                  </span>
                </div>
                {usageLimit ? (
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploads salvos</span>
                  <span className="font-medium">{uploadsCount}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-1/3 rounded-full bg-primary/70" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between border-t border-border/60">
            <Button variant="secondary" asChild>
              <Link href="#editar-perfil">Editar perfil</Link>
            </Button>
            <Button variant="ghost">Ver detalhes</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Crown className="h-5 w-5 text-primary" />
              {subscriptionPlanName}
            </CardTitle>
            <CardDescription>
              {user.plan?.description ?? "Detalhes do seu plano atual."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-2xl font-semibold">
                    {subscriptionAmount && subscriptionInterval
                      ? `${subscriptionAmount} / ${subscriptionInterval}`
                      : "Consulte valores no portal"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextBillingDate ? `Proxima cobranca em ${nextBillingDate}` : "Sem cobranca ativa"}
                  </p>
                </div>
                <Badge variant="secondary">{renewalLabel}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Status atual: <span className="text-foreground font-medium">{subscriptionStatus}</span>
              </div>
              {!billing.enabled ? (
                <div className="text-sm text-muted-foreground">
                  Stripe nao configurado. Defina STRIPE_SECRET_KEY para ativar o portal.
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Beneficios ativos
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {usageLimit ? `${usageLimit} geracoes de imagem por periodo` : "Geracoes ilimitadas"}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Processamento prioritario e sem fila
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Acesso antecipado a novos estilos
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3 border-t border-border/60">
            <StripePortalButton
              className="w-full"
              leadingIcon={<ShieldCheck className="h-4 w-4" />}
              disabled={!billing.enabled}
            >
              Gerenciar no Stripe
            </StripePortalButton>
            <StripePortalButton variant="ghost" className="w-full" disabled={!billing.enabled}>
              Fazer downgrade
            </StripePortalButton>
          </CardFooter>
        </Card>
      </section>

      <section id="editar-perfil">
        <ProfileEditor name={user.name} email={user.email} pendingEmail={user.pendingEmail} />
      </section>

      <section>
        <PasswordResetCard />
      </section>

      <section>
        <Card className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Receipt className="h-5 w-5 text-primary" />
              Historico de cobrancas
            </CardTitle>
            <CardDescription>Ultimos recibos gerados pelo Stripe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing.invoices.length ? (
              billing.invoices.map((invoice) => {
                const amount = invoice.amount_paid || invoice.amount_due
                const statusLabel = invoice.status
                  ? STATUS_LABELS[invoice.status] ?? invoice.status
                  : "Pago"

                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatMonth(new Date(invoice.created * 1000))}</p>
                      <p className="text-xs text-muted-foreground">{subscriptionPlanName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(amount / 100, invoice.currency.toUpperCase())}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                Nenhum recibo encontrado no Stripe.
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-border/60">
            <StripePortalButton variant="ghost" className="w-full" disabled={!billing.enabled}>
              Ver todos os recibos
            </StripePortalButton>
          </CardFooter>
        </Card>
      </section>

    </div>
  )
}
