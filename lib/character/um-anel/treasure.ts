import type {
  TorBlessingCategory,
  TorCursedItemEffect,
  TorEnchantedReward,
  TorHoardTier,
} from "./treasure-types";

/** Tabela de Tesouros (Hoards) — livro, "Hoards". */
export const TOR_HOARD_TABLE: TorHoardTier[] = [
  {
    id: "menor",
    label: "Menor",
    examples: "Espólio de um único Troll, saque de Goblin, tesouro de bandidos",
    treasureValue: "Role 1 Dado de Sucesso",
    magicalTreasureRolls: "Role o Dado de Proeza 2 vezes",
  },
  {
    id: "maior",
    label: "Maior",
    examples: "Tesouro antigo, tesouro Anão",
    treasureValue: "Role 2 Dados de Sucesso",
    magicalTreasureRolls: "Role o Dado de Proeza 4 vezes",
  },
  {
    id: "maravilhoso",
    label: "Maravilhoso",
    examples: "Tesouro ancestral, cofre de uma cidade Anã, tesouro de Dragão",
    treasureValue: "Role 3 Dados de Sucesso",
    magicalTreasureRolls: "Role o Dado de Proeza 6 vezes",
  },
];

/** Recompensas Encantadas — qualidades de Armas e Armaduras Famosas (máx. 3 por item, mín. 1 encantada). */
export const TOR_ENCHANTED_REWARDS: TorEnchantedReward[] = [
  {
    id: "ajuste-ancestral",
    name: "Ajuste Ancestral",
    craftsmanship: "Élfico, Anão",
    item: "Armadura, Elmo",
    description: "Ao fazer uma rolagem de PROTEÇÃO usando uma peça de armadura ou elmo com essa qualidade, some 3 ao resultado, ou um bônus igual ao seu Valor, o que for maior.",
  },
  {
    id: "fabricacao-ancestral-engenhosa",
    name: "Fabricação Ancestral Engenhosa",
    craftsmanship: "Élfico, Anão",
    item: "Armadura, Elmo ou Escudo",
    description: "Reduz a Carga do item em 3 pontos, ou pelo seu Valor, o que for maior (mínimo de 0 de Carga).",
  },
  {
    id: "sinistro-superior",
    name: "Sinistro Superior",
    craftsmanship: "Élfico, Numenoreano",
    item: "Qualquer arma",
    special: "Perdição (se Numenoreana)",
    description: "Se a arma é Élfica, some 4 ao Ferimento. Se é Numenoreana, some 2 ao Ferimento, ou um bônus igual ao Valor do portador (o que for maior) se usada contra uma criatura de Perdição.",
  },
  {
    id: "grave-superior",
    name: "Grave Superior",
    craftsmanship: "Anão, Numenoreano",
    item: "Qualquer arma",
    special: "Perdição (se Numenoreana)",
    description: "Se a arma é Anã, some 2 ao Dano. Se é Numenoreana, some 1 ao Dano, ou um bônus igual ao Valor do portador se usada contra uma criatura de Perdição.",
  },
  {
    id: "afiado-superior",
    name: "Afiado Superior",
    craftsmanship: "Anão, Élfico",
    item: "Qualquer arma",
    special: "Perdição (se Élfica)",
    description: "Se Anã, causa Golpe Perfurante em 8+. Se Élfica, causa Golpe Perfurante em 9+, ou em (10 − Valor do portador) se usada contra uma criatura de Perdição.",
  },
  {
    id: "reforcado-superior",
    name: "Reforçado Superior",
    craftsmanship: "Qualquer",
    item: "Escudo",
    special: "Perdição (se Élfico ou Numenoreano)",
    description: "Some 2 ao bônus de Bloqueio do escudo. Se Numenoreano ou Élfico, some 1 a mais, ou um bônus igual ao Valor do portador contra uma criatura de Perdição.",
  },
  {
    id: "dardo-mordaz",
    name: "Dardo Mordaz",
    craftsmanship: "Élfico",
    item: "Arma à distância",
    special: "Perdição",
    description: "Ao acertar o alvo com essa arma, ele também sofre perda de 1 ponto de Ódio ou Resolução — 3 pontos se for uma criatura de Perdição.",
  },
  {
    id: "fendente",
    name: "Fendente",
    craftsmanship: "Qualquer",
    item: "Arma corpo a corpo",
    description: "Ao matar um inimigo com essa arma, você pode imediatamente atacar um segundo adversário engajado com você.",
  },
  {
    id: "chama-da-esperanca",
    name: "Chama da Esperança",
    craftsmanship: "Anão",
    item: "Arma corpo a corpo",
    description: "Ao acertar o alvo com essa arma, todos os membros da Companhia (você incluído) recuperam 1 ponto de Resistência, +1 por cada ícone de sucesso rolado.",
  },
  {
    id: "extermínio-de-inimigos",
    name: "Extermínio de Inimigos",
    craftsmanship: "Élfico, Numenoreano",
    item: "Qualquer arma",
    special: "Perdição",
    description: "Ao causar Golpe Perfurante numa criatura de Perdição, a rolagem de PROTEÇÃO do alvo fica Desfavorecida. Se já estivesse Desfavorecida por outro motivo, o Golpe Perfurante causa uma Ferida automática.",
  },
  {
    id: "brilho-do-terror",
    name: "Brilho do Terror",
    craftsmanship: "Anão",
    item: "Arma corpo a corpo",
    description: "Ao acertar o alvo com essa arma, ele também sofre perda de 2 pontos de Ódio ou Resolução.",
  },
  {
    id: "martelante",
    name: "Martelante",
    craftsmanship: "Qualquer",
    item: "Arma corpo a corpo",
    description: "Uma criatura atingida por essa arma que sofra perda de Resistência igual ou superior ao dobro de seu Nível de Atributo também é derrubada e deve gastar sua próxima ação principal se levantando.",
  },
  {
    id: "aco-oco",
    name: "Aço Oco",
    craftsmanship: "Numenoreano",
    item: "Arcos",
    special: "sem Perdição necessária",
    description: "Você sempre pode fazer uma flechada de abertura adicional, mesmo quando nenhuma é permitida (a menos que esteja surpreendido).",
  },
  {
    id: "luminescencia",
    name: "Luminescência",
    craftsmanship: "Élfico",
    item: "Arma corpo a corpo",
    special: "Perdição",
    description: "A lâmina brilha com uma luz pálida e fria quando uma criatura de Perdição está por perto. Você e toda a Companhia têm sucesso automático em rolagens pra evitar emboscadas dessas criaturas.",
  },
  {
    id: "armadura-de-mithril",
    name: "Armadura de Mithril",
    craftsmanship: "Anão",
    item: "Armadura de Malha",
    description: "Uma camisa e um sobretudo de malha de Mithril têm Carga 3 e 6, respectivamente.",
  },
  {
    id: "armadura-runica",
    name: "Armadura Rúnica",
    craftsmanship: "Anão",
    item: "Armadura",
    description: "Ao fazer um teste de PROTEÇÃO usando essa armadura, ignore os efeitos de estar Arrasado ou Exausto.",
  },
  {
    id: "elmo-runico",
    name: "Elmo Rúnico",
    craftsmanship: "Anão",
    item: "Elmo",
    description: "Ao fazer uma rolagem de Perícia numa Tarefa de Combate usando esse elmo, ignore os efeitos de estar Arrasado ou Exausto.",
  },
  {
    id: "escudo-runico",
    name: "Escudo Rúnico",
    craftsmanship: "Anão",
    item: "Escudo",
    description: "Lutando com esse escudo, rolagens de ataque contra você são feitas como se o adversário estivesse Exausto.",
  },
  {
    id: "arma-runica",
    name: "Arma Rúnica",
    craftsmanship: "Anão, Élfico",
    item: "Qualquer arma",
    description: "Ao fazer uma rolagem de ataque usando essa arma, ignore os efeitos de estar Arrasado ou Exausto.",
  },
  {
    id: "voo-reto",
    name: "Voo Reto",
    craftsmanship: "Qualquer",
    item: "Arma à distância",
    description: "O portador sempre tem um tiro limpo, mesmo atirando contra vento forte ou com o alvo protegido pela escuridão — ignora modificadores negativos por complicações.",
  },
];

/** Bênçãos — o que um Artefato Maravilhoso/Item Prodigioso concede (Cap. "Marvellous Artefacts and Wondrous Items"). */
export const TOR_BLESSINGS: TorBlessingCategory[] = [
  {
    id: "personalidade",
    label: "Personalidade",
    entries: [
      { rollRange: "1–2", skill: "Fascínio", suggestedItems: "anel, capa, diadema, colar, cinto, bainha de arma, cajado, chifre de guerra" },
      { rollRange: "3–4", skill: "Indução", suggestedItems: "anel, capa, bainha de arma, cajado, chifre de guerra" },
      { rollRange: "5–6", skill: "Persuasão", suggestedItems: "anel, capa, diadema, colar" },
    ],
  },
  {
    id: "movimento",
    label: "Movimento",
    entries: [
      { rollRange: "1–2", skill: "Atletismo", suggestedItems: "corda, botas, sapatos" },
      { rollRange: "3–4", skill: "Viagem", suggestedItems: "cajado, cinto, botas" },
      { rollRange: "5–6", skill: "Furtividade", suggestedItems: "anel, capa, sapatos" },
    ],
  },
  {
    id: "percepcao",
    label: "Percepção",
    entries: [
      { rollRange: "1–2", skill: "Vigilância", suggestedItems: "anel, diadema, colar" },
      { rollRange: "3–4", skill: "Discernimento", suggestedItems: "anel, diadema, colar" },
      { rollRange: "5–6", skill: "Busca", suggestedItems: "anel, diadema, cajado" },
    ],
  },
  {
    id: "sobrevivencia",
    label: "Sobrevivência",
    entries: [
      { rollRange: "1–2", skill: "Caçada", suggestedItems: "cinto, chifre de caça, cajado" },
      { rollRange: "3–4", skill: "Cura", suggestedItems: "incomum — poções e unguentos perdem a virtude rápido" },
      { rollRange: "5–6", skill: "Exploração", suggestedItems: "botas, cajado, rolo de corda" },
    ],
  },
  {
    id: "costume",
    label: "Costume",
    entries: [
      { rollRange: "1–2", skill: "Cortesia", suggestedItems: "anel, diadema, par de brincos" },
      { rollRange: "3–4", skill: "Música", suggestedItems: "anel, instrumento musical" },
      { rollRange: "5–6", skill: "Enigma", suggestedItems: "anel" },
    ],
  },
  {
    id: "vocacao",
    label: "Vocação",
    entries: [
      { rollRange: "1–2", skill: "Ofício", suggestedItems: "anel, ferramenta de ofício" },
      { rollRange: "3–4", skill: "Batalha", suggestedItems: "coroa, anel, cajado, chifre de guerra — raro, geralmente pertence a armas" },
      { rollRange: "5–6", skill: "História", suggestedItems: "espelho, livro, palantír" },
    ],
  },
];

/** Itens Amaldiçoados — exemplos de Maldições que podem acompanhar um Tesouro Mágico. */
export const TOR_CURSED_ITEMS: TorCursedItemEffect[] = [
  {
    id: "maldicao-da-fraqueza",
    name: "Maldição da Fraqueza",
    description: "O herói amaldiçoado exibe a pior Falha ligada ao seu próprio Caminho da Sombra (Covarde/Vagueação-louca, Amedrontado/Caminho do Desespero, Assassino/Maldição da Vingança, Ladrão/Mal do Dragão, Tirânico/Fascínio pelo Poder, Traiçoeiro/Fascínio pelos Segredos). Considerada temporária — não conta pra Sucumbir à Sombra.",
  },
  {
    id: "escurecer",
    name: "Escurecer",
    description: "Quando o item é revelado (uma espada é desembainhada, uma luva é removida revelando um anel), todas as sombras ao redor parecem se aprofundar. Isso causa perda de (1d) em todas as rolagens apropriadas do portador.",
  },
  {
    id: "cacado",
    name: "Caçado",
    description: "A presença do item não passa despercebida — um tipo de inimigo (Orcs, Homens Maus, o Inimigo) percebe quando se aproxima dele. Eventos de jornada da Companhia podem passar a girar em torno dessa caçada.",
  },
  {
    id: "ma-sorte",
    name: "Má Sorte",
    description: "O azar persegue o portador a cada passo. Um resultado de Olho no Dado de Proeza em qualquer rolagem significa falha automática pro portador (como se estivesse Arrasado).",
  },
  {
    id: "mau-presságio",
    name: "Mau Presságio",
    description: "A chegada do portador é precedida por avisos sombrios. Todas as rolagens feitas pelo portador durante um Conselho perdem (1d).",
  },
  {
    id: "malicia",
    name: "Malícia",
    description: "O item não ama seu portador e tenta prejudicá-lo. Se uma rolagem envolve o item (Perícia com Bênção, ataque com a arma, Proteção com a armadura), o companheiro é impedido de gastar Esperança pra ganhar dados bônus.",
  },
  {
    id: "possuido",
    name: "Possuído",
    description: "O item pertence ou foi criado por outra criatura, e pode ter chegado às mãos do herói só pra retornar ao seu dono. Perto do dono original, o item fica completamente inútil.",
  },
  {
    id: "mancha-da-sombra",
    name: "Mancha da Sombra",
    description: "O item carrega uma mancha de sombra maior que a maioria — enquanto o herói o carrega, sua Sombra é aumentada (1 ponto por Bênção de um Artefato, 2 de um Item Prodigioso; o dobro do nº de Recompensas Encantadas numa Arma/Armadura Famosa). Esse aumento não pode ser removido até a Maldição ser levantada.",
  },
  {
    id: "enfraquecimento",
    name: "Enfraquecimento",
    description: "A Maldição corrói o portador com uma fraqueza terrível. O Mestre escolhe Força, Coração ou Astúcia — o NA do Atributo associado sobe 2 pontos.",
  },
];
