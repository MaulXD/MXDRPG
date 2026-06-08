import { isAllyToken } from "@/lib/combat/ability";
import { isMonsterToken } from "@/lib/room/settings";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";
import type { BattleToken } from "@/lib/vtt/types";
import { hpRatio } from "@/lib/vtt/token-hp-display";

export type MiniHudMode = "full" | "obscured" | "name";

const OBSCURED_HP_COLOR = "#8b5cf6";

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

function isHostileCreature(token: BattleToken): boolean {
  return isMonsterToken(token) || Boolean(token.monsterEntryId || token.gmCreationId);
}

export function obscuredHpBarColor(): string {
  return OBSCURED_HP_COLOR;
}

export function miniHudModeForViewer(
  hovered: BattleToken,
  opts: {
    isGm: boolean;
    viewerToken: BattleToken | null;
    showMonsterHpToPlayers?: boolean;
  }
): MiniHudMode {
  const showMonsterHp = opts.showMonsterHpToPlayers ?? false;

  if (opts.isGm) {
    return hovered.vidaMax != null && hovered.vida != null ? "full" : "name";
  }

  const viewer = opts.viewerToken;
  if (viewer && (viewer.id === hovered.id || isAllyToken(viewer, hovered))) {
    return hovered.vidaMax != null ? "full" : "name";
  }

  if (isHostileCreature(hovered)) {
    if (showMonsterHp && hovered.vidaMax != null) return "full";
    return "obscured";
  }

  return "name";
}

export function hpBarPercent(token: BattleToken): number {
  return Math.round(hpRatio(token) * 100);
}
