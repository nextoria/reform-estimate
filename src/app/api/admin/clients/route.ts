import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Also return distinct clientIds from EstimateRule for the copy-from dropdown
  const ruleClients = await prisma.estimateRule.findMany({
    select: { clientId: true },
    distinct: ["clientId"],
    orderBy: { clientId: "asc" },
  });

  return Response.json({
    clients,
    ruleClientIds: ruleClients.map((r) => r.clientId),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, clientKey, email, password, copyFromClientId } = body;

    if (!companyName || !clientKey || !email || !password) {
      return Response.json(
        { error: "必須項目を入力してください" },
        { status: 400 }
      );
    }

    // Check for duplicate clientKey
    const existingClient = await prisma.client.findUnique({
      where: { clientKey },
    });
    if (existingClient) {
      return Response.json(
        { error: "このクライアントキーは既に使用されています" },
        { status: 409 }
      );
    }

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return Response.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Fetch source rules if copy is requested
    let sourceRules: Array<{
      category: string;
      itemKey: string;
      itemLabel: string;
      unitType: string;
      baseMinPrice: number;
      baseMaxPrice: number;
      lightMultiplier: number;
      mediumMultiplier: number;
      heavyMultiplier: number;
      repairMultiplier: number;
      partialMultiplier: number;
      fullMultiplier: number;
      isActive: boolean;
    }> = [];

    if (copyFromClientId) {
      sourceRules = await prisma.estimateRule.findMany({
        where: { clientId: copyFromClientId },
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
    }

    // Transaction: create Client + User + copy EstimateRules
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          clientKey,
          companyName,
          contactEmail: email,
        },
      });

      await tx.user.create({
        data: {
          name: companyName,
          email,
          passwordHash,
          role: "client",
          clientId: clientKey,
        },
      });

      if (sourceRules.length > 0) {
        await tx.estimateRule.createMany({
          data: sourceRules.map((rule) => ({
            ...rule,
            clientId: clientKey,
          })),
        });
      }

      return client;
    });

    return Response.json({ client: result }, { status: 201 });
  } catch (error) {
    console.error("Client creation error:", error);
    return Response.json(
      { error: "クライアントの作成に失敗しました" },
      { status: 500 }
    );
  }
}
