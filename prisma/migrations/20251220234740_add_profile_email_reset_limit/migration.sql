-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastEmailChangeSentAt" TIMESTAMP(3),
ADD COLUMN     "lastPasswordResetSentAt" TIMESTAMP(3);
