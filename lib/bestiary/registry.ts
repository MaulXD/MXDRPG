import type { PlayerBestiaryEntry } from "@/lib/bestiary/types";

export type BestiaryStoreKey = `${string}:${string}:${string}`;

export function bestiaryStoreKey(
  userId: string,
  adventureId: string,
  typeKey: string
): BestiaryStoreKey {
  return `${userId}:${adventureId}:${typeKey}`;
}

declare global {
  // eslint-disable-next-line no-var
  var __eldarinPlayerBestiary: Map<BestiaryStoreKey, PlayerBestiaryEntry> | undefined;
}

export function bestiaryStore(): Map<BestiaryStoreKey, PlayerBestiaryEntry> {
  if (!globalThis.__eldarinPlayerBestiary) {
    globalThis.__eldarinPlayerBestiary = new Map();
  }
  return globalThis.__eldarinPlayerBestiary;
}

export function getBestiaryEntry(
  userId: string,
  adventureId: string,
  typeKey: string
): PlayerBestiaryEntry | null {
  return bestiaryStore().get(bestiaryStoreKey(userId, adventureId, typeKey)) ?? null;
}

export function setBestiaryEntry(entry: PlayerBestiaryEntry, userId: string, adventureId: string): void {
  bestiaryStore().set(bestiaryStoreKey(userId, adventureId, entry.typeKey), entry);
}

export function listBestiaryEntriesForUser(
  userId: string,
  adventureId: string
): PlayerBestiaryEntry[] {
  const prefix = `${userId}:${adventureId}:`;
  const out: PlayerBestiaryEntry[] = [];
  for (const [key, entry] of bestiaryStore()) {
    if (key.startsWith(prefix)) out.push(entry);
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}
