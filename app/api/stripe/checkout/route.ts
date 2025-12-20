import { NextResponse } from "next/server"
import { getSessionUser } from "@/server-actions/session"
import { getStripeClient, getStripeCustomerByEmail } from "@/lib/stripe"

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const priceId = typeof body.priceId === "string" ? body.priceId : null

  if (!priceId) {
    return NextResponse.json({ error: "Missing price id" }, { status: 400 })
  }

  const requestOrigin = new URL(request.url).origin
  const successUrl = `${requestOrigin}/app/profile?checkout=success`
  const cancelUrl = `${requestOrigin}/app/profile?checkout=cancel`

  const customer = await getStripeCustomerByEmail({
    email: user.email,
    name: user.name,
    createIfMissing: true,
  })

  if (!customer) {
    return NextResponse.json({ error: "Stripe customer not found" }, { status: 404 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  })

  return NextResponse.json({ url: session.url })
}
