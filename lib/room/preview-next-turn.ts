import { normalizeCombatTrack, type CombatTrack } from "@/lib/room/combat";
import { isTokenDefeated } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";

function shouldSkipTurn(token: BattleToken | undefined): boolean {
  if (!token) return true;
  if (isTokenDefeated(token)) return true;
  if (token.conditions?.includes("atordoado")) return true;
  return false;
}

/** Preview local ao passar turno — reconcilia quando o POST voltar. */
export function previewNextTurn(combat: CombatTrack, tokens: BattleToken[]): CombatTrack {
  const track = normalizeCombatTrack(combat, tokens);
  if (!track.order.length) return track;

  let activeIndex = track.activeIndex;
  let round = track.round;
  const maxSteps = track.order.length + 2;

  for (let step = 0; step < maxSteps; step++) {
    activeIndex += 1;
    if (activeIndex >= track.order.length) {
      activeIndex = 0;
      round += 1;
    }
    const tokenId = track.order[activeIndex];
    const token = tokens.find((t) => t.id === tokenId);
    if (shouldSkipTurn(token)) continue;
    return { ...track, activeIndex, round, notices: [] };
  }

  return track;
}
