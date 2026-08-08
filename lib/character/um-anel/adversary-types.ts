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
  /**
   * Ferimento: o NA do Teste de Proteção que um Golpe Perfurante obriga o alvo a
   * fazer. NÃO é o limiar do golpe — esse é fixo em 10 ou [Runa] no Dado de
   * Proeza. E não confundir com o Dano Especial PERFURAR, que gasta 1 ícone de
   * Sucesso pra somar +1/+2/+3 ao resultado do Dado de Proeza.
   */
  injury: number;
  /** Opções de Dano Especial disponíveis (texto — não mecanizadas no v1). */
  specialDamage?: string[];
  /**
   * Ação feita com arma à distância (Arco, Arco de Chifre).
   *
   * Decide alcance contra a postura do herói: "Você pode atacar seus adversários
   * usando apenas armas à distância, e só pode ser alvo de atacantes usando armas
   * similares" (06-fases-de-aventura-combate.md §Postura de Retaguarda). Sem esta
   * marca todo adversário conta como corpo a corpo, e o Arqueiro Goblin não
   * conseguia acertar quem estivesse na Retaguarda — que é justamente o alvo dele.
   */
  ranged?: boolean;
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
  /**
   * Criatura **maior que humana**, para os limites de engajamento (POS-R03): um
   * herói é engajado por até 3 humanos **ou 2 grandes**, e até 6 heróis podem
   * cercar um grande contra 3 num humano.
   *
   * Marcada só onde o livro diz: o texto dá "criaturas grandes (**como Trolls**)"
   * como exemplo, e é o único critério explícito na fonte. Vigor 2 NÃO serve de
   * atalho — mede Ferimentos para abater, não tamanho, e há adversários de Vigor
   * 2 do tamanho de um homem.
   */
  large?: boolean;
  description?: string;
};
