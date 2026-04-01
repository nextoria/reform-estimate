import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 更新可能なフィールドのみ抽出
    const allowedFields = [
      "itemLabel",
      "baseMinPrice",
      "baseMaxPrice",
      "lightMultiplier",
      "mediumMultiplier",
      "heavyMultiplier",
      "repairMultiplier",
      "partialMultiplier",
      "fullMultiplier",
      "isActive",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "更新するフィールドがありません" }, { status: 400 });
    }

    const rule = await prisma.estimateRule.update({
      where: { id },
      data,
    });

    return Response.json({ rule });
  } catch (error) {
    console.error("Rule update error:", error);
    return Response.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
