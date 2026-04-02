import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/api/estimate") ||
    pathname.startsWith("/api/leads") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session_token")?.value;
  const session = token ? verifyToken(token) : null;

  // Not authenticated → login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /admin routes → admin only
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // /dashboard routes → client only
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard")) {
    if (session.role !== "client") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
