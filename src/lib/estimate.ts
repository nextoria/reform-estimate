import { prisma } from "@/lib/db";

export interface EstimateInput {
  clientId: string;
  buildingAge: number;
  concerns: string[];
  photoCount: number;
  details?: string;
}

export interface EstimateItem {
  label: string;
  category: string;
  unitType: string;
  min: number;
  max: number;
}

export interface EstimateResult {
  items: EstimateItem[];
  totalMin: number;
  totalMax: number;
  degradationLevel: string;
  workLevel: string;
  note: string;
}

/**
 * 築年数と写真枚数から劣化レベルを推定
 * - 築20年以下 or 写真0枚 → light
 * - 築21〜30年 → medium
 * - 築31年以上 or 写真3枚（＝多くの問題箇所） → heavy
 */
function estimateDegradation(buildingAge: number, photoCount: number): "light" | "medium" | "heavy" {
  if (buildingAge >= 31 || photoCount >= 3) return "heavy";
  if (buildingAge >= 21) return "medium";
  return "light";
}

/**
 * 劣化レベルと困りごと数から工事レベルを推定
 * - 軽度 + 項目少 → repair（補修）
 * - 中度 → partial（部分交換）
 * - 重度 or 項目多 → full（全面交換）
 */
function estimateWorkLevel(degradation: "light" | "medium" | "heavy", concernCount: number): "repair" | "partial" | "full" {
  if (degradation === "heavy" || concernCount >= 4) return "full";
  if (degradation === "medium" || concernCount >= 2) return "partial";
  return "repair";
}

function roundTo10k(n: number): number {
  return Math.round(n / 10000) * 10000;
}

export async function generateEstimate(input: EstimateInput): Promise<EstimateResult> {
  const { clientId, buildingAge, concerns, photoCount } = input;

  // DBからクライアントのルールを取得
  const rules = await prisma.estimateRule.findMany({
    where: {
      clientId,
      itemKey: { in: concerns },
      isActive: true,
    },
  });

  // DBにルールが無い concerns はフォールバック用に取得
  const foundKeys = new Set(rules.map((r) => r.itemKey));
  const missingConcerns = concerns.filter((c) => !foundKeys.has(c));

  // フォールバック: 他クライアントのルール or 汎用値
  let fallbackRules: typeof rules = [];
  if (missingConcerns.length > 0) {
    fallbackRules = await prisma.estimateRule.findMany({
      where: {
        itemKey: { in: missingConcerns },
        isActive: true,
      },
      distinct: ["itemKey"],
    });
  }

  const allRules = [...rules, ...fallbackRules];

  const degradation = estimateDegradation(buildingAge, photoCount);
  const workLevel = estimateWorkLevel(degradation, concerns.length);

  const items: EstimateItem[] = allRules.map((rule) => {
    // 劣化係数
    const degradationMultiplier =
      degradation === "heavy" ? rule.heavyMultiplier :
      degradation === "medium" ? rule.mediumMultiplier :
      rule.lightMultiplier;

    // 工事レベル係数
    const workMultiplier =
      workLevel === "full" ? rule.fullMultiplier :
      workLevel === "partial" ? rule.partialMultiplier :
      rule.repairMultiplier;

    return {
      label: rule.itemLabel,
      category: rule.category,
      unitType: rule.unitType,
      min: roundTo10k(rule.baseMinPrice * degradationMultiplier * workMultiplier),
      max: roundTo10k(rule.baseMaxPrice * degradationMultiplier * workMultiplier),
    };
  });

  const totalMin = items.reduce((s, i) => s + i.min, 0);
  const totalMax = items.reduce((s, i) => s + i.max, 0);

  const degradationLabels = { light: "軽度", medium: "中度", heavy: "重度" };
  const workLabels = { repair: "補修", partial: "部分交換", full: "全面交換" };

  return {
    items,
    totalMin,
    totalMax,
    degradationLevel: degradationLabels[degradation],
    workLevel: workLabels[workLevel],
    note: "※ 概算見積です。正確な金額は現地調査後にご案内いたします。築年数・劣化状況により変動します。",
  };
}
