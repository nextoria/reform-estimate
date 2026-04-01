import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("clientId");
  const where = clientId ? { clientId } : {};

  const rules = await prisma.estimateRule.findMany({
    where,
    orderBy: [{ clientId: "asc" }, { category: "asc" }, { itemKey: "asc" }],
  });

  return Response.json({ rules });
}
