import { paTurnRulesForActor } from "@/lib/combat/pa-economy";
import { isExplorationMode } from "@/lib/combat/mesa-mode";
import type { RoomSettings } from "@/lib/room/settings";
import type { CombatTrack } from "@/lib/room/combat";
import type { CharacterSheet } from "@/lib/character/types";
import type { MovePaOptions } from "@/lib/vtt/movement";

/** Opções de PA de movimento alinhadas ao servidor (`moveRoomToken`). */
export function movementPaOptsForRoom(
  settings: Pick<RoomSettings, "combatActive">,
  combat: CombatTrack | null | undefined,
  actor: CharacterSheet | null,
  bypassTurn?: boolean
): MovePaOptions {
  if (isExplorationMode(settings, combat)) {
    return { gmBypass: true, freeBasicMovePa: true };
  }
  return {
    ...(actor ? { freeBasicMovePa: paTurnRulesForActor(actor).freeBasicMovePa } : {}),
    ...(bypassTurn ? { gmBypass: true as const } : {}),
  };
}
