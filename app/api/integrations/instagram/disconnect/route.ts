import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { createIntegrationJob } from "@/server-actions/integrations/jobs"
import { canUseIntegrations } from "@/utils/integrations"

export async function POST() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!canUseIntegrations(user.subscriptionPlan)) {
    return NextResponse.json(
      { error: "Integrações disponíveis apenas nos planos Pro e Business." },
      { status: 403 }
    )
  }

  await prisma.integrationAccount.deleteMany({
    where: { userId: user.id, provider: "INSTAGRAM" },
  })

  await createIntegrationJob({
    userId: user.id,
    provider: "INSTAGRAM",
    type: "DISCONNECT",
    status: "SUCCESS",
  })

  return NextResponse.json({ ok: true })
}
