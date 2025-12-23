import { embed, gateway } from "ai"
import { RAG_EMBEDDING_MODEL, RAG_EMBEDDING_DIMENSION } from "@/lib/rag/config"

export async function embedText(value: string) {
  try {
    const result = await embed({
      model: gateway.embeddingModel(RAG_EMBEDDING_MODEL),
      value,
    })

    if (result.embedding.length !== RAG_EMBEDDING_DIMENSION) {
      console.warn(
        "[rag] Embedding dimension mismatch",
        result.embedding.length,
        RAG_EMBEDDING_DIMENSION
      )
    }

    return result.embedding
  } catch (error) {
    console.warn("[rag] Embedding model failed, skipping embeddings", error)
    return null
  }
}

export function formatEmbeddingForSql(embedding: number[]) {
  return `[${embedding.map((item) => Number(item).toFixed(6)).join(",")}]`
}
