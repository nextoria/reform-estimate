import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, name, phone } = body;

    if (!leadId || !name || !phone) {
      return Response.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { name, phone, status: "contacted" },
    });

    return Response.json({ success: true, lead });
  } catch (error) {
    console.error("Lead update error:", error);
    return Response.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
