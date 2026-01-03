import { prisma } from "@/lib/prisma"

export type AlertSettings = {
  id: string
  highUsage24hLimit: number
  premiumModel30dLimit: number
  creditOrders30dLimit: number
  creditRevenue30dLimit: number | null
  lastAlertSignature?: string | null
  lastAlertSentAt?: Date | null
}

export async function getOrCreateAlertSettings(): Promise<AlertSettings> {
  const model = (prisma as typeof prisma & {
    adminAlertSettings?: {
      findFirst: () => Promise<AlertSettings | null>
      create: (args: { data: Omit<AlertSettings, "id"> }) => Promise<AlertSettings>
    }
  }).adminAlertSettings

  if (!model) {
    return {
      id: "fallback",
      highUsage24hLimit: 200,
      premiumModel30dLimit: 50,
      creditOrders30dLimit: 3,
      creditRevenue30dLimit: null,
      lastAlertSignature: null,
      lastAlertSentAt: null,
    }
  }

  const existing = await model.findFirst()
  if (existing) {
    return existing
  }

  return model.create({
    data: {
      highUsage24hLimit: 200,
      premiumModel30dLimit: 50,
      creditOrders30dLimit: 3,
      creditRevenue30dLimit: null,
      lastAlertSignature: null,
      lastAlertSentAt: null,
    },
  })
}
