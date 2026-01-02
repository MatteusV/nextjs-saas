import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import {
  createInstagramMediaContainer,
  publishInstagramMedia,
} from "@/lib/integrations/instagram"
import { createIntegrationJob } from "@/lib/integrations/jobs"

function parseSchedule(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const imageUrl = typeof payload?.imageUrl === "string" ? payload.imageUrl.trim() : ""
  const caption = typeof payload?.caption === "string" ? payload.caption.trim() : ""
  const scheduleAt = parseSchedule(payload?.scheduleAt)

  if (!imageUrl) {
    return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 })
  }

  const account = await prisma.integrationAccount.findFirst({
    where: { userId: user.id, provider: "INSTAGRAM" },
  })

  if (!account?.accessToken || !account.providerAccountId) {
    return NextResponse.json({ error: "Instagram não conectado" }, { status: 400 })
  }

  if (scheduleAt && scheduleAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Agendamento precisa ser futuro" }, { status: 400 })
  }

  if (scheduleAt) {
    const job = await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "PUBLISH",
      status: "PENDING",
      runAt: scheduleAt,
      metadata: {
        imageUrl,
        caption,
      },
    })

    return NextResponse.json({ scheduled: true, jobId: job.id })
  }

  try {
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

    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "PUBLISH",
      status: "SUCCESS",
      metadata: {
        imageUrl,
        caption,
        creationId: container.id,
        mediaId: publish.id,
      },
    })

    return NextResponse.json({ ok: true, mediaId: publish.id })
  } catch (error) {
    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "PUBLISH",
      status: "FAILED",
      error: error instanceof Error ? error.message : "unknown_error",
      metadata: {
        imageUrl,
        caption,
      },
    })

    console.error("[instagram] Falha ao publicar", error)
    return NextResponse.json({ error: "Falha ao publicar" }, { status: 500 })
  }
}
