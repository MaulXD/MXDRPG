import "server-only";

import type { SessionUser } from "@/lib/auth/types";
import { fetchClerkIdForUser, fetchUserByClerkId } from "@/lib/db/users";
import { materializeSessionUser, safeMaterializeSessionUser } from "@/lib/auth/session-user";

export type CharacterAccount = {
  /** ID estável em `eldarin_users` (ou legado se DB indisponível). */
  canonicalId: string;
  /** IDs para buscar fichas (canônico + aliases `clerk-*`). */
  queryIds: string[];
  clerkId: string | null;
};

function clerkAlias(clerkId: string | null | undefined): string | null {
  const id = clerkId?.trim();
  return id ? `clerk-${id}` : null;
}

/** Resolve conta + aliases para dono de ficha. */
export async function resolveCharacterAccount(
  userId: string,
  clerkId?: string | null
): Promise<CharacterAccount> {
  let canonicalId = userId;
  let resolvedClerk = clerkId?.trim() || null;

  if (userId.startsWith("clerk-")) {
    const fromClerk = userId.slice("clerk-".length);
    resolvedClerk = resolvedClerk ?? fromClerk;
    const row = await fetchUserByClerkId(fromClerk);
    if (row) canonicalId = row.id;
  } else if (!resolvedClerk) {
    resolvedClerk = await fetchClerkIdForUser(userId);
  }

  const queryIds = new Set<string>([canonicalId, userId]);
  const alias = clerkAlias(resolvedClerk);
  if (alias) queryIds.add(alias);

  return {
    canonicalId,
    queryIds: [...queryIds],
    clerkId: resolvedClerk,
  };
}

/** Garante usuário materializado no Postgres e retorna conta para fichas. */
export async function resolveSessionCharacterAccount(
  user: SessionUser
): Promise<CharacterAccount> {
  const materialized = await materializeSessionUser(user);
  return resolveCharacterAccount(materialized.id, materialized.clerkId ?? user.clerkId);
}

/** SSR — não derruba render se MariaDB/OAuth falhar. */
export async function resolveSessionCharacterAccountSafe(
  user: SessionUser
): Promise<CharacterAccount> {
  const materialized = await safeMaterializeSessionUser(user);
  return resolveCharacterAccount(materialized.id, materialized.clerkId ?? user.clerkId);
}

/** Ficha pertence à conta (canônico ou alias legado). */
export function characterOwnedByAccount(
  sheet: { ownerId: string },
  account: CharacterAccount
): boolean {
  return account.queryIds.includes(sheet.ownerId);
}

export { characterOwnedBySessionUser } from "@/lib/auth/account-ownership";
