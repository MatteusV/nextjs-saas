import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

export async function POST() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.integrationJob.deleteMany({
    where: { userId: user.id },
  })

  return NextResponse.json({ ok: true })
}
