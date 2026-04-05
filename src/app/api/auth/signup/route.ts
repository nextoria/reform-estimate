import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { companyName, clientKey, email, password } = await request.json();

    if (!companyName || !clientKey || !email || !password) {
      return NextResponse.json(
        { error: "全ての項目を入力してください" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(clientKey)) {
      return NextResponse.json(
        { error: "クライアントキーは半角英数字とハイフンのみ使用できます" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      );
    }

    // Check duplicates
    const existingClient = await prisma.client.findUnique({
      where: { clientKey },
    });
    if (existingClient) {
      return NextResponse.json(
        { error: "このクライアントキーは既に使用されています" },
        { status: 409 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 409 }
      );
    }

    // Fetch default rules
    const defaultRules = await prisma.estimateRule.findMany({
      where: { clientId: "default" },
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

    const passwordHash = await bcrypt.hash(password, 10);

    // Transaction: Client + User + EstimateRules
    const user = await prisma.$transaction(async (tx) => {
      await tx.client.create({
        data: {
          clientKey,
          companyName,
          contactEmail: email,
        },
      });

      const newUser = await tx.user.create({
        data: {
          name: companyName,
          email,
          passwordHash,
          role: "client",
          clientId: clientKey,
        },
      });

      if (defaultRules.length > 0) {
        await tx.estimateRule.createMany({
          data: defaultRules.map((rule) => ({
            ...rule,
            clientId: clientKey,
          })),
        });
      }

      return newUser;
    });

    // Auto-login
    const session = await createSession(user.id);

    return NextResponse.json({
      ok: true,
      redirectTo: session.role === "admin" ? "/admin" : "/dashboard",
    }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "登録に失敗しました" },
      { status: 500 }
    );
  }
}
