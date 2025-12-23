import { prisma } from "@/lib/prisma"
import { formatEmbeddingForSql } from "@/lib/rag/embeddings"
import type { NormalizedPrompt, RagContext } from "@/lib/rag/types"

type CreateGenerationParams = {
  userId: string
  rawPrompt: string
  stylePrompt?: string | null
  inputImageType?: string | null
  inputImageSize?: number | null
}

export async function createGeneration({
  userId,
  rawPrompt,
  stylePrompt,
  inputImageType,
  inputImageSize,
}: CreateGenerationParams) {
  return prisma.imageGeneration.create({
    data: {
      userId,
      rawPrompt,
      stylePrompt: stylePrompt ?? null,
      inputImageType: inputImageType ?? null,
      inputImageSize: inputImageSize ?? null,
    },
  })
}

type SaveNormalizationParams = {
  generationId: string
  normalized: NormalizedPrompt
}

export async function saveNormalization({
  generationId,
  normalized,
}: SaveNormalizationParams) {
  return prisma.promptNormalization.create({
    data: {
      generationId,
      intent: normalized.intent ?? null,
      style: normalized.style ?? null,
      emotion: normalized.emotion ?? null,
      visualTags: normalized.visualTags ?? [],
      parameters: normalized.parameters ?? undefined,
      normalizedText: normalized.normalizedText,
    },
  })
}

type UpdateGenerationParams = {
  generationId: string
  status: "PENDING" | "COMPLETED" | "FAILED"
  finalPrompt?: string | null
  modelUsed?: string | null
  userUploadId?: string | null
  ragContext?: RagContext | null
}

export async function updateGeneration({
  generationId,
  status,
  finalPrompt,
  modelUsed,
  userUploadId,
  ragContext,
}: UpdateGenerationParams) {
  return prisma.imageGeneration.update({
    where: { id: generationId },
    data: {
      status,
      finalPrompt: finalPrompt ?? null,
      modelUsed: modelUsed ?? null,
      userUploadId: userUploadId ?? null,
      ragContext: ragContext ?? undefined,
    },
  })
}

type InsertEmbeddingParams = {
  userId?: string | null
  generationId?: string | null
  feedbackId?: string | null
  kind: "NORMALIZED_PROMPT" | "FINAL_PROMPT" | "VISUAL_TAG" | "FEEDBACK"
  content: string
  embedding: number[]
}

export async function insertEmbedding({
  userId,
  generationId,
  feedbackId,
  kind,
  content,
  embedding,
}: InsertEmbeddingParams) {
  const vector = formatEmbeddingForSql(embedding)
  const id = crypto.randomUUID()

  await prisma.$executeRaw`
    INSERT INTO "RagEmbedding" ("id", "userId", "generationId", "feedbackId", "kind", "content", "embedding", "createdAt")
    VALUES (${id}, ${userId ?? null}, ${
    generationId ?? null
  }, ${feedbackId ?? null}, ${kind}, ${content}, ${vector}::vector, NOW())
  `
}
