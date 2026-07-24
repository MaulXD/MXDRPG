import { CALLING_BY_ID, CULTURE_BY_ID, SKILLS, STANDARDS_OF_LIVING } from "./data";
import { computeDerivedStats } from "./rules";
import type { TorCharacterSheet, TorCombatProficiencyRatings, TorSkillRatings } from "./types";
import type { TorCharacterWizardDraft } from "./wizard-types";
import { validateTorWizardDraft } from "./wizard-types";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTorCharacterFromWizard(
  ownerId: string,
  draft: TorCharacterWizardDraft,
  adventureId: string | null
): TorCharacterSheet {
  const invalid = validateTorWizardDraft(draft);
  if (invalid) throw new Error(invalid);

  const culture = CULTURE_BY_ID[draft.culture!];
  const calling = CALLING_BY_ID[draft.calling!];
  const attrOption = culture.attributeOptions[draft.attributeOptionIndex!];
  if (!attrOption) throw new Error("Conjunto de Atributos inválido");

  const attributes = { ...attrOption };
  if (culture.id === "rangers" && draft.rangerAttributeBonus) {
    attributes[draft.rangerAttributeBonus] += 1;
  }

  const skills: TorSkillRatings = { ...culture.skillBase } as TorSkillRatings;
  for (const s of SKILLS) if (!(s.id in skills)) skills[s.id] = 0;

  const favouredSkills = [draft.cultureFavouredSkill!, ...draft.favouredCallingSkills];

  const combatProficiencies: TorCombatProficiencyRatings = {
    machados: 0,
    arcos: 0,
    lancas: 0,
    espadas: 0,
  };
  combatProficiencies[draft.combatProficiencyChoiceA!] = Math.max(
    combatProficiencies[draft.combatProficiencyChoiceA!],
    2
  );
  combatProficiencies[draft.combatProficiencyChoiceB!] += 1;

  const derived = computeDerivedStats(culture.id, attributes);
  const standard = STANDARDS_OF_LIVING.find((s) => s.id === culture.standardOfLiving)!;

  const distinctiveFeatures = [...draft.distinctiveFeatures, calling.traitId];
  if (calling.enemyLoreChoice && draft.enemyLoreChoice) {
    distinctiveFeatures.push(`${calling.traitId}:${draft.enemyLoreChoice}`);
  }

  const sheet: TorCharacterSheet = {
    id: newId("tor"),
    ownerId,
    adventureId,
    campaignRoomId: null,
    name: draft.name.trim().slice(0, 80),
    biography: draft.biography.trim(),
    portraitUrl: null,
    system: "um-anel",

    culture: culture.id,
    calling: calling.id,
    age: draft.age,
    distinctiveFeatures,
    flaws: "",
    standardOfLiving: standard.id,
    patron: null,
    shadowPathId: calling.shadowPathId,
    heirName: null,

    attributes,
    favouredSkills,
    skills,
    combatProficiencies,

    endurance: { value: derived.enduranceMax, max: derived.enduranceMax },
    hope: { value: derived.hopeMax, max: derived.hopeMax },
    parry: derived.parry,
    shieldParryBonus: 0,
    load: 0,

    shadow: 0,
    shadowScars: 0,
    fatigue: 0,
    conditions: { weary: false, miserable: false, wounded: false },
    injury: "",

    valour: 1,
    wisdom: 1,
    rewards: draft.reward ? [draft.reward] : [],
    virtues: draft.virtue ? [draft.virtue] : [],

    treasure: standard.startingTreasure,
    adventurePoints: 0,
    skillPoints: 0,
    fellowship: 1,

    warGear: [],
    armour: { armourId: null, helm: false, shieldId: null },
    travellingGear: "",
    usefulItems: [],
  };

  return sheet;
}
