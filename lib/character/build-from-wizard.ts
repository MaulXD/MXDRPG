import { applyIdentityPatch } from "@/lib/character/identity";
import { normalizeCharacter } from "@/lib/character/normalize";
import { attributesAfterRacial, validatePointBuy } from "@/lib/character/point-buy";
import type { CharacterSheet } from "@/lib/character/types";
import { attributeMod, getClass, hpMaxFor } from "@/lib/character/rules";
import { validateImageDataUrl } from "@/lib/media/image-data-url";
import type { CharacterWizardDraft } from "@/lib/character/wizard-types";
import { xpTotalForLevel } from "@/lib/character/xp";
import {
  applyStarterKitToSheet,
  getDefaultStarterEquipment,
  getDefaultStarterKitId,
  sanitizeStarterEquipmentForClass,
  validateStarterEquipment,
} from "@/lib/character/starter-kits";
import { validateDisplayName } from "@/lib/moderation/display-name";

const MAX_PORTRAIT_FIELD_CHARS = 900_000;

/** Evita 413 no POST quando data URLs excedem limite do parser. */
export function sanitizeWizardDraftForSave(
  draft: CharacterWizardDraft
): CharacterWizardDraft {
  const portraitUrl =
    draft.portraitUrl && draft.portraitUrl.length <= MAX_PORTRAIT_FIELD_CHARS
      ? validateImageDataUrl(draft.portraitUrl) ?? null
      : null;
  const tokenImageUrl =
    draft.tokenImageUrl && draft.tokenImageUrl.length <= MAX_PORTRAIT_FIELD_CHARS
      ? validateImageDataUrl(draft.tokenImageUrl) ?? null
      : null;
  return {
    ...draft,
    portraitUrl,
    tokenImageUrl,
    starterEquipment: sanitizeStarterEquipmentForClass(
      draft.classe,
      draft.starterEquipment ?? getDefaultStarterEquipment(draft.classe)
    ),
  };
}

export function validateWizardDraft(draft: CharacterWizardDraft): string | null {
  const nameCheck = validateDisplayName(draft.name);
  if (!nameCheck.ok) {
    if (nameCheck.error.includes("2 caracteres")) return "Informe o nome do personagem";
    return nameCheck.error;
  }
  const name = nameCheck.name;
  if (!draft.raca) return "Escolha uma raça";
  if (!draft.classe) return "Escolha uma classe";
  if (!getClass(draft.classe)) return "Classe inválida";
  if (draft.raca === "Meio-Humano" && !draft.linhagem?.trim()) {
    return "Meio-Humano exige linhagem";
  }
  const pb = validatePointBuy(draft.pointBuy);
  if (pb) return pb;
  if (!draft.antecedente.trim()) return "Escolha um antecedente";
  if (!draft.religiao?.trim()) return "Escolha uma devotion (ou Sem Deus)";
  const equipErr = validateStarterEquipment(
    draft.classe,
    draft.starterEquipment ?? getDefaultStarterEquipment(draft.classe)
  );
  if (equipErr) return equipErr;
  return null;
}

export function buildCharacterFromWizard(
  userId: string,
  draft: CharacterWizardDraft,
  id?: string,
  adventureId?: string | null
): CharacterSheet {
  const safeDraft = sanitizeWizardDraftForSave(draft);
  const err = validateWizardDraft(safeDraft);
  if (err) throw new Error(err);

  const attributes = attributesAfterRacial(
    safeDraft.pointBuy,
    safeDraft.raca,
    safeDraft.linhagem
  );
  const conMod = attributeMod(attributes.constituicao);
  const hpMax = hpMaxFor(safeDraft.classe, 1, conMod);
  const desMod = attributeMod(attributes.destreza);

  const shell: CharacterSheet = normalizeCharacter({
    id: id ?? `pc-${Date.now().toString(36)}`,
    ownerId: userId,
    adventureId: adventureId ?? null,
    name: safeDraft.name.trim(),
    biography: safeDraft.biography.trim().slice(0, 2000),
    portraitUrl: safeDraft.portraitUrl ?? null,
    tokenImageUrl: safeDraft.tokenImageUrl ?? null,
    portraitFocus: safeDraft.portraitFocus ?? null,
    coverFocus: safeDraft.coverFocus ?? safeDraft.portraitFocus ?? null,
    tokenFocus: safeDraft.tokenFocus ?? safeDraft.portraitFocus ?? null,
    identity: {
      nivel: 1,
      xpTotal: xpTotalForLevel(1),
      raca: safeDraft.raca,
      classe: safeDraft.classe,
      subclasse: null,
      linhagem: safeDraft.raca === "Meio-Humano" ? safeDraft.linhagem : null,
      antecedente: safeDraft.antecedente,
      religiao: safeDraft.religiao,
      talentos: [],
      featIds: [],
      escolhaPericiaAntecedente:
        safeDraft.antecedente === "Aventureiro"
          ? (safeDraft.escolhaPericiaAntecedente ?? null)
          : null,
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
    armorLoadout: null,
  });

  const withKit = applyStarterKitToSheet(shell, {
    classe: safeDraft.classe,
    raca: safeDraft.raca,
    antecedente: safeDraft.antecedente,
    starterKitId: safeDraft.starterKitId || getDefaultStarterKitId(safeDraft.classe),
    equipment: safeDraft.starterEquipment,
  });

  return applyIdentityPatch(withKit, {
    raca: safeDraft.raca,
    classe: safeDraft.classe,
    linhagem: safeDraft.raca === "Meio-Humano" ? safeDraft.linhagem : null,
    antecedente: safeDraft.antecedente,
    attributes,
  });
}
