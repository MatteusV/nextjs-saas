import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  ArrowRight,
  Check,
  ImageIcon,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getStripePricesByIds } from "@/lib/stripe"

const featureHighlights = [
  {
    title: "Estilize em escala",
    description:
      "Combine prompts personalizados com filtros construídos para capturar o tom da sua marca.",
    badge: "Automação",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Preview em tempo real",
    description:
      "Veja como cada ajuste afeta sua imagem e salve versões prontas para redes sociais.",
    badge: "Pré-visualização",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    title: "Integração segura",
    description:
      "Envie suas fotos e defina quem pode usar os estilos criados por você.",
    badge: "Segurança",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Resultados consistentes",
    description:
      "Nossa engine mantém cores, proporções e microinterações alinhadas aos tokens do design system.",
    badge: "Qualidade",
    icon: <Wand2 className="h-5 w-5" />,
  },
]

const stats = [
  { label: "Imagens editadas por mês", value: "15k+", detail: "com base em resultados reais" },
  { label: "Estilos salvos", value: "80", detail: "para usar em novos posts" },
  { label: "Avaliação média", value: "4.9/5", detail: "pelos criadores que usam a plataforma" },
]

const processSteps = [
  { title: "Envie suas fotos", body: "Carregue uma ou várias imagens direto do celular ou desktop." },
  { title: "Personalize o estilo", body: "Ajuste cores, luzes e detalhes com controles guiados em tempo real." },
  { title: "Finalize e compartilhe", body: "Exporte em alta resolução para redes, portfólio ou impressão." },
]

const orderedPlans = ["FREE_TIER", "PRO", "BUSINESS"]

const testimonials = [
  {
    quote:
      "O AI Stylizer tirou horas do nosso fluxo e manteve a consistência visual com os nossos tokens internos.",
    author: "Marina Costa – Product Design Lead",
  },
  {
    quote:
      "Importei várias campanhas e a plataforma ajustou cada imagem sem perder brilho nem fidelidade à marca.",
    author: "Rafael Dias – Growth Designer",
  },
]

export const revalidate = 300

export default async function LandingPage() {
  const plans = await prisma.plan.findMany()
  const sortedPlans = plans.sort(
    (a, b) => orderedPlans.indexOf(a.id) - orderedPlans.indexOf(b.id)
  )
  const pricesById = await getStripePricesByIds(
    sortedPlans.map((plan) => plan.stripePriceId).filter(Boolean) as string[]
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

    const highlights = plan.benefits ?? []

    const hasStorage = plan.hasImageStorage ?? plan.id !== "FREE_TIER"

    return {
      ...plan,
      priceLabel,
      highlights,
      featured: plan.id === "PRO",
      storageLabel: hasStorage ? "Inclui armazenamento das imagens" : "Sem armazenamento",
    }
  })
  const planById = Object.fromEntries(plansWithPrices.map((plan) => [plan.id, plan]))
  const planColumns = orderedPlans.map((id) => planById[id]).filter(Boolean)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <header className="flex flex-col gap-4 text-center lg:text-left">
            <Badge className="self-center lg:self-start" variant="secondary">
              Nova geração
            </Badge>
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                AI Stylizer
              </p>
              <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Transforme suas fotos em artes únicas sem abrir mão da simplicidade.
              </h1>
              <p className="text-base text-muted-foreground md:text-lg">
                Escolha um plano, carregue sua imagem e personalize filtros, luzes e detalhes com
                sugestões inteligentes pensadas para quem cria para redes sociais.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/register">Criar conta</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
            </div>
          </header>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border/50 bg-card/80 shadow-xl">
                <CardContent className="space-y-2 px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-semibold text-foreground">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-20 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">O que entregamos</p>
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
              Padrões inteligentes para equipes que querem criar rápido sem abrir mão da arte.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Da curadoria de estilos à exportação final, cada etapa foi desenhada para reduzir
              fricção e manter a qualidade. Aos poucos, você substitui tarefas repetitivas por
              automações com supervisão humana.
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline">Design System</Badge>
              <Badge variant="outline">Automação Criativa</Badge>
              <Badge variant="outline">Exportadores</Badge>
            </div>
          </div>
          <div className="grid gap-4">
            {featureHighlights.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/50 bg-card/95 shadow-xl transition-transform hover:-translate-y-1"
              >
                <CardContent className="space-y-3 px-6">
                  <div className="flex items-center gap-2 text-primary">{feature.icon}</div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                  <Badge variant="secondary">{feature.badge}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
              Planos para sua criatividade
            </p>
            <h3 className="text-3xl font-semibold text-foreground">Escolha o plano que cabe no seu fluxo</h3>
            <p className="text-base text-muted-foreground">
              Sem surpresas, pagamento mensal flexível e upgrades instantâneos para acompanhar o ritmo.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plansWithPrices.map((plan) => (
              <Card
                key={plan.name}
                className={`border-border/50 bg-background/90 shadow-xl ${plan.featured ? "border-primary" : ""}`}
              >
                <CardContent className="space-y-4 px-6 pb-6 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {plan.name}
                  </p>
                  <div className="text-4xl font-semibold text-foreground">
                    {plan.priceLabel ?? "Consulte valores"}
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {plan.storageLabel}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                  {plan.highlights.length ? (
                    <ul className="space-y-2 text-left text-sm text-muted-foreground">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Button variant={plan.featured ? "default" : "outline"} className="w-full" asChild>
                    <Link href="/register">Criar conta</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 rounded-3xl border border-border/60 bg-background/95 p-6 shadow-xl">
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Benefícios por plano
              </p>
              <p className="text-base text-muted-foreground">
                Cada plano tem seus próprios benefícios para acompanhar o seu ritmo.
              </p>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {planColumns.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {plan.name}
                    </p>
                  <p className="text-lg font-semibold text-foreground">
                    {plan.priceLabel ?? "Consulte valores"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {plan.storageLabel}
                  </p>
                </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {(plan.benefits?.length
                      ? plan.benefits
                      : [plan.stylizeLimit ? `${plan.stylizeLimit} imagens/mês` : "Gerações ilimitadas"]
                    ).map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
                Como funciona
              </p>
              <h3 className="text-3xl font-semibold text-foreground">3 passos para estilizar em escala</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {processSteps.map((step) => (
                <div
                  key={step.title}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/80 p-6 text-center shadow-sm"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {step.title}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 lg:py-24">
        <div className="space-y-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
            Depoimentos
          </p>
          <h3 className="text-3xl font-semibold text-foreground">Quem já acelerou o fluxo</h3>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.author}
              className="border-border/60 bg-card/90 shadow-lg"
            >
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="flex items-center gap-2 text-primary">
                  <Check className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Avaliação verificada
                  </p>
                </div>
                <p className="text-base leading-relaxed text-foreground">{testimonial.quote}</p>
                <p className="text-sm font-semibold text-muted-foreground">{testimonial.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background/90 py-12">
        <div className="container mx-auto flex flex-col gap-6 px-4 text-center lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Criativo, consistente e pronto para deploy.</p>
            <p className="text-sm text-muted-foreground">
              © 2025 AI Stylizer. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Criar conta</Link>
            </Button>
            <Button variant="ghost" size="lg" className="group" asChild>
              <Link href="/login">
                Entrar
                <ArrowRight className="h-4 w-4 transition-all group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
