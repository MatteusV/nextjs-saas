import { prisma } from "@/lib/prisma"
import type { IntegrationJobStatus, IntegrationJobType, IntegrationProvider } from "@/generated/prisma/client"

export async function createIntegrationJob({
  userId,
  provider,
  type,
  status,
  error,
  metadata,
  runAt,
}: {
  userId: string
  provider: IntegrationProvider
  type: IntegrationJobType
  status: IntegrationJobStatus
  error?: string | null
  metadata?: Record<string, unknown>
  runAt?: Date | null
}) {
  return prisma.integrationJob.create({
    data: {
      userId,
      provider,
      type,
      status,
      error: error ?? null,
      metadata: metadata ?? undefined,
      runAt: runAt ?? null,
    },
  })
}
