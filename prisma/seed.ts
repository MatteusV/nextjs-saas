import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

type DefaultPlan = {
  id: "FREE_TIER" | "PRO" | "BUSINESS"
  name: string
  description?: string
  stylizeLimit: number | null
  stripePriceId?: string
}

const DEFAULT_PLANS: DefaultPlan[] = [
  {
    id: "FREE_TIER",
    name: "Free",
    description: "Plano gratuito com limite de usos.",
    stylizeLimit: 3,
  },
  {
    id: "PRO",
    name: "Pro",
    description: "Plano Pro com limite ampliado.",
    stylizeLimit: null,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  {
    id: "BUSINESS",
    name: "Business",
    description: "Plano Business com limite ampliado.",
    stylizeLimit: null,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS,
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
