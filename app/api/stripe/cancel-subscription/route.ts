import { NextResponse } from "next/server"
import { getSessionUser } from "@/server-actions/session"
import { cancelStripeSubscriptionForCustomer, getStripeCustomerByEmail } from "@/lib/stripe"

export async function POST() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const customer = await getStripeCustomerByEmail({
    email: user.email,
    name: user.name,
    createIfMissing: false,
  })

  if (!customer) {
    return NextResponse.json({ error: "Stripe customer not found" }, { status: 404 })
  }

  const subscription = await cancelStripeSubscriptionForCustomer({
    customerId: customer.id,
  })

  if (!subscription) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, cancelAtPeriodEnd: subscription.cancel_at_period_end })
}
