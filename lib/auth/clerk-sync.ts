import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import type { SessionUser } from "@/lib/auth/types";
import { ensureUserFromClerk } from "@/lib/db/users";

export async function resolveClerkSessionUser(): Promise<SessionUser | null> {
  if (!isClerkEnabled()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const cu = await currentUser();
  if (!cu) return null;

  const email =
    cu.primaryEmailAddress?.emailAddress ??
    cu.emailAddresses[0]?.emailAddress ??
    `${userId}@users.clerk.local`;

  const name =
    [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() ||
    cu.username ||
    email.split("@")[0] ||
    "Jogador";

  const profile = {
    clerkId: userId,
    email,
    name: name.slice(0, 80),
    oauthAvatarUrl: cu.imageUrl ?? null,
  };

  try {
    return await ensureUserFromClerk(profile);
  } catch (err) {
    console.error("[clerk-sync] ensureUserFromClerk failed, using ephemeral session:", err);
    return {
      id: `clerk-${userId}`,
      email,
      name: name.slice(0, 80),
      nickname: null,
      role: "member" as const,
      clerkId: userId,
      oauthAvatarUrl: cu.imageUrl ?? null,
    };
  }
}
