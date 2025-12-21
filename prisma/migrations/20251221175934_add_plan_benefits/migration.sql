-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[];
