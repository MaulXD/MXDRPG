import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import {
  MESA_WATCH_COOKIE_MAX_AGE,
  mesaWatchCookieName,
  mesaWatchCookiePath,
} from "@/lib/auth/mesa-watch-session";

function applyMesaWatchCookie(request: NextRequest, response: NextResponse): NextResponse {
  const match = request.nextUrl.pathname.match(/^\/mesa\/([^/]+)$/);
  if (!match) return response;

  const roomId = decodeURIComponent(match[1]!);
  const cookieName = mesaWatchCookieName(roomId);
  const cookiePath = mesaWatchCookiePath(roomId);

  if (request.nextUrl.searchParams.get("watch") === "1") {
    response.cookies.set(cookieName, "1", {
      path: cookiePath,
      httpOnly: true,
      sameSite: "lax",
      maxAge: MESA_WATCH_COOKIE_MAX_AGE,
    });
  } else {
    response.cookies.delete({ name: cookieName, path: cookiePath });
  }

  return response;
}

function bareHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/** Redireciona apex ↔ www para o host de AUTH_URL (cookie OAuth é host-specific). */
function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  const raw = process.env.AUTH_URL?.trim();
  if (!raw) return null;

  let canonical: URL;
  try {
    canonical = new URL(raw);
  } catch {
    return null;
  }

  const reqHost = request.nextUrl.host;
  const canonHost = canonical.host;
  if (reqHost.toLowerCase() === canonHost.toLowerCase()) return null;
  if (bareHost(reqHost) !== bareHost(canonHost)) return null;

  const url = request.nextUrl.clone();
  url.protocol = canonical.protocol;
  url.host = canonical.host;
  return NextResponse.redirect(url, 308);
}

function withMesaWatchCookie(request: NextRequest): NextResponse {
  const canon = canonicalHostRedirect(request);
  if (canon) return applyMesaWatchCookie(request, canon);
  return applyMesaWatchCookie(request, NextResponse.next());
}

/** Só ativa clerkMiddleware com pk + sk — evita 500 se só uma chave existir no servidor. */
export default isClerkEnabled()
  ? clerkMiddleware((_auth, request) => withMesaWatchCookie(request))
  : withMesaWatchCookie;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
