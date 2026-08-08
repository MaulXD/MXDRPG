import { CALLING_BY_ID, CULTURE_BY_ID, SKILLS, STANDARDS_OF_LIVING, WEAPON_BY_ID } from "./data";
import {
  computeDerivedStats,
  computeLoad,
  shieldParryBonus,
  torVirtueDerivedBonus,
} from "./rules";
import type {
  TorCharacterSheet,
  TorCombatProficiencyRatings,
  TorSkillRatings,
  TorWarGearItem,
} from "./types";
import type { TorCharacterWizardDraft } from "./wizard-types";
import { activeCombatProficiencies, validateTorWizardDraft } from "./wizard-types";

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
  // Pela FLAG, não pelo id: a Bênção dos Altos-Elfos de Valfenda tem a mesma
  // mecânica e perdia o ponto por estar fora do `if` amarrado a "rangers".
  if (culture.blessingAttributeBonus && draft.rangerAttributeBonus) {
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
  // `Math.max`, não `+= 1`. A Cultura COPIA graduações da tabela (2 numa do par,
  // 1 numa à escolha) — não incrementa. Com `+=`, escolher a MESMA Proficiência
  // nas duas dava graduação 3 de graça: o mesmo degrau que custaria 6 dos 10
  // pontos de Experiência Prévia. Escolher a mesma agora simplesmente desperdiça
  // a segunda escolha, que é o resultado correto.
  combatProficiencies[draft.combatProficiencyChoiceB!] = Math.max(
    combatProficiencies[draft.combatProficiencyChoiceB!],
    1
  );

  // A Virtude inicial de valor fixo soma nas derivadas — o livro manda anotar a
  // derivada JÁ com o efeito ("já contado no total" nas fichas do Starter Set).
  const virtues = draft.virtue ? [draft.virtue] : [];
  const virtueBonus = torVirtueDerivedBonus(virtues);
  const base = computeDerivedStats(culture.id, attributes);
  const derived = {
    enduranceMax: base.enduranceMax + virtueBonus.enduranceMax,
    hopeMax: base.hopeMax + virtueBonus.hopeMax,
    parry: base.parry + virtueBonus.parry,
  };
  const standard = STANDARDS_OF_LIVING.find((s) => s.id === culture.standardOfLiving)!;

  // O traço da Vocação entra UMA vez. Quando ele exige especialização (o
  // Conhecimento do Inimigo do Campeão, onde o jogador escolhe o tipo de
  // inimigo), entra só a forma especializada — antes gravava as duas, e o
  // Campeão terminava com 4 Traços Distintivos em vez de 3, com a única
  // informação que o livro manda escolher invisível na ficha.
  const especializado =
    calling.enemyLoreChoice && draft.enemyLoreChoice
      ? `${calling.traitId}:${draft.enemyLoreChoice}`
      : null;
  const distinctiveFeatures = [
    ...draft.distinctiveFeatures,
    especializado ?? calling.traitId,
  ];

  const warGear: TorWarGearItem[] = activeCombatProficiencies(draft).map((prof) => {
    const weaponId = draft.weaponChoices[prof]!;
    const weapon = WEAPON_BY_ID[weaponId];
    return {
      instanceId: newId("gear"),
      weaponId,
      twoHanded: weapon?.twoHanded || undefined,
    };
  });
  const armour = {
    armourId: draft.armourId,
    helm: draft.helm,
    shieldId: draft.shieldId,
  };

  const sheet: TorCharacterSheet = {
    id: newId("tor"),
    ownerId,
    adventureId,
    campaignRoomId: null,
    name: draft.name.trim().slice(0, 80),
    biography: draft.biography.trim(),
    portraitUrl: draft.portraitUrl,
    tokenImageUrl: draft.tokenImageUrl,
    portraitFocus: draft.portraitFocus,
    coverFocus: draft.coverFocus,
    tokenFocus: draft.tokenFocus,
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
    shieldParryBonus: shieldParryBonus(armour.shieldId),
    load: computeLoad(warGear, armour, culture.id),

    shadow: 0,
    shadowScars: 0,
    shadowFlaws: 0,
    fatigue: 0,
    conditions: { weary: false, miserable: false, wounded: false },
    injury: "",

    valour: 1,
    wisdom: 1,
    rewards: draft.reward ? [draft.reward] : [],
    virtues,

    treasure: standard.startingTreasure,
    adventurePoints: 0,
    skillPoints: 0,
    fellowship: 1,

    warGear,
    armour,
    travellingGear: "",
    usefulItems: [],
  };

  return sheet;
}
