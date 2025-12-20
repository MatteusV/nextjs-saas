-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE_TIER', 'PRO', 'BUSINESS');

-- CreateTable
CREATE TABLE "Plan" (
    "id" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stylizeLimit" INTEGER,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE_TIER',
    "stylizeUsageCount" INTEGER NOT NULL DEFAULT 0,
    "stylizeUsagePeriod" TEXT NOT NULL DEFAULT '1970-01',
    "verifiedAt" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subscriptionPlan_fkey" FOREIGN KEY ("subscriptionPlan") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
