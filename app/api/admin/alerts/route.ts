import { z } from "zod"
import { getAdminUser } from "@/server-actions/admin"
import { prisma } from "@/lib/prisma"
import { getOrCreateAlertSettings } from "@/lib/admin-alerts"

const alertSettingsSchema = z.object({
  highUsage24hLimit: z.number().int().min(10).max(100000),
  premiumModel30dLimit: z.number().int().min(0).max(100000),
  creditOrders30dLimit: z.number().int().min(0).max(100000),
  creditRevenue30dLimit: z.number().int().min(0).max(1_000_000_000).nullable(),
})

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return new Response("Unauthorized", { status: 401 })
  }

  const settings = await getOrCreateAlertSettings()
  return Response.json({ settings })
}

export async function PUT(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = alertSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const existing = await getOrCreateAlertSettings()
  const updated = await prisma.adminAlertSettings.update({
    where: { id: existing.id },
    data: {
      highUsage24hLimit: parsed.data.highUsage24hLimit,
      premiumModel30dLimit: parsed.data.premiumModel30dLimit,
      creditOrders30dLimit: parsed.data.creditOrders30dLimit,
      creditRevenue30dLimit: parsed.data.creditRevenue30dLimit,
    },
  })

  return Response.json({ settings: updated })
}
