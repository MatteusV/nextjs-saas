import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { sendEmailChangeVerification } from "@/lib/email"
import { randomBytes } from "node:crypto"

const patchSchema = z.object({
  name: z.string().min(3).max(80),
  email: z.string().email().optional(),
})

const EMAIL_CHANGE_COOLDOWN_MS = 5 * 60 * 1000

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

export async function PATCH(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { name, email } = parsed.data
  const normalizedEmail = email?.toLowerCase().trim()
  const normalizedName = name.trim()

  if (normalizedEmail && normalizedEmail !== user.email) {
    if (
      user.lastEmailChangeSentAt &&
      Date.now() - user.lastEmailChangeSentAt.getTime() < EMAIL_CHANGE_COOLDOWN_MS
    ) {
      return Response.json(
        { error: "Aguarde alguns minutos para solicitar a troca de email novamente." },
        { status: 429 }
      )
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { pendingEmail: normalizedEmail }],
      },
      select: { id: true },
    })

    if (existing && existing.id !== user.id) {
      return Response.json({ error: "Email already in use" }, { status: 400 })
    }

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: normalizedName,
        pendingEmail: normalizedEmail,
        emailChangeToken: token,
        emailChangeTokenExpires: expiresAt,
        lastEmailChangeSentAt: new Date(),
      },
      select: { id: true, name: true, email: true, pendingEmail: true },
    })

    const baseUrl = getBaseUrl(request)
    const confirmUrl = `${baseUrl}/email-change?token=${token}`
    const emailResult = await sendEmailChangeVerification({
      to: normalizedEmail,
      name: normalizedName,
      confirmUrl,
    })

    return Response.json({ user: updated, emailChangeSent: emailResult.sent })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: normalizedName },
    select: { id: true, name: true, email: true, pendingEmail: true },
  })

  return Response.json({ user: updated, emailChangeSent: false })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}
