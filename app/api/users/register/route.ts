import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import { resolvePlanFromStripeEmail } from "@/lib/stripe"
import { hash } from "bcryptjs"
import { randomBytes } from "node:crypto"

const bodySchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
})

function generateVerificationToken() {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
  return { token, expiresAt }
}

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
  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { name, email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const userExists = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    }
  })

  if (userExists) {
    return Response.json({ error: "User already exists" }, { status: 400 })
  }

  const { token, expiresAt } = generateVerificationToken()
  const hashedPassword = await hash(password, 6)

  await prisma.plan.upsert({
    where: { id: "FREE_TIER" },
    update: {},
    create: {
      id: "FREE_TIER",
      name: "Free",
      description: "Plano gratuito com limite de usos e sem histórico de imagens.",
      hasImageStorage: false,
      benefits: [
        "10 imagens/mês",
        "Não salva no histórico",
        "Editor com IA incluído",
        "Suporte por email",
      ],
    },
  })

  let initialPlan: "FREE_TIER" | "PRO" | "BUSINESS" = "FREE_TIER"
  try {
    const planFromStripe = await resolvePlanFromStripeEmail({
      email: normalizedEmail,
      name,
    })
    if (planFromStripe) {
      initialPlan = planFromStripe
    }
  } catch (error) {
    console.warn("[register] Failed to sync Stripe plan", error)
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      verificationToken: token,
      verificationTokenExpires: expiresAt,
      subscriptionPlan: initialPlan
    },
    select: {
      id: true,
    }
  })

  const baseUrl = getBaseUrl(request)
  const verificationUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(normalizedEmail)}`
  const emailResult = await sendVerificationEmail({
    to: normalizedEmail,
    name,
    verificationUrl,
  })

  return Response.json(
    {
      id: user.id,
      verificationSent: emailResult.sent,
    },
    { status: 201 }
  )
}
