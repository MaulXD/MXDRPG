import {
  defaultPointBuyScores,
  getRacialBonuses,
  ATTR_ORDER,
  POINT_BUY_MIN,
} from "@/lib/character/point-buy";
import type { CharacterSheet } from "@/lib/character/types";
import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import { getDefaultStarterEquipment, getDefaultStarterKitId } from "@/lib/character/starter-kits";

export function characterToWizardDraft(character: CharacterSheet): CharacterWizardDraft {
  const racial = getRacialBonuses(
    character.identity.raca,
    character.identity.linhagem
  );
  const pointBuy = defaultPointBuyScores();
  for (const key of ATTR_ORDER) {
    pointBuy[key] = Math.max(
      POINT_BUY_MIN,
      (character.attributes[key] ?? 8) - (racial[key] ?? 0)
    );
  }

  return {
    name: character.name,
    biography: character.biography,
    raca: character.identity.raca,
    linhagem: character.identity.linhagem ?? null,
    classe: character.identity.classe,
    antecedente: character.identity.antecedente,
    starterKitId: getDefaultStarterKitId(character.identity.classe),
    starterEquipment: getDefaultStarterEquipment(character.identity.classe),
    religiao: character.identity.religiao ?? "sem-deus",
    pointBuy,
    portraitUrl: character.portraitUrl ?? null,
    tokenImageUrl: character.tokenImageUrl ?? null,
    portraitFocus: character.portraitFocus ?? null,
    coverFocus: character.coverFocus ?? null,
    tokenFocus: character.tokenFocus ?? null,
  };
}
