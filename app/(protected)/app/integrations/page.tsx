import Link from "next/link"
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
import { prisma } from "@/lib/prisma"
import { getSessionUserWithStatus } from "@/server-actions/session"
import { Instagram, Link2, ShieldCheck } from "lucide-react"
import { getInstagramConfig } from "@/lib/integrations/instagram"
import { InstagramPublishCard } from "@/components/instagram-publish-card"
import { InstagramInsightsCard } from "@/components/instagram-insights-card"
import { ClearIntegrationLogsButton } from "@/components/clear-integration-logs-button"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default async function IntegrationsPage() {
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
              Não foi possível validar sua sessão. Faça login novamente.
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

  const instagramAccount = await prisma.integrationAccount.findFirst({
    where: { userId: user.id, provider: "INSTAGRAM" },
  })

  const jobs = await prisma.integrationJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const isConnected = Boolean(instagramAccount)
  const instagramConfig = getInstagramConfig()

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-balance">Integrações</h1>
        <p className="text-lg text-muted-foreground text-pretty">
          Conecte serviços externos para automatizar exportações e publicações.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-medium">
              <Instagram className="h-5 w-5 text-primary" />
              Instagram
            </CardTitle>
            <CardDescription>
              Autorize para publicar, agendar e acompanhar métricas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
              {instagramAccount ? (
                <div className="mt-3 space-y-1 text-muted-foreground">
                  <p>
                    Usuário:{" "}
                    <span className="text-foreground font-medium">
                      {instagramAccount.username ?? "Sem username"}
                    </span>
                  </p>
                  {instagramAccount.pageName ? (
                    <p>
                      Página:{" "}
                      <span className="text-foreground font-medium">
                        {instagramAccount.pageName}
                      </span>
                    </p>
                  ) : null}
                  {instagramAccount.expiresAt ? (
                    <p>
                      Expira em:{" "}
                      <span className="text-foreground font-medium">
                        {formatDate(instagramAccount.expiresAt)}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-muted-foreground">
                  Autorize sua conta para habilitar fluxos de publicação.
                </p>
              )}
              {!instagramConfig ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Configure `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` e
                  `INSTAGRAM_REDIRECT_URI` para habilitar o login.
                </p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t border-border/60">
            {isConnected ? (
              <form action="/api/integrations/instagram/disconnect" method="post" className="w-full">
                <Button variant="secondary" className="w-full">
                  Desconectar Instagram
                </Button>
              </form>
            ) : (
              <Button asChild className="w-full" disabled={!instagramConfig}>
                <Link href="/api/integrations/instagram/connect">
                  Conectar Instagram
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="shadow-xl border-border/50 bg-card/95">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-medium">
                <Link2 className="h-5 w-5 text-primary" />
                Últimos eventos
              </CardTitle>
            <CardDescription>Logs das últimas ações de integração.</CardDescription>
            </div>
            {jobs.length ? <ClearIntegrationLogsButton /> : null}
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground max-h-80 overflow-y-auto pr-1">
            {jobs.length ? (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {job.provider} · {job.type}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(job.createdAt)}</p>
                  </div>
                  <Badge variant={job.status === "FAILED" ? "destructive" : "secondary"}>
                    {job.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                Nenhuma integração registrada ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <InstagramPublishCard
          isConnected={isConnected}
          pageName={instagramAccount?.pageName}
        />
        <InstagramInsightsCard isConnected={isConnected} />
      </section>
    </div>
  )
}
