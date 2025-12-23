import { embedText } from "@/lib/rag/embeddings"
import { insertEmbedding } from "@/lib/rag/persist"

type StoreFeedbackEmbeddingParams = {
  feedbackId: string
  userId: string
  generationId: string
  rating?: number | null
  comment?: string | null
  tags?: string[]
}

export async function storeFeedbackEmbedding({
  feedbackId,
  userId,
  generationId,
  rating,
  comment,
  tags,
}: StoreFeedbackEmbeddingParams) {
  const contentParts = [
    rating ? `rating:${rating}` : null,
    comment?.trim() || null,
    tags?.length ? `tags:${tags.join(", ")}` : null,
  ].filter(Boolean)

  if (!contentParts.length) {
    return
  }

  const content = contentParts.join(" | ")
  const embedding = await embedText(content)
  if (!embedding) {
    return
  }

  await insertEmbedding({
    userId,
    generationId,
    feedbackId,
    kind: "FEEDBACK",
    content,
    embedding,
  })
}
