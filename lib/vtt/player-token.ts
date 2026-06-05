import { paMaxForActor } from "@/lib/combat/pa-economy";
import type { RoomActor } from "@/lib/room/types";
import type { Axial } from "@/lib/vtt/hex-math";
import { defaultMovementFields } from "@/lib/vtt/movement";
import { creatureSizeOf } from "@/lib/vtt/creature-size";
import { playerColorForActor } from "@/lib/vtt/token-colors";
import { DEFAULT_PORTRAIT_FOCUS, sanitizePortraitFocus } from "@/lib/media/portrait-focus";
import type { BattleToken } from "@/lib/vtt/types";

export function createPlayerTokenFromActor(
  actor: RoomActor,
  axial: Axial,
  tokenId?: string
): BattleToken {
  const id = tokenId ?? `tk-${actor.id}`;
  const paMax = paMaxForActor(actor);
  const pa = Math.min(paMax, Math.max(0, actor.resources.pontosAcao.value));
  const focus = sanitizePortraitFocus(actor.portraitFocus) ?? DEFAULT_PORTRAIT_FOCUS;

  return {
    id,
    name: actor.name,
    axial,
    color: playerColorForActor(actor.id, [actor.id]),
    walk: actor.movement.walk,
    run: actor.movement.run,
    pa,
    paMax,
    bankedPa: 0,
    paSpentThisTurn: 0,
    ownerRole: "jogador",
    actorId: actor.id,
    linked: true,
    nivel: actor.identity.nivel,
    vida: actor.resources.vida.value,
    vidaMax: actor.resources.vida.max,
    defesa: actor.tactical.defesa,
    imageUrl: actor.tokenImageUrl ?? actor.portraitUrl ?? null,
    imageFocus: focus,
    movementWalkMax: actor.movement.walk,
    movementRunMax: actor.movement.run,
    movementSpentHex: 0,
    creatureSize: creatureSizeOf({} as BattleToken, actor.identity.raca),
    ...defaultMovementFields({ walk: actor.movement.walk, run: actor.movement.run }),
  };
}
