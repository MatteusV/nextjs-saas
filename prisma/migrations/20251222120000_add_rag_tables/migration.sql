CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "EmbeddingKind" AS ENUM (
  'NORMALIZED_PROMPT',
  'FINAL_PROMPT',
  'VISUAL_TAG',
  'FEEDBACK'
);

CREATE TYPE "GenerationStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED'
);

CREATE TABLE "ImageGeneration" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userUploadId" TEXT,
  "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
  "inputImageType" TEXT,
  "inputImageSize" INTEGER,
  "rawPrompt" TEXT NOT NULL,
  "stylePrompt" TEXT,
  "finalPrompt" TEXT,
  "modelUsed" TEXT,
  "ragContext" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ImageGeneration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromptNormalization" (
  "id" TEXT NOT NULL,
  "generationId" TEXT NOT NULL,
  "intent" TEXT,
  "emotion" TEXT,
  "style" TEXT,
  "visualTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "parameters" JSONB,
  "normalizedText" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromptNormalization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RagEmbedding" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "generationId" TEXT,
  "feedbackId" TEXT,
  "kind" "EmbeddingKind" NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(768) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RagEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImageFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "generationId" TEXT NOT NULL,
  "rating" INTEGER,
  "comment" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ImageFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImageGeneration_userUploadId_key" ON "ImageGeneration"("userUploadId");
CREATE UNIQUE INDEX "PromptNormalization_generationId_key" ON "PromptNormalization"("generationId");

ALTER TABLE "ImageGeneration"
ADD CONSTRAINT "ImageGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImageGeneration"
ADD CONSTRAINT "ImageGeneration_userUploadId_fkey" FOREIGN KEY ("userUploadId") REFERENCES "UserUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PromptNormalization"
ADD CONSTRAINT "PromptNormalization_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "ImageGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RagEmbedding"
ADD CONSTRAINT "RagEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RagEmbedding"
ADD CONSTRAINT "RagEmbedding_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "ImageGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RagEmbedding"
ADD CONSTRAINT "RagEmbedding_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "ImageFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImageFeedback"
ADD CONSTRAINT "ImageFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImageFeedback"
ADD CONSTRAINT "ImageFeedback_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "ImageGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
