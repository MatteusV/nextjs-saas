export const RAG_LANGUAGE_MODEL =
  process.env.AI_RAG_LANGUAGE_MODEL ?? "google/gemini-2.0-flash"

export const RAG_EMBEDDING_MODEL =
  process.env.AI_RAG_EMBEDDING_MODEL ?? "openai/text-embedding-3-small"

export const RAG_EMBEDDING_DIMENSION = Number(
  process.env.AI_RAG_EMBEDDING_DIMENSION ?? "1536"
)

export const RAG_MAX_SIMILAR_USER = 4
export const RAG_MAX_SIMILAR_GLOBAL = 3
