-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "lineUserId" TEXT,
    "buildingAge" INTEGER,
    "concerns" TEXT,
    "details" TEXT,
    "photos" TEXT,
    "estimate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateRule" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "unitType" TEXT NOT NULL DEFAULT '式',
    "baseMinPrice" INTEGER NOT NULL,
    "baseMaxPrice" INTEGER NOT NULL,
    "lightMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "mediumMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
    "heavyMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.35,
    "repairMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "partialMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "fullMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_clientId_idx" ON "Lead"("clientId");

-- CreateIndex
CREATE INDEX "Lead_lineUserId_idx" ON "Lead"("lineUserId");

-- CreateIndex
CREATE INDEX "EstimateRule_clientId_idx" ON "EstimateRule"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "EstimateRule_clientId_itemKey_key" ON "EstimateRule"("clientId", "itemKey");
