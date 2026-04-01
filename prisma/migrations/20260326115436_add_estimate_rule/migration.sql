-- CreateTable
CREATE TABLE "EstimateRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "unitType" TEXT NOT NULL DEFAULT '式',
    "baseMinPrice" INTEGER NOT NULL,
    "baseMaxPrice" INTEGER NOT NULL,
    "lightMultiplier" REAL NOT NULL DEFAULT 1.0,
    "mediumMultiplier" REAL NOT NULL DEFAULT 1.15,
    "heavyMultiplier" REAL NOT NULL DEFAULT 1.35,
    "repairMultiplier" REAL NOT NULL DEFAULT 0.6,
    "partialMultiplier" REAL NOT NULL DEFAULT 1.0,
    "fullMultiplier" REAL NOT NULL DEFAULT 1.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EstimateRule_clientId_idx" ON "EstimateRule"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "EstimateRule_clientId_itemKey_key" ON "EstimateRule"("clientId", "itemKey");
