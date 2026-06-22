import type { CombatTurnOptions } from "@/lib/combat/types";
import { activeTokenId, type CombatTrack } from "@/lib/room/combat";
import { resolveLivingActiveTokenId } from "@/lib/room/combat-order";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

/** Mesmo critério do cliente (`useCombatTurn`) — ignora mortos/atordoados na fila. */
export function effectiveCombatActiveTokenId(
  combat: CombatTrack,
  tokens: BattleToken[]
): string | null {
  if (!combat?.order?.length) return null;
  return resolveLivingActiveTokenId(combat, tokens) ?? activeTokenId(combat);
}

export function combatTurnOptionsFromRoom(
  room: RoomState,
  opts?: { bypassTurn?: boolean }
): CombatTurnOptions {
  return {
    activeTokenId: effectiveCombatActiveTokenId(room.combat, room.scene.tokens),
    bypassTurn: opts?.bypassTurn,
    combatRound: room.combat.round,
    combatHasOrder: Boolean(room.combat?.order?.length),
    combatActive: room.settings.combatActive,
  };
}
