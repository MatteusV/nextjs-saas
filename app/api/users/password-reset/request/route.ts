import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { sendPasswordResetEmail } from "@/server-actions/email"
import { rateLimit } from "@/server-actions/rate-limit"

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
  if (!rateLimit({ key: `password-reset:${ip}`, limit: 5, windowMs: 60_000 })) {
    return Response.json({ error: "Too many attempts" }, { status: 429 })
  }

  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (
    user.lastPasswordResetSentAt &&
    Date.now() - user.lastPasswordResetSentAt.getTime() < PASSWORD_RESET_COOLDOWN_MS
  ) {
    return Response.json(
      { error: "Aguarde alguns minutos para solicitar um novo link." },
      { status: 429 }
    )
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
  const emailResult = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  })

  if (!emailResult.sent) {
    return Response.json(
      { error: "Falha ao enviar email. Verifique as credenciais do provedor." },
      { status: 500 }
    )
  }

  return Response.json({ sent: true })
}
