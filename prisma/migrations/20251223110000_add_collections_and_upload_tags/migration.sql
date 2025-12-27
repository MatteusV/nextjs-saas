-- Collections
CREATE TABLE "Collection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Collection"
ADD CONSTRAINT "Collection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

-- Upload metadata
ALTER TABLE "UserUpload" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "UserUpload" ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserUpload" ADD COLUMN "collectionId" TEXT;

ALTER TABLE "UserUpload"
ADD CONSTRAINT "UserUpload_collectionId_fkey"
FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "UserUpload_collectionId_idx" ON "UserUpload"("collectionId");
