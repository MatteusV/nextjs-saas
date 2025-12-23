import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
})

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = subscriptionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: user.id },
  })

  return Response.json({ ok: true })
}
