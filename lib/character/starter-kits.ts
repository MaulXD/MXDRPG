import { computeDefesaFromArmor } from "@/lib/character/armor-defense";
import { isCasterClass } from "@/lib/character/spell-prep";
import { newInstanceId } from "@/lib/character/inventory-storage";
import { attributeMod, type ClassId } from "@/lib/character/rules";
import type {
  CharacterAttributes,
  CharacterSheet,
  InventoryItem,
  LootEconomy,
} from "@/lib/character/types";
import type { CombatLoadout } from "@/lib/combat/types";
import { getEntry } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";

export const STARTING_PO = 50;

type StarterItemRef = {
  packId: CompendiumPackId;
  entryId: string;
  quantity?: number;
};

export type StarterKitOption = {
  id: string;
  label: string;
  summary: string;
  items: StarterItemRef[];
  combatLoadout: CombatLoadout | null;
  armorLoadout: { packId: "equipamentos"; entryId: string } | null;
};

/** Escolha manual de equipamento no wizard (arma, armadura, magias e extras). */
export type StarterEquipmentDraft = {
  combatLoadout: CombatLoadout | null;
  /** Arma física extra no inventário (ex.: adaga quando o foco de combate é magia). */
  sideWeaponEntryId: string | null;
  armorEntryId: string | null;
  spellEntryIds: string[];
  extraEntryIds: string[];
};

export type StarterEquipmentPools = {
  combatOptions: CombatLoadout[];
  sideWeaponEntryIds: string[];
  armorEntryIds: string[];
  spellEntryIds: string[];
  extraEntryIds: string[];
};

/** Itens de sobrevivência e culinária — todo personagem nv 1. */
const UNIVERSAL_STARTER: StarterItemRef[] = [
  { packId: "equipamentos", entryId: "equipamentos-kit-de-trinchar", quantity: 1 },
  { packId: "equipamentos", entryId: "equipamentos-tocha-de-masmorra", quantity: 1 },
  { packId: "equipamentos", entryId: "equipamentos-corda-de-seda-de-aranha", quantity: 1 },
];

const CLASS_STARTER_KITS: Record<ClassId, StarterKitOption[]> = {
  Guerreiro: [
    {
      id: "guerreiro-lamina",
      label: "Lâmina leve e couro curtido",
      summary: "Corpo a corpo versátil: lâmina leve e couro curtido.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "guerreiro-espada",
      label: "Espada longa e cota de malha",
      summary: "Linha de frente: espada longa e cota de malha.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s02" },
        { packId: "equipamentos", entryId: "equipamentos-arm-05" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s02" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-05" },
    },
    {
      id: "guerreiro-arco",
      label: "Arco longo e couro acolchoado",
      summary: "Atirador: arco longo e couro acolchoado.",
      items: [
        { packId: "armas", entryId: "armas-arc-l01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-02" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-arc-l01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-02" },
    },
  ],
  Patrulheiro: [
    {
      id: "patrulheiro-arco",
      label: "Arco curto e couro",
      summary: "Caçador: arco curto e couro.",
      items: [
        { packId: "armas", entryId: "armas-arc-c01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-arc-c01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "patrulheiro-duas-armas",
      label: "Gladius e gibão de peles",
      summary: "Escaramuça: gladius e gibão de peles.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s08" },
        { packId: "equipamentos", entryId: "equipamentos-arm-03" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s08" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-03" },
    },
    {
      id: "patrulheiro-melee",
      label: "Rapieira e meia-armadura",
      summary: "Duelista protegido: rapieira e meia-armadura.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-07" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-07" },
    },
  ],
  Ladino: [
    {
      id: "ladino-rapieira",
      label: "Rapieira e couro",
      summary: "Finesse: rapieira e couro.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "ladino-adagas",
      label: "Adagas gêmeas e couro acolchoado",
      summary: "Duas lâminas: adagas gêmeas e couro acolchoado.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o02" },
        { packId: "equipamentos", entryId: "equipamentos-arm-02" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o02" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-02" },
    },
    {
      id: "ladino-arco",
      label: "Arco curto (sem armadura pesada)",
      summary: "À distância: arco curto, sem armadura pesada.",
      items: [{ packId: "armas", entryId: "armas-arc-c01" }],
      combatLoadout: { packId: "armas", entryId: "armas-arc-c01" },
      armorLoadout: null,
    },
  ],
  Mago: [
    {
      id: "mago-adaga",
      label: "Adaga e Lâmina de Espírito",
      summary: "Conjurador: adaga, Lâmina de Espírito e Chama de Fogareiro.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "magias", entryId: "magias-lamina-de-espirito" },
        { packId: "magias", entryId: "magias-chama-de-fogareiro" },
      ],
      combatLoadout: { packId: "magias", entryId: "magias-lamina-de-espirito" },
      armorLoadout: null,
    },
    {
      id: "mago-bestia",
      label: "Besta leve e couro",
      summary: "À distância: besta leve e couro, com Raio do Limiar no grimório.",
      items: [
        { packId: "armas", entryId: "armas-bst-01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
        { packId: "magias", entryId: "magias-raio-do-limiar" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-bst-01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "mago-arcano",
      label: "Adaga e Onda de Trovão",
      summary: "Sem armadura: adaga, Onda de Trovão e Escudo Arcano.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "magias", entryId: "magias-onda-de-trovao" },
        { packId: "magias", entryId: "magias-escudo-arcano" },
      ],
      combatLoadout: { packId: "magias", entryId: "magias-onda-de-trovao" },
      armorLoadout: null,
    },
  ],
  Clérigo: [
    {
      id: "clerigo-maca",
      label: "Maça, meia-armadura e cura",
      summary: "Sacerdote guerreiro: maça, meia-armadura e Curar Ferimentos.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-07" },
        { packId: "magias", entryId: "magias-curar-ferimentos" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-07" },
    },
    {
      id: "clerigo-bestia",
      label: "Besta, couro e Curar Ferimentos",
      summary: "Suporte à distância: besta leve, couro e Curar Ferimentos.",
      items: [
        { packId: "armas", entryId: "armas-bst-01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
        { packId: "magias", entryId: "magias-curar-ferimentos" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-bst-01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "clerigo-azagaia",
      label: "Azagaia e brigandina",
      summary: "Linha de frente: azagaia e brigandina.",
      items: [
        { packId: "armas", entryId: "armas-wpn-p04" },
        { packId: "equipamentos", entryId: "equipamentos-arm-09" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-p04" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-09" },
    },
  ],
  Bárbaro: [
    {
      id: "barbaro-machado",
      label: "Machado grande e gibão",
      summary: "Fúria pesada: machado grande e gibão de peles.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o04" },
        { packId: "equipamentos", entryId: "equipamentos-arm-03" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o04" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-03" },
    },
    {
      id: "barbaro-gladius",
      label: "Gladius e couro batido",
      summary: "Ágil: gladius e couro batido.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s08" },
        { packId: "equipamentos", entryId: "equipamentos-arm-04" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s08" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-04" },
    },
    {
      id: "barbaro-maca",
      label: "Maça e couro curtido",
      summary: "Impacto brutal: maça e couro curtido.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
  ],
  Bardo: [
    {
      id: "bardo-rapieira",
      label: "Rapieira, couro e Inspiração Culinária",
      summary: "Duelista: rapieira, couro e Inspiração Culinária.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
        { packId: "magias", entryId: "magias-inspiracao-culinaria" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "bardo-adaga",
      label: "Adaga, couro acolchoado e Sussurro de Masmorra",
      summary: "Furtivo: adaga, couro acolchoado e Sussurro de Masmorra.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-02" },
        { packId: "magias", entryId: "magias-sussurro-de-masmorra" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-02" },
    },
    {
      id: "bardo-arco",
      label: "Arco curto e Ilusão Menor",
      summary: "À distância: arco curto e Ilusão Menor.",
      items: [
        { packId: "armas", entryId: "armas-arc-c01" },
        { packId: "magias", entryId: "magias-ilusao-menor" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-arc-c01" },
      armorLoadout: null,
    },
  ],
  Druida: [
    {
      id: "druida-cimitarra",
      label: "Cimitarra, gibão e Crescimento Acelerado",
      summary: "Predador: cimitarra, gibão de peles e Crescimento Acelerado.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s07" },
        { packId: "equipamentos", entryId: "equipamentos-arm-03" },
        { packId: "magias", entryId: "magias-crescimento-acelerado" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s07" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-03" },
    },
    {
      id: "druida-organica",
      label: "Azagaia, escamas de dragonete e Purificar Veneno",
      summary: "Armadura orgânica: azagaia, escamas de dragonete e Purificar Veneno.",
      items: [
        { packId: "armas", entryId: "armas-wpn-p04" },
        { packId: "equipamentos", entryId: "equipamentos-arm-14" },
        { packId: "magias", entryId: "magias-purificar-veneno" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-p04" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-14" },
    },
    {
      id: "druida-adaga",
      label: "Adaga, couro de troll e Estabilizar",
      summary: "Místico: adaga, couro de troll e Estabilizar.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-15" },
        { packId: "magias", entryId: "magias-estabilizar" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-15" },
    },
  ],
  Feiticeiro: [
    {
      id: "feiticeiro-centelha",
      label: "Adaga e Lâmina de Espírito",
      summary: "Inato: adaga e Lâmina de Espírito.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "magias", entryId: "magias-lamina-de-espirito" },
      ],
      combatLoadout: { packId: "magias", entryId: "magias-lamina-de-espirito" },
      armorLoadout: null,
    },
    {
      id: "feiticeiro-trovao",
      label: "Besta e Onda de Trovão",
      summary: "Burst: besta leve e Onda de Trovão.",
      items: [
        { packId: "armas", entryId: "armas-bst-01" },
        { packId: "magias", entryId: "magias-onda-de-trovao" },
      ],
      combatLoadout: { packId: "magias", entryId: "magias-onda-de-trovao" },
      armorLoadout: null,
    },
    {
      id: "feiticeiro-chama",
      label: "Maça e Chama de Vinha",
      summary: "Elemental: maça e Chama de Vinha.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o05" },
        { packId: "magias", entryId: "magias-chama-de-vinha" },
      ],
      combatLoadout: { packId: "magias", entryId: "magias-chama-de-vinha" },
      armorLoadout: null,
    },
  ],
  Espiritualista: [
    {
      id: "espiritualista-punhos",
      label: "Punhos (sem arma) e Golpe de Chi",
      summary: "Corpo a corpo sem arma: Golpe de Chi.",
      items: [{ packId: "habilidades", entryId: "chi-golpe-de-chi" }],
      combatLoadout: { packId: "habilidades", entryId: "chi-golpe-de-chi" },
      armorLoadout: null,
    },
    {
      id: "espiritualista-bastao",
      label: "Lança curta e Passo do Vácuo",
      summary: "Mobilidade: lança curta e Passo do Vácuo.",
      items: [
        { packId: "armas", entryId: "armas-wpn-p01" },
        { packId: "habilidades", entryId: "chi-passo-do-vacuo" },
      ],
      combatLoadout: { packId: "habilidades", entryId: "chi-passo-do-vacuo" },
      armorLoadout: null,
    },
    {
      id: "espiritualista-lamina",
      label: "Lâmina de Vinha e Ferida Aberta",
      summary: "Asceta da Dor: lâmina de vinha e Ferida Aberta.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s01" },
        { packId: "habilidades", entryId: "chi-ferida-aberta" },
      ],
      combatLoadout: { packId: "habilidades", entryId: "chi-ferida-aberta" },
      armorLoadout: null,
    },
  ],
  Paladino: [
    {
      id: "paladino-espada",
      label: "Espada longa e cota de malha",
      summary: "Cavaleiro sagrado: espada longa, cota de malha, Curar Ferimentos e Raio do Limiar.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s02" },
        { packId: "equipamentos", entryId: "equipamentos-arm-05" },
        { packId: "magias", entryId: "magias-curar-ferimentos" },
        { packId: "magias", entryId: "magias-raio-do-limiar" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s02" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-05" },
    },
    {
      id: "paladino-maca",
      label: "Maça e meia-armadura",
      summary: "Templo guerreiro: maça, meia-armadura, cura e Escudo Arcano.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-07" },
        { packId: "magias", entryId: "magias-curar-ferimentos" },
        { packId: "magias", entryId: "magias-escudo-arcano" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-07" },
    },
    {
      id: "paladino-gladius",
      label: "Gladius e brigandina",
      summary: "Voto móvel: gladius, brigandina e Purificar Veneno.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s08" },
        { packId: "equipamentos", entryId: "equipamentos-arm-09" },
        { packId: "magias", entryId: "magias-purificar-veneno" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s08" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-09" },
    },
  ],
  Bruxo: [
    {
      id: "bruxo-adaga",
      label: "Adaga e couro",
      summary: "Pacto arcano: adaga, couro, Raio do Limiar e Sussurro de Masmorra.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
        { packId: "magias", entryId: "magias-raio-do-limiar" },
        { packId: "magias", entryId: "magias-sussurro-de-masmorra" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "bruxo-cajado",
      label: "Machado de batalha e couro acolchoado",
      summary: "Canal do patrono: machado de batalha, couro acolchoado e Chama de Fogareiro.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o03" },
        { packId: "equipamentos", entryId: "equipamentos-arm-02" },
        { packId: "magias", entryId: "magias-chama-de-fogareiro" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o03" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-02" },
    },
    {
      id: "bruxo-bestia",
      label: "Besta e Lâmina de Espírito",
      summary: "Pacto à distância: besta, Lâmina de Espírito e Ilusão Menor.",
      items: [
        { packId: "armas", entryId: "armas-bst-01" },
        { packId: "magias", entryId: "magias-lamina-de-espirito" },
        { packId: "magias", entryId: "magias-ilusao-menor" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-bst-01" },
      armorLoadout: null,
    },
  ],
};

const RACE_STARTER: Record<string, StarterItemRef[]> = {
  Anão: [{ packId: "equipamentos", entryId: "equipamentos-kit-de-trinchar", quantity: 1 }],
  Gnomo: [{ packId: "equipamentos", entryId: "equipamentos-kit-de-brasas-mágicas", quantity: 1 }],
};

const ANTECEDENTE_STARTER: Record<string, StarterItemRef[]> = {
  Explorador: [{ packId: "equipamentos", entryId: "equipamentos-corda-de-seda-de-aranha", quantity: 1 }],
  Criminoso: [{ packId: "armas", entryId: "armas-wpn-o01", quantity: 1 }],
  Soldado: [{ packId: "armas", entryId: "armas-wpn-s08", quantity: 1 }],
  Eremita: [{ packId: "magias", entryId: "magias-estabilizar", quantity: 1 }],
};

export function getStarterOptionsForClass(classe: string): StarterKitOption[] {
  return CLASS_STARTER_KITS[classe as ClassId] ?? CLASS_STARTER_KITS.Guerreiro;
}

export function getDefaultStarterKitId(classe: string): string {
  return getStarterOptionsForClass(classe)[0]?.id ?? "guerreiro-lamina";
}

const UNIVERSAL_ENTRY_IDS = new Set(UNIVERSAL_STARTER.map((u) => u.entryId));

function combatLoadoutKey(loadout: CombatLoadout | null): string {
  if (!loadout) return "";
  return `${loadout.packId}:${loadout.entryId}`;
}

function sameCombatLoadout(a: CombatLoadout | null, b: CombatLoadout | null): boolean {
  return combatLoadoutKey(a) === combatLoadoutKey(b);
}

function sortedUnique(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

export function loadoutDraftFromKit(kit: StarterKitOption): StarterEquipmentDraft {
  const spellEntryIds: string[] = [];
  const extraEntryIds: string[] = [];
  let sideWeaponEntryId: string | null = null;

  for (const item of kit.items) {
    if (item.packId === "magias") {
      spellEntryIds.push(item.entryId);
    } else if (item.packId === "armas") {
      const isPrimary =
        kit.combatLoadout?.packId === "armas" &&
        kit.combatLoadout.entryId === item.entryId;
      if (!isPrimary && !sideWeaponEntryId) {
        sideWeaponEntryId = item.entryId;
      }
    } else if (
      item.packId === "equipamentos" &&
      item.entryId !== kit.armorLoadout?.entryId &&
      !UNIVERSAL_ENTRY_IDS.has(item.entryId)
    ) {
      extraEntryIds.push(item.entryId);
    }
  }

  return {
    combatLoadout: kit.combatLoadout,
    sideWeaponEntryId,
    armorEntryId: kit.armorLoadout?.entryId ?? null,
    spellEntryIds: sortedUnique(spellEntryIds),
    extraEntryIds: sortedUnique(extraEntryIds),
  };
}

export function getDefaultStarterEquipment(classe: string): StarterEquipmentDraft {
  const kit = getStarterOptionsForClass(classe)[0];
  return kit ? loadoutDraftFromKit(kit) : emptyStarterEquipment();
}

export function emptyStarterEquipment(): StarterEquipmentDraft {
  return {
    combatLoadout: null,
    sideWeaponEntryId: null,
    armorEntryId: null,
    spellEntryIds: [],
    extraEntryIds: [],
  };
}

export function getStarterEquipmentPools(classe: string): StarterEquipmentPools {
  const combatMap = new Map<string, CombatLoadout>();
  const sideWeaponEntryIds = new Set<string>();
  const armorEntryIds = new Set<string>();
  const spellEntryIds = new Set<string>();
  const extraEntryIds = new Set<string>();

  for (const kit of getStarterOptionsForClass(classe)) {
    if (kit.combatLoadout) {
      combatMap.set(combatLoadoutKey(kit.combatLoadout), kit.combatLoadout);
    }
    if (kit.armorLoadout?.entryId) {
      armorEntryIds.add(kit.armorLoadout.entryId);
    }
    for (const item of kit.items) {
      if (item.packId === "magias") spellEntryIds.add(item.entryId);
      else if (item.packId === "armas") {
        const isPrimary =
          kit.combatLoadout?.packId === "armas" &&
          kit.combatLoadout.entryId === item.entryId;
        if (!isPrimary) sideWeaponEntryIds.add(item.entryId);
      } else if (
        item.packId === "equipamentos" &&
        item.entryId !== kit.armorLoadout?.entryId &&
        !UNIVERSAL_ENTRY_IDS.has(item.entryId)
      ) {
        extraEntryIds.add(item.entryId);
      }
    }
  }

  return {
    combatOptions: [...combatMap.values()],
    sideWeaponEntryIds: [...sideWeaponEntryIds].sort(),
    armorEntryIds: [...armorEntryIds].sort(),
    spellEntryIds: [...spellEntryIds].sort(),
    extraEntryIds: [...extraEntryIds].sort(),
  };
}

export function equipmentMatchesKit(
  equipment: StarterEquipmentDraft,
  kit: StarterKitOption
): boolean {
  const fromKit = loadoutDraftFromKit(kit);
  return (
    sameCombatLoadout(equipment.combatLoadout, fromKit.combatLoadout) &&
    equipment.sideWeaponEntryId === fromKit.sideWeaponEntryId &&
    equipment.armorEntryId === fromKit.armorEntryId &&
    sortedUnique(equipment.spellEntryIds).join() === sortedUnique(fromKit.spellEntryIds).join() &&
    sortedUnique(equipment.extraEntryIds).join() === sortedUnique(fromKit.extraEntryIds).join()
  );
}

export function findMatchingStarterKitId(
  classe: string,
  equipment: StarterEquipmentDraft
): string | null {
  for (const kit of getStarterOptionsForClass(classe)) {
    if (equipmentMatchesKit(equipment, kit)) return kit.id;
  }
  return null;
}

export function sanitizeStarterEquipmentForClass(
  classe: string,
  equipment: StarterEquipmentDraft
): StarterEquipmentDraft {
  const pools = getStarterEquipmentPools(classe);
  const combatKeys = new Set(pools.combatOptions.map(combatLoadoutKey));
  const combatLoadout =
    equipment.combatLoadout && combatKeys.has(combatLoadoutKey(equipment.combatLoadout))
      ? equipment.combatLoadout
      : (pools.combatOptions[0] ?? null);

  const armorEntryId =
    equipment.armorEntryId && pools.armorEntryIds.includes(equipment.armorEntryId)
      ? equipment.armorEntryId
      : null;

  const sideWeaponEntryId =
    equipment.sideWeaponEntryId &&
    pools.sideWeaponEntryIds.includes(equipment.sideWeaponEntryId)
      ? equipment.sideWeaponEntryId
      : null;

  const spellSet = new Set(pools.spellEntryIds);
  const extraSet = new Set(pools.extraEntryIds);

  let spellEntryIds = equipment.spellEntryIds.filter((id) => spellSet.has(id));
  const extraEntryIds = equipment.extraEntryIds.filter((id) => extraSet.has(id));

  if (
    combatLoadout?.packId === "magias" &&
    spellSet.has(combatLoadout.entryId) &&
    !spellEntryIds.includes(combatLoadout.entryId)
  ) {
    spellEntryIds = sortedUnique([...spellEntryIds, combatLoadout.entryId]);
  }

  return {
    combatLoadout,
    sideWeaponEntryId,
    armorEntryId,
    spellEntryIds: sortedUnique(spellEntryIds),
    extraEntryIds: sortedUnique(extraEntryIds),
  };
}

export function validateStarterEquipment(
  classe: string,
  equipment: StarterEquipmentDraft
): string | null {
  const pools = getStarterEquipmentPools(classe);
  if (!equipment.combatLoadout && pools.combatOptions.length > 0) {
    return "Escolha uma arma ou magia principal";
  }
  if (
    equipment.combatLoadout &&
    !pools.combatOptions.some((o) => sameCombatLoadout(o, equipment.combatLoadout))
  ) {
    return "Arma ou magia principal inválida para esta classe";
  }
  if (equipment.armorEntryId && !pools.armorEntryIds.includes(equipment.armorEntryId)) {
    return "Armadura inválida para esta classe";
  }
  if (
    equipment.sideWeaponEntryId &&
    !pools.sideWeaponEntryIds.includes(equipment.sideWeaponEntryId)
  ) {
    return "Arma reserva inválida para esta classe";
  }
  const spellSet = new Set(pools.spellEntryIds);
  if (equipment.spellEntryIds.some((id) => !spellSet.has(id))) {
    return "Magia inicial inválida para esta classe";
  }
  const extraSet = new Set(pools.extraEntryIds);
  if (equipment.extraEntryIds.some((id) => !extraSet.has(id))) {
    return "Item extra inválido para esta classe";
  }
  return null;
}

/** Busca exata — sem fallback (validação do wizard). */
export function findStarterKitOption(classe: string, kitId: string): StarterKitOption | null {
  const options = getStarterOptionsForClass(classe);
  return options.find((o) => o.id === kitId) ?? null;
}

/** Resolve kit para build — usa padrão da classe se id inválido. */
export function resolveStarterKitOption(
  classe: string,
  kitId: string
): StarterKitOption | null {
  return findStarterKitOption(classe, kitId) ?? getStarterOptionsForClass(classe)[0] ?? null;
}

function mergeStarterItems(refs: StarterItemRef[]): InventoryItem[] {
  const merged = new Map<string, InventoryItem>();
  for (const ref of refs) {
    const key = `${ref.packId}:${ref.entryId}`;
    const existing = merged.get(key);
    const qty = Math.max(1, ref.quantity ?? 1);
    if (existing) {
      existing.quantity += qty;
    } else {
      merged.set(key, {
        instanceId: newInstanceId(),
        packId: ref.packId,
        entryId: ref.entryId,
        quantity: qty,
      });
    }
  }
  return [...merged.values()];
}

function refsFromEquipmentDraft(equipment: StarterEquipmentDraft): StarterItemRef[] {
  const refs: StarterItemRef[] = [];
  const combat = equipment.combatLoadout;
  if (
    combat &&
    (combat.packId === "armas" ||
      combat.packId === "magias" ||
      combat.packId === "habilidades")
  ) {
    refs.push({
      packId: combat.packId,
      entryId: combat.entryId,
    });
  } else if (equipment.combatLoadout?.packId === "magias") {
    refs.push({
      packId: "magias",
      entryId: equipment.combatLoadout.entryId,
    });
  }
  if (
    equipment.sideWeaponEntryId &&
    equipment.combatLoadout?.packId !== "armas"
  ) {
    refs.push({ packId: "armas", entryId: equipment.sideWeaponEntryId });
  } else if (
    equipment.sideWeaponEntryId &&
    equipment.combatLoadout?.packId === "armas" &&
    equipment.sideWeaponEntryId !== equipment.combatLoadout.entryId
  ) {
    refs.push({ packId: "armas", entryId: equipment.sideWeaponEntryId });
  }
  if (equipment.armorEntryId) {
    refs.push({ packId: "equipamentos", entryId: equipment.armorEntryId });
  }
  for (const entryId of equipment.spellEntryIds) {
    // Magia de combate já entrou como combatLoadout: não somar de novo (BV-042).
    if (combat?.packId === "magias" && combat.entryId === entryId) continue;
    refs.push({ packId: "magias", entryId });
  }
  for (const entryId of equipment.extraEntryIds) {
    refs.push({ packId: "equipamentos", entryId });
  }
  return refs;
}

export function buildStarterInventory(opts: {
  classe: string;
  raca: string;
  antecedente: string;
  starterKitId: string;
  equipment?: StarterEquipmentDraft;
}): {
  inventory: InventoryItem[];
  combatLoadout: CombatLoadout | null;
  armorLoadout: { packId: "equipamentos"; entryId: string } | null;
  lootEconomy: LootEconomy;
} {
  const kit = resolveStarterKitOption(opts.classe, opts.starterKitId);
  const equipment =
    opts.equipment ??
    (kit ? loadoutDraftFromKit(kit) : sanitizeStarterEquipmentForClass(opts.classe, emptyStarterEquipment()));

  const refs: StarterItemRef[] = [
    ...UNIVERSAL_STARTER,
    ...refsFromEquipmentDraft(equipment),
    ...(RACE_STARTER[opts.raca] ?? []),
    ...(ANTECEDENTE_STARTER[opts.antecedente] ?? []),
  ];

  return {
    inventory: mergeStarterItems(refs),
    combatLoadout: equipment.combatLoadout,
    armorLoadout: equipment.armorEntryId
      ? { packId: "equipamentos", entryId: equipment.armorEntryId }
      : null,
    lootEconomy: { po: STARTING_PO, especiarias: {}, minerios: {}, tesouros: {} },
  };
}

export function previewStarterDefesa(
  attributes: CharacterAttributes,
  kit: StarterKitOption
): number {
  return previewEquipmentDefesa(attributes, loadoutDraftFromKit(kit));
}

export function previewEquipmentDefesa(
  attributes: CharacterAttributes,
  equipment: StarterEquipmentDraft
): number {
  const desMod = attributeMod(attributes.destreza);
  if (!equipment.armorEntryId) return 10 + desMod;
  const entry = getEntry("equipamentos", equipment.armorEntryId);
  return computeDefesaFromArmor(desMod, entry);
}

export function describeStarterEquipment(
  equipment: StarterEquipmentDraft,
  opts?: { omitSpells?: boolean }
): string {
  const parts: string[] = [];
  if (equipment.combatLoadout) {
    const entry = getEntry(equipment.combatLoadout.packId, equipment.combatLoadout.entryId);
    parts.push(entry?.name ?? "Combate");
  }
  if (equipment.sideWeaponEntryId) {
    const entry = getEntry("armas", equipment.sideWeaponEntryId);
    if (entry) parts.push(entry.name);
  }
  if (equipment.armorEntryId) {
    const entry = getEntry("equipamentos", equipment.armorEntryId);
    parts.push(entry?.name ?? "Armadura");
  } else {
    parts.push("Sem armadura");
  }
  // BV-044: a Revisão do wizard passa omitSpells e lista as magias no cartão
  // "Magias e truques"; os demais chamadores continuam recebendo as magias aqui.
  // A magia de combate já saiu pelo combatLoadout acima (BV-042).
  if (!opts?.omitSpells) {
    for (const spellId of equipment.spellEntryIds) {
      if (equipment.combatLoadout?.packId === "magias" && equipment.combatLoadout.entryId === spellId) continue;
      const entry = getEntry("magias", spellId);
      if (entry) parts.push(entry.name);
    }
  }
  for (const extraId of equipment.extraEntryIds) {
    const entry = getEntry("equipamentos", extraId);
    if (entry) parts.push(entry.name);
  }
  return parts.join(" · ");
}

export function describeStarterKit(kit: StarterKitOption): string {
  const parts: string[] = [];
  for (const item of kit.items) {
    const entry = getEntry(item.packId, item.entryId);
    if (entry) parts.push(entry.name);
  }
  return parts.join(" · ");
}

export function applyStarterKitToSheet(
  sheet: CharacterSheet,
  opts: {
    classe: string;
    raca: string;
    antecedente: string;
    starterKitId: string;
    equipment?: StarterEquipmentDraft;
  }
): CharacterSheet {
  const built = buildStarterInventory(opts);
  const kit = resolveStarterKitOption(opts.classe, opts.starterKitId);
  const equipment =
    opts.equipment ??
    (kit
      ? loadoutDraftFromKit(kit)
      : sanitizeStarterEquipmentForClass(opts.classe, emptyStarterEquipment()));
  const preparedSpellIds = isCasterClass(opts.classe)
    ? sortedUnique(equipment.spellEntryIds)
    : undefined;
  return {
    ...sheet,
    inventory: built.inventory,
    combatLoadout: built.combatLoadout,
    armorLoadout: built.armorLoadout,
    lootEconomy: built.lootEconomy,
    ...(preparedSpellIds !== undefined ? { preparedSpellIds } : {}),
  };
}
