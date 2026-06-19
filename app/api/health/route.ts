import { NextResponse } from "next/server";
import { getAuthCapabilities } from "@/lib/auth/auth-capabilities";
import { hasClerkPublishableKey, isClerkEnabled } from "@/lib/auth/clerk-config";
import {
  isDiscordOAuthConfigured,
  isGoogleOAuthConfigured,
  authAppOrigin,
  oauthSetupStatus,
} from "@/lib/auth/oauth-config";
import { dbEnabled, dbPing } from "@/lib/db/client";
import { persistenceLabel } from "@/lib/db/dialect";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";

export async function GET() {
  const hasUrl = dbEnabled();
  if (hasUrl) {
    try {
      await ensureDbMigrations();
    } catch {
      /* ping below may still report error */
    }
  }
  const ping = hasUrl ? await dbPing() : { ok: false as const, error: "DATABASE_URL not set" };
  const db = ping.ok;
  const clerkPublishable = hasClerkPublishableKey();
  const clerk = isClerkEnabled();
  const auth = getAuthCapabilities();
  const oauthStatus = oauthSetupStatus();

  const body: Record<string, unknown> = {
    ok: true,
    app: "eldarin-rpg",
    buildSha: process.env.BUILD_SHA?.trim() || null,
    deployHint:
      process.env.BUILD_SHA?.trim() ?
        null
      : "Imagem antiga — atualize o deployment para ghcr.io/maulxd/mxdrpg:sha-<commit>",
    db,
    persistence: hasUrl ? persistenceLabel() : "memory",
    authOrigin: (() => {
      try {
        return authAppOrigin();
      } catch {
        return null;
      }
    })(),
    clerk: {
      publishableKey: clerkPublishable,
      secretKey: Boolean(process.env.CLERK_SECRET_KEY?.trim()),
      ready: clerk,
    },
    oauth: {
      google: isGoogleOAuthConfigured(),
      discord: isDiscordOAuthConfigured(),
      ready: oauthStatus.ready,
      providers: oauthStatus.providers,
      ...(oauthStatus.missing.length > 0 ? { missing: oauthStatus.missing } : {}),
    },
    auth: {
      emailLogin: auth.emailLogin,
      persistentAccounts: db,
      demoAccounts: auth.emailLogin,
    },
  };

  if (hasUrl && !db && ping.error) {
    body.dbError = ping.error;
  }

  return NextResponse.json(body);
}
