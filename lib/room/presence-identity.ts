import "server-only";

import { fetchUserByClerkId } from "@/lib/db/users";

export async function resolveCanonicalPresenceUserId(userId: string): Promise<string> {
  if (!userId) return userId;
  if (userId.startsWith("usr_")) return userId;
  if (userId.startsWith("clerk-")) {
    const stored = await fetchUserByClerkId(userId.slice("clerk-".length));
    if (stored) return stored.id;
  }
  return userId;
}

/** Mescla entradas clerk-* e usr_* do mesmo usuário. */
export async function dedupePresenceByUser(
  raw: { userId: string; displayName: string }[]
): Promise<{ userId: string; displayName: string }[]> {
  const map = new Map<string, { userId: string; displayName: string }>();

  for (const entry of raw) {
    const canonical = await resolveCanonicalPresenceUserId(entry.userId);
    const existing = map.get(canonical);
    if (!existing) {
      map.set(canonical, { userId: canonical, displayName: entry.displayName });
      continue;
    }
    if (entry.userId.startsWith("usr_")) {
      map.set(canonical, { userId: canonical, displayName: entry.displayName });
    }
  }

  return [...map.values()];
}
