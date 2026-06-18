import { paMaxForActor } from "@/lib/combat/pa-economy";
import type { RoomActor } from "@/lib/room/types";
import type { Axial } from "@/lib/vtt/grid-math";
import { defaultMovementFields } from "@/lib/vtt/movement";
import { creatureSizeOf } from "@/lib/vtt/creature-size";
import { playerColorForActor } from "@/lib/vtt/token-colors";
import {
  resolveActorTokenImageUrl,
  resolveLinkedTokenImageFocus,
} from "@/lib/room/portrait-sync";
import type { BattleToken } from "@/lib/vtt/types";

export function createPlayerTokenFromActor(
  actor: RoomActor,
  axial: Axial,
  tokenId?: string
): BattleToken {
  const id = tokenId ?? `tk-${actor.id}`;
  const paMax = paMaxForActor(actor);
  /** Pool preenchido no início do turno em combate; em aventura exibe recuperação cheia. */
  const pa = paMax;
  const imageUrl = resolveActorTokenImageUrl(actor);
  const focus = resolveLinkedTokenImageFocus(actor);

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
    vidaTemp: actor.resources.vida.temp,
    defesa: actor.tactical.defesa,
    imageUrl,
    imageFocus: focus,
    movementWalkMax: actor.movement.walk,
    movementRunMax: actor.movement.run,
    movementSpentCells: 0,
    creatureSize: creatureSizeOf({} as BattleToken, actor.identity.raca),
    ...defaultMovementFields({ walk: actor.movement.walk, run: actor.movement.run }),
  };
}
