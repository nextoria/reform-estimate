import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

interface RuleTemplate {
  category: string;
  itemKey: string;
  itemLabel: string;
  unitType: string;
  baseMinPrice: number;
  baseMaxPrice: number;
}

const baseRules: RuleTemplate[] = [
  { category: "外装", itemKey: "roof",    itemLabel: "屋根の補修・塗装",     unitType: "式", baseMinPrice: 350000,  baseMaxPrice: 900000 },
  { category: "外装", itemKey: "wall",    itemLabel: "外壁の補修・塗装",     unitType: "式", baseMinPrice: 550000,  baseMaxPrice: 1300000 },
  { category: "水回り", itemKey: "water",   itemLabel: "水回り全般",          unitType: "式", baseMinPrice: 450000,  baseMaxPrice: 1600000 },
  { category: "水回り", itemKey: "bath",    itemLabel: "浴室リフォーム",      unitType: "式", baseMinPrice: 650000,  baseMaxPrice: 1600000 },
  { category: "水回り", itemKey: "kitchen", itemLabel: "キッチンリフォーム",  unitType: "式", baseMinPrice: 550000,  baseMaxPrice: 2200000 },
  { category: "水回り", itemKey: "toilet",  itemLabel: "トイレリフォーム",    unitType: "台", baseMinPrice: 180000,  baseMaxPrice: 550000 },
  { category: "内装", itemKey: "floor",   itemLabel: "床・フローリング",     unitType: "式", baseMinPrice: 250000,  baseMaxPrice: 650000 },
  { category: "内装", itemKey: "other",   itemLabel: "その他内装",          unitType: "式", baseMinPrice: 120000,  baseMaxPrice: 500000 },
];

async function main() {
  // client-a: 標準価格帯
  for (const rule of baseRules) {
    await prisma.estimateRule.upsert({
      where: { clientId_itemKey: { clientId: "client-a", itemKey: rule.itemKey } },
      update: {},
      create: {
        clientId: "client-a",
        ...rule,
        lightMultiplier: 1.0,
        mediumMultiplier: 1.15,
        heavyMultiplier: 1.35,
        repairMultiplier: 0.6,
        partialMultiplier: 1.0,
        fullMultiplier: 1.5,
      },
    });
  }

  // client-b: やや高めの価格帯（+10〜15%）
  for (const rule of baseRules) {
    await prisma.estimateRule.upsert({
      where: { clientId_itemKey: { clientId: "client-b", itemKey: rule.itemKey } },
      update: {},
      create: {
        clientId: "client-b",
        ...rule,
        baseMinPrice: Math.round(rule.baseMinPrice * 1.12 / 10000) * 10000,
        baseMaxPrice: Math.round(rule.baseMaxPrice * 1.1 / 10000) * 10000,
        lightMultiplier: 1.0,
        mediumMultiplier: 1.2,
        heavyMultiplier: 1.4,
        repairMultiplier: 0.55,
        partialMultiplier: 1.0,
        fullMultiplier: 1.55,
      },
    });
  }

  const count = await prisma.estimateRule.count();
  console.log(`Seeded ${count} estimate rules`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
