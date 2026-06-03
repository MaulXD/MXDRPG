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
  ownerRole: "mestre" | "jogador";
  /** Foundry: token linkado ao Actor — stats vêm da ficha */
  actorId?: string;
  linked?: boolean;
  nivel?: number;
  vida?: number;
  vidaMax?: number;
  defesa?: number;
  /** Imagem circular no hex — sync do Actor.tokenImageUrl */
  imageUrl?: string | null;
  /** Iniciativa rolada (ordem de combate) */
  initiative?: number;
  /** Compêndio monstros — token NPC */
  monsterEntryId?: string;
  /** mob · mini · boss — anel na mesa */
  monsterTier?: import("@/lib/vtt/monsters").MonsterTier;
  /** Elite ou Colossal na invocação */
  monsterVariant?: import("@/lib/vtt/monster-scaling").MonsterSpawnVariant;
  /** Foco da imagem no token (sync da ficha) */
  imageFocus?: import("@/lib/media/portrait-focus").PortraitFocus;
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
  /** Condições Eldarin Cap. 3.4 */
  conditions?: import("@/lib/combat/conditions").TokenCondition[];
};

export type BattleScene = {
  id: string;
  name: string;
  gridRadius: number;
  hexSize: number;
  tokens: BattleToken[];
};
