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

const plans = [
  {
    name: "Starter",
    price: "R$ 29",
    period: "/mês",
    description: "Para quem quer manter o feed atualizado e cheio de personalidade.",
    highlights: ["10 imagens/semana", "2 estilos salvos", "Suporte por chat"],
  },
  {
    name: "Essentials",
    price: "R$ 79",
    period: "/mês",
    description: "Ideal para criadores que produzem peças diárias e precisam agilizar o processo.",
    highlights: ["50 imagens/semana", "Estilos ilimitados", "Integrações com redes sociais"],
    featured: true,
  },
  {
    name: "Pro",
    price: "R$ 149",
    period: "/mês",
    description: "Para projetos maiores com foco em exportar múltiplas versões e backups automáticos.",
    highlights: ["Imagens ilimitadas", "Estilos privados compartilháveis", "Consultoria rápida"],
  },
]

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

export default function LandingPage() {
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
              <Button size="lg">Começar agora</Button>
              <Button variant="outline" size="lg">
                Ver planos
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">O que entregamos</p>
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Planos para sua criatividade
            </p>
            <h3 className="text-3xl font-semibold text-foreground">Escolha o plano que cabe no seu fluxo</h3>
            <p className="text-base text-muted-foreground">
              Sem surpresas, pagamento mensal flexível e upgrades instantâneos para acompanhar o ritmo.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`border-border/50 bg-background/90 shadow-xl ${plan.featured ? "border-primary" : ""}`}
              >
                <CardContent className="space-y-4 px-6 pb-6 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {plan.name}
                  </p>
                  <div className="space-x-1 text-4xl font-semibold text-foreground">
                    <span>{plan.price}</span>
                    <span className="text-sm font-medium text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                  <ul className="space-y-2 text-left text-sm text-muted-foreground">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.featured ? "default" : "outline"} className="w-full">
                    Escolher plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
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
            <Button size="lg">Experimentar grátis</Button>
            <Button variant="ghost" size="lg" className="group">
              Conhecer integrações
              <ArrowRight className="h-4 w-4 transition-all group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
