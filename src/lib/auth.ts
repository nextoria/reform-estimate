import { cookies } from "next/headers";
import { prisma } from "./db";
import crypto from "crypto";

const SESSION_COOKIE = "session_token";
const SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";

interface SessionPayload {
  userId: string;
  role: string;
  clientId: string | null;
  exp: number;
}

function sign(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

function verify(token: string): SessionPayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    clientId: user.clientId,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  const token = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return payload;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function verifyToken(token: string): SessionPayload | null {
  return verify(token);
}
