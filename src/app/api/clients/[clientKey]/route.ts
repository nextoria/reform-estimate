import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientKey: string }> }
) {
  const { clientKey } = await params;

  const client = await prisma.client.findUnique({
    where: { clientKey },
    select: {
      companyName: true,
      contactEmail: true,
      isActive: true,
    },
  });

  if (!client) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ client });
}
