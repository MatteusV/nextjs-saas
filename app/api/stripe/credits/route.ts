import { NextResponse } from "next/server"
import { getSessionUser } from "@/server-actions/session"
import { getStripeClient, getStripeCustomerByEmail } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const plan = await prisma.plan.findUnique({
    where: { id: user.subscriptionPlan },
    select: { creditPackPriceId: true, creditPackAmount: true },
  })

  if (!plan?.creditPackPriceId || !plan.creditPackAmount) {
    return NextResponse.json({ error: "Pacote de créditos indisponível" }, { status: 400 })
  }

  const requestOrigin = new URL(request.url).origin
  const successUrl = `${requestOrigin}/app/profile?credits=success`
  const cancelUrl = `${requestOrigin}/app/profile?credits=cancel`

  const customer = await getStripeCustomerByEmail({
    email: user.email,
    name: user.name,
    createIfMissing: true,
  })

  if (!customer) {
    return NextResponse.json({ error: "Stripe customer not found" }, { status: 404 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    client_reference_id: user.id,
    line_items: [{ price: plan.creditPackPriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    payment_intent_data: {
      metadata: {
        userId: user.id,
        credits: String(plan.creditPackAmount),
        kind: "credit_pack",
      },
    },
    metadata: {
      userId: user.id,
      credits: String(plan.creditPackAmount),
      kind: "credit_pack",
    },
  })

  return NextResponse.json({ url: session.url })
}
