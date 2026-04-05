import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowed: Record<string, true> = {
      companyName: true,
      contactEmail: true,
      isActive: true,
    };

    const data: Record<string, string | boolean | null> = {};
    for (const key of Object.keys(body)) {
      if (!allowed[key]) continue;

      if (key === "companyName") {
        if (typeof body[key] !== "string" || body[key].trim() === "") {
          return Response.json(
            { error: "会社名は必須です" },
            { status: 400 }
          );
        }
        data[key] = body[key].trim();
      } else if (key === "contactEmail") {
        data[key] = body[key] || null;
      } else if (key === "isActive") {
        if (typeof body[key] !== "boolean") {
          return Response.json(
            { error: "isActive は boolean で指定してください" },
            { status: 400 }
          );
        }
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json(
        { error: "更新する項目がありません" },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    return Response.json({ client });
  } catch (error) {
    console.error("Client update error:", error);
    return Response.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }
}
