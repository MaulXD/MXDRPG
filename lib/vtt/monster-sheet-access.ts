import { isMonsterToken } from "@/lib/room/settings";
import type { RoomActor } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export type MonsterSheetOpenTarget =
  | { kind: "compendium"; entryId: string }
  | { kind: "actor"; actorId: string };

/** Resolve como abrir a ficha de um token (PC vinculado ou monstro do compêndio). */
export function resolveMonsterSheetOpenTarget(
  token: BattleToken
): MonsterSheetOpenTarget | null {
  if (token.linked && token.actorId) {
    return { kind: "actor", actorId: token.actorId };
  }
  if (isMonsterToken(token) && token.monsterEntryId) {
    return { kind: "compendium", entryId: token.monsterEntryId };
  }
  return null;
}

export function canShowMonsterSheetButton(token: BattleToken): boolean {
  return resolveMonsterSheetOpenTarget(token) != null;
}

/** Ficha no action ring: mestre vê qualquer token abrível; jogador só a própria. */
export function canShowSheetInActionRing(
  token: BattleToken,
  opts: {
    isRoomGm: boolean;
    userId?: string | null;
    roomActors: Record<string, RoomActor>;
  }
): boolean {
  const target = resolveMonsterSheetOpenTarget(token);
  if (!target) return false;
  if (opts.isRoomGm) return true;
  if (!opts.userId) return false;
  if (target.kind === "actor") {
    return opts.roomActors[target.actorId]?.ownerId === opts.userId;
  }
  return false;
}
