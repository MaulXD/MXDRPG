import { paMaxForActor } from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import { materializeCombatPa } from "@/lib/combat/pa-turn";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export function paMaxForCombatToken(room: RoomState, token: BattleToken): number {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paMaxForActor(room.actors[token.actorId]);
  }
  return token.paMax;
}

/** Pool + guardados prontos para validar/gastar PA em combate. */
export function prepareCombatToken(room: RoomState, token: BattleToken): BattleToken {
  const paMax = paMaxForCombatToken(room, token);
  const prepared = materializeCombatPa(token, paMax);
  return { ...token, ...normalizeTokenPaFields(prepared, paMax) };
}

export function syncActorPaFromToken(room: RoomState, token: BattleToken): void {
  if (!token.linked || !token.actorId || !room.actors[token.actorId]) return;
  const a = room.actors[token.actorId];
  room.actors[token.actorId] = {
    ...a,
    resources: {
      ...a.resources,
      pontosAcao: {
        value: token.pa,
        max: token.paMax,
      },
    },
    revision: a.revision + 1,
  };
}
