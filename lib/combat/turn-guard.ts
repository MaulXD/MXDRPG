import type { CombatTrack } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";

export const TURN_WAIT_MSG = "Aguarde seu turno na iniciativa";

export function combatHasInitiative(combat?: CombatTrack | null): boolean {
  return Boolean(combat?.order?.length);
}

/** GM bypass applies only to non-linked tokens (monsters/NPCs). */
export function gmBypassAppliesToToken(token: BattleToken, canBypass: boolean): boolean {
  if (!canBypass) return false;
  if (token.linked === true) return false;
  return true;
}

export function effectiveBypassTurn(token: BattleToken, canBypass: boolean): boolean {
  return canBypass && gmBypassAppliesToToken(token, canBypass);
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
