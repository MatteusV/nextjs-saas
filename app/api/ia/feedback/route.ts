import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/server-actions/session"
import { storeFeedbackEmbedding } from "@/lib/rag/feedback"

const feedbackSchema = z.object({
  generationId: z.string().uuid(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(50)).max(12).optional(),
})

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { generationId, rating, comment, tags } = parsed.data
  const generation = await prisma.imageGeneration.findFirst({
    where: { id: generationId, userId: user.id },
    select: { id: true },
  })

  if (!generation) {
    return Response.json({ error: "Geração não encontrada" }, { status: 404 })
  }

  const feedback = await prisma.imageFeedback.create({
    data: {
      userId: user.id,
      generationId,
      rating: rating ?? null,
      comment: comment?.trim() || null,
      tags: tags ?? [],
    },
  })

  try {
    await storeFeedbackEmbedding({
      feedbackId: feedback.id,
      userId: user.id,
      generationId,
      rating: rating ?? null,
      comment: comment?.trim() || null,
      tags: tags ?? [],
    })
  } catch (error) {
    console.warn("[rag] Failed to embed feedback", error)
  }

  return Response.json({ success: true, feedbackId: feedback.id })
}
