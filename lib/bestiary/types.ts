/** Memória de combate de um jogador sobre um tipo de monstro na aventura. */
export type PlayerMonsterAttackRecord = {
  messageId: string;
  at: number;
  attackerTokenId: string;
  weaponName: string;
  actionKind: "weapon" | "spell" | "unarmed" | "ability";
  hit: boolean;
  /** Dano que o monstro causou neste jogador neste golpe. */
  damageToPlayer: number;
  detail: string;
};

export type PlayerBestiaryEntry = {
  typeKey: string;
  monsterEntryId?: string;
  gmCreationId?: string;
  displayName: string;
  /** Ataques que este tipo de monstro executou contra o jogador na mesa. */
  attacksAgainstPlayer: PlayerMonsterAttackRecord[];
  /** Dano total que o jogador causou a criaturas deste tipo. */
  damageDealtByPlayer: number;
  /** Quantas vezes o jogador participou de abater este tipo. */
  killCount: number;
  /** Vida máxima inferida após matar pelo menos um exemplar. */
  hpMaxKnown?: number;
  updatedAt: number;
};

/** Resposta sanitizada para o painel do jogador — sem HP atual. */
export type PlayerMonsterKnowledgeView = {
  displayName: string;
  typeKey: string;
  attacksAgainstPlayer: PlayerMonsterAttackRecord[];
  damageDealtByPlayer: number;
  killCount: number;
  hpMaxKnown: number | null;
  hasAnyKnowledge: boolean;
};

/** Visão do mestre — bestiário completo de um jogador na aventura. */
export type PlayerBestiaryGmView = {
  playerUserId: string;
  playerName: string;
  characterName: string;
  entries: PlayerMonsterKnowledgeView[];
};
