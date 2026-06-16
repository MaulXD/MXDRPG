import type { CombatTrack } from "@/lib/room/combat";
import type { RoomSettings } from "@/lib/room/settings";
import {
  phaseHasRealPaSpend,
  phaseHasTurnOrder,
  resolveCombatPaPhase,
  type CombatPaPhase,
} from "@/lib/combat/combat-pa-phase";

/** Modo combate ativo na mesa (mestre liga ao rolar iniciativa ou manualmente). */
export function isCombatModeActive(
  settings: Pick<RoomSettings, "combatActive">,
  _combat?: CombatTrack | null
): boolean {
  return Boolean(settings.combatActive);
}

/** Gastar PA de verdade (combate ligado, com ou sem iniciativa). */
export function requiresCombatPaEconomy(
  settings: Pick<RoomSettings, "combatActive">,
  combat?: CombatTrack | null
): boolean {
  return phaseHasRealPaSpend(resolveCombatPaPhase(settings, combat));
}

/** Respeitar ordem de turno e auto-passe (combate + fila de iniciativa). */
export function requiresCombatTurnEconomy(
  settings: Pick<RoomSettings, "combatActive">,
  combat?: CombatTrack | null
): boolean {
  return phaseHasTurnOrder(resolveCombatPaPhase(settings, combat));
}

/** Exploração: movimento e magias sem PA real (só display). */
export function isExplorationMode(
  settings: Pick<RoomSettings, "combatActive">,
  _combat?: CombatTrack | null
): boolean {
  return resolveCombatPaPhase(settings, _combat) === "exploration";
}

export type { CombatPaPhase };
export { resolveCombatPaPhase, phaseHasRealPaSpend, phaseHasTurnOrder };
