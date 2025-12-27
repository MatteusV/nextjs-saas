-- Add parent generation for variations
ALTER TABLE "ImageGeneration" ADD COLUMN "parentGenerationId" TEXT;

ALTER TABLE "ImageGeneration"
ADD CONSTRAINT "ImageGeneration_parentGenerationId_fkey"
FOREIGN KEY ("parentGenerationId") REFERENCES "ImageGeneration"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Presets
CREATE TABLE "Preset" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "style" TEXT,
  "prompt" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Preset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Preset"
ADD CONSTRAINT "Preset_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Preset_userId_idx" ON "Preset"("userId");

-- Derivatives
CREATE TYPE "DerivativeKind" AS ENUM ('CROP');

CREATE TABLE "ImageDerivative" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "generationId" TEXT NOT NULL,
  "kind" "DerivativeKind" NOT NULL,
  "aspectRatio" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImageDerivative_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ImageDerivative"
ADD CONSTRAINT "ImageDerivative_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImageDerivative"
ADD CONSTRAINT "ImageDerivative_generationId_fkey"
FOREIGN KEY ("generationId") REFERENCES "ImageGeneration"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ImageDerivative_userId_idx" ON "ImageDerivative"("userId");
CREATE INDEX "ImageDerivative_generationId_idx" ON "ImageDerivative"("generationId");
