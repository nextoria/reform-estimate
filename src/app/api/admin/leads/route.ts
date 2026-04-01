import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("clientId");

  const where = clientId ? { clientId } : {};

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ leads });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    return Response.json({ lead });
  } catch (error) {
    console.error("Admin update error:", error);
    return Response.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
