-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "creditPackAmount" INTEGER,
ADD COLUMN     "creditPackPriceId" TEXT,
ADD COLUMN     "watermarkEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watermarkText" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "extraCredits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CreditPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "credits" INTEGER NOT NULL,
    "amount" INTEGER,
    "currency" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditPurchase_stripeSessionId_key" ON "CreditPurchase"("stripeSessionId");

-- CreateIndex
CREATE INDEX "CreditPurchase_userId_idx" ON "CreditPurchase"("userId");

-- AddForeignKey
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
