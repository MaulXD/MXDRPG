import { syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import { isExplorationMode } from "@/lib/combat/mesa-mode";
import {
  paTurnRulesForActor,
  paTurnRulesForMonster,
  type PaTurnRules,
} from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import { clearCombatPaPool } from "@/lib/combat/pa-turn";
import type { RoomActor, RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export function paTurnRulesForRoomToken(
  room: RoomState,
  token: BattleToken
): PaTurnRules {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paTurnRulesForActor(room.actors[token.actorId]);
  }
  return paTurnRulesForMonster(token.monsterTier);
}

/** PA exibidos em exploração — recuperação padrão, sem gasto real. */
export function explorationPaForToken(room: RoomState, token: BattleToken): number {
  return paTurnRulesForRoomToken(room, token).recoveryPerTurn;
}

/** Token com PA “cravados” para modo aventura (sem bank, sem gasto no turno). */
export function applyExplorationPaDisplayToToken(
  room: RoomState,
  token: BattleToken
): BattleToken {
  // O Um Anel não tem economia de PA — token.pa/paMax ficam numa constante alta fixa
  // (TOR_TOKEN_PA, ver lib/vtt/tor-player-token.ts) só pra não travar checkCanSpendPa.
  // Sobrescrever aqui com regras de recuperação de PA do Eldarin quebraria essa garantia.
  if (token.torCombat) return token;
  const rules = paTurnRulesForRoomToken(room, token);
  const cleared = clearCombatPaPool(token);
  return {
    ...cleared,
    ...normalizeTokenPaFields(
      {
        ...cleared,
        pa: rules.recoveryPerTurn,
        paMax: rules.recoveryPerTurn,
      },
      rules.recoveryPerTurn,
      rules.accumulationCap
    ),
  };
}

/** Preview client-side ao ligar modo aventura (antes do POST). */
export function previewExplorationPaTokens(
  tokens: BattleToken[],
  actors: Record<string, RoomActor>
): BattleToken[] {
  return tokens.map((token) => {
    if (token.torCombat) return token;
    const rules =
      token.linked && token.actorId && actors[token.actorId]
        ? paTurnRulesForActor(actors[token.actorId])
        : paTurnRulesForMonster(token.monsterTier);
    const cleared = clearCombatPaPool(token);
    return {
      ...cleared,
      ...normalizeTokenPaFields(
        {
          ...cleared,
          pa: rules.recoveryPerTurn,
          paMax: rules.recoveryPerTurn,
        },
        rules.recoveryPerTurn,
        rules.accumulationCap
      ),
    };
  });
}

/** Normaliza todos os tokens para PA de exploração e sincroniza fichas linkadas. */
export function applyExplorationPaDisplay(room: RoomState): void {
  if (!isExplorationMode(room.settings, room.combat)) return;

  const tokens = room.scene.tokens.map((t) => applyExplorationPaDisplayToToken(room, t));
  room.scene = { ...room.scene, tokens };

  for (const token of tokens) {
    syncActorPaFromToken(room, token);
  }
}
