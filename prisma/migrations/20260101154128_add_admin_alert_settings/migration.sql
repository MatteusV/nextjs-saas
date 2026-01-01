-- CreateTable
CREATE TABLE "AdminAlertSettings" (
    "id" TEXT NOT NULL,
    "highUsage24hLimit" INTEGER NOT NULL DEFAULT 200,
    "premiumModel30dLimit" INTEGER NOT NULL DEFAULT 50,
    "creditOrders30dLimit" INTEGER NOT NULL DEFAULT 3,
    "creditRevenue30dLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAlertSettings_pkey" PRIMARY KEY ("id")
);
