import { computeDefesaFromArmor } from "@/lib/character/armor-defense";
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
      label: "Lâmina e couro",
      summary: "Corpo a corpo versátil — lâmina leve e couro curtido.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "guerreiro-espada",
      label: "Espada e cota",
      summary: "Tanque de linha de frente — espada longa e armadura média.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s02" },
        { packId: "equipamentos", entryId: "equipamentos-arm-05" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s02" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-05" },
    },
    {
      id: "guerreiro-arco",
      label: "Arco e couro acolchoado",
      summary: "Atirador — arco longo e mobilidade.",
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
      summary: "Caçador clássico — arco curto e couro curtido.",
      items: [
        { packId: "armas", entryId: "armas-arc-c01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-arc-c01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "patrulheiro-duas-armas",
      label: "Gladius e gibão",
      summary: "Escaramuça — lâmina curta e gibão de peles.",
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
      summary: "Duelista protegido — rapieira e meia-armadura.",
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
      summary: "Finesse — rapieira e couro curtido.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "ladino-adagas",
      label: "Adagas gêmeas",
      summary: "Duas lâminas — adagas gêmeas e couro acolchoado.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o02" },
        { packId: "equipamentos", entryId: "equipamentos-arm-02" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o02" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-02" },
    },
    {
      id: "ladino-arco",
      label: "Arco curto furtivo",
      summary: "À distância — arco curto, sem armadura pesada.",
      items: [{ packId: "armas", entryId: "armas-arc-c01" }],
      combatLoadout: { packId: "armas", entryId: "armas-arc-c01" },
      armorLoadout: null,
    },
  ],
  Mago: [
    {
      id: "mago-adaga",
      label: "Adaga e truques",
      summary: "Conjurador — adaga, lâmina de espírito e chama de fogareiro.",
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
      label: "Besta e couro",
      summary: "À distância — besta leve, couro e raio do limiar.",
      items: [
        { packId: "armas", entryId: "armas-bst-01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
        { packId: "magias", entryId: "magias-raio-do-limiar" },
        { packId: "magias", entryId: "magias-chama-de-fogareiro" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-bst-01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "mago-arcano",
      label: "Arcano puro",
      summary: "Sem armadura — onda de trovão e escudo arcano no grimório.",
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
      label: "Maça e meia-armadura",
      summary: "Sacerdote guerreiro — maça e armadura média.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-07" },
        { packId: "magias", entryId: "magias-curar-ferimentos" },
        { packId: "magias", entryId: "magias-estabilizar" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-07" },
    },
    {
      id: "clerigo-bestia",
      label: "Besta e couro",
      summary: "Suporte à distância — besta, couro e cura.",
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
      summary: "Linha de frente — azagaia e brigandina.",
      items: [
        { packId: "armas", entryId: "armas-wpn-p04" },
        { packId: "equipamentos", entryId: "equipamentos-arm-10" },
        { packId: "magias", entryId: "magias-curar-ferimentos" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-p04" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-10" },
    },
  ],
  Bárbaro: [
    {
      id: "barbaro-machado",
      label: "Machado grande",
      summary: "Fúria pesada — machado grande e gibão de peles.",
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
      summary: "Ágil — gladius e couro batido.",
      items: [
        { packId: "armas", entryId: "armas-wpn-s08" },
        { packId: "equipamentos", entryId: "equipamentos-arm-04" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-s08" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-04" },
    },
    {
      id: "barbaro-maca",
      label: "Maça de guerra",
      summary: "Impacto brutal — maça e couro curtido.",
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
      label: "Rapieira e inspiração",
      summary: "Duelista — rapieira, couro e inspiração culinária.",
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
      label: "Adaga e sussurros",
      summary: "Furtivo — adaga, couro e magia de apoio.",
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
      label: "Arco e performance",
      summary: "À distância — arco curto e truques de palco.",
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
      label: "Cimitarra e gibão",
      summary: "Predador — cimitarra e gibão de peles.",
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
      label: "Azagaia e escamas",
      summary: "Armadura orgânica — azagaia e escamas de dragonete.",
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
      label: "Adaga e couro de troll",
      summary: "Místico — adaga, couro de troll e estabilizar.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-15" },
        { packId: "magias", entryId: "magias-estabilizar" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-15" },
    },
  ],
  Artífice: [
    {
      id: "artifice-maca",
      label: "Maça e forja de campo",
      summary: "Ferreiro — maça, couro e chama de fogareiro.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o05" },
        { packId: "equipamentos", entryId: "equipamentos-arm-01" },
        { packId: "equipamentos", entryId: "equipamentos-kit-de-brasas-mágicas" },
        { packId: "magias", entryId: "magias-chama-de-fogareiro" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o05" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    },
    {
      id: "artifice-bestia",
      label: "Besta e meia-armadura",
      summary: "Engenheiro — besta, armadura média e armadura arcana.",
      items: [
        { packId: "armas", entryId: "armas-bst-01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-07" },
        { packId: "magias", entryId: "magias-armadura-arcana" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-bst-01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-07" },
    },
    {
      id: "artifice-adaga",
      label: "Adaga e brigandina",
      summary: "Inventor — adaga, brigandina e detecção.",
      items: [
        { packId: "armas", entryId: "armas-wpn-o01" },
        { packId: "equipamentos", entryId: "equipamentos-arm-10" },
        { packId: "magias", entryId: "magias-detectar-veneno" },
      ],
      combatLoadout: { packId: "armas", entryId: "armas-wpn-o01" },
      armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-10" },
    },
  ],
};

const RACE_STARTER: Record<string, StarterItemRef[]> = {
  Anão: [{ packId: "equipamentos", entryId: "equipamentos-kit-de-trinchar", quantity: 1 }],
  Gnomo: [{ packId: "equipamentos", entryId: "equipamentos-kit-de-brasas-mágicas", quantity: 1 }],
  "Forjado de Osso": [{ packId: "equipamentos", entryId: "equipamentos-corda-de-seda-de-aranha", quantity: 1 }],
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

export function buildStarterInventory(opts: {
  classe: string;
  raca: string;
  antecedente: string;
  starterKitId: string;
}): {
  inventory: InventoryItem[];
  combatLoadout: CombatLoadout | null;
  armorLoadout: { packId: "equipamentos"; entryId: string } | null;
  lootEconomy: LootEconomy;
} {
  const kit = resolveStarterKitOption(opts.classe, opts.starterKitId);
  if (!kit) {
    return {
      inventory: mergeStarterItems(UNIVERSAL_STARTER),
      combatLoadout: null,
      armorLoadout: null,
      lootEconomy: { po: STARTING_PO, especiarias: {}, minerios: {}, tesouros: {} },
    };
  }

  const refs: StarterItemRef[] = [
    ...UNIVERSAL_STARTER,
    ...kit.items,
    ...(RACE_STARTER[opts.raca] ?? []),
    ...(ANTECEDENTE_STARTER[opts.antecedente] ?? []),
  ];

  return {
    inventory: mergeStarterItems(refs),
    combatLoadout: kit.combatLoadout,
    armorLoadout: kit.armorLoadout,
    lootEconomy: { po: STARTING_PO, especiarias: {}, minerios: {}, tesouros: {} },
  };
}

export function previewStarterDefesa(
  attributes: CharacterAttributes,
  kit: StarterKitOption
): number {
  const desMod = attributeMod(attributes.destreza);
  if (!kit.armorLoadout?.entryId) return 10 + desMod;
  const entry = getEntry("equipamentos", kit.armorLoadout.entryId);
  return computeDefesaFromArmor(desMod, entry);
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
  }
): CharacterSheet {
  const built = buildStarterInventory(opts);
  return {
    ...sheet,
    inventory: built.inventory,
    combatLoadout: built.combatLoadout,
    armorLoadout: built.armorLoadout,
    lootEconomy: built.lootEconomy,
  };
}
