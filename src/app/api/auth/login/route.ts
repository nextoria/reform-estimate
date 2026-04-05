import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "メールアドレスとパスワードを入力してください" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    );
  }

  // Check if client account is active
  if (user.role === "client" && user.clientId) {
    const client = await prisma.client.findUnique({
      where: { clientKey: user.clientId },
    });
    if (client && !client.isActive) {
      return NextResponse.json(
        { error: "このアカウントは現在停止されています" },
        { status: 403 }
      );
    }
  }

  const session = await createSession(user.id);

  return NextResponse.json({
    ok: true,
    role: session.role,
    redirectTo: session.role === "admin" ? "/admin" : "/dashboard",
  });
}
