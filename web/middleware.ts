import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/auth/types";

const SESSION_COOKIE = "vinite_session";

const AREA_ROLES: Record<string, UserRole> = {
  admin: "admin",
  mestre: "mestre",
  jogador: "jogador",
};

const ROLE_LEVEL: Record<UserRole, number> = {
  admin: 100,
  mestre: 50,
  jogador: 10,
};

function readRole(request: NextRequest): UserRole | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(json) as { user?: { role?: UserRole } };
    return data.user?.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1];
  const required = AREA_ROLES[segment];
  if (!required) return NextResponse.next();

  const userRole = readRole(request);
  if (!userRole) {
    const login = new URL("/entrar", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  if (ROLE_LEVEL[userRole] < ROLE_LEVEL[required]) {
    return NextResponse.redirect(new URL(`/${userRole}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/mestre/:path*", "/jogador/:path*"],
};
