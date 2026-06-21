import {
  paTurnRulesForActor,
  paTurnRulesForMonster,
  type PaTurnRules,
} from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import { bankPaAtEndOfTurn, refreshPaAtTurnStart } from "@/lib/combat/pa-turn";
import { activeTokenId, normalizeCombatTrack, type CombatTrack } from "@/lib/room/combat";
import type { RoomActor } from "@/lib/room/types";
import { isTokenDefeated } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";

function shouldSkipTurn(token: BattleToken | undefined): boolean {
  if (!token) return true;
  if (isTokenDefeated(token)) return true;
  if (token.conditions?.includes("atordoado")) return true;
  return false;
}

function paRulesForToken(
  token: BattleToken,
  actors: Record<string, RoomActor>
): PaTurnRules {
  if (token.linked && token.actorId && actors[token.actorId]) {
    return paTurnRulesForActor(actors[token.actorId]);
  }
  return paTurnRulesForMonster(token.monsterTier);
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
    return {
      ...track,
      activeIndex,
      round,
      notices: [],
      paRefreshTurnKey: undefined,
      pendingAutoPass: undefined,
    };
  }

  return track;
}

/** Preview otimista de passar turno — banca PA do ativo e restaura o próximo. */
export function previewPassTurn(
  combat: CombatTrack,
  tokens: BattleToken[],
  actors: Record<string, RoomActor>
): { combat: CombatTrack; tokens: BattleToken[] } {
  const nextCombat = previewNextTurn(combat, tokens);
  const endingId = activeTokenId(combat);
  const nextActiveId = activeTokenId(nextCombat);
  if (!endingId || !nextActiveId) {
    return { combat: nextCombat, tokens };
  }

  const nextTokens = tokens.map((token) => {
    if (token.id === endingId) {
      const rules = paRulesForToken(token, actors);
      const banked = bankPaAtEndOfTurn(token, rules);
      return {
        ...token,
        ...normalizeTokenPaFields(banked, rules.recoveryPerTurn, rules.accumulationCap),
      };
    }
    if (token.id === nextActiveId) {
      const rules = paRulesForToken(token, actors);
      const refreshed = refreshPaAtTurnStart(token, rules);
      return {
        ...token,
        ...normalizeTokenPaFields(refreshed, rules.recoveryPerTurn, rules.accumulationCap),
      };
    }
    return token;
  });

  return { combat: nextCombat, tokens: nextTokens };
}
