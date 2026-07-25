/**
 * Tesouro Mágico do Um Anel (2ª ed.) — extraído de
 * livros/um-anel/08-mestre-e-adversarios.md ("Treasure" até "Cursed Items").
 * Conteúdo de referência pro Mestre (compêndio) — não mecanizado (gerar
 * tesouro/rolar Achado Mágico continua sendo decisão de mesa, não automático).
 */

export type TorHoardTier = {
  id: string;
  label: string;
  examples: string;
  treasureValue: string;
  magicalTreasureRolls: string;
};

/** Uma Recompensa Encantada — qualidade mágica de Armas e Armaduras Famosas. */
export type TorEnchantedReward = {
  id: string;
  name: string;
  craftsmanship: string;
  item: string;
  special?: string;
  description: string;
};

export type TorBlessingEntry = {
  rollRange: string;
  skill: string;
  suggestedItems: string;
};

export type TorBlessingCategory = {
  id: string;
  label: string;
  entries: TorBlessingEntry[];
};

export type TorCursedItemEffect = {
  id: string;
  name: string;
  description: string;
};
