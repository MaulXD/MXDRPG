import type { CompendiumPackId } from "@/lib/compendium/types";
import type { AttributeKey, CulinaryKey } from "@/lib/character/rules";
import type { CombatLoadout } from "@/lib/combat/types";
import type { RpgSystemId } from "@/lib/rpg/systems";

/** Campos comuns a qualquer ficha, independente do sistema de RPG. */
export type BaseCharacterFields = {
  id: string;
  ownerId: string;
  /** Aventura à qual a ficha pertence (null = legado sem campanha). */
  adventureId?: string | null;
  /** @deprecated use adventureId — migrado em normalizeCharacter */
  campaignRoomId?: string | null;
  name: string;
  biography: string;
  /** Retrato na ficha (Foundry: Actor artwork) */
  portraitUrl?: string | null;
  /** Ponto focal do retrato (0–1) */
  portraitFocus?: import("@/lib/media/portrait-focus").PortraitFocus | null;
  /** Enquadramento da capa larga (fallback: portraitFocus) */
  coverFocus?: import("@/lib/media/portrait-focus").PortraitFocus | null;
  /** Enquadramento do token na mesa (fallback: portraitFocus) */
  tokenFocus?: import("@/lib/media/portrait-focus").PortraitFocus | null;
  /** Gerado automaticamente do retrato + foco */
  tokenImageUrl?: string | null;
};

export type CharacterAttributes = Record<AttributeKey, number>;

export type CharacterCulinary = Record<CulinaryKey, number>;

export type CharacterResources = {
  vida: { value: number; max: number; temp?: number };
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
  /** Caminho de Assimilação (subclasse) — escolhido no nv 2 */
  subclasse?: string | null;
  /** Meio-Humano: linhagem permanente */
  linhagem?: string | null;
  antecedente: string;
  /** Devotion religiosa (panteão Eldarin) ou sem-deus */
  religiao?: string | null;
  /** Talentos de subclasse (nv 4/8/12/16) + ascensão nv20 */
  talentos?: Array<{ level: number; id: string; name: string }>;
  /** Talentos universais (feats) escolhidos nos níveis 4/8/12/16 */
  featIds?: string[];
  /** Perícia livre escolhida pelo antecedente Aventureiro */
  escolhaPericiaAntecedente?: string | null;
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

export type CharacterSheet = BaseCharacterFields & {
  /** Discriminante de sistema de RPG — default "eldarin" (normalizeCharacter). */
  system?: RpgSystemId;
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
  /** Magias preparadas para o dia (truques sempre disponíveis). Vazio = todas do inventário. */
  preparedSpellIds?: string[];
  /** Armadura equipada — afeta CA na ficha e no token */
  armorLoadout?: { packId: "equipamentos"; entryId: string } | null;
  /** Assimilações ativas, anatomia estudada, fome (Cap. 5–6). */
  culinaryProgress?: import("@/lib/culinary/types").CharacterCulinaryProgress;
};
