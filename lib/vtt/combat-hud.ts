import { isAllyToken } from "@/lib/combat/ability";
import { isMonsterToken } from "@/lib/room/settings";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";
import { hpRatio } from "@/lib/vtt/token-hp-display";

export type MiniHudMode = "full" | "damage" | "none";

/** Dano acumulado no monstro (PV máx − atual), sem revelar vida restante. */
export function monsterDamageTaken(token: BattleToken): number {
  if (token.vidaMax == null || token.vidaMax <= 0) return 0;
  const current = token.vida ?? token.vidaMax;
  return Math.max(0, token.vidaMax - current);
}

export function turnOrderHint(
  combat: CombatTrack | null | undefined,
  tokenId: string
): { label: string; isActive: boolean } | null {
  if (!combat?.order?.length) return null;
  const idx = combat.order.indexOf(tokenId);
  if (idx < 0) return null;
  const active = activeTokenId(combat);
  if (tokenId === active) {
    return { label: "Turno agora", isActive: true };
  }
  return { label: `${idx + 1}º na ordem`, isActive: false };
}

export function miniHudModeForViewer(
  hovered: BattleToken,
  opts: {
    isGm: boolean;
    viewerToken: BattleToken | null;
  }
): MiniHudMode {
  if (opts.isGm) return "full";
  const viewer = opts.viewerToken;
  if (!viewer) return "none";
  if (viewer.id === hovered.id) return "full";
  if (isAllyToken(viewer, hovered)) return "full";
  if (isMonsterToken(hovered) || hovered.monsterEntryId || hovered.gmCreationId) {
    return "damage";
  }
  return "none";
}

export function hpBarPercent(token: BattleToken): number {
  return Math.round(hpRatio(token) * 100);
}
