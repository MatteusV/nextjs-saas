import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ collections })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: "Payload inválido" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""

  if (!name) {
    return Response.json({ error: "Nome da coleção é obrigatório" }, { status: 400 })
  }

  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name,
      description: description || null,
    },
  })

  return Response.json({ collection })
}
