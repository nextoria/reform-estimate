import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const VALID_TEMPLATES = ["template-standard", "template-high", "template-low"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "client" || !session.clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId } = await request.json();

  if (!templateId || !VALID_TEMPLATES.includes(templateId)) {
    return Response.json(
      { error: "無効なテンプレートです" },
      { status: 400 }
    );
  }

  const templateRules = await prisma.estimateRule.findMany({
    where: { clientId: templateId },
    select: {
      category: true,
      itemKey: true,
      itemLabel: true,
      unitType: true,
      baseMinPrice: true,
      baseMaxPrice: true,
      lightMultiplier: true,
      mediumMultiplier: true,
      heavyMultiplier: true,
      repairMultiplier: true,
      partialMultiplier: true,
      fullMultiplier: true,
      isActive: true,
    },
  });

  if (templateRules.length === 0) {
    return Response.json(
      { error: "テンプレートのルールが見つかりません" },
      { status: 404 }
    );
  }

  const clientId = session.clientId;

  await prisma.$transaction(async (tx) => {
    await tx.estimateRule.deleteMany({
      where: { clientId },
    });

    await tx.estimateRule.createMany({
      data: templateRules.map((rule) => ({
        ...rule,
        clientId,
      })),
    });
  });

  return Response.json({ ok: true, count: templateRules.length });
}
