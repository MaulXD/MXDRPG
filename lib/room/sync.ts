import { getCharacter } from "@/lib/character/demo-characters";
import { normalizeCharacter } from "@/lib/character/normalize";
import { paMaxForActor } from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import { defaultMovementFields } from "@/lib/vtt/movement";
import { creatureSizeOf } from "@/lib/vtt/creature-size";
import { collectPlayerActorIds, playerColorForActor } from "@/lib/vtt/token-colors";
import {
  resolveLinkedTokenImageFocus,
  resolveLinkedTokenImageUrl,
} from "@/lib/room/portrait-sync";
import { DEMO_SCENE } from "@/lib/vtt/demo-scene";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import { emptyCombat } from "./combat";
import { welcomeChat } from "./chat";
import { initCombatPaForRoom } from "./handlers/combat-turn";
import { DEFAULT_ROOM_SETTINGS } from "./settings";
import type { RoomActor, RoomState } from "./types";

/** Foundry: token linkado herda stats + imagem do Actor */
export function syncLinkedTokens(
  scene: BattleScene,
  actors: Record<string, RoomActor>,
  opts?: { preserveCombatPa?: boolean }
): BattleScene {
  const playerIds = collectPlayerActorIds(scene.tokens);

  const tokens: BattleToken[] = scene.tokens.map((token) => {
    if (!token.linked || !token.actorId) return token;
    const actor = actors[token.actorId];
    if (!actor) return token;

    const focus = resolveLinkedTokenImageFocus(actor);
    const playerColor = playerColorForActor(token.actorId, playerIds);
    const paMax = paMaxForActor(actor);
    const paSource =
      opts?.preserveCombatPa && typeof token.pa === "number"
        ? token.pa
        : typeof token.pa === "number"
          ? token.pa
          : 0;
    const paFields = normalizeTokenPaFields(
      {
        ...token,
        pa: paSource,
        bankedPa: opts?.preserveCombatPa ? (token.bankedPa ?? 0) : (token.bankedPa ?? 0),
        paSpentThisTurn: token.paSpentThisTurn ?? 0,
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
      movementSpentHex: token.movementSpentHex ?? 0,
      creatureSize: creatureSizeOf(token, actor.identity.raca),
    };
  });

  return { ...scene, tokens: tokens.map(ensureMovementFields) };
}

function ensureMovementFields(token: BattleToken): BattleToken {
  if (token.movementWalkMax != null && token.movementSpentHex != null) return token;
  return { ...token, ...defaultMovementFields(token) };
}

export function createDemoRoom(): RoomState {
  const thrain = getCharacter("pc-thrain-ferroescudo");
  const lyanna = getCharacter("pc-lyanna-umbral");
  const maelis = getCharacter("pc-maelis-purificador");
  const pippin = getCharacter("pc-pippin-sussurro");
  if (!thrain || !lyanna || !maelis || !pippin) throw new Error("Demo character missing");

  const actors: Record<string, RoomActor> = {
    [thrain.id]: { ...normalizeCharacter(thrain), revision: 1 },
    [lyanna.id]: { ...normalizeCharacter(lyanna), revision: 1 },
    [maelis.id]: { ...normalizeCharacter(maelis), revision: 1 },
    [pippin.id]: { ...normalizeCharacter(pippin), revision: 1 },
  };

  const scene = syncLinkedTokens(DEMO_SCENE, actors);

  const room: RoomState = {
    roomId: "demo",
    adventureId: "demo",
    ownerId: "usr_demo_mestre",
    name: "Mesa demonstração",
    inviteCode: "DEMOELDR",
    memberIds: [],
    settings: { ...DEFAULT_ROOM_SETTINGS },
    scene,
    actors,
    combat: emptyCombat(scene.tokens),
    chat: [welcomeChat()],
    pings: [],
    revision: 1,
    updatedAt: Date.now(),
  };

  initCombatPaForRoom(room);
  return room;
}
