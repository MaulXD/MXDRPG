import type { CompendiumPackId } from "@/lib/compendium/types";
import type { AttributeKey, CulinaryKey } from "@/lib/character/rules";
import type { CombatLoadout } from "@/lib/combat/types";

export type CharacterAttributes = Record<AttributeKey, number>;

export type CharacterCulinary = Record<CulinaryKey, number>;

export type CharacterResources = {
  vida: { value: number; max: number };
  pontosAcao: { value: number; max: number };
};

export type CharacterMovement = {
  walk: number;
  run: number;
};

export type CharacterIdentity = {
  nivel: number;
  /** XP acumulado (Cap. 2.5) */
  xpTotal: number;
  raca: string;
  classe: string;
  /** Dieta Marcial — escolhida no nv 2 */
  subclasse?: string | null;
  /** Meio-Humano: linhagem permanente */
  linhagem?: string | null;
  antecedente: string;
  /** Talentos de subclasse (nv 4/8/12/16) + ascensão nv20 */
  talentos?: Array<{ level: number; id: string; name: string }>;
};

/** Especiarias, minerios, tesouros (Cap. 5.6) */
export type LootEconomy = {
  po: number;
  especiarias: Record<string, number>;
  minerios: Record<string, number>;
  tesouros: Record<string, number>;
};

/** Item na ficha — referência ao compêndio + instância */
export type InventoryItem = {
  instanceId: string;
  packId: CompendiumPackId;
  entryId: string;
  quantity: number;
};

export type CharacterSheet = {
  id: string;
  ownerId: string;
  name: string;
  biography: string;
  /** Retrato na ficha (Foundry: Actor artwork) */
  portraitUrl?: string | null;
  /** Ponto focal do retrato/token (0–1) */
  portraitFocus?: import("@/lib/media/portrait-focus").PortraitFocus | null;
  /** Gerado automaticamente do retrato + foco */
  tokenImageUrl?: string | null;
  identity: CharacterIdentity;
  attributes: CharacterAttributes;
  culinary: CharacterCulinary;
  resources: CharacterResources;
  movement: CharacterMovement;
  tactical: { defesa: number; iniciativa: number };
  /** Seed inicial; runtime merge com localStorage */
  inventory: InventoryItem[];
  /** PO + ESP/MIN/TES — localStorage em runtime */
  lootEconomy?: LootEconomy;
  /** Arma ou magia ofensiva selecionada na mesa */
  combatLoadout?: CombatLoadout | null;
};
