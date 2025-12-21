import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminUser } from "@/server-actions/admin"

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const planId = typeof body.planId === "string" ? body.planId : null
  const benefits = Array.isArray(body.benefits)
    ? body.benefits.filter((item) => typeof item === "string" && item.trim())
    : null

  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 })
  }

  if (!benefits) {
    return NextResponse.json({ error: "Invalid benefits" }, { status: 400 })
  }

  await prisma.plan.update({
    where: { id: planId },
    data: { benefits },
  })

  return NextResponse.json({ ok: true })
}
