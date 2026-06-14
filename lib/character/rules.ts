/** Regras Eldarin v4 — classes, raças, progressão (espelha Cap. 2–4) */

export type ClassId =
  | "Guerreiro"
  | "Patrulheiro"
  | "Ladino"
  | "Mago"
  | "Clérigo"
  | "Bárbaro"
  | "Bardo"
  | "Druida"
  | "Feiticeiro"
  | "Espiritualista"
  | "Paladino"
  | "Bruxo";

export type RaceId =
  | "Humano"
  | "Elfo"
  | "Anão"
  | "Halfling"
  | "Gnomo"
  | "Meio-Humano"

export type AttributeKey =
  | "forca"
  | "destreza"
  | "constituicao"
  | "inteligencia"
  | "sabedoria"
  | "carisma";

export type CulinaryKey = "trinchar" | "harmonizacao" | "coccao" | "estomagoDeFerro";

/** IDs canônicos (livros/TABELA-IDS) — não exibir na UI */
export const CLASS_CANON_ID: Record<ClassId, string> = {
  Guerreiro: "CLA-guerreiro",
  Patrulheiro: "CLA-patrulheiro",
  Ladino: "CLA-ladino",
  Mago: "CLA-mago",
  Clérigo: "CLA-clérigo",
  Bárbaro: "CLA-bárbaro",
  Bardo: "CLA-bardo",
  Druida: "CLA-druida",
  Feiticeiro: "CLA-feiticeiro",
  Espiritualista: "CLA-espiritualista",
  Paladino: "CLA-paladino",
  Bruxo: "CLA-bruxo",
};

export const RACE_CANON_ID: Record<RaceId, string> = {
  Humano: "RAC-humano",
  Elfo: "RAC-elfo",
  Anão: "RAC-anao",
  Halfling: "RAC-halfling",
  Gnomo: "RAC-gnomo",
  "Meio-Humano": "RAC-meio-humano",
};

export const LINHAGEM_CANON_ID: Record<string, string> = {
  "Linhagem do Gato": "LIN-gato",
  "Linhagem da Cobra": "LIN-cobra",
  "Linhagem do Urso": "LIN-urso",
  "Linhagem do Tigre": "LIN-tigre",
  "Linhagem da Águia": "LIN-aguia",
  "Linhagem do Lobo": "LIN-lobo",
  "Linhagem do Tubarão": "LIN-tubarao",
  "Linhagem do Corvo": "LIN-corvo",
};

export type ClassDef = {
  id: ClassId;
  /** ID canônico (ex. CLA-guerreiro) — uso interno/VTT, não exibir na UI */
  canonId: string;
  hpDie: 6 | 8 | 10 | 12;
  hpDieMax: number;
  hpDieAvg: number;
  primary: string;
  proficiencies: string;
  culinary: Partial<Record<CulinaryKey, number>>;
  dietBonus: string;
  subclasses: string[];
};

export type RaceDef = {
  id: RaceId;
  canonId: string;
  attributeBonus: Partial<Record<AttributeKey, number>>;
  /** +1 CON + linhagem para Meio-Humano */
  fixedBonus?: Partial<Record<AttributeKey, number>>;
  culinaryBonus?: Partial<Record<CulinaryKey, number>>;
  traits: string[];
  milestones: Record<number, string>;
  linhagens?: Array<{
    id: string;
    canonId?: string;
    attributeBonus: Partial<Record<AttributeKey, number>>;
    trait: string;
    milestones: Record<number, string>;
  }>;
};

export const CLASS_LIST: ClassDef[] = [
  {
    id: "Guerreiro",
    canonId: CLASS_CANON_ID.Guerreiro,
    hpDie: 10,
    hpDieMax: 10,
    hpDieAvg: 6,
    primary: "Força ou Destreza",
    proficiencies: "Todas armaduras, escudos e armas",
    culinary: { trinchar: 3, estomagoDeFerro: 2 },
    dietBonus: "Foco de Combate — Vantagem em Força/Atletismo após descanso curto na masmorra",
    subclasses: [
      "Caçador de Feras",
      "Quebrador de Carapaças",
      "Cavaleiro Dracônico",
      "Sentinela das Profundezas",
    ],
  },
  {
    id: "Patrulheiro",
    canonId: CLASS_CANON_ID.Patrulheiro,
    hpDie: 10,
    hpDieMax: 10,
    hpDieAvg: 6,
    primary: "Destreza e Sabedoria",
    proficiencies: "Armaduras leves/médias, escudos, armas simples e marciais",
    culinary: { harmonizacao: 3, trinchar: 2 },
    dietBonus: "Rastreador — sem penalidade ao forragear ou caçar no campo",
    subclasses: [
      "Caçador do Céu",
      "Explorador de Esporos",
      "Rastreador de Escamas",
      "Mestre de Enxame",
    ],
  },
  {
    id: "Ladino",
    canonId: CLASS_CANON_ID.Ladino,
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Destreza e Inteligência",
    proficiencies: "Armaduras leves, armas fines",
    culinary: { trinchar: 4, harmonizacao: 2 },
    dietBonus: "Reflexos de Masmorra — +6m movimento e Vantagem em Iniciativa no 1º turno",
    subclasses: [
      "Sombra Etérea",
      "Forma Amorfa",
      "Assassino Venenoso",
      "Corsário de Cripta",
    ],
  },
  {
    id: "Mago",
    canonId: CLASS_CANON_ID.Mago,
    hpDie: 6,
    hpDieMax: 6,
    hpDieAvg: 4,
    primary: "Inteligência",
    proficiencies: "Adagas, dardos, fundas, cajados, bestas leves",
    culinary: { coccao: 4, harmonizacao: 3 },
    dietBonus: "Arcanista de Campo — componentes de masmorra restauram 1 feitiço de nível baixo",
    subclasses: [
      "Piromante das Brasas",
      "Criomante do Gelo",
      "Mago Alquímico",
      "Alquimista Ácido",
      "Mago dos Encantos",
    ],
  },
  {
    id: "Clérigo",
    canonId: CLASS_CANON_ID.Clérigo,
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Sabedoria e Carisma",
    proficiencies: "Armaduras leves/médias, escudos, armas simples",
    culinary: { harmonizacao: 4, estomagoDeFerro: 3 },
    dietBonus: "Comunhão de Masmorra — descanso concede HP temporários = nv×2 ao grupo",
    subclasses: [
      "Sacerdote Purificador",
      "Clérigo Contemplativo",
      "Clérigo do Sustento",
      "Pastor de Quimeras",
      "Clérigo do Limiar",
    ],
  },
  {
    id: "Bárbaro",
    canonId: CLASS_CANON_ID.Bárbaro,
    hpDie: 12,
    hpDieMax: 12,
    hpDieAvg: 7,
    primary: "Força e Constituição",
    proficiencies: "Armaduras leves/médias, escudos, todas armas",
    culinary: { estomagoDeFerro: 4, trinchar: 2 },
    dietBonus: "Sede de Batalha — assimilação vital cura 1d8+CON e estende Fúria",
    subclasses: [
      "Devorador de Essência",
      "Mandíbula de Ferro",
      "Colosso do Gelo",
      "Berserker Veloz",
    ],
  },
  {
    id: "Bardo",
    canonId: CLASS_CANON_ID.Bardo,
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Carisma e Destreza",
    proficiencies: "Armaduras leves, armas simples, instrumentos",
    culinary: { harmonizacao: 5, coccao: 2 },
    dietBonus: "Inspiração de Grupo — bônus de suporte do grupo duram +50%",
    subclasses: [
      "Estratega de Masmorra",
      "Bardo Fermentador",
      "Dançarino das Lâminas",
      "Cantor dos Venenos",
    ],
  },
  {
    id: "Druida",
    canonId: CLASS_CANON_ID.Druida,
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Sabedoria",
    proficiencies: "Armaduras leves/médias (não metálicas), escudos, armas simples",
    culinary: { harmonizacao: 5, trinchar: 1 },
    dietBonus: "Ciclo da Masmorra — toxinas naturais viram resistência",
    subclasses: [
      "Círculo da Podridão",
      "Círculo do Predador",
      "Círculo da Simbiose",
      "Círculo da Terra",
    ],
  },
  {
    id: "Feiticeiro",
    canonId: CLASS_CANON_ID.Feiticeiro,
    hpDie: 6,
    hpDieMax: 6,
    hpDieAvg: 4,
    primary: "Carisma",
    proficiencies: "Adagas, dardos, fundas, bestas leves",
    culinary: { harmonizacao: 3, coccao: 2 },
    dietBonus:
      "Centelha Inata — após Refeição Comum+, primeira magia ofensiva do combate +1d6 (conforme subclasse)",
    subclasses: [
      "Linhagem Bestial",
      "Sangue Selvagem",
      "Eco Abissal",
      "Chama Inata",
    ],
  },
  {
    id: "Espiritualista",
    canonId: CLASS_CANON_ID.Espiritualista,
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Destreza e Sabedoria",
    proficiencies: "Armas simples, espadas curtas, bestas leves; sem armadura pesada",
    culinary: { estomagoDeFerro: 3, harmonizacao: 2 },
    dietBonus:
      "Respiração de Combate — após descanso curto na masmorra, recupera 2 Chi extras no próximo combate",
    subclasses: [
      "Punho do Limiar",
      "Tecelão do Vácuo",
      "Asceta da Dor",
      "Guardião da Respiração",
    ],
  },
  {
    id: "Paladino",
    canonId: CLASS_CANON_ID.Paladino,
    hpDie: 10,
    hpDieMax: 10,
    hpDieAvg: 6,
    primary: "Força e Carisma",
    proficiencies: "Todas armaduras, escudos, armas simples e marciais",
    culinary: { harmonizacao: 3, estomagoDeFerro: 3 },
    dietBonus:
      "Voto Alimentar — após Refeição Comum+, HP temporários = nível; aliados da mesma devoção adjacentes +1 em saves",
    subclasses: ["Jurado do Sol", "Cavaleiro do Limiar", "Guardião da Gorge"],
  },
  {
    id: "Bruxo",
    canonId: CLASS_CANON_ID.Bruxo,
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Carisma",
    proficiencies: "Armaduras leves, armas simples",
    culinary: { coccao: 4, harmonizacao: 2 },
    dietBonus:
      "Pacto Gastronômico — ingredientes do patrono restauram 1 slot de Pacto ao descanso curto",
    subclasses: ["Filho da Voragem", "Herdeiro do Sangue", "Voz das Profundezas"],
  },
];

export const RACE_LIST: RaceDef[] = [
  {
    id: "Humano",
    canonId: RACE_CANON_ID.Humano,
    attributeBonus: {
      forca: 1,
      destreza: 1,
      constituicao: 1,
      inteligencia: 1,
      sabedoria: 1,
      carisma: 1,
    },
    culinaryBonus: { estomagoDeFerro: 2 },
    traits: ["Adaptabilidade", "Versatilidade de Masmorra", "Resistência Mundana", "Determinação"],
    milestones: {
      4: "+1 em dois atributos à escolha",
      8: "Aprende habilidade de caminho de aliado (30 dias)",
      12: "Determinação Humana — Determinação 2×/dia",
      16: "+2 em todas habilidades de sobrevivência",
      20: "Legado — mutação biomágica permanente",
    },
  },
  {
    id: "Elfo",
    canonId: RACE_CANON_ID.Elfo,
    attributeBonus: { destreza: 2, inteligencia: 1 },
    culinaryBonus: { harmonizacao: 3 },
    traits: ["Visão Arcana", "Instinto de Forrageio", "Sono Élfico", "Resistência a Encantamentos"],
    milestones: {
      4: "Toque Purificador — neutraliza venenos não-mágicos",
      8: "Leitura de Espécime — Estudo de Anatomia automático",
      12: "Mutações elementais duram 48h",
      16: "Memória Ancestral — bestiário 1×/semana",
      20: "Harmonia Perfeita — assimilações sempre Perfeitas",
    },
  },
  {
    id: "Anão",
    canonId: RACE_CANON_ID.Anão,
    attributeBonus: { constituicao: 2, forca: 1 },
    culinaryBonus: { trinchar: 2 },
    traits: ["Resistência Anã", "Visão de Escuro", "Mestria de Ferramentas", "Instinto de Forja"],
    milestones: {
      4: "Estômago de Pedra — imune debuffs de Gororoba",
      8: "Resistência Térmica — fogo/calor",
      12: "Construtor Instintivo — ferramentas Boss em metade do tempo",
      16: "Sangue de Forja — ataques corpo-a-corpo +1d6 fogo",
      20: "Lenda da Forja — ferramenta Lendária 1×/mês",
    },
  },
  {
    id: "Halfling",
    canonId: RACE_CANON_ID.Halfling,
    attributeBonus: { destreza: 2, sabedoria: 1 },
    traits: ["Sorte Inata", "Bravura Halfling", "Furtividade Natural", "Instinto de Sobrevivente"],
    milestones: {
      4: "Sorte Dupla — Sorte Inata 2×/descanso",
      6: "Passo Silencioso",
      8: "Faro de Perigo",
      10: "Sorte Compartilhada",
      12: "Reflexos de Sobrevivente",
      14: "+2 Forrageio",
      16: "Esquiva do Destino",
      18: "Sentido de Horda",
      20: "Abençoado pela Sorte",
    },
  },
  {
    id: "Gnomo",
    canonId: RACE_CANON_ID.Gnomo,
    attributeBonus: { inteligencia: 2, sabedoria: 1 },
    culinaryBonus: { harmonizacao: 4 },
    traits: ["Mente Alquímica", "Pocioneiro Nato", "Identificação Instantânea", "Resistência Mágica"],
    milestones: {
      4: "Poção Dupla",
      6: "Estabilizador de Veneno",
      8: "Fórmula Secreta",
      10: "Concentração Arcana",
      12: "Catálise Elemental",
      14: "+2 Fabricação",
      16: "Grande Obra",
      18: "Digestão Arcana",
      20: "Transmutação Perfeita",
    },
  },
  {
    id: "Meio-Humano",
    canonId: RACE_CANON_ID["Meio-Humano"],
    fixedBonus: { constituicao: 1 },
    attributeBonus: {},
    traits: ["Herança Bestial", "Olfato Aguçado", "Corpo Resistente"],
    milestones: {},
    linhagens: [
      {
        id: "Linhagem do Gato",
        canonId: LINHAGEM_CANON_ID["Linhagem do Gato"],
        attributeBonus: { destreza: 2, sabedoria: 1 },
        trait: "Aterrissagem Felina, Visão Noturna, Reflexos de Predador",
        milestones: {
          4: "Garras Retráteis — 1d6 desarmado",
          8: "Furtividade Felina",
          12: "Sete Vidas",
          16: "Predador Perfeito",
          20: "Forma de Felino",
        },
      },
      {
        id: "Linhagem da Cobra",
        canonId: LINHAGEM_CANON_ID["Linhagem da Cobra"],
        attributeBonus: { destreza: 2, inteligencia: 1 },
        trait: "Visão Térmica, Flexibilidade Óssea, Veneno Natural",
        milestones: {
          4: "Veneno Aprimorado",
          8: "Constrição",
          12: "Desprendimento",
          16: "Veneno Paralisante",
          20: "Olhar de Hipnose",
        },
      },
      {
        id: "Linhagem do Urso",
        canonId: LINHAGEM_CANON_ID["Linhagem do Urso"],
        attributeBonus: { forca: 2, constituicao: 1 },
        trait: "Força Bruta, Agarrão Poderoso, Pelagem Grossa",
        milestones: {
          4: "Garras de Urso",
          8: "Resistência ao Frio",
          12: "Abraço Esmagador",
          16: "Fúria Bestial",
          20: "Forma de Urso",
        },
      },
      {
        id: "Linhagem do Tigre",
        canonId: LINHAGEM_CANON_ID["Linhagem do Tigre"],
        attributeBonus: { forca: 2, destreza: 1 },
        trait: "Salto Predatório, Camuflagem Listrada, Rugido",
        milestones: { 4: "Garras Afiadas", 8: "Emboscada", 12: "Instinto de Caça", 16: "Mordida", 20: "Forma de Tigre" },
      },
      {
        id: "Linhagem da Águia",
        canonId: LINHAGEM_CANON_ID["Linhagem da Águia"],
        attributeBonus: { destreza: 2, sabedoria: 1 },
        trait: "Visão de Caçador, Voo Planado, Garras",
        milestones: { 4: "Mergulho", 8: "Olho de Águia", 12: "Asas Parciais", 16: "Garras Afiadas", 20: "Forma de Águia" },
      },
      {
        id: "Linhagem do Lobo",
        canonId: LINHAGEM_CANON_ID["Linhagem do Lobo"],
        attributeBonus: { destreza: 1, sabedoria: 2 },
        trait: "Caça em Matilha, Faro, Mordida",
        milestones: { 4: "Mordida Aprimorada", 8: "Uivo de Matilha", 12: "Instinto de Alcateia", 16: "Forma Híbrida", 20: "Forma de Lobo" },
      },
      {
        id: "Linhagem do Tubarão",
        canonId: LINHAGEM_CANON_ID["Linhagem do Tubarão"],
        attributeBonus: { forca: 2, constituicao: 1 },
        trait: "Frenesi Aquático, Mordida, Sentido de Sangue",
        milestones: { 4: "Mordida Devastadora", 8: "Nadador Natural", 12: "Frenesi", 16: "Pele Cartilaginosa", 20: "Forma de Tubarão" },
      },
      {
        id: "Linhagem do Corvo",
        canonId: LINHAGEM_CANON_ID["Linhagem do Corvo"],
        attributeBonus: { inteligencia: 2, carisma: 1 },
        trait: "Memória, Voo, Augúrio",
        milestones: { 4: "Mensageiro", 8: "Visão Augúrio", 12: "Plumas Negras", 16: "Voz dos Mortos", 20: "Forma de Corvo" },
      },
    ],
  },
];

export const TALENT_LEVELS = [4, 8, 12, 16] as const;

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  forca: "FOR",
  destreza: "DES",
  constituicao: "CON",
  inteligencia: "INT",
  sabedoria: "SAB",
  carisma: "CAR",
};

/** Rótulos de sobrevivência na UI (chaves internas mantidas por compatibilidade). */
export const CULINARY_LABELS: Record<CulinaryKey, string> = {
  trinchar: "Extração",
  harmonizacao: "Forrageio",
  coccao: "Fabricação",
  estomagoDeFerro: "Fortitude",
};

export const SURVIVAL_LABELS = CULINARY_LABELS;

/** Rótulo da escolha de subclasse no nv 2. */
export const SUBCLASS_PATH_LABEL = "Caminho de Assimilação";

export function getClass(id: string): ClassDef | undefined {
  return CLASS_LIST.find((c) => c.id === id);
}

export function getRace(id: string): RaceDef | undefined {
  return RACE_LIST.find((r) => r.id === id);
}

export function proficiencyBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

export function attributeMod(value: number): number {
  return Math.floor((value - 10) / 2);
}

export function hpMaxFor(classId: string, level: number, conMod: number): number {
  const cls = getClass(classId);
  if (!cls || level < 1) return 0;
  if (level === 1) return cls.hpDieMax + conMod;
  return cls.hpDieMax + conMod + (level - 1) * (cls.hpDieAvg + conMod);
}

export function hpGainOnLevelUp(classId: string, newLevel: number, conMod: number): number {
  const cls = getClass(classId);
  if (!cls) return 0;
  if (newLevel === 1) return cls.hpDieMax + conMod;
  return cls.hpDieAvg + conMod;
}

export function computeCulinary(
  classId: string,
  raceId: string,
  linhagem?: string | null
): Record<CulinaryKey, number> {
  const base: Record<CulinaryKey, number> = {
    trinchar: 0,
    harmonizacao: 0,
    coccao: 0,
    estomagoDeFerro: 0,
  };
  const cls = getClass(classId);
  const race = getRace(raceId);
  if (cls) {
    for (const [k, v] of Object.entries(cls.culinary) as [CulinaryKey, number][]) {
      base[k] += v;
    }
  }
  if (race?.culinaryBonus) {
    for (const [k, v] of Object.entries(race.culinaryBonus) as [CulinaryKey, number][]) {
      base[k] += v;
    }
  }
  if (raceId === "Meio-Humano" && linhagem && race?.linhagens) {
    const lin = race.linhagens.find((l) => l.id === linhagem);
    if (lin?.milestones[14]?.includes("Harmonização")) base.harmonizacao += 2;
  }
  return base;
}

export function racialMilestone(raceId: string, level: number, linhagem?: string | null): string | null {
  const race = getRace(raceId);
  if (!race) return null;
  if (raceId === "Meio-Humano" && linhagem && race.linhagens) {
    const lin = race.linhagens.find((l) => l.id === linhagem);
    return lin?.milestones[level] ?? null;
  }
  return race.milestones[level] ?? null;
}

export function classLevelFeatures(classId: string, level: number): string[] {
  const cls = getClass(classId);
  if (!cls) return [];
  const out: string[] = [];
  if (level === 1) out.push(`Proficiências: ${cls.proficiencies}`);
  if (level === 2) out.push("Escolhe Caminho de Assimilação (subclasse)");
  if (classId === "Guerreiro") {
    if (level === 5 || level === 11 || level === 17) {
      const attacks = level === 5 ? 2 : level === 11 ? 3 : 4;
      out.push(`Ataque Extra — ${attacks} ataques/ação (1 PA por golpe)`);
    }
    if (level === 5) out.push("Economia marcial — cada golpe de arma custa 1 PA");
    if (level === 14) out.push("Golpe de Veterano — críticos 19–20");
    if (level === 20) out.push("Campeão Implacável");
  }
  if (classId === "Ladino" && level >= 1) {
    const dice = Math.min(10, 1 + Math.floor((level - 1) / 2));
    if ([1, 3, 5, 7, 9, 11, 13, 15, 17, 19].includes(level) || level === 20) {
      out.push(`Golpe Oportunista — ${dice}d6`);
    }
  }
  if (classId === "Bárbaro" && level === 1) out.push("Fúria — 2 usos");
  if (classId === "Bardo" && level >= 1) out.push("Inspiração de Bardo evolui com o nível");
  if (classId === "Druida" && level === 1) out.push("Forma de Espécime");
  if (classId === "Feiticeiro") {
    if (level === 1) out.push("Magia inata — 4 truques, magias conhecidas (lista arcano-inato)");
    if (level === 2) out.push("Fonte de Metamorfose — elevar magias (+1 PA = +1d6)");
    if (level === 5) out.push("Centelha Arcana — 1ª magia 2+ PA custa 1 PA a menos");
    if (level === 20) out.push("Ascensão da Centelha — metamorfose sem custo extra 1×/combate");
  }
  if (classId === "Espiritualista") {
    if (level === 1) out.push("Chi de Combate — 10 Chi/combate, máx. 2 Chi/turno");
    if (level === 2) out.push("Caminho do Corpo — técnicas de Chi da subclasse");
    if (level === 5) out.push("Fluxo Marcial — 1ª técnica de Chi do turno custa 1 Chi a menos");
    if (level === 11) out.push("Passo do Vácuo — +1 hex de movimento ao gastar Chi");
    if (level === 20) out.push("Corpo Transcendente — Chi máximo 12 neste combate");
  }
  if (classId === "Paladino") {
    if (level === 1) {
      out.push("Toque Consagrado — cura 1d8+CAR ou 2d8 radiante vs morto-vivo");
      out.push("Aura de Devoção — aliados em 3m +2 em saves vs medo e encantamento");
    }
    if (level === 2) out.push("Golpe do Juramento — +2d8 radiante (1 PA extra por golpe)");
    if (level === 5) {
      out.push("Canto Divino — magias 2+ PA custam 1 PA a menos");
      out.push("Golpe do Juramento — 3d8 radiante");
    }
    if (level === 9) out.push("Golpe do Juramento — 4d8 radiante");
    if (level === 13) out.push("Golpe do Juramento — 5d8 radiante");
    if (level === 17) out.push("Golpe do Juramento — 6d8 radiante");
    if (level === 20) out.push("Ascensão do Juramento — 1 resistência lendária/dia");
  }
  if (classId === "Bruxo") {
    if (level === 1) out.push("Pacto Arcano — 2 truques, 2 slots nv.1 (recarga descanso curto)");
    if (level === 2) out.push("Invocação do Pacto — escolhe 1 invocação");
    if (level === 5) out.push("Afinidade do Pacto — magias 2+ PA custam 1 PA a menos");
    if (level === 11) out.push("Pacto Reforçado — slots sobem de nível");
    if (level === 17) out.push("Pacto Supremo — +1 slot de Pacto");
    if (level === 20) out.push("Patrono Manifesto — 1 invocação extra ativa");
  }
  const casters = ["Mago", "Clérigo", "Druida", "Bardo", "Feiticeiro", "Paladino", "Bruxo"];
  if (casters.includes(classId) && level === 5 && classId !== "Paladino" && classId !== "Bruxo") {
    if (classId === "Feiticeiro") out.push("Centelha Arcana — magias 2+ PA custam 1 PA a menos");
    else out.push("Economia Arcana — magias 2+ PA custam 1 PA a menos");
  }
  if (TALENT_LEVELS.includes(level as (typeof TALENT_LEVELS)[number])) {
    out.push(`Talento do Caminho de Subclasse (nv ${level})`);
  }
  return out;
}

/** Guerreiro — Ataque Extra (nv 5/11/17) */
export function extraAttackCount(classId: string, level: number): number {
  if (classId !== "Guerreiro") return 1;
  if (level >= 17) return 4;
  if (level >= 11) return 3;
  if (level >= 5) return 2;
  return 1;
}

export { PA_BASE, paMaxForLevel, paMaxForActor } from "@/lib/combat/pa-economy";

/** @alias paMaxForLevel */
export { paMaxForLevel as paMaxFor } from "@/lib/combat/pa-economy";

export function defaultAttributesForRace(raceId: string, linhagem?: string | null): Record<AttributeKey, number> {
  const base: Record<AttributeKey, number> = {
    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    carisma: 10,
  };
  const race = getRace(raceId);
  if (!race) return base;

  const apply = (bonus: Partial<Record<AttributeKey, number>>) => {
    for (const [k, v] of Object.entries(bonus) as [AttributeKey, number][]) {
      base[k] += v;
    }
  };

  if (race.fixedBonus) apply(race.fixedBonus);
  apply(race.attributeBonus);
  if (raceId === "Meio-Humano" && linhagem && race.linhagens) {
    const lin = race.linhagens.find((l) => l.id === linhagem);
    if (lin) apply(lin.attributeBonus);
  }
  return base;
}
