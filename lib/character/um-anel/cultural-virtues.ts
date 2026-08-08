import type { TorCultureId } from "./types";

/**
 * Virtudes Culturais — extraídas de livros/um-anel/05-valor-e-sabedoria.md
 * ("Cultural Virtues"). Escolhidas no lugar de uma Virtude comum ao ganhar
 * nova graduação de Sabedoria, só a partir de Sabedoria 2, e só da própria
 * Cultura do herói.
 */
export type TorCulturalVirtue = {
  id: string;
  name: string;
  cultureId: TorCultureId;
  description: string;
};

export const TOR_CULTURAL_VIRTUES: TorCulturalVirtue[] = [
  // ——— Bardos ———
  {
    id: "cram",
    name: "Cram",
    cultureId: "bardos",
    description: "Cada vez que ganha Fadiga de um Evento de Jornada, ganha 1 ponto a menos. Além disso, num Descanso Curto, você e toda a Companhia recuperam Resistência extra igual à sua Sabedoria.",
  },
  {
    id: "matador-de-dragoes",
    name: "Matador de Dragões",
    cultureId: "bardos",
    description: "Ao lutar contra criaturas com Vigor 2 ou mais, todas as suas rolagens de ataque são Favorecidas.",
  },
  {
    id: "amigo-dos-anoes",
    name: "Amigo dos Anões",
    cultureId: "bardos",
    description: "Se seu Foco de Companhia é um Anão, quando os dois lutam em postura Defensiva podem tentar a Tarefa de Combate Proteger Companheiro como ação secundária um pro outro. Anões são sempre considerados Amigáveis com você num Conselho.",
  },
  {
    id: "tiro-feroz",
    name: "Tiro Feroz",
    cultureId: "bardos",
    description: "Ao causar um Golpe Perfurante num ataque à distância, a rolagem de Proteção do alvo fica Desfavorecida.",
  },
  {
    id: "alto-destino",
    name: "Alto Destino",
    cultureId: "bardos",
    description: "Na primeira vez que sofrer uma Ferida que normalmente o mataria, você é salvo por alguma circunstância milagrosa — fica Ferido mas vivo, e aumenta sua Esperança máxima em 2 (só pode acontecer uma vez).",
  },
  {
    id: "a-lingua-dos-passaros",
    name: "A Língua dos Pássaros",
    cultureId: "bardos",
    description: "Pode se comunicar com qualquer pássaro (rolagens de Cortesia, Persuasão ou Música). Ao ar livre, uma vez por Combate/Conselho/Jornada, pode ficar Inspirado numa rolagem.",
  },

  // ——— Anões ———
  {
    id: "baruk-khazad",
    name: "Baruk Khazâd!",
    cultureId: "anoes",
    description: "Uma vez por combate, lutando em postura Avançado, pode tornar sua rolagem de ataque Favorecida e tentar Intimidar Inimigo como ação secundária.",
  },
  {
    id: "feiticos-fragmentados",
    name: "Feitiços Fragmentados",
    cultureId: "anoes",
    description: "Escolha uma Perícia de cada categoria (Força, Coração, Astúcia) e marque-as. Ao usar qualquer uma delas, pode gastar 1 Esperança pra obter um sucesso Mágico.",
  },
  {
    id: "escuro-para-trabalho-escuro",
    name: "Escuro pra Trabalho Escuro",
    cultureId: "anoes",
    description: "Quando está no escuro (à noite ou no subterrâneo) fica Inspirado em todas as suas rolagens.",
  },
  {
    id: "caminho-de-durin",
    name: "Caminho de Durin",
    cultureId: "anoes",
    description: "Some +2 ao seu Bloqueio lutando no subterrâneo, ou em espaços apertados como dentro de um edifício.",
  },
  {
    id: "duro-como-pedra",
    name: "Duro como Pedra",
    cultureId: "anoes",
    description: "Todas as suas rolagens de Proteção são Favorecidas, desde que não esteja Arrasado.",
  },
  {
    id: "espirito-indomavel",
    name: "Espírito Indomável",
    cultureId: "anoes",
    description: "Aumente sua Esperança máxima em 1. Ganha (1d) em todos os Testes de Sombra pra resistir a efeitos de Feitiçaria.",
  },

  // ——— Elfos ———
  {
    id: "contra-o-invisivel",
    name: "Contra o Invisível",
    cultureId: "elfos",
    description: "Todos os seus Testes de Sombra por Pavor são Favorecidos, e ganha (1d) adicional nos causados por um espírito ou fantasma maligno.",
  },
  {
    id: "arco-mortal",
    name: "Arco Mortal",
    cultureId: "elfos",
    description: "Usando um Arco (não Grande Arco) em postura Retaguarda, pode tentar Preparar Tiro como ação secundária.",
  },
  {
    id: "elbereth-gilthoniel",
    name: "Elbereth Gilthoniel!",
    cultureId: "elfos",
    description: "Aumente sua Esperança máxima em 1. Durante a Fase de Aventura pode ficar Inspirado num número de rolagens igual à sua Sabedoria.",
  },
  {
    id: "sonhos-elficos",
    name: "Sonhos Élficos",
    cultureId: "elfos",
    description: "Não precisa dormir, desde que possa se engajar em atividades simples e repetitivas. Um Descanso Curto conta como Descanso Prolongado.",
  },
  {
    id: "brilho-da-ira",
    name: "Brilho da Ira",
    cultureId: "elfos",
    description: "Numa rolagem de ataque bem-sucedida, o adversário também perde 1 ponto de Ódio ou Resolução, +1 por cada ícone de sucesso.",
  },
  {
    id: "memoria-de-dias-antigos",
    name: "Memória de Dias Antigos",
    cultureId: "elfos",
    description: "Quando alvo de um Evento de Jornada, a rolagem na tabela é feita como se estivesse numa Terra Fronteiriça (o Mestre rola 2 Dados de Proeza e fica com o melhor).",
  },

  // ——— Hobbits ———
  {
    id: "arte-de-desaparecer",
    name: "Arte de Desaparecer",
    cultureId: "hobbits",
    description: "Havendo qualquer chance de se esconder, role Furtividade — com 1+ ícone de sucesso, pode gastar 1 pra simplesmente desaparecer de vista até se revelar de novo.",
  },
  {
    id: "bravo-no-aperto",
    name: "Bravo no Aperto",
    cultureId: "hobbits",
    description: "Enquanto estiver Arrasado, Exausto ou Ferido, fica Inspirado em todas as suas rolagens.",
  },
  {
    id: "pequeno-povo",
    name: "Pequeno Povo",
    cultureId: "hobbits",
    description: "Engajado corpo a corpo com uma criatura maior que você, some +2 ao Bloqueio. Pode assumir postura Retaguarda mesmo com só mais um companheiro em postura de Combate Corpo a Corpo.",
  },
  {
    id: "certeiro-no-alvo",
    name: "Certeiro no Alvo",
    cultureId: "hobbits",
    description: "Todos os seus ataques à distância são Favorecidos. Ao atacar com pedra arremessada, o ataque causa Golpe Perfurante com um ícone de sucesso, Ferimento 12.",
  },
  {
    id: "tres-e-companhia",
    name: "Três é Companhia",
    cultureId: "hobbits",
    description: "Aumente o Nível de Companhia em 1. Pode escolher um segundo Foco de Companhia.",
  },
  {
    id: "duro-como-raiz-velha",
    name: "Duro como Raiz Velha",
    cultureId: "hobbits",
    description: "Ao rolar Severidade de Ferida, role 2 Dados de Proeza e fique com o melhor. Dobre sua Força ao calcular Resistência recuperada em descanso.",
  },

  // ——— Homens de Bri ———
  {
    id: "poney-de-bri",
    name: "Pônei de Bri",
    cultureId: "homens-de-bri",
    description: "Aumente sua Esperança máxima em 1. Seu pônei tem Vigor 4 (independente do Padrão de Vida) e nunca te abandona.",
  },
  {
    id: "desafio",
    name: "Desafio",
    cultureId: "homens-de-bri",
    description: "No fim de cada cena de Combate, se não estiver Ferido ou Arrasado, recupera Resistência igual ao seu Coração ou Valor, o que for maior.",
  },
  {
    id: "coragem-desesperada",
    name: "Coragem Desesperada",
    cultureId: "homens-de-bri",
    description: "Ao gastar Esperança numa rolagem, pode também ganhar 1 Sombra pra ficar Inspirado nessa rolagem.",
  },
  {
    id: "amigavel-e-familiar",
    name: "Amigável e Familiar",
    cultureId: "homens-de-bri",
    description: "Aumente em 1 o número máximo de rolagens de Perícia num Conselho. O povo encontrado é sempre considerado Amigável com você.",
  },
  {
    id: "estranho-como-noticia-de-bri",
    // O nome vem do dito citado no próprio capítulo ("'Estranho como Notícias de
    // Bri' ainda era um dito no Quadrante Leste") — no plural, como na fonte.
    name: "Estranho como Notícias de Bri",
    cultureId: "homens-de-bri",
    description: "Durante qualquer Fase de Companhia, pode rolar Discernimento ou Enigma — com sucesso, recebe um boato do Mestre.",
  },
  {
    id: "a-arte-de-fumar",
    name: "A Arte de Fumar",
    cultureId: "homens-de-bri",
    description: "Sempre que recuperar 1+ pontos de Esperança, recupera 1 ponto adicional.",
  },

  // ——— Rangers do Norte ———
  {
    id: "resistencia-do-ranger",
    name: "Resistência do Ranger",
    cultureId: "rangers",
    description: "Vestindo armadura de Couro ou nenhuma, e sem escudo, nunca ganha Fadiga numa jornada.",
  },
  {
    id: "presciencia-de-sua-estirpe",
    name: "Presciência de sua Estirpe",
    cultureId: "rangers",
    description: "Durante uma Fase de Aventura, pode invocar sua presciência um número de vezes igual à sua Sabedoria, pra si ou outro membro da Companhia, refazendo todos os dados de uma rolagem (sua ou de um adversário).",
  },
  {
    id: "herdeiro-de-arnor",
    name: "Herdeiro de Arnor",
    cultureId: "rangers",
    description: "Com ajuda do Mestre, crie um Artefato Maravilhoso ou uma Arma Famosa com 1 Recompensa Encantada — geralmente de fabricação Numenoreana. Ao se aposentar, o item passa ao seu herdeiro.",
  },
  {
    id: "realeza-revelada",
    name: "Realeza Revelada",
    cultureId: "rangers",
    // "Reunir Companheiros" é o nome da tarefa de combate da postura Aberta em
    // stances.ts e no compêndio (tradução de "Rally Comrades", cap. 6). Antes
    // dizia "Reanimar Companheiros" — nome que não existe em nenhum outro lugar
    // do app, então o Mestre não achava a tarefa que a Virtude manda tentar.
    description: "Uma vez por combate, em postura Aberta, pode tentar Reunir Companheiros como ação secundária. Além disso, toda a Companhia fica Inspirada na rodada seguinte.",
  },
  {
    id: "forca-de-vontade",
    name: "Força de Vontade",
    cultureId: "rangers",
    description: "Ganha (1d) em todos os Testes de Sombra pra resistir a efeitos de Pavor.",
  },
  {
    id: "costumes-do-ermo",
    name: "Costumes do Ermo",
    cultureId: "rangers",
    description: "Numa rolagem de Caçada, Exploração ou Viagem, pode gastar 1 Esperança pra obter um sucesso Mágico. Sempre pode cobrir mais de um papel durante uma jornada.",
  },

  // ——— Altos-Elfos de Valfenda (também podem escolher da lista dos Elfos de Lindon) ———
  {
    id: "artifice-de-eregion",
    name: "Artífice de Eregion",
    cultureId: "altos-elfos-de-valfenda",
    description: "No próximo Yule, adicione uma Recompensa Encantada de fabricação Élfica a uma arma à escolha, ou crie um Artefato Maravilhoso. Além disso, numa Fase de Companhia, uma rolagem de Ofício ou História bem-sucedida revela tudo sobre um Artefato Maravilhoso ou Item Prodigioso na posse da Companhia.",
  },
  {
    id: "beleza-das-estrelas",
    name: "Beleza das Estrelas",
    cultureId: "altos-elfos-de-valfenda",
    description: "Aumente sua Esperança máxima em 1.",
  },
  {
    id: "poder-dos-primogenitos",
    name: "Poder dos Primogênitos",
    cultureId: "altos-elfos-de-valfenda",
    description: "Quando um adversário gasta 1 ponto de Ódio ou Resolução pra ativar uma Habilidade Sinistra, você pode gastar 1 ponto de Esperança pra cancelar o efeito.",
  },
  {
    id: "habilidade-dos-eldar",
    // "Perícia dos Eldar" (10-rivendell.md), não "Habilidade": Skill = Perícia no
    // glossário, e "Habilidade" já é Habilidade Sinistra (Fell Ability) — dois
    // conceitos distintos não podem dividir a palavra. O `id` fica como está:
    // é chave estável e renomear quebraria ficha salva.
    name: "Perícia dos Eldar",
    cultureId: "altos-elfos-de-valfenda",
    description: "Ao rolar um ícone de sucesso no Dado de Proeza, o resultado conta como sucesso Mágico sem precisar gastar Esperança. (A fonte também descreve, na mesma seção, uma habilidade adicional de Conselho: como porta-voz, você aumenta o limite de tempo do Conselho em 1, ou faz com que os Mortais presentes retenham só uma lembrança vaga do que foi dito — conta como efeito mágico menor pra Consciência do Olho.)",
  },
];

export const TOR_CULTURAL_VIRTUES_BY_CULTURE: Record<TorCultureId, TorCulturalVirtue[]> = {
  bardos: TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "bardos"),
  anoes: TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "anoes"),
  elfos: TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "elfos"),
  hobbits: TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "hobbits"),
  "homens-de-bri": TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "homens-de-bri"),
  rangers: TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "rangers"),
  // Altos-Elfos escolhem tanto da lista própria quanto da lista dos Elfos de Lindon (regra do livro).
  "altos-elfos-de-valfenda": [
    ...TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "altos-elfos-de-valfenda"),
    ...TOR_CULTURAL_VIRTUES.filter((v) => v.cultureId === "elfos"),
  ],
};
