import { embedText } from "@/lib/rag/embeddings"
import { insertEmbedding } from "@/lib/rag/persist"
import type { NormalizedPrompt } from "@/lib/rag/types"

type StoreGenerationEmbeddingsParams = {
  generationId: string
  userId: string
  normalized: NormalizedPrompt
  finalPrompt: string
}

export async function storeGenerationEmbeddings({
  generationId,
  userId,
  normalized,
  finalPrompt,
}: StoreGenerationEmbeddingsParams) {
  const normalizedEmbedding = await embedText(normalized.normalizedText)
  if (normalizedEmbedding) {
    await insertEmbedding({
      userId,
      generationId,
      kind: "NORMALIZED_PROMPT",
      content: normalized.normalizedText,
      embedding: normalizedEmbedding,
    })
  }

  const finalEmbedding = await embedText(finalPrompt)
  if (finalEmbedding) {
    await insertEmbedding({
      userId,
      generationId,
      kind: "FINAL_PROMPT",
      content: finalPrompt,
      embedding: finalEmbedding,
    })
  }

  if (normalized.visualTags.length) {
    await Promise.all(
      normalized.visualTags.map(async (tag) => {
        const tagEmbedding = await embedText(tag)
        if (!tagEmbedding) {
          return
        }
        await insertEmbedding({
          userId,
          generationId,
          kind: "VISUAL_TAG",
          content: tag,
          embedding: tagEmbedding,
        })
      })
    )
  }
}
