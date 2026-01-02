import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { fetchInstagramMediaList } from "@/lib/integrations/instagram"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await prisma.integrationAccount.findFirst({
    where: { userId: user.id, provider: "INSTAGRAM" },
  })

  if (!account?.accessToken || !account.providerAccountId) {
    return NextResponse.json({ error: "Instagram não conectado" }, { status: 400 })
  }

  try {
    const media = await fetchInstagramMediaList({
      igUserId: account.providerAccountId,
      accessToken: account.accessToken,
    })

    return NextResponse.json({ items: media.data })
  } catch (error) {
    console.error("[instagram] Falha ao carregar mídias", error)
    return NextResponse.json({ error: "Falha ao carregar mídias" }, { status: 500 })
  }
}
