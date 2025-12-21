import Stripe from "stripe"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getStripeClient } from "@/lib/stripe"

export const runtime = "nodejs"

async function findUserIdFromStripe({
  customerId,
  metadata,
  clientReferenceId,
}: {
  customerId?: string | null
  metadata?: Stripe.Metadata | null
  clientReferenceId?: string | null
}) {
  if (metadata?.userId) {
    return metadata.userId
  }

  if (clientReferenceId) {
    return clientReferenceId
  }

  if (!customerId) {
    return null
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return null
  }

  const customer = await stripe.customers.retrieve(customerId)
  if (!customer || customer.deleted) {
    return null
  }

  const email = customer.email?.toLowerCase().trim()
  if (!email) {
    return null
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  })

  return user?.id ?? null
}

async function findPlanFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id
  if (!priceId) {
    return null
  }

  return prisma.plan.findFirst({
    where: { stripePriceId: priceId },
  })
}

export async function POST(request: Request) {
  const stripe = getStripeClient()
  if (!stripe) {
    return new Response("Stripe not configured", { status: 500 })
  }

  const signature = (await headers()).get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return new Response("Missing webhook signature", { status: 400 })
  }

  const body = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature"
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const dataObject = event.data.object
    const subscription =
      event.type === "checkout.session.completed"
        ? null
        : (dataObject as Stripe.Subscription)

    const userId = await findUserIdFromStripe({
      customerId: "customer" in dataObject ? (dataObject.customer as string) : undefined,
      metadata: "metadata" in dataObject ? dataObject.metadata : undefined,
      clientReferenceId:
        "client_reference_id" in dataObject ? (dataObject.client_reference_id as string) : undefined,
    })

    if (userId) {
      if (event.type === "customer.subscription.deleted") {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionPlan: "FREE_TIER" },
        })
      } else if (subscription) {
        const plan = await findPlanFromSubscription(subscription)
        if (plan) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionPlan: plan.id },
          })
        }
      } else if (event.type === "checkout.session.completed") {
        const session = dataObject as Stripe.Checkout.Session
        if (session.subscription) {
          const subscriptionData = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const plan = await findPlanFromSubscription(subscriptionData)
          if (plan) {
            await prisma.user.update({
              where: { id: userId },
              data: { subscriptionPlan: plan.id },
            })
          }
        }
      }
    }
  }

  return new Response("ok", { status: 200 })
}
