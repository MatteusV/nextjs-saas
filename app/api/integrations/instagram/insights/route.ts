import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { fetchInstagramInsights } from "@/lib/integrations/instagram"
import { createIntegrationJob } from "@/lib/integrations/jobs"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get("mediaId")?.trim()
  const mediaType = searchParams.get("mediaType")?.trim() ?? null

  if (!mediaId) {
    return NextResponse.json({ error: "Media ID obrigatório" }, { status: 400 })
  }

  const account = await prisma.integrationAccount.findFirst({
    where: { userId: user.id, provider: "INSTAGRAM" },
  })

  if (!account?.accessToken) {
    return NextResponse.json({ error: "Instagram não conectado" }, { status: 400 })
  }

  try {
    const insights = await fetchInstagramInsights({
      mediaId,
      accessToken: account.accessToken,
      mediaType,
    })

    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "INSIGHTS",
      status: "SUCCESS",
      metadata: { mediaId },
    })

    return NextResponse.json({ insights: insights.data })
  } catch (error) {
    await createIntegrationJob({
      userId: user.id,
      provider: "INSTAGRAM",
      type: "INSIGHTS",
      status: "FAILED",
      error: error instanceof Error ? error.message : "unknown_error",
      metadata: { mediaId },
    })

    console.error("[instagram] Falha ao carregar insights", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível carregar os insights agora.",
      },
      { status: 500 }
    )
  }
}
