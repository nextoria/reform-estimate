import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "client" || !session.clientId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ leads });
}
