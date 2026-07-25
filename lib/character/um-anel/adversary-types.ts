/**
 * Adversários do Um Anel (2ª ed.) — formato simplificado do livro (Attribute Level,
 * Might, Hate/Resolve, Parry, Armour) usado só pelo Mestre, sem ficha completa.
 * Regras extraídas de livros/um-anel/08-mestre-e-adversarios.md ("Format of Presentation").
 */

export type TorAdversaryAction = {
  id: string;
  label: string;
  /** Graduação da Proficiência de Combate do adversário nessa arma. */
  rating: number;
  damage: number;
  /** Golpe Perfurante dispara em Proeza ≥ este valor (10 ou Runa cobre a maioria). */
  injury: number;
  /** Opções de Dano Especial disponíveis (texto — não mecanizadas no v1). */
  specialDamage?: string[];
};

export type TorAdversaryFellAbility = {
  name: string;
  text: string;
};

export type TorAdversaryTier = "mob" | "elite" | "boss";

export type TorAdversaryStats = {
  id: string;
  name: string;
  /** Traços de sabor ("Cruel, Hardened") — não são Traços Distintivos mecânicos no v1. */
  traits?: string;
  tier: TorAdversaryTier;
  attributeLevel: number;
  endurance: number;
  might: number;
  hate: number;
  /** "hate" = servo do Inimigo (nunca foge/negocia) · "resolve" = adversário não-monstro. */
  hateKind: "hate" | "resolve";
  /** Bônus somado ao NA de Força do herói atacante. 0 quando o livro lista "–". */
  parry: number;
  /** Nº de Dados de Proteção no teste de Golpe Perfurante. */
  armour: number;
  actions: TorAdversaryAction[];
  fellAbilities?: TorAdversaryFellAbility[];
  description?: string;
};
