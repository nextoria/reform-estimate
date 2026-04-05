import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ALLOWED_FIELDS: Record<string, "int" | "float"> = {
  baseMinPrice: "int",
  baseMaxPrice: "int",
  lightMultiplier: "float",
  mediumMultiplier: "float",
  heavyMultiplier: "float",
  repairMultiplier: "float",
  partialMultiplier: "float",
  fullMultiplier: "float",
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "client" || !session.clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const rule = await prisma.estimateRule.findUnique({ where: { id } });
  if (!rule || rule.clientId !== session.clientId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, number> = {};

  for (const [key, type] of Object.entries(ALLOWED_FIELDS)) {
    if (key in body) {
      const val = type === "int" ? parseInt(String(body[key])) : parseFloat(String(body[key]));
      if (isNaN(val)) {
        return Response.json({ error: `${key} の値が不正です` }, { status: 400 });
      }
      data[key] = val;
    }
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  const updated = await prisma.estimateRule.update({
    where: { id },
    data,
  });

  return Response.json({ rule: updated });
}
