import { paMaxForActor } from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import { defaultMovementFields } from "@/lib/vtt/movement";
import { creatureSizeOf } from "@/lib/vtt/creature-size";
import { collectPlayerActorIds, playerColorForActor } from "@/lib/vtt/token-colors";
import {
  resolveLinkedTokenImageFocus,
  resolveLinkedTokenImageUrl,
} from "@/lib/room/portrait-sync";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import type { RoomActor } from "./types";

/** Foundry: token linkado herda stats + imagem do Actor */
export function syncLinkedTokens(
  scene: BattleScene,
  actors: Record<string, RoomActor>,
  opts?: { preserveCombatPa?: boolean; explorationDisplay?: boolean }
): BattleScene {
  const playerIds = collectPlayerActorIds(scene.tokens);

  const tokens: BattleToken[] = scene.tokens.map((token) => {
    if (!token.linked || !token.actorId) return token;
    const actor = actors[token.actorId];
    if (!actor) return token;

    const focus = resolveLinkedTokenImageFocus(actor);
    const playerColor = playerColorForActor(token.actorId, playerIds);
    const paMax = paMaxForActor(actor);
    const levelChanged =
      typeof token.nivel === "number" && token.nivel !== actor.identity.nivel;
    const paSource =
      opts?.preserveCombatPa && typeof token.pa === "number"
        ? token.pa
        : opts?.explorationDisplay
          ? paMax
          : levelChanged
            ? paMax
            : typeof token.pa === "number"
              ? token.pa
              : paMax;
    const paFields = normalizeTokenPaFields(
      {
        ...token,
        pa: paSource,
        bankedPa: opts?.explorationDisplay
          ? 0
          : opts?.preserveCombatPa
            ? (token.bankedPa ?? 0)
            : (token.bankedPa ?? 0),
        paSpentThisTurn: opts?.explorationDisplay ? 0 : (token.paSpentThisTurn ?? 0),
        paMax,
      },
      paMax
    );

    return {
      ...token,
      name: actor.name,
      color: playerColor,
      walk: actor.movement.walk,
      run: actor.movement.run,
      ...paFields,
      nivel: actor.identity.nivel,
      vida: actor.resources.vida.value,
      vidaMax: actor.resources.vida.max,
      vidaTemp: actor.resources.vida.temp,
      defesa: actor.tactical.defesa,
      defesaBonus: token.defesaBonus,
      defesaBuffSource: token.defesaBuffSource,
      chargeReady: token.chargeReady,
      chargeNote: token.chargeNote,
      attackMark: token.attackMark,
      nextAttackBonus: token.nextAttackBonus,
      allyAttackAdvantage: token.allyAttackAdvantage,
      reactionShiftReady: token.reactionShiftReady,
      bonusDamageFormula: token.bonusDamageFormula,
      rangedAttackAdvantage: token.rangedAttackAdvantage,
      weakened: token.weakened,
      nameplateMode: token.nameplateMode,
      conditions: token.conditions,
      timedEffects: token.timedEffects,
      imageUrl: resolveLinkedTokenImageUrl(token, actor),
      imageFocus: focus,
      movementWalkMax: actor.movement.walk,
      movementRunMax: actor.movement.run,
      movementSpentCells: token.movementSpentCells ?? 0,
      creatureSize: creatureSizeOf(token, actor.identity.raca),
    };
  });

  return { ...scene, tokens: tokens.map(ensureMovementFields) };
}

function ensureMovementFields(token: BattleToken): BattleToken {
  const walk = Number.isFinite(token.walk) ? token.walk : (token.movementWalkMax ?? 4);
  const run = Number.isFinite(token.run) ? token.run : (token.movementRunMax ?? 6);
  if (
    token.movementWalkMax != null &&
    token.movementSpentCells != null &&
    Number.isFinite(token.walk) &&
    Number.isFinite(token.run)
  ) {
    return token;
  }
  return {
    ...token,
    walk,
    run,
    ...defaultMovementFields({ walk, run }),
  };
}
