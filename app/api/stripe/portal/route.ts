import { NextResponse } from "next/server"
import { getSessionUser } from "@/server-actions/session"
import { getStripeClient, getStripeCustomerByEmail } from "@/server-actions/stripe"

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
  const requestOrigin = new URL(request.url).origin
  const fallbackReturnUrl = `${requestOrigin}/app/profile`
  let returnUrl = fallbackReturnUrl

  if (typeof body.returnUrl === "string") {
    try {
      const parsed = new URL(body.returnUrl, requestOrigin)
      if (parsed.origin === requestOrigin) {
        returnUrl = parsed.toString()
      }
    } catch {
      returnUrl = fallbackReturnUrl
    }
  }

  const customer = await getStripeCustomerByEmail({
    email: user.email,
    name: user.name,
    createIfMissing: true,
  })

  if (!customer) {
    return NextResponse.json({ error: "Stripe customer not found" }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: returnUrl,
  })

  return NextResponse.json({ url: session.url })
}
