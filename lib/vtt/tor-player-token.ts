import type { Axial } from "@/lib/vtt/grid-math";
import { defaultMovementFields } from "@/lib/vtt/movement";
import { playerColorForActor } from "@/lib/vtt/token-colors";
import { resolveActorTokenImageUrl, resolveLinkedTokenImageFocus } from "@/lib/room/portrait-sync";
import { computeProtectionDice } from "@/lib/character/um-anel/rules";
import { TOR_DEFAULT_STANCE } from "@/lib/combat/um-anel/stances";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";
import type { BattleToken } from "@/lib/vtt/types";

/**
 * O Um Anel não tem "PA" nem orçamento de movimento em células (a mesa é
 * "levemente posicional" — ver plano da Fase 4). `pa`/`paMax` altos evitam
 * que `checkCanSpendPa` (lib/vtt/movement.ts) trave o token sem querer;
 * walk/run são um valor fixo razoável pro mapa compartilhado, não uma regra
 * do livro.
 */
const TOR_TOKEN_PA = 999;
const TOR_TOKEN_WALK = 4;
const TOR_TOKEN_RUN = 6;

export function createTorPlayerTokenFromCharacter(
  sheet: TorCharacterSheet,
  axial: Axial,
  tokenId?: string
): BattleToken {
  const id = tokenId ?? `tk-tor-${sheet.id}`;
  const imageUrl = resolveActorTokenImageUrl(sheet);
  const focus = resolveLinkedTokenImageFocus(sheet);

  return {
    id,
    name: sheet.name,
    axial,
    color: playerColorForActor(sheet.id, [sheet.id]),
    walk: TOR_TOKEN_WALK,
    run: TOR_TOKEN_RUN,
    pa: TOR_TOKEN_PA,
    paMax: TOR_TOKEN_PA,
    ownerRole: "jogador",
    linked: true,
    vida: sheet.endurance.value,
    vidaMax: sheet.endurance.max,
    imageUrl,
    imageFocus: focus,
    creatureSize: "medium",
    torCombat: {
      kind: "hero",
      torCharacterId: sheet.id,
      parry: sheet.parry + sheet.shieldParryBonus,
      protectionDice: computeProtectionDice(sheet.armour),
      strength: sheet.attributes.forca,
      wounded: sheet.conditions.wounded,
      eliminated: false,
      stance: TOR_DEFAULT_STANCE,
    },
    ...defaultMovementFields({ walk: TOR_TOKEN_WALK, run: TOR_TOKEN_RUN }),
  };
}
