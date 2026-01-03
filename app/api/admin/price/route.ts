import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStripeClient } from "@/server-actions/stripe"
import { getAdminUser } from "@/server-actions/admin"

function parseAmount(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".")
  const amount = Number.parseFloat(normalized)
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }
  return Math.round(amount * 100)
}

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const planId = typeof body.planId === "string" ? body.planId : null
  const amountInput = typeof body.amount === "string" ? body.amount : ""

  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 })
  }

  const amount = parseAmount(amountInput)
  if (!amount) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan || !plan.stripePriceId) {
    return NextResponse.json({ error: "Plan price not configured" }, { status: 400 })
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const currentPrice = await stripe.prices.retrieve(plan.stripePriceId)
  if (!currentPrice.product || typeof currentPrice.product !== "string") {
    return NextResponse.json({ error: "Invalid Stripe price configuration" }, { status: 400 })
  }

  const newPrice = await stripe.prices.create({
    unit_amount: amount,
    currency: currentPrice.currency,
    recurring: currentPrice.recurring
      ? { interval: currentPrice.recurring.interval }
      : { interval: "month" },
    product: currentPrice.product,
  })

  await prisma.plan.update({
    where: { id: planId },
    data: { stripePriceId: newPrice.id },
  })

  return NextResponse.json({ ok: true, priceId: newPrice.id })
}
