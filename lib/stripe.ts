import Stripe from "stripe"

let stripeClient: Stripe | null = null

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return null
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    })
  }

  return stripeClient
}

export async function getStripeCustomerByEmail({
  email,
  name,
  createIfMissing = false,
}: {
  email: string
  name?: string | null
  createIfMissing?: boolean
}) {
  const stripe = getStripeClient()
  if (!stripe) {
    return null
  }

  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data[0]) {
    return existing.data[0]
  }

  if (!createIfMissing) {
    return null
  }

  return stripe.customers.create({
    email,
    name: name ?? undefined,
  })
}

export async function getStripeBillingSummary({
  email,
  name,
}: {
  email: string
  name?: string | null
}) {
  const stripe = getStripeClient()
  if (!stripe) {
    return {
      enabled: false as const,
      customer: null,
      subscription: null,
      invoices: [],
      paymentMethod: null,
    }
  }

  const customer = await getStripeCustomerByEmail({ email, name })
  if (!customer) {
    return {
      enabled: true as const,
      customer: null,
      subscription: null,
      invoices: [],
      paymentMethod: null,
    }
  }

  const [subscriptions, invoices, paymentMethods] = await Promise.all([
    stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 3 }),
    stripe.invoices.list({ customer: customer.id, limit: 3 }),
    stripe.paymentMethods.list({ customer: customer.id, type: "card", limit: 1 }),
  ])

  const subscription =
    subscriptions.data.find((item) => item.status === "active" || item.status === "trialing") ??
    subscriptions.data[0] ??
    null

  return {
    enabled: true as const,
    customer,
    subscription,
    invoices: invoices.data,
    paymentMethod: paymentMethods.data[0] ?? null,
  }
}
