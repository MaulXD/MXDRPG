import type { Adventure } from "./types";

/** Prazo para o mestre restaurar uma mesa excluída. */
export const ADVENTURE_RESTORE_MS = 30 * 24 * 60 * 60 * 1000;

export function isAdventureDeleted(adv: Adventure): boolean {
  return typeof adv.deletedAt === "number" && adv.deletedAt > 0;
}

export function canRestoreAdventure(adv: Adventure, now = Date.now()): boolean {
  if (!isAdventureDeleted(adv) || adv.deletedAt == null) return false;
  return now - adv.deletedAt < ADVENTURE_RESTORE_MS;
}

export function adventureRestoreDeadline(adv: Adventure): number | null {
  if (!isAdventureDeleted(adv) || adv.deletedAt == null) return null;
  return adv.deletedAt + ADVENTURE_RESTORE_MS;
}

export function isAdventureJoinable(adv: Adventure, now = Date.now()): boolean {
  if (!isAdventureDeleted(adv)) return true;
  return false;
}

export function shouldPurgeAdventure(adv: Adventure, now = Date.now()): boolean {
  if (!isAdventureDeleted(adv) || adv.deletedAt == null) return false;
  return now - adv.deletedAt >= ADVENTURE_RESTORE_MS;
}
