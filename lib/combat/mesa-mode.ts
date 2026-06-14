import type { CombatTrack } from "@/lib/room/combat";
import type { RoomSettings } from "@/lib/room/settings";

/** Modo combate ativo na mesa (mestre liga ao rolar iniciativa ou manualmente). */
export function isCombatModeActive(
  settings: Pick<RoomSettings, "combatActive">,
  combat?: CombatTrack | null
): boolean {
  if (settings.combatActive) return true;
  return Boolean(combat?.order?.length);
}

/** Gastar PA / respeitar ordem de turno. */
export function requiresCombatTurnEconomy(
  settings: Pick<RoomSettings, "combatActive">,
  combat?: CombatTrack | null
): boolean {
  return isCombatModeActive(settings, combat) && Boolean(combat?.order?.length);
}

/** Exploração: movimento e magias sem PA. */
export function isExplorationMode(
  settings: Pick<RoomSettings, "combatActive">,
  combat?: CombatTrack | null
): boolean {
  return !requiresCombatTurnEconomy(settings, combat);
}
