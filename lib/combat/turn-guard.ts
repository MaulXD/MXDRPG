import type { CombatTrack } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";

export const TURN_WAIT_MSG = "Aguarde seu turno na iniciativa";

export function combatHasInitiative(combat?: CombatTrack | null): boolean {
  return Boolean(combat?.order?.length);
}

/**
 * Bypass de ações fora do turno — desativado.
 * Gerenciar turnos (rolar iniciativa, passar, reordenar) usa `canAdvanceCombatTurn`, não este flag.
 */
export function gmBypassAppliesToToken(_token: BattleToken, _canBypass: boolean): boolean {
  return false;
}

/** Sempre falso: PCs e monstros só executam ações (mover, atacar, magia) na sua vez. */
export function effectiveBypassTurn(_token: BattleToken, _canBypass: boolean): boolean {
  return false;
}

export function canActOnCombatTurn(
  tokenId: string,
  opts: {
    combat?: CombatTrack | null;
    activeTokenId?: string | null;
    bypassTurn?: boolean;
    combatHasOrder?: boolean;
  }
): boolean {
  if (opts.bypassTurn) return true;

  const hasOrder = opts.combatHasOrder ?? combatHasInitiative(opts.combat);
  if (!hasOrder) return true;

  if (!opts.activeTokenId) return false;
  return opts.activeTokenId === tokenId;
}
