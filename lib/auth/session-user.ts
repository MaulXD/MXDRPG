import "server-only";

import type { SessionUser } from "@/lib/auth/types";
import { ensureUserFromClerk, fetchUserByClerkId, fetchUserById } from "@/lib/db/users";

/** Garante linha em `eldarin_users` para o usuário da sessão (resolve ids `clerk-*`). */
export async function materializeSessionUser(user: SessionUser): Promise<SessionUser> {
  if (user.id.startsWith("usr_")) {
    const row = await fetchUserById(user.id);
    if (row) return { ...row, clerkId: user.clerkId ?? row.clerkId ?? null };
  }

  const clerkId =
    user.clerkId?.trim() ||
    (user.id.startsWith("clerk-") ? user.id.slice("clerk-".length) : null);
  if (!clerkId) {
    throw new Error("Conta não encontrada — saia e entre de novo");
  }

  const existing = await fetchUserByClerkId(clerkId);
  if (existing) {
    const row = await fetchUserById(existing.id);
    if (row) return { ...row, clerkId };
  }

  return ensureUserFromClerk({
    clerkId,
    email: user.email,
    name: user.name,
    oauthAvatarUrl: user.oauthAvatarUrl ?? null,
  });
}
