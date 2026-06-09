import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import type { SessionUser } from "@/lib/auth/types";
import { ensureUserFromClerk } from "@/lib/db/users";

function ephemeralClerkSession(
  userId: string,
  email: string,
  name: string,
  oauthAvatarUrl?: string | null
): SessionUser {
  return {
    id: `clerk-${userId}`,
    email,
    name: name.slice(0, 80),
    nickname: null,
    role: "member",
    clerkId: userId,
    oauthAvatarUrl: oauthAvatarUrl ?? null,
  };
}

export async function resolveClerkSessionUser(): Promise<SessionUser | null> {
  if (!isClerkEnabled()) return null;

  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  let cu = null;
  try {
    cu = await currentUser();
  } catch (err) {
    console.error("[clerk-sync] currentUser failed:", err);
  }

  const claimEmail =
    typeof sessionClaims?.email === "string" ? sessionClaims.email.trim() : "";
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    (claimEmail || `${userId}@users.clerk.local`);

  const claimName =
    typeof sessionClaims?.name === "string" ? sessionClaims.name.trim() : "";
  const name =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ").trim() ||
    cu?.username ||
    claimName ||
    email.split("@")[0] ||
    "Jogador";

  const profile = {
    clerkId: userId,
    email,
    name: name.slice(0, 80),
    oauthAvatarUrl: cu?.imageUrl ?? null,
  };

  try {
    return await ensureUserFromClerk(profile);
  } catch (err) {
    console.error("[clerk-sync] ensureUserFromClerk failed, using ephemeral session:", err);
    return ephemeralClerkSession(userId, email, name, cu?.imageUrl);
  }
}
