import "server-only";

import { getUserById } from "@/lib/auth/user-store";
import type { SessionUser } from "@/lib/auth/types";
import { dbEnabled } from "@/lib/db/enabled";
import { ensureUserFromClerk, fetchUserByClerkId, fetchUserById } from "@/lib/db/users";

/** Garante linha em `eldarin_users` para o usuário da sessão (resolve ids `clerk-*`). */
export async function materializeSessionUser(user: SessionUser): Promise<SessionUser> {
  if (user.id.startsWith("usr_")) {
    try {
      const row = await fetchUserById(user.id);
      if (row) return { ...row, clerkId: user.clerkId ?? row.clerkId ?? null };
    } catch (err) {
      console.error("[materializeSessionUser] fetchUserById failed:", err);
    }

    const local = await getUserById(user.id);
    if (local) return { ...local, clerkId: user.clerkId ?? local.clerkId ?? null };

    if (!dbEnabled()) return user;
  }

  const clerkId =
    user.clerkId?.trim() ||
    (user.id.startsWith("clerk-") ? user.id.slice("clerk-".length) : null);
  if (!clerkId) {
    if (!dbEnabled()) return user;
    throw new Error("Conta não encontrada — saia e entre de novo");
  }

  try {
    const existing = await fetchUserByClerkId(clerkId);
    if (existing) {
      const row = await fetchUserById(existing.id);
      if (row) return { ...row, clerkId };
    }

    return await ensureUserFromClerk({
      clerkId,
      email: user.email,
      name: user.name,
      oauthAvatarUrl: user.oauthAvatarUrl ?? null,
    });
  } catch (err) {
    console.error("[materializeSessionUser] clerk sync failed:", err);
    if (!dbEnabled()) return user;
    throw err;
  }
}
