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

function withMesaWatchCookie(request: NextRequest): NextResponse {
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
