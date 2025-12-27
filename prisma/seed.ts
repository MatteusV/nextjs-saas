import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

type DefaultPlan = {
  id: "FREE_TIER" | "PRO" | "BUSINESS"
  name: string
  description?: string
  stylizeLimit: number | null
  stripePriceId?: string
  benefits?: string[]
  hasImageStorage?: boolean
  watermarkEnabled?: boolean
  watermarkText?: string
  creditPackAmount?: number
  creditPackPriceId?: string
}

const DEFAULT_PLANS: DefaultPlan[] = [
  {
    id: "FREE_TIER",
    name: "Free",
    description: "Plano gratuito com limite de usos e sem histórico de imagens.",
    stylizeLimit: 10,
    hasImageStorage: false,
    watermarkEnabled: true,
    watermarkText: "AI Stylizer",
    creditPackAmount: 10,
    creditPackPriceId: process.env.STRIPE_PRICE_CREDITS,
    benefits: [
      "10 imagens/mês",
      "Não salva no histórico",
      "Editor com IA incluído",
      "Suporte por email",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    description: "Plano Pro com limite ampliado.",
    stylizeLimit: 50,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    hasImageStorage: true,
    watermarkEnabled: false,
    watermarkText: "AI Stylizer",
    creditPackAmount: 10,
    creditPackPriceId: process.env.STRIPE_PRICE_CREDITS,
    benefits: [
      "50 imagens/mês",
      "Salva no histórico",
      "Fila prioritária",
      "Suporte por email",
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    description: "Plano Business com limite ampliado.",
    stylizeLimit: 100,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS,
    hasImageStorage: true,
    watermarkEnabled: false,
    watermarkText: "AI Stylizer",
    creditPackAmount: 10,
    creditPackPriceId: process.env.STRIPE_PRICE_CREDITS,
    benefits: [
      "100 imagens/mês",
      "Salva no histórico",
      "Gestão de equipe",
      "Suporte dedicado",
    ],
  },
]

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  await Promise.all(
    DEFAULT_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { id: plan.id },
        update: {
          name: plan.name,
          description: plan.description,
          stylizeLimit: plan.stylizeLimit,
          stripePriceId: plan.stripePriceId,
          benefits: plan.benefits ?? [],
          hasImageStorage: plan.hasImageStorage ?? false,
          watermarkEnabled: plan.watermarkEnabled ?? false,
          watermarkText: plan.watermarkText ?? null,
          creditPackAmount: plan.creditPackAmount ?? null,
          creditPackPriceId: plan.creditPackPriceId ?? null,
        },
        create: plan,
      })
    )
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
