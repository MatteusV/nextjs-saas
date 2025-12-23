import { randomBytes } from "node:crypto"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"

const bodySchema = z.object({
  email: z.string().email(),
})

const PASSWORD_RESET_COOLDOWN_MS = 5 * 60 * 1000

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin")
  if (origin) return origin

  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = forwardedHost ?? request.headers.get("host")
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "http"
    return `${proto}://${host}`
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!rateLimit({ key: `password-reset-email:${ip}`, limit: 5, windowMs: 60_000 })) {
    return Response.json({ error: "Too many attempts" }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    return Response.json({ sent: true })
  }

  if (
    user.lastPasswordResetSentAt &&
    Date.now() - user.lastPasswordResetSentAt.getTime() < PASSWORD_RESET_COOLDOWN_MS
  ) {
    return Response.json({ sent: true })
  }

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetTokenExpires: expiresAt,
      lastPasswordResetSentAt: new Date(),
    },
  })

  const baseUrl = getBaseUrl(request)
  const resetUrl = `${baseUrl}/reset-password?token=${token}`
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  })

  return Response.json({ sent: true })
}
