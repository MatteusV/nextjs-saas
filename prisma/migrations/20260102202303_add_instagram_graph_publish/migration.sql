-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntegrationJobType" ADD VALUE 'PUBLISH';
ALTER TYPE "IntegrationJobType" ADD VALUE 'INSIGHTS';

-- AlterTable
ALTER TABLE "IntegrationAccount" ADD COLUMN     "pageId" TEXT,
ADD COLUMN     "pageName" TEXT;

-- AlterTable
ALTER TABLE "IntegrationJob" ADD COLUMN     "runAt" TIMESTAMP(3);
