import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  createInstagramMediaContainer,
  publishInstagramMedia,
} from "@/lib/integrations/instagram"

const CRON_SECRET = process.env.INSTAGRAM_CRON_SECRET

function isAuthorized(request: Request) {
  if (!CRON_SECRET) return true
  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${CRON_SECRET}`
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const jobs = await prisma.integrationJob.findMany({
    where: {
      provider: "INSTAGRAM",
      type: "PUBLISH",
      status: "PENDING",
      runAt: { lte: now },
    },
    orderBy: { runAt: "asc" },
    take: 10,
  })

  if (!jobs.length) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const job of jobs) {
    const metadata = (job.metadata ?? {}) as Record<string, unknown>
    const imageUrl = typeof metadata.imageUrl === "string" ? metadata.imageUrl : ""
    const caption = typeof metadata.caption === "string" ? metadata.caption : ""

    try {
      const account = await prisma.integrationAccount.findFirst({
        where: { userId: job.userId, provider: "INSTAGRAM" },
      })

      if (!account?.accessToken || !account.providerAccountId || !imageUrl) {
        throw new Error("Conta não configurada para agendamento")
      }

      const container = await createInstagramMediaContainer({
        igUserId: account.providerAccountId,
        accessToken: account.accessToken,
        imageUrl,
        caption,
      })

      const publish = await publishInstagramMedia({
        igUserId: account.providerAccountId,
        accessToken: account.accessToken,
        creationId: container.id,
      })

      await prisma.integrationJob.update({
        where: { id: job.id },
        data: {
          status: "SUCCESS",
          metadata: {
            ...metadata,
            creationId: container.id,
            mediaId: publish.id,
          },
        },
      })

      processed += 1
    } catch (error) {
      console.error("[instagram] Falha ao executar job agendado", error)
      await prisma.integrationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "unknown_error",
        },
      })
    }
  }

  return NextResponse.json({ processed })
}
