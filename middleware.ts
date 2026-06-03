import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeUserRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";

const SESSION_COOKIE = "vinite_session";

const AREA_ROLES: Record<string, UserRole> = {
  admin: "admin",
  painel: "member",
};

const ROLE_LEVEL: Record<UserRole, number> = {
  admin: 100,
  member: 10,
};

function readRole(request: NextRequest): UserRole | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(json) as { user?: { role?: string } };
    if (!data.user?.role) return null;
    return normalizeUserRole(data.user.role);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/mestre") || pathname.startsWith("/jogador")) {
    const target = new URL("/painel", request.url);
    return NextResponse.redirect(target);
  }

  const segment = pathname.split("/")[1];
  const required = AREA_ROLES[segment];
  if (!required) return NextResponse.next();

  const userRole = readRole(request);
  if (!userRole) {
    const login = new URL("/entrar", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  const level = ROLE_LEVEL[userRole] ?? ROLE_LEVEL.member;
  if (level < ROLE_LEVEL[required]) {
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/painel/:path*", "/mestre/:path*", "/jogador/:path*"],
};
