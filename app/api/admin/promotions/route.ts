import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminUser } from "@/server-actions/admin"
import { getStripeClient } from "@/lib/stripe"

function parsePercent(value: string) {
  const normalized = value.replace("%", "").replace(",", ".").trim()
  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return null
  }
  return Math.round(parsed)
}

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === "string" ? body.code.trim() : ""
  const percent = typeof body.discount === "string" ? parsePercent(body.discount) : null
  const maxRedemptions =
    typeof body.limit === "string" && body.limit.trim()
      ? Number.parseInt(body.limit, 10)
      : null
  const expiresAt =
    typeof body.expiresAt === "string" && body.expiresAt.trim()
      ? new Date(body.expiresAt)
      : null

  if (!code || !percent) {
    return NextResponse.json({ error: "Invalid promotion payload" }, { status: 400 })
  }

  let stripeCouponId: string | null = null
  let stripePromotionCodeId: string | null = null
  const stripe = getStripeClient()
  if (stripe) {
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: "once",
    })
    stripeCouponId = coupon.id

    const promotion = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: maxRedemptions ?? undefined,
      expires_at: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined,
    })
    stripePromotionCodeId = promotion.id
  }

  const promotion = await prisma.promotion.create({
    data: {
      code,
      discountPercent: percent,
      maxRedemptions,
      expiresAt,
      stripeCouponId,
      stripePromotionCodeId,
    },
  })

  return NextResponse.json({ ok: true, promotion })
}
