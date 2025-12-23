import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { formatEmbeddingForSql } from "@/lib/rag/embeddings"
import { RAG_MAX_SIMILAR_GLOBAL, RAG_MAX_SIMILAR_USER } from "@/lib/rag/config"
import type { RagContext, RagMatch } from "@/lib/rag/types"

type RetrieveContextParams = {
  userId: string
  queryEmbedding: number[]
}

type RawMatch = {
  content: string
  kind: "NORMALIZED_PROMPT" | "FINAL_PROMPT" | "VISUAL_TAG" | "FEEDBACK"
  distance: number
  generationId: string | null
}

function mapMatch(match: RawMatch): RagMatch {
  const score = Math.max(0, 1 - match.distance)
  return {
    content: match.content,
    kind: match.kind,
    score,
    generationId: match.generationId,
  }
}

export async function retrieveRagContext({
  userId,
  queryEmbedding,
}: RetrieveContextParams): Promise<RagContext> {
  const vector = formatEmbeddingForSql(queryEmbedding)
  const kinds = Prisma.join(
    [
      "FINAL_PROMPT",
      "NORMALIZED_PROMPT",
      "VISUAL_TAG",
      "FEEDBACK",
    ].map((kind) => Prisma.sql`${kind}`)
  )

  const userMatches = await prisma.$queryRaw<RawMatch[]>`
    SELECT
      "RagEmbedding"."content",
      "RagEmbedding"."kind",
      ("RagEmbedding"."embedding" <=> ${vector}::vector) AS "distance",
      "RagEmbedding"."generationId"
    FROM "RagEmbedding"
    LEFT JOIN "ImageFeedback"
      ON "ImageFeedback"."id" = "RagEmbedding"."feedbackId"
    WHERE "RagEmbedding"."userId" = ${userId}
      AND "RagEmbedding"."kind" IN (${kinds})
      AND (
        "RagEmbedding"."kind" <> 'FEEDBACK'
        OR ("ImageFeedback"."rating" IS NULL OR "ImageFeedback"."rating" >= 4)
      )
    ORDER BY "RagEmbedding"."embedding" <=> ${vector}::vector
    LIMIT ${RAG_MAX_SIMILAR_USER};
  `

  const globalMatches = await prisma.$queryRaw<RawMatch[]>`
    SELECT
      "RagEmbedding"."content",
      "RagEmbedding"."kind",
      ("RagEmbedding"."embedding" <=> ${vector}::vector) AS "distance",
      "RagEmbedding"."generationId"
    FROM "RagEmbedding"
    LEFT JOIN "ImageFeedback"
      ON "ImageFeedback"."id" = "RagEmbedding"."feedbackId"
    WHERE "RagEmbedding"."userId" IS NULL
      AND "RagEmbedding"."kind" IN (${kinds})
      AND (
        "RagEmbedding"."kind" <> 'FEEDBACK'
        OR ("ImageFeedback"."rating" IS NULL OR "ImageFeedback"."rating" >= 4)
      )
    ORDER BY "RagEmbedding"."embedding" <=> ${vector}::vector
    LIMIT ${RAG_MAX_SIMILAR_GLOBAL};
  `

  const userMapped = userMatches.map(mapMatch)
  const globalMapped = globalMatches.map(mapMatch)
  const tagHints = [...userMapped, ...globalMapped]
    .filter((item) => item.kind === "VISUAL_TAG")
    .map((item) => item.content)

  return {
    userMatches: userMapped,
    globalMatches: globalMapped,
    tagHints: Array.from(new Set(tagHints)).slice(0, 8),
  }
}
