import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { createIntegrationJob } from "@/lib/integrations/jobs"

export async function POST() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
