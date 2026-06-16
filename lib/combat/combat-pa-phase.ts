import type { CombatTrack } from "@/lib/room/combat";
import type { RoomSettings } from "@/lib/room/settings";

/**
 * Fase da economia de PA na mesa.
 * - exploration: PA só visual, ações não debitam
 * - combat_free: combate ON, todos gastam PA, sem fila de turno
 * - combat_turn: combate ON + iniciativa, só o ativo age por vez
 */
export type CombatPaPhase = "exploration" | "combat_free" | "combat_turn";

export function resolveCombatPaPhase(
  settings: Pick<RoomSettings, "combatActive">,
  combat?: CombatTrack | null
): CombatPaPhase {
  if (!settings.combatActive) return "exploration";
  if (!combat?.order?.length) return "combat_free";
  return "combat_turn";
}

export function phaseHasRealPaSpend(phase: CombatPaPhase): boolean {
  return phase !== "exploration";
}

export function phaseHasTurnOrder(phase: CombatPaPhase): boolean {
  return phase === "combat_turn";
}
