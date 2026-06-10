/** Atlas jogável — lugares, cenários e nações de Eldarin (v4). */

export type PlaceKind =
  | "reino"
  | "cidade"
  | "vilarejo"
  | "fortaleza"
  | "torre"
  | "santuario"
  | "cenario"
  | "rota";

export type WorldPlace = {
  id: string;
  name: string;
  kind: PlaceKind;
  region: string;
  population?: string;
  boca?: string;
  devotion?: string;
  summary: string;
  lore: string;
  hooks?: string[];
};

export const WORLD_REGIONS = [
  "Coroa de Valdremor",
  "Marches do Sul",
  "Litoral Oriental",
  "Planície Central",
  "Norte Glacial",
  "Deserto Roxo",
  "Planalto do Céu",
  "Vesper e Oeste",
  "Confederação Gnomica",
  "Clãs das Profundezas",
  "Rotas e Fronteiras",
] as const;

export const WORLD_PLACES: WorldPlace[] = [
  // — Reinos e estados —
  {
    id: "valdremor",
    name: "Reino de Valdremor",
    kind: "reino",
    region: "Coroa de Valdremor",
    population: "Milhões (continente)",
    summary: "Monarquia feudal no coração do continente; sindicato dos exploradores e guildas culinárias.",
    lore:
      "Valdremor não governa todas as Bocas, mas suas estradas em estrela ligam Ossenfurt a cada entrada nomeada. Lei: 5% da renda de expedição ao sindicato; registro obrigatório ao descer. Forjados têm status de pessoa plena na capital, propriedade disputada em Khaz-Durin.",
    hooks: ["Corrida eleitoral no sindicato", "Princesa quer descer pessoalmente à Boca Rosada"],
    devotion: "Valdrun, Vesna, Korrath",
  },
  {
    id: "vesper-republica",
    name: "República de Vesper",
    kind: "reino",
    region: "Vesper e Oeste",
    population: "Grande cidade-estado",
    boca: "Dourada",
    devotion: "Sorn, Luneth",
    summary: "Cidade-estado acadêmica sobre a Boca Dourada; tributo simbólico em mapas e pesquisas.",
    lore:
      "47 professores mortos na masmorra; 12.000 artigos publicados; Andar 4 ainda inexplicado. Não é província de Valdremor — negocia autonomia com mapas. Leitores de Sorn dominam o Arquivo Vivo; extremistas do Convento do Olho Aberto operam nas sombras.",
    hooks: ["Núcleo de golem roubado", "Concurso de tese sobre Boca Vazia"],
  },
  {
    id: "ferromur",
    name: "Cidade-livre de Ferromur",
    kind: "reino",
    region: "Industrial",
    population: "Grande",
    boca: "Cinza",
    devotion: "Valdrun, Brasa-Reinante",
    summary: "Guilda industrial anã e humana; fábricas sobre a Boca Cinza.",
    lore:
      "Ferramentas orgânicas têm isenção de exportação. Golems de patrulha vigiem becos de Chaminé Baixa. Metal sagrado de Valdrun não oxida perto da Boca Cinza — peregrinação anual ao Santuário da Mão Forjadora.",
    hooks: ["Greve dos operários", "Vazamento de gás cinza no andar 1"],
  },
  {
    id: "confederacao-gnomica",
    name: "Confederação das Torres Gnômicas",
    kind: "reino",
    region: "Confederação Gnomica",
    summary: "Rede de torres-laboratório autônomas; tratado de mutualismo com Valdremor.",
    lore:
      "Cada torre é vila murada + laboratório. Ingredientes frescos em troca de proteção militar. Gnomos não reconhecem divindades humanas oficialmente — mas oferecem incenso a Sorn e ao Primeiro Cozinheiro por convenção acadêmica.",
    hooks: ["Torre do Relógio Quebrado pede escolta", "Veneno catalogado desaparece"],
  },
  {
    id: "khaz-durin",
    name: "Clãs das Profundezas (Khaz-Durin)",
    kind: "reino",
    region: "Clãs das Profundezas",
    devotion: "Valdrun",
    summary: "Salão-clã anão em túneis antigos engolidos pelo submundo.",
    lore:
      "Negocia com Valdremor mas não obedece à coroa. Forjados são 'ferramenta viva' até provarem opinião. Maior concentração de Mestres da Forja fora de Ferromur.",
    hooks: ["Disputa de sucessão do salão", "Mapa de veia perdida resurface"],
  },

  // — Cidades —
  {
    id: "ossenfurt",
    name: "Ossenfurt",
    kind: "cidade",
    region: "Coroa de Valdremor",
    population: "Metrópole",
    devotion: "Valdrun, Primeiro Cozinheiro, Korrath",
    summary: "Capital; Academia de Culinária; Palácio das Medidas; Grande Mercado de Especiarias.",
    lore:
      "Centro da Estrada das Onze Bocas. Tribunal do sindicato no castelo real. Altar ao Primeiro Cozinheiro na Academia. Lei dos Forjados: pessoa plena. 3 a 10 dias de carroça até qualquer Boca nomeada.",
    hooks: ["Leilão de especiaria lendária", "Embaixador de Mirraga desaparece"],
  },
  {
    id: "kravenholm",
    name: "Kravenholm",
    kind: "cidade",
    region: "Marches do Sul",
    population: "Média",
    boca: "Vermelha",
    devotion: "Korrath, Brasa-Reinante",
    summary: "Mineração, forjas reais licenciadas, tavernas de mineiros.",
    lore:
      "Última cidade grande antes da Boca Vermelha. Fortaleza Kraven vigia draconídeos menores. Pedra vulcânica exportada para todo o reino. Taverna 'O Crisol' é templo não-oficial de Brasa-Reinante.",
    hooks: ["Corrida de carroças com pólvora", "Mapa falso vendido a novatos"],
  },
  {
    id: "salmour",
    name: "Salmour",
    kind: "cidade",
    region: "Litoral Oriental",
    population: "Média",
    boca: "Azul",
    devotion: "Thalor, Mira",
    summary: "Porto, faróis, pesca e contrabando de tinta abissal.",
    lore:
      "Docas esculpidas em penhascos. Pescadores juram por Thalor; alguns recusam comer 'o que veio de baixo'. Caravanas marítimas alimentam Ossenfurt. Culto de Mira nos bairros baixos — oferendas de algas.",
    hooks: ["Kraken menor avistado", "Farol apaga três noites seguidas"],
  },
  {
    id: "skeldhaug",
    name: "Skeldhaug",
    kind: "cidade",
    region: "Norte Glacial",
    population: "Pequena",
    boca: "Branca",
    devotion: "Mira, Vesna",
    summary: "Casas enterradas no gelo; depósitos de conservação.",
    lore:
      "Bastião Skeld abastece expedições à Boca Branca. Carne congelada é moeda informal. Contrabando de pelo de yeti por Gelo-Partilhado. Purificadoras de Vesna visitam na primavera para benzer estoques.",
    hooks: ["Avalanche revela entrada lateral", "Yeti domesticado?"],
  },
  {
    id: "mirraga",
    name: "Mirraga",
    kind: "cidade",
    region: "Deserto Roxo",
    population: "Pequena (oásis)",
    boca: "Púrpura",
    devotion: "Faca Sem Nome, Luneth",
    summary: "Cidade-oásis; mercado de espelhos; leis contra doppelgängers.",
    lore:
      "Areia roxa reflete rostos de forma estranha à noite. Casa dos Espelhos Quebrados abriga culto da Faca Sem Nome. Torre da Penumbra estuda miméticos. Poços artesianos com água levemente alucinógena em Areia Roxa.",
    hooks: ["Lei marcial contra clones", "Espelho que mostra Boca Vazia"],
  },
  {
    id: "alto-serath",
    name: "Alto Serath",
    kind: "cidade",
    region: "Planalto do Céu",
    population: "Pequena",
    boca: "Laranja",
    devotion: "Mira, Luneth",
    summary: "Mosteiros no planalto; peregrinos descem à Boca Laranja.",
    lore:
      "Poço de Mira concede visões de queda celeste. Ninho Caído guarda estátuas de anjos partidos. Vigias do Véu observam Roda-Lua ao horizonte. Ar rarefeito — penalidade leve sem aclimatação.",
    hooks: ["Peregrinação coincide com aparição da Boca Vazia", "Anjo de pedra sangra"],
  },
  {
    id: "grimwald",
    name: "Grimwald",
    kind: "fortaleza",
    region: "Planície Central",
    population: "Vila-fortaleza",
    boca: "Negra",
    devotion: "Vesna",
    summary: "Castelo-capela; Obelisco de obsidiana visível a léguas.",
    lore:
      "Ordem da Purificação patrulha contra mortos da Boca Negra. Torre do Obelisco: guarnição rotativa; ninguém dorme no porão. 30% de reviver morto-vivo na Boca Negra é lenda urbana — Purificadoras dizem que é maldição.",
    hooks: ["Obelisco pulsa", "Mortos sobem na superfície"],
  },

  // — Vilarejos —
  {
    id: "brasa-pequena",
    name: "Brasa-Pequena",
    kind: "vilarejo",
    region: "Marches do Sul",
    boca: "Vermelha",
    devotion: "Brasa-Reinante",
    summary: "Última parada antes da Boca; estalagens com banho de cinzas.",
    lore: "Mineiros aquecem ossos na lareira comum antes de descer — ritual de Brasa-Reinante. Estalagem 'Três Cinzas' nunca esfria o caldeirão.",
    hooks: ["Estalajadeiro é ex-legionário de Korrath"],
  },
  {
    id: "tres-forjas",
    name: "Três Forjas",
    kind: "vilarejo",
    region: "Marches do Sul",
    devotion: "Valdrun, Brasa-Reinante",
    summary: "Vilarejo anão; contratos de escolta até andar 2.",
    lore: "Três forjas comunitárias nunca param. Disputa amigável entre clérigos de Valdrun e Abrasadores sobre qual metal abençoar primeiro.",
    hooks: ["Contrato quebrado — monstro no andar 1"],
  },
  {
    id: "porto-lugubre",
    name: "Porto Lúgubre",
    kind: "vilarejo",
    region: "Litoral Oriental",
    devotion: "Thalor",
    summary: "Bairro de pescadores; rumores de kraken menor.",
    lore: "Casas sobre palafitas podres. Crianças jogam dados com conchas que sussurram marés. Irmandade da Maré Baixa reza ao anoitecer.",
    hooks: ["Rede puxa osso de leviatã"],
  },
  {
    id: "foz-das-lagrimas",
    name: "Foz das Lágrimas",
    kind: "santuario",
    region: "Litoral Oriental",
    devotion: "Thalor, Mira",
    summary: "Capela flutuante; velas de monstro queimam azul.",
    lore: "Construída sobre destroços de três navios fundidos. Mareantes dizem que Thalor e Mira 'concordam' apenas aqui — ciclo da maré e ciclo da vida.",
    hooks: ["Vela acende sozinha quando Boca Azul inunda"],
  },
  {
    id: "campo-obelisco",
    name: "Campo do Obelisco",
    kind: "cenario",
    region: "Planície Central",
    boca: "Negra",
    devotion: "Vesna",
    summary: "Tendas de registro do sindicato; planície ao pé de Grimwald.",
    lore: "Todo grupo registra-se antes de descer à Negra. Capelões de Vesna abençoam carroças ao amanhecer. Mercado temporário de antídotos e lanternas.",
    hooks: ["Fila de registro sabotada", "Mercador vende mapa do andar 3 'garantido'"],
  },
  {
    id: "vale-podre",
    name: "Vale Podre",
    kind: "vilarejo",
    region: "Planície Central",
    boca: "Verde",
    devotion: "Mira, O Enxame",
    summary: "3 km sem vegetação; famílias com resistência a esporos.",
    lore: "Efluente da Boca Verde matou a flora local há gerações. Colônia do Enxame mantém horta de fungos comestíveis. Torre do Frasco Verde (gnomos) colabora em fermentação.",
    hooks: ["Esporo novo cora em humano", "Criança fala com o Enxame"],
  },
  {
    id: "roda-lua",
    name: "Roda-Lua",
    kind: "vilarejo",
    region: "Planície Central",
    boca: "Vazia",
    devotion: "Luneth",
    summary: "Povoado nômade; rastreia aparição da Boca Vazia.",
    lore: "Tendas movem-se a cada lua cheia. Sonhadores compartilham mapas desenhados em sono. Quando a Boca Vazia aparece, toda a tribo corre — às vezes chegam antes de grupos de Ossenfurt.",
    hooks: ["Boca Vazia a 1 dia da capital", "Dois mapas de sonho contradizem"],
  },
  {
    id: "gelo-partilhado",
    name: "Gelo-Partilhado",
    kind: "vilarejo",
    region: "Norte Glacial",
    boca: "Branca",
    summary: "Armazéns de carne congelada; contrabando de pelo de yeti.",
    lore: "Única estrada glaciar mantida por magia de conservação. Funcionários juram silêncio sobre o que encontram no gelo profundo.",
    hooks: ["Bloco de gelo contém cavaleiro preservado"],
  },
  {
    id: "patio-estudantes",
    name: "Pátio dos Estudantes",
    kind: "vilarejo",
    region: "Vesper e Oeste",
    devotion: "Sorn",
    summary: "Satélite de Vesper; alojamento barato para pupilos.",
    lore: "Barracas e bibliotecas de segunda mão. Primeiro contato de muitos Leitores com a Boca Dourada. Moinho de Pergaminho produz papel que às vezes nasce vivo.",
    hooks: ["Papel vivo escreve nome do PC", "Aposta entre turmas"],
  },
  {
    id: "chamine-baixa",
    name: "Chaminé Baixa",
    kind: "vilarejo",
    region: "Industrial",
    boca: "Cinza",
    summary: "Bairro operário; -1 dano em armas mundanas após andar 3 (efeito regional).",
    lore: "Fuligem eterna. Sindicato mineiro rivaliza com guilda industrial. Crianças nascem com gosto de metal na língua — superstição local.",
    hooks: ["Golem de patrulha desliga e pede ajuda"],
  },
  {
    id: "areia-roxa",
    name: "Areia Roxa",
    kind: "vilarejo",
    region: "Deserto Roxo",
    devotion: "Luneth",
    summary: "Poços artesianos com água levemente alucinógena.",
    lore: "Viajantes veem a Boca Vazia em reflexo da água. Luneth é invocada antes de beber. Caravanas param apenas de dia.",
    hooks: ["Visão coletiva na mesma noite"],
  },
  {
    id: "ninho-caido",
    name: "Ninho Caído",
    kind: "santuario",
    region: "Planalto do Céu",
    devotion: "Mira",
    summary: "Estátuas de anjos partidos; oferendas a Mira.",
    lore: "Dizem que anjos caíram antes das masmorras existirem. Peregrinos deixam brotos verdes nas fissuras. Silêncio absoluto ao meio-dia — tradição.",
    hooks: ["Estátua muda de posição", "Broto floresce em um dia"],
  },

  // — Torres e cenários —
  {
    id: "torre-indice",
    name: "Torre do Índice",
    kind: "torre",
    region: "Confederação Gnomica",
    devotion: "Sorn",
    summary: "Catalogação de venenos; proximidade a Vesper.",
    lore: "Milhares de frascos etiquetados. Visitantes assinam termo de responsabilidade mortal. Gnomos piadas que Sorn foi primeiro aluno.",
    hooks: ["Veneno lendário roubado"],
  },
  {
    id: "torre-frasco-verde",
    name: "Torre do Frasco Verde",
    kind: "torre",
    region: "Confederação Gnomica",
    summary: "Fermentação e slimes; Vale Podre.",
    lore: "Experiências com ooze comestível. Colaboração tensa com culto do Enxame.",
    hooks: ["Slime escapa e sabe ler"],
  },
  {
    id: "torre-relogio-quebrado",
    name: "Torre do Relógio Quebrado",
    kind: "torre",
    region: "Confederação Gnomica",
    devotion: "Valdrun",
    summary: "Automatos e engrenagens; Ferromur.",
    lore: "Relógio central para há 200 anos. Golems têm horário de luto quando peças quebram. Pediu escolta para núcleo roubado na Boca Cinza.",
    hooks: ["Núcleo de golem na mesa"],
  },
  {
    id: "santuario-mao-forjadora",
    name: "Santuário da Mão Forjadora",
    kind: "santuario",
    region: "Industrial",
    devotion: "Valdrun",
    summary: "Metal sagrado não oxida na Boca Cinza.",
    lore: "Anões peregrinam antes de grandes expedições. Bigorna central nunca esfria. Forjados aguardam bênção aqui — alguns recebem.",
    hooks: ["Bigorna rachou — mau agouro"],
  },
  {
    id: "poco-mira",
    name: "Poço de Mira",
    kind: "santuario",
    region: "Planalto do Céu",
    devotion: "Mira",
    summary: "Visões de queda celeste; Alto Serath.",
    lore: "Quem bebe a água sonha com corredores. Clérigos registram sonhos em cordéis. Profundidade desconhecida — corda de 100m nunca tocou fundo.",
    hooks: ["Sonho igual em todo o planalto"],
  },
  {
    id: "ruinas-lareth",
    name: "Ruínas de Lareth",
    kind: "cenario",
    region: "Rotas e Fronteiras",
    summary: "Cidade engolida; às vezes brota no andar 1 de qualquer Boca.",
    lore: "Lareth foi capital anterior a Ossenfurt — engolida em uma noite. Fragmentos da cidade 'teleportam' entre Bocas. Historiadores de Sorn obsessivos.",
    hooks: ["Portão de Lareth no andar 1 hoje", "Sobrenome do PC aparece em pedra"],
  },
  {
    id: "estrada-onze-bocas",
    name: "Estrada das Onze Bocas",
    kind: "rota",
    region: "Rotas e Fronteiras",
    summary: "Estrada em estrela com Ossenfurt no centro; pedágios alimentam a coroa.",
    lore: "Postos de pedágio a cada ramificação. Caravanas de Salmour disputam rotas com contrabandistas. Cartógrafos vendem mapas que envelhecem quando a Boca Vazia se move.",
    hooks: ["Pedágio quebrado — monstro na estrada", "Mapa vendido a dois grupos"],
  },
  {
    id: "campo-rosada",
    name: "Campo da Boca Rosada",
    kind: "cenario",
    region: "Planície Central",
    boca: "Rosada",
    devotion: "Mira",
    summary: "Pradaria cor-de-rosa sazonal; entrada discreta.",
    lore: "Flores carnívoras microscópicas no ar — CON CD 10 ou espirros que alertam monstros. Românticos piquenique sem saber. Exploradores experientes usam máscaras de fungo do Vale Podre.",
    hooks: ["Casamento real na borda do campo", "Flor gigante desperta"],
  },
];

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  reino: "Reino / estado",
  cidade: "Cidade",
  vilarejo: "Vilarejo",
  fortaleza: "Fortaleza",
  torre: "Torre gnomica",
  santuario: "Santuário",
  cenario: "Cenário de campanha",
  rota: "Rota comercial",
};

export function getWorldPlace(id: string): WorldPlace | undefined {
  return WORLD_PLACES.find((p) => p.id === id);
}

export function placesByRegion(region: string): WorldPlace[] {
  return WORLD_PLACES.filter((p) => p.region === region);
}

export function placeCardTooltip(p: WorldPlace): string {
  const lines = [
    `${p.name} (${PLACE_KIND_LABEL[p.kind]})`,
    `Região: ${p.region}`,
    p.population ? `Escala: ${p.population}` : null,
    p.boca ? `Boca próxima: ${p.boca}` : null,
    p.devotion ? `Fé dominante: ${p.devotion}` : null,
    "",
    p.summary,
    "",
    p.lore,
  ];
  if (p.hooks?.length) {
    lines.push("", "Ganchos:", ...p.hooks.map((h) => `• ${h}`));
  }
  return lines.filter((line) => line != null).join("\n");
}
