-- AlterTable
ALTER TABLE "AdminAlertSettings" ADD COLUMN     "lastAlertSentAt" TIMESTAMP(3),
ADD COLUMN     "lastAlertSignature" TEXT;
