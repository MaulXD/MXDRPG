import { getCharacter } from "@/lib/character/characters";
import { normalizeCharacter } from "@/lib/character/normalize";
import { defaultMovementFields } from "@/lib/vtt/movement";
import { collectPlayerActorIds, playerColorForActor } from "@/lib/vtt/token-colors";
import { DEFAULT_PORTRAIT_FOCUS, sanitizePortraitFocus } from "@/lib/media/portrait-focus";
import { DEMO_SCENE } from "@/lib/vtt/demo-scene";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import { emptyCombat } from "./combat";
import { welcomeChat } from "./chat";
import type { RoomActor, RoomState } from "./types";

/** Foundry: token linkado herda stats + imagem do Actor */
export function syncLinkedTokens(scene: BattleScene, actors: Record<string, RoomActor>): BattleScene {
  const playerIds = collectPlayerActorIds(scene.tokens);

  const tokens: BattleToken[] = scene.tokens.map((token) => {
    if (!token.linked || !token.actorId) return token;
    const actor = actors[token.actorId];
    if (!actor) return token;

    const focus = sanitizePortraitFocus(actor.portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS;
    const playerColor = playerColorForActor(token.actorId, playerIds);

    return {
      ...token,
      name: actor.name,
      color: playerColor,
      walk: actor.movement.walk,
      run: actor.movement.run,
      pa: actor.resources.pontosAcao.value,
      paMax: actor.resources.pontosAcao.max,
      nivel: actor.identity.nivel,
      vida: actor.resources.vida.value,
      vidaMax: actor.resources.vida.max,
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
      conditions: token.conditions,
      imageUrl: actor.tokenImageUrl ?? actor.portraitUrl ?? token.imageUrl ?? null,
      imageFocus: focus,
      movementWalkMax: actor.movement.walk,
      movementRunMax: actor.movement.run,
      movementSpentHex: token.movementSpentHex ?? 0,
    };
  });

  return { ...scene, tokens: tokens.map(ensureMovementFields) };
}

function ensureMovementFields(token: BattleToken): BattleToken {
  if (token.movementWalkMax != null && token.movementSpentHex != null) return token;
  return { ...token, ...defaultMovementFields(token) };
}

export function createDemoRoom(): RoomState {
  const aventureiro = getCharacter("pc-aventureiro");
  if (!aventureiro) throw new Error("Demo character missing");

  const actors: Record<string, RoomActor> = {
    [aventureiro.id]: { ...normalizeCharacter(aventureiro), revision: 1 },
  };

  const scene = syncLinkedTokens(DEMO_SCENE, actors);

  return {
    roomId: "demo",
    scene,
    actors,
    combat: emptyCombat(scene.tokens),
    chat: [welcomeChat()],
    revision: 1,
    updatedAt: Date.now(),
  };
}
