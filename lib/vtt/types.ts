import type { Axial } from "./hex-math";

export type TokenId = string;

export type BattleToken = {
  id: TokenId;
  name: string;
  axial: Axial;
  color: string;
  walk: number;
  run: number;
  pa: number;
  paMax: number;
  /** PA guardados para o próximo turno (máx. 2) */
  bankedPa?: number;
  /** PA já gastos neste turno (informativo; sem teto de gasto) */
  paSpentThisTurn?: number;
  /** Desconto −PA já consumido neste turno, por tipo (Cap. 12.0). */
  paDiscountUsed?: Partial<Record<"weapon" | "spell" | "ability", boolean>>;
  /** Bônus on-kill já concedidos neste turno (ex.: Carrasco). */
  onKillPaGranted?: Partial<Record<string, boolean>>;
  /** @deprecated Use `paDiscountUsed.weapon`. */
  paReduceWeaponUsed?: boolean;
  /** @deprecated Use `paDiscountUsed.spell`. */
  paReduceSpellUsed?: boolean;
  /** @deprecated Use `paDiscountUsed.ability`. */
  paReduceAbilityUsed?: boolean;
  /** O Peão: 1 PA de movimento básico já isento neste turno */
  peaoFreeMoveUsed?: boolean;
  ownerRole: "mestre" | "jogador";
  /** Foundry: token linkado ao Actor — stats vêm da ficha */
  actorId?: string;
  linked?: boolean;
  nivel?: number;
  vida?: number;
  vidaMax?: number;
  /** Derrotado (HP ≤ 0) — mantido quando HP do monstro é oculto para jogadores. */
  defeated?: boolean;
  /** Vida temporária (absorve dano antes da vida normal). */
  vidaTemp?: number;
  defesa?: number;
  /** Nome no mapa: hover (padrão) ou sempre visível */
  nameplateMode?: "hover" | "always";
  /** Imagem circular no hex — sync do Actor.tokenImageUrl */
  imageUrl?: string | null;
  /** Iniciativa rolada (ordem de combate) */
  initiative?: number;
  /** Compêndio monstros — token NPC */
  monsterEntryId?: string;
  /** Template customizado do mestre (criatura) */
  gmCreationId?: string;
  gmCreatureStats?: { forca: number; agilidade: number; ameaca: number };
  gmActions?: import("@/lib/combat/types").CombatActionOption[];
  /** mob · mini · boss — anel na mesa */
  monsterTier?: import("@/lib/vtt/monsters").MonsterTier;
  /** Elite ou Colossal na invocação */
  monsterVariant?: import("@/lib/vtt/monster-scaling").MonsterSpawnVariant;
  /** Foco da imagem no token (sync da ficha) */
  imageFocus?: import("@/lib/media/portrait-focus").PortraitFocus;
  /** Tamanho corporal — Médio 1 hex · Grande 4 · Gigante 7 · … */
  creatureSize?: import("@/lib/vtt/creature-size").CreatureSize;
  /** @deprecated use creatureSize */
  footprint?: "medium" | "small";
  /** Criatura que pode dividir hex com outra pequena */
  sharedHex?: boolean;
  /** Hex gastos no turno atual */
  movementSpentHex?: number;
  /** Orçamento caminhada do turno (= walk) */
  movementWalkMax?: number;
  /** Orçamento corrida do turno (= run) */
  movementRunMax?: number;
  /** Bônus temporário de defesa (Postura Defensiva etc.) */
  defesaBonus?: number;
  defesaBuffSource?: string;
  /** Investida — próximo ataque corpo a corpo pode ter bônus */
  chargeReady?: boolean;
  /** Nota de movimento especial (Passo das Sombras) */
  chargeNote?: string;
  /** Marca de caçador / finta / tiro certeiro */
  attackMark?: import("@/lib/combat/types").AttackMark;
  /** Golpe Devastador etc. */
  nextAttackBonus?: number;
  /** Inspiração de Batalha — próximo ataque com vantagem */
  allyAttackAdvantage?: boolean;
  /** Reflexos de Masmorra — pode deslocar 1 hex como reação */
  reactionShiftReady?: boolean;
  /** Dano extra no próximo golpe (Canalizar Energia) */
  bonusDamageFormula?: string;
  /** Próximo ataque à distância com vantagem (Tiro Certeiro) */
  rangedAttackAdvantage?: boolean;
  /** Raios de Enfraquecimento etc. — desvantagem em ataques e testes de FOR */
  weakened?: boolean;
  /** Antídoto de masmorra (POC-05) — vantagem em salvaguardas vs veneno */
  saveAdvantagePoison?: boolean;
  /** Resistência a tipos de dano (POC-10 … POC-12) — metade do dano */
  damageResist?: string[];
  /** Condições Eldarin Cap. 3.4 */
  conditions?: import("@/lib/combat/conditions").TokenCondition[];
  /** Buffs/debuffs/condições com contador de turno ou rodada */
  timedEffects?: import("@/lib/combat/timed-effects").TimedEffect[];
  /** Recargas de magias/habilidades — chave packId:entryId */
  actionRecharge?: Record<string, import("@/lib/combat/recharge").ActionRechargeState>;
  /** Chi (Espiritualista) — renovado a cada combate */
  chi?: number;
  chiMax?: number;
  /** Chi gasto neste turno (máx. 2) */
  chiSpentThisTurn?: number;
};

export type BattlePing = {
  id: string;
  q: number;
  r: number;
  color: string;
  author: string;
  at: number;
};

/** Parede ou objeto na camada de masmorra — bloqueia tokens. */
export type DungeonObjectKind = "wall" | "object";

export type DungeonObject = {
  id: string;
  kind: DungeonObjectKind;
  q: number;
  r: number;
};

export type MapMarkupKind =
  | "freehand"
  | "line"
  | "rect"
  | "circle"
  | "arrow"
  | "polygon"
  | "text";

export type MapMarkupDurability = "temporary" | "permanent";

/** Marcação desenhada na lousa do mapa (coordenadas do tabuleiro). */
export type MapMarkup = {
  id: string;
  kind: MapMarkupKind;
  durability: MapMarkupDurability;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  text?: string;
  author: string;
  createdAt: number;
  /** Só para temporárias — removida automaticamente após este instante */
  expiresAt?: number;
};

export type BattleScene = {
  id: string;
  name: string;
  gridRadius: number;
  hexSize: number;
  tokens: BattleToken[];
  /** Camada de piso — URL da imagem de fundo abaixo do grid */
  mapImageUrl?: string | null;
  /** Escala do mapa (1 = automático ao grid) */
  mapImageScale?: number;
  mapImageOffsetX?: number;
  mapImageOffsetY?: number;
  /** Fog of war — jogadores só veem hexes revelados + visão dos próprios tokens */
  fogEnabled?: boolean;
  /** Chaves "q,r" reveladas permanentemente */
  revealedHexes?: string[];
  /** Camada de objetos/paredes — mestre edita; tokens não podem ocupar esses hexes */
  dungeonObjects?: DungeonObject[];
  /** Lousa — desenhos e anotações sobre o mapa */
  mapMarkups?: MapMarkup[];
};
