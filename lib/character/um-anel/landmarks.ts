/**
 * Marcos (Landmarks) — sistema de cenários jogáveis auto-contidos, extraído de
 * livros/um-anel/13-apendice-patronos-e-ficha.md ("Landmarks" + "The Star of
 * the Mist"). Diferente de um módulo de aventura com cenas predeterminadas,
 * um Marco descreve um lugar, seus habitantes e eventos possíveis — o Mestre
 * conduz a exploração livremente usando as regras normais (Jornada pra
 * chegar lá, Empreitadas de Perícia/Nível de Risco pros obstáculos do local).
 */

export type TorLandmarkStructurePart = { step: number; name: string; description: string };

export const TOR_LANDMARK_STRUCTURE: TorLandmarkStructurePart[] = [
  {
    step: 1,
    name: "Nome",
    description: "Em geral, o nome que a superstição ou lenda local dá ao lugar (ex.: \"Vala dos Mortos\", \"Norburgo dos Reis\", \"Moria\").",
  },
  {
    step: 2,
    name: "Boato",
    description: "A informação sobre o lugar que os heróis captam aventurando-se ou durante a Fase de Companhia — pode misturar verdade e mentira, filtrada por preconceitos/superstições locais. Saber Antigo: informação adicional disponível pra quem pesquisa o Marco, geralmente mais precisa e verdadeira que o Boato base.",
  },
  {
    step: 3,
    name: "Antecedentes",
    description: "Uma visão geral do lugar pro Mestre, resumindo seus principais aspectos e por que é interessante ou perigoso, com direções gerais de como chegar lá a partir de um lugar conhecido (mas sem informação de jogo pra Jornada — pra isso, o Mestre usa as regras de Jornada normalmente). Eventos de Jornada: informação útil pra montar acidentes ou eventos notáveis conforme a Companhia se aproxima do Marco.",
  },
  {
    step: 4,
    name: "Mapa",
    description: "Um desenho ilustrando o Marco com o máximo de detalhe possível — um mapa ou recorte, sempre referenciado nas descrições da seção Locais.",
  },
  {
    step: 5,
    name: "Locais",
    description: "Vários parágrafos descrevendo o lugar em detalhe, incluindo informação de Tesouro ou possíveis encontros com habitantes/PNJs. Alguns encontros podem se conectar à seção Tramas e Problemas.",
  },
  {
    step: 6,
    name: "Tramas e Problemas",
    description: "Descreve como forças externas podem interferir na exploração do local; lista eventos/acidentes auto-contidos que podem ocorrer durante a Fase de Aventura. Às vezes liga o Marco a um quadro maior (ex.: as tramas de um vilão recorrente).",
  },
];

export type TorLandmarkScheme = { name: string; text: string };

export type TorLandmark = {
  id: string;
  name: string;
  rumour: string;
  oldLore: string;
  background: string;
  locations: string;
  /** Id em lib/character/um-anel/adversaries.ts, quando o Marco tem uma adversária única de destaque. */
  adversaryId?: string;
  schemesAndTrouble: TorLandmarkScheme[];
};

export const TOR_LANDMARKS: TorLandmark[] = [
  {
    id: "estrela-na-bruma",
    name: "A Estrela na Bruma",
    rumour:
      "Uma torre antiga no sopé sul das Montanhas Azuis, resto de um castelo dos dias dos Reis; viajantes falam de uma estranha luz azul, às vezes visível desde o Vau de Sarn. Gente tem desaparecido nas redondezas.",
    oldLore:
      "A torre foi erguida sobre uma ruína Anã, foi sitiada nas Guerras de Angmar e caiu por traição — alguns dizem que Anões deixaram as forças do Rei-Bruxo entrarem por passagens secretas.",
    background:
      "Um povoado fortificado já existiu aqui, lar de um valoroso senhor Dúnedain que resistiu ao Rei-Bruxo. A fortaleza foi sitiada; o senhor foi capturado e torturado até a morte diante dos olhos de sua esposa. O povoado e o castelo caíram por traição e foram arrasados, amaldiçoados pelo próprio Rei-Bruxo. A nobre viúva foi consumida pelo pesar e, ao longo dos anos, tornou-se uma Espectra Funesta; seus seguidores degeneraram em criaturas horríveis, quase imortais. Hoje só resta uma torre em ruínas, alcançável por um posto de guarda subterrâneo e uma ponte sobre um desfiladeiro profundo — atualmente usada como base por um bando de bandidos (secretamente liderado por Sabian, um espião de Umbar interessado nas ruínas de Cardolan).",
    locations:
      "Acampamento dos Bandidos (guardado por assaltantes, um por herói); uma ponte quebrada sobre o desfiladeiro; o Portão Anão (um posto de guarda hoje usado como dormitório dos bandidos, escondendo um pequeno tesouro de ouro roubado); as Câmaras Inundadas (um salão de registros Anão amaldiçoado e inundado, hoje lar dos Habitantes do Pântano — o dobro do número de heróis — que atacam qualquer um que entre; contém sepulcros, um tesouro menor, e escadas subindo pros Salões Amaldiçoados ou pras ruínas da cidade Anã de Narag-nâla, lar de uma colônia escondida de Anões traiçoeiros liderada pelo cego Veiko); os Salões Amaldiçoados (ruínas arrasadas do povoado, com grafites em Língua Negra — lê-los concede 2 pontos de Sombra independente de compreensão); e a própria Torre da Estrela, onde o corpo mumificado do Senhor Hadirion jaz com uma coroa amaldiçoada — remover a coroa quebra a maldição e finalmente dá descanso à Espectra Funesta Elwen, revelando um tesouro maior numa masmorra escondida.",
    adversaryId: "elwen-a-espectra-funesta",
    schemesAndTrouble: [
      {
        name: "Os Bandidos",
        text: "Um bando na verdade liderado pelo espião Sabian, que prefere sabotar/armar armadilhas pro grupo em vez de lutar abertamente.",
      },
      {
        name: "Anões Traiçoeiros",
        text: "Os Anões de Narag-nâla, descendentes dos que traíram Hadirion — inicialmente hostis, mas podem se aliar depois que os Habitantes do Pântano/a maldição forem resolvidos.",
      },
      {
        name: "Encurralados!",
        text: "Bandidos que retornam podem selar o grupo dentro das ruínas, do lado de fora.",
      },
    ],
  },
];

export const TOR_LANDMARK_BY_ID: Record<string, TorLandmark> = Object.fromEntries(
  TOR_LANDMARKS.map((l) => [l.id, l])
);
