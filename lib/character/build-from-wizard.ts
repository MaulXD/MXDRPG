import { applyIdentityPatch } from "@/lib/character/identity";
import { normalizeCharacter } from "@/lib/character/normalize";
import { attributesAfterRacial, validatePointBuy } from "@/lib/character/point-buy";
import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import type { CharacterSheet } from "@/lib/character/types";
import { attributeMod, hpMaxFor } from "@/lib/character/rules";
import { xpTotalForLevel } from "@/lib/character/xp";

export function validateWizardDraft(draft: CharacterWizardDraft): string | null {
  const name = draft.name.trim();
  if (!name || name.length < 2) return "Informe o nome do personagem";
  if (name.length > 80) return "Nome muito longo (máx 80)";
  if (!draft.raca) return "Escolha uma raça";
  if (!draft.classe) return "Escolha uma classe";
  if (draft.raca === "Meio-Humano" && !draft.linhagem?.trim()) {
    return "Meio-Humano exige linhagem";
  }
  const pb = validatePointBuy(draft.pointBuy);
  if (pb) return pb;
  if (!draft.antecedente.trim()) return "Escolha um antecedente";
  return null;
}

export function buildCharacterFromWizard(
  userId: string,
  draft: CharacterWizardDraft,
  id?: string
): CharacterSheet {
  const err = validateWizardDraft(draft);
  if (err) throw new Error(err);

  const attributes = attributesAfterRacial(
    draft.pointBuy,
    draft.raca,
    draft.linhagem
  );
  const conMod = attributeMod(attributes.constituicao);
  const hpMax = hpMaxFor(draft.classe, 1, conMod);
  const desMod = attributeMod(attributes.destreza);

  const shell: CharacterSheet = normalizeCharacter({
    id: id ?? `pc-${Date.now().toString(36)}`,
    ownerId: userId,
    name: draft.name.trim(),
    biography: draft.biography.trim().slice(0, 2000),
    portraitUrl: draft.portraitUrl ?? null,
    tokenImageUrl: draft.tokenImageUrl ?? null,
    portraitFocus: draft.portraitFocus ?? null,
    identity: {
      nivel: 1,
      xpTotal: xpTotalForLevel(1),
      raca: draft.raca,
      classe: draft.classe,
      subclasse: null,
      linhagem: draft.raca === "Meio-Humano" ? draft.linhagem : null,
      antecedente: draft.antecedente,
      talentos: [],
    },
    attributes,
    culinary: { trinchar: 0, harmonizacao: 0, coccao: 0, estomagoDeFerro: 0 },
    resources: {
      vida: { value: hpMax, max: hpMax },
      pontosAcao: { value: 0, max: 0 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 10 + desMod, iniciativa: desMod },
    inventory: [],
    combatLoadout: null,
  });

  return applyIdentityPatch(shell, {
    raca: draft.raca,
    classe: draft.classe,
    linhagem: draft.raca === "Meio-Humano" ? draft.linhagem : null,
    antecedente: draft.antecedente,
    attributes,
  });
}
