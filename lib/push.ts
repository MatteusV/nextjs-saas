import webpush from "web-push"
import { prisma } from "@/lib/prisma"

type PushPayload = {
  title: string
  body: string
  url?: string
  notificationId?: string
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@aistylizer.com"

function getWebPushClient() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return null
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  return webpush
}

type SendPushParams = {
  userIds: string[]
  payload: PushPayload
}

export async function sendPushToUsers({ userIds, payload }: SendPushParams) {
  const client = getWebPushClient()
  if (!client) {
    console.warn("[push] Missing VAPID keys, skipping push delivery")
    return { sent: 0, failed: 0 }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  })

  if (!subscriptions.length) {
    return { sent: 0, failed: 0 }
  }

  const body = JSON.stringify(payload)
  let sent = 0
  let failed = 0

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await client.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          body
        )
        sent += 1
      } catch (error) {
        failed += 1
        const status = (error as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          })
        } else {
          console.warn("[push] Failed to send notification", error)
        }
      }
    })
  )

  return { sent, failed }
}
