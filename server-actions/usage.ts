"use server"

import { prisma } from "@/lib/prisma"

export async function incrementUserStylizeUsage({ userId }: { userId: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: { stylizeUsageCount: { increment: 1 } },
    select: { id: true, stylizeUsageCount: true },
  })
}
