import type { Axial } from "./grid-math";

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
  /** PA guardados para o próximo turno (legado) */
  bankedPa?: number;
  /** Débito de reação — reduz recuperação no próximo turno. */
  paRecoveryDebt?: number;
  /** Estribilhos (nv.0) conjurados neste turno por entryId. */
  estribilhoCasts?: Record<string, number>;
  /** Contador de morte (−1 ao cair em 0 HP; +1/rodada sem cura). */
  deathTurns?: number;
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
  /** Usuário delegado pode pilotar este token (D9/D21). */
  delegatedToUserId?: string | null;
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
  /** Imagem circular na célula — sync do Actor.tokenImageUrl */
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
  /** Tamanho corporal — Médio 1 célula · Grande 4 · Gigante 9 · … */
  creatureSize?: import("@/lib/vtt/creature-size").CreatureSize;
  /** @deprecated use creatureSize */
  footprint?: "medium" | "small";
  /** Criatura que pode dividir célula com outra pequena */
  sharedCell?: boolean;
  /** Células gastas no turno atual */
  movementSpentCells?: number;
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
  /** Reflexos de Masmorra — pode deslocar 1 célula como reação */
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
  /** O Um Anel — presente só em tokens de mesas com rpgSystemId "um-anel". */
  torCombat?: TorCombatTokenFields;
};

/**
 * Bag leve do Um Anel embutido direto no token — espelha o padrão já usado por
 * `gmCreatureStats` pra criaturas sem ficha completa, mas com tipo próprio
 * (Bloqueio/Proteção/Nível de Atributo não fazem sentido no vocabulário Eldarin).
 * `vida`/`vidaMax`/`defeated` (campos genéricos acima) representam a Resistência.
 */
export type TorCombatTokenFields = {
  kind: "hero" | "adversary";
  /** Só kind:"hero" — FK pra um_anel_characters, nunca pra room.actors. */
  torCharacterId?: string;
  /** Bloqueio — vira TN de quem ataca este token. */
  parry: number;
  /**
   * Quanto do Bloqueio vem do escudo — precisa ser separável porque Quebrar
   * Escudo tira exatamente essa parcela. Sem guardar, o motor não teria como
   * saber quanto subtrair de um `parry` já somado.
   */
  shieldParryBonus?: number;
  /**
   * Escudo destroçado por Quebrar Escudo. NÃO é efeito de rodada: o livro não dá
   * prazo, o escudo fica quebrado até ser substituído ou consertado — o que
   * acontece de graça no próximo assentamento (cap. 5 §Itens de Valor Superior).
   */
  shieldBroken?: boolean;
  /**
   * Agarrado por um adversário: "a vítima só pode lutar em postura Avançada
   * fazendo ataques de Briga". Também dura além da rodada — sai gastando um
   * ícone de Sucesso numa rolagem de ataque bem-sucedida.
   */
  grappled?: boolean;
  /**
   * Só herói — Empurrão em aberto: a última perda de Resistência que ainda pode
   * ser reduzida à metade "escolhendo ser empurrado" (06-fases-de-aventura-combate.md).
   *
   * Fica guardado porque a escolha é do jogador **depois** de ver o dano, e o
   * ataque é uma requisição só, feita por outra pessoa (quem ataca). Sem a
   * oferta gravada, o defensor não teria sobre o que decidir.
   */
  pushOffer?: { loss: number; round: number };
  /** Rodada em que o herói já foi empurrado — "uma vez por rodada". */
  pushedRound?: number;
  /** Nº de Dados de Proteção da armadura vestida (teste de Golpe Perfurante). */
  protectionDice: number;
  /** Só herói — TN de ataque = 20 - força + Bloqueio do alvo. */
  strength?: number;
  /** Só adversário — graduação de sucesso no ataque dele. */
  attributeLevel?: number;
  /** Só adversário — ações de ataque embutidas do compêndio (evita 2ª consulta). */
  actions?: import("@/lib/character/um-anel/adversary-types").TorAdversaryAction[];
  /** Herói já com 1 Ferida marcada — a próxima é fatal. */
  wounded: boolean;
  /**
   * Só adversário — Vigor: "o número de Ferimentos necessários para abater um
   * inimigo de vez, e o número de ataques que ele pode fazer durante uma rodada"
   * (08-mestre-e-adversarios.md). Ausente é tratado como 1.
   */
  might?: number;
  /** Só adversário — Ferimentos acumulados; ao alcançar o Vigor, é eliminado. */
  wounds?: number;
  /**
   * Só adversário — Ódio (lacaios do Inimigo) ou Resolução (Homens Maus e outros
   * não monstruosos). Mesma função que a Esperança tem para o herói: o Mestre
   * gasta para *ganhar (1d)* numa rolagem, e várias Habilidades Sinistras exigem
   * o gasto (08-mestre-e-adversarios.md).
   *
   * Ficava só no bestiário e nunca chegava à mesa: o Mestre não tinha onde ver
   * nem como gastar, então metade do bloco do adversário era decorativa.
   */
  hate?: number;
  hateMax?: number;
  /**
   * Só adversário — Exausto: "se uma criatura começa uma rodada sem pontos de
   * Ódio ou Resolução, ela é considerada Exausta" (08-mestre-e-adversarios.md).
   *
   * Guardado no token, e não derivado de `hate <= 0` na hora da rolagem, porque
   * o livro garante ao Mestre o direito de gastar o ÚLTIMO ponto numa Habilidade
   * Sinistra. Derivar na hora puniria esse gasto na mesma rodada; a Exaustão só
   * vale a partir da rodada seguinte.
   */
  weary?: boolean;
  /** Qual dos dois nomes usar na tela — muda o texto, não a mecânica. */
  hateKind?: "hate" | "resolve";
  /**
   * Só adversário — Habilidades Sinistras do bloco, como texto.
   *
   * Não são mecanizadas de propósito: quase todas são gastos OPCIONAIS ("gaste 1
   * de Ódio para…"), decisão do Mestre. Mesmo critério das Virtudes — o que é
   * opcional não dispara sozinho. O que o app faz é pôr o texto e o contador na
   * frente de quem decide.
   */
  fellAbilities?: import("@/lib/character/um-anel/adversary-types").TorAdversaryFellAbility[];
  /**
   * Postura de Combate do herói (Avançada/Aberta/Defensiva/Retaguarda).
   *
   * Opcional de propósito: token gravado antes deste campo simplesmente lê como
   * Aberta (`TOR_DEFAULT_STANCE`), que é a postura neutra — não altera nenhum
   * número. Isso dispensa migração de sala salva.
   *
   * Adversário não escolhe postura: o livro diz que a mecânica retrata só o
   * ponto de vista do herói (06-fases-de-aventura-combate.md §Stances).
   */
  stance?: import("@/lib/combat/um-anel/stances").TorStanceId;
  /**
   * Efeitos com duração de rodada (Tarefas de Combate). Opcional — token de sala
   * antiga simplesmente não tem nenhum, que é o mesmo que a lista vazia.
   */
  roundEffects?: import("@/lib/combat/um-anel/round-effects").TorRoundEffect[];
  /** Adversário eliminado (Ferimentos = Vigor, ou Resistência 0). */
  eliminated: boolean;
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
  cellSize: number;
  tokens: BattleToken[];
  /** Camada de piso — URL da imagem de fundo abaixo do grid */
  mapImageUrl?: string | null;
  /** Escala do mapa (1 = automático ao grid) */
  mapImageScale?: number;
  mapImageOffsetX?: number;
  mapImageOffsetY?: number;
  /** Jogadores só veem células reveladas + visão dos próprios tokens */
  fogEnabled?: boolean;
  /** Chaves "q,r" reveladas permanentemente */
  revealedCells?: string[];
  /** Camada de objetos/paredes — mestre edita; tokens não podem ocupar essas células */
  dungeonObjects?: DungeonObject[];
  /** Lousa — desenhos e anotações sobre o mapa */
  mapMarkups?: MapMarkup[];
};
