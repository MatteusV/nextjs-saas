"use server"

import { prisma } from "@/lib/prisma"

function getUsagePeriod(date = new Date()) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

type UsageResult = {
  allowed: boolean
  reason?: "limit_reached"
  usageLimit: number | null
  usageCount: number
  usagePeriod: string
  extraCredits: number
  usedCredits: number
  remaining: number | null
}

export async function consumeStylizeUsage({
  userId,
  amount = 1,
}: {
  userId: string
  amount?: number
}): Promise<UsageResult> {
  if (amount <= 0) {
    return {
      allowed: true,
      usageLimit: null,
      usageCount: 0,
      usagePeriod: getUsagePeriod(),
      extraCredits: 0,
      usedCredits: 0,
      remaining: null,
    }
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    })

    if (!user || !user.plan) {
      return {
        allowed: false,
        reason: "limit_reached",
        usageLimit: 0,
        usageCount: 0,
        usagePeriod: getUsagePeriod(),
        extraCredits: 0,
        usedCredits: 0,
        remaining: 0,
      }
    }

    const currentPeriod = getUsagePeriod()
    const usagePeriod = user.stylizeUsagePeriod === currentPeriod ? currentPeriod : currentPeriod
    const normalizedUsageCount =
      user.stylizeUsagePeriod === currentPeriod ? user.stylizeUsageCount : 0

    const limit = user.plan.stylizeLimit ?? null
    const availablePlan = limit == null ? Number.POSITIVE_INFINITY : Math.max(0, limit - normalizedUsageCount)
    const availableTotal =
      limit == null ? Number.POSITIVE_INFINITY : availablePlan + user.extraCredits

    if (limit != null && availableTotal < amount) {
      return {
        allowed: false,
        reason: "limit_reached",
        usageLimit: limit,
        usageCount: normalizedUsageCount,
        usagePeriod,
        extraCredits: user.extraCredits,
        usedCredits: 0,
        remaining: Math.max(0, limit - normalizedUsageCount),
      }
    }

    const creditsNeeded = limit == null ? 0 : Math.max(0, amount - availablePlan)
    const nextExtraCredits = Math.max(0, user.extraCredits - creditsNeeded)
    const nextUsageCount = normalizedUsageCount + amount

    await tx.user.update({
      where: { id: userId },
      data: {
        stylizeUsageCount: nextUsageCount,
        stylizeUsagePeriod: usagePeriod,
        extraCredits: nextExtraCredits,
      },
    })

    return {
      allowed: true,
      usageLimit: limit,
      usageCount: nextUsageCount,
      usagePeriod,
      extraCredits: nextExtraCredits,
      usedCredits: creditsNeeded,
      remaining: limit == null ? null : Math.max(0, limit - nextUsageCount),
    }
  })
}
