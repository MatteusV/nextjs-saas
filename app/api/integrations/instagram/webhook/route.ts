import { prisma } from "@/lib/prisma"
import { createIntegrationJob } from "@/server-actions/integrations/jobs"

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ?? ""

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 })
  }

  return new Response("Invalid token", { status: 403 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.entry)) {
    return new Response("Invalid payload", { status: 400 })
  }

  await Promise.all(
    body.entry.map(async (entry: { id?: string }) => {
      if (!entry?.id) return
      const account = await prisma.integrationAccount.findFirst({
        where: { provider: "INSTAGRAM", providerAccountId: entry.id },
        select: { userId: true },
      })
      if (!account) return

      await createIntegrationJob({
        userId: account.userId,
        provider: "INSTAGRAM",
        type: "SYNC",
        status: "SUCCESS",
        metadata: entry,
      })
    })
  )

  return new Response("OK", { status: 200 })
}
