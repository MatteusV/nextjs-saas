import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"
import { SignJWT } from "jose"
import { NextResponse } from "next/server"
import { z } from "zod"
import { resolvePlanFromStripeEmail } from "@/lib/stripe"
import { rateLimit } from "@/lib/rate-limit"

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})



export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!rateLimit({ key: `login:${ip}`, limit: 10, windowMs: 60_000 })) {
    return Response.json({ error: "Too many attempts" }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  })

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  const passwordMatch = await compare(password, user.password)
  if (!passwordMatch) {
    return Response.json({ error: "Invalid password" }, { status: 401 })
  }

  if (user.subscriptionPlan === "FREE_TIER" && user.verifiedAt) {
    try {
      const planFromStripe = await resolvePlanFromStripeEmail({
        email: normalizedEmail,
        name: user.name,
      })
      if (planFromStripe && planFromStripe !== user.subscriptionPlan) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: planFromStripe },
        })
      }
    } catch (error) {
      console.warn("[login] Failed to sync Stripe plan", error)
    }
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }

  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret))

  const response = NextResponse.json({ ok: true })
  response.cookies.set("session", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return response
}
