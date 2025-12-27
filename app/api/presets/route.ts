import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"

export async function GET() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const presets = await prisma.preset.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ presets })
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: "Payload inválido" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const style = typeof body.style === "string" ? body.style.trim() : ""
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
  const intent = typeof body.intent === "string" ? body.intent.trim() : ""
  const emotion = typeof body.emotion === "string" ? body.emotion.trim() : ""
  const lighting = typeof body.lighting === "string" ? body.lighting.trim() : ""
  const palette = typeof body.palette === "string" ? body.palette.trim() : ""
  const framing = typeof body.framing === "string" ? body.framing.trim() : ""
  const details = typeof body.details === "string" ? body.details.trim() : ""
  const tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : []

  if (!name) {
    return Response.json({ error: "Nome do preset é obrigatório" }, { status: 400 })
  }

  const preset = await prisma.preset.create({
    data: {
      userId: sessionUser.id,
      name,
      style: style || null,
      prompt: prompt || null,
      intent: intent || null,
      emotion: emotion || null,
      lighting: lighting || null,
      palette: palette || null,
      framing: framing || null,
      details: details || null,
      tags,
    },
  })

  return Response.json({ preset })
}
