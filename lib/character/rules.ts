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
  | "Artífice";

export type RaceId =
  | "Humano"
  | "Elfo"
  | "Anão"
  | "Halfling"
  | "Gnomo"
  | "Meio-Humano"
  | "Forjado de Osso";

export type AttributeKey =
  | "forca"
  | "destreza"
  | "constituicao"
  | "inteligencia"
  | "sabedoria"
  | "carisma";

export type CulinaryKey = "trinchar" | "harmonizacao" | "coccao" | "estomagoDeFerro";

export type ClassDef = {
  id: ClassId;
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
  attributeBonus: Partial<Record<AttributeKey, number>>;
  /** +1 CON + linhagem para Meio-Humano */
  fixedBonus?: Partial<Record<AttributeKey, number>>;
  culinaryBonus?: Partial<Record<CulinaryKey, number>>;
  traits: string[];
  milestones: Record<number, string>;
  linhagens?: Array<{
    id: string;
    attributeBonus: Partial<Record<AttributeKey, number>>;
    trait: string;
    milestones: Record<number, string>;
  }>;
};

export const CLASS_LIST: ClassDef[] = [
  {
    id: "Guerreiro",
    hpDie: 10,
    hpDieMax: 10,
    hpDieAvg: 6,
    primary: "Força ou Destreza",
    proficiencies: "Todas armaduras, escudos e armas",
    culinary: { trinchar: 3, estomagoDeFerro: 2 },
    dietBonus: "Metabolismo Focado — Vantagem em Força/Atletismo após refeição Comum+",
    subclasses: [
      "Acougueiro de Batalha",
      "Quebra-Cascos",
      "Cavaleiro Dracônico",
      "Guerreiro das Profundezas",
    ],
  },
  {
    id: "Patrulheiro",
    hpDie: 10,
    hpDieMax: 10,
    hpDieAvg: 6,
    primary: "Destreza e Sabedoria",
    proficiencies: "Armaduras leves/médias, escudos, armas simples e marciais",
    culinary: { harmonizacao: 3, trinchar: 2 },
    dietBonus: "Estômago Selvagem — come cru/no campo sem penalidade",
    subclasses: [
      "Caçador Celeste",
      "Forrageiro dos Esporos",
      "Rastreador de Sangue Frio",
      "Guia de Enxame",
    ],
  },
  {
    id: "Ladino",
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Destreza e Inteligência",
    proficiencies: "Armaduras leves, armas fines",
    culinary: { trinchar: 4, harmonizacao: 2 },
    dietBonus: "Digestão Rápida — +6m movimento e Vantagem em Iniciativa no 1º turno",
    subclasses: [
      "Degustador de Sombras",
      "Extrator de Geleias",
      "Ladrão de Glândulas",
      "Corsário de Cripta",
    ],
  },
  {
    id: "Mago",
    hpDie: 6,
    hpDieMax: 6,
    hpDieAvg: 4,
    primary: "Inteligência",
    proficiencies: "Adagas, dardos, fundas, cajados, bestas leves",
    culinary: { coccao: 4, harmonizacao: 3 },
    dietBonus: "Mente Nutrigena — ingredientes mágicos restauram 1 feitiço de nível baixo",
    subclasses: [
      "Piromante de Forno",
      "Criomante de Conservação",
      "Mago Fermentador",
      "Alquimista de Caldos",
      "Mago Confeiteiro",
    ],
  },
  {
    id: "Clérigo",
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Sabedoria e Carisma",
    proficiencies: "Armaduras leves/médias, escudos, armas simples",
    culinary: { harmonizacao: 4, estomagoDeFerro: 3 },
    dietBonus: "Comunhão Material — refeição concede HP temporários = nv×2",
    subclasses: [
      "Sacerdote da Purificação",
      "Monge do Jejum",
      "Clérigo do Pão da Vida",
      "Pastor de Quimeras",
      "Clérigo do Limiar",
    ],
  },
  {
    id: "Bárbaro",
    hpDie: 12,
    hpDieMax: 12,
    hpDieAvg: 7,
    primary: "Força e Constituição",
    proficiencies: "Armaduras leves/médias, escudos, todas armas",
    culinary: { estomagoDeFerro: 4, trinchar: 2 },
    dietBonus: "Sede de Sangue — coração/cru cura 1d8+CON e estende Fúria",
    subclasses: [
      "Devorador de Corações",
      "Mandíbula de Ferro",
      "Ruminante das Neves",
      "Frenético do Açúcar",
    ],
  },
  {
    id: "Bardo",
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Carisma e Destreza",
    proficiencies: "Armaduras leves, armas simples, instrumentos",
    culinary: { harmonizacao: 5, coccao: 2 },
    dietBonus: "Harmonia de Sabores — bônus de comida do grupo duram +50%",
    subclasses: [
      "Sommelier de Masmorra",
      "Bardo Cervejeiro",
      "Dançarino das Facas",
      "Cantor das Especiarias",
    ],
  },
  {
    id: "Druida",
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Sabedoria",
    proficiencies: "Armaduras leves/médias (não metálicas), escudos, armas simples",
    culinary: { harmonizacao: 5, trinchar: 1 },
    dietBonus: "Ciclo da Vida — plantas/fungos venenosos viram nutrição",
    subclasses: [
      "Círculo da Decomposição",
      "Círculo do Superpredador",
      "Círculo da Simbiose",
      "Círculo do Solo Vivo",
    ],
  },
  {
    id: "Artífice",
    hpDie: 8,
    hpDieMax: 8,
    hpDieAvg: 5,
    primary: "Inteligência e Destreza",
    proficiencies: "Armaduras leves/médias, ferramentas, armas simples e bestas",
    culinary: { coccao: 5, trinchar: 3 },
    dietBonus: "Panela de Pressão — utensílios dobram porções",
    subclasses: [
      "Ferreiro de Utensílios",
      "Engenheiro de Fogareiros",
      "Biólogo Alquímico",
      "Construtor de Armadilhas",
    ],
  },
];

export const RACE_LIST: RaceDef[] = [
  {
    id: "Humano",
    attributeBonus: {
      forca: 1,
      destreza: 1,
      constituicao: 1,
      inteligencia: 1,
      sabedoria: 1,
      carisma: 1,
    },
    culinaryBonus: { estomagoDeFerro: 2 },
    traits: ["Adaptabilidade", "Paladar Versátil", "Resistência Mundana", "Determinação"],
    milestones: {
      4: "+1 em dois atributos à escolha",
      8: "Aprende habilidade de subclasse de aliado (30 dias)",
      12: "Determinação Humana — Determinação 2×/dia",
      16: "+2 em todos atributos culinários",
      20: "Legado — mutação biomágica permanente",
    },
  },
  {
    id: "Elfo",
    attributeBonus: { destreza: 2, inteligencia: 1 },
    culinaryBonus: { harmonizacao: 3 },
    traits: ["Visão Arcana", "Instinto de Harmonização", "Sono Élfico", "Resistência a Encantamentos"],
    milestones: {
      4: "Toque Purificador — neutraliza venenos não-mágicos",
      8: "Leitura de Espécime — Estudo de Anatomia automático",
      12: "Mutações elementais duram 48h",
      16: "Memória Ancestral — bestiário 1×/semana",
      20: "Harmonia Perfeita — pratos sempre Perfeitos",
    },
  },
  {
    id: "Anão",
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
    attributeBonus: { destreza: 2, sabedoria: 1 },
    traits: ["Sorte Inata", "Bravura Halfling", "Furtividade Natural", "Paladar de Especialista"],
    milestones: {
      4: "Sorte Dupla — Sorte Inata 2×/descanso",
      6: "Passo Silencioso",
      8: "Faro de Perigo",
      10: "Sorte Compartilhada",
      12: "Reflexos de Sobrevivente",
      14: "+2 Harmonização",
      16: "Esquiva do Destino",
      18: "Sentido de Horda",
      20: "Abençoado pela Sorte",
    },
  },
  {
    id: "Gnomo",
    attributeBonus: { inteligencia: 2, sabedoria: 1 },
    culinaryBonus: { harmonizacao: 4 },
    traits: ["Mente Alquímica", "Pocioneiro Nato", "Identificação Instantânea", "Resistência Mágica"],
    milestones: {
      4: "Poção Dupla",
      6: "Estabilizador de Veneno",
      8: "Fórmula Secreta",
      10: "Concentração Arcana",
      12: "Catálise Elemental",
      14: "+2 Coccão",
      16: "Grande Obra",
      18: "Digestão Arcana",
      20: "Transmutação Perfeita",
    },
  },
  {
    id: "Meio-Humano",
    fixedBonus: { constituicao: 1 },
    attributeBonus: {},
    traits: ["Herança Bestial", "Olfato Aguçado", "Corpo Resistente"],
    milestones: {},
    linhagens: [
      {
        id: "Linhagem do Gato",
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
        attributeBonus: { forca: 2, destreza: 1 },
        trait: "Salto Predatório, Camuflagem Listrada, Rugido",
        milestones: { 4: "Garras Afiadas", 8: "Emboscada", 12: "Instinto de Caça", 16: "Mordida", 20: "Forma de Tigre" },
      },
      {
        id: "Linhagem da Águia",
        attributeBonus: { destreza: 2, sabedoria: 1 },
        trait: "Visão de Caçador, Voo Planado, Garras",
        milestones: { 4: "Mergulho", 8: "Olho de Águia", 12: "Asas Parciais", 16: "Garras Afiadas", 20: "Forma de Águia" },
      },
      {
        id: "Linhagem do Lobo",
        attributeBonus: { destreza: 1, sabedoria: 2 },
        trait: "Caça em Matilha, Faro, Mordida",
        milestones: { 4: "Mordida Aprimorada", 8: "Uivo de Matilha", 12: "Instinto de Alcateia", 16: "Forma Híbrida", 20: "Forma de Lobo" },
      },
      {
        id: "Linhagem do Tubarão",
        attributeBonus: { forca: 2, constituicao: 1 },
        trait: "Frenesi Aquático, Mordida, Sentido de Sangue",
        milestones: { 4: "Mordida Devastadora", 8: "Nadador Natural", 12: "Frenesi", 16: "Pele Cartilaginosa", 20: "Forma de Tubarão" },
      },
      {
        id: "Linhagem do Corvo",
        attributeBonus: { inteligencia: 2, carisma: 1 },
        trait: "Memória, Voo, Augúrio",
        milestones: { 4: "Mensageiro", 8: "Visão Augúrio", 12: "Plumas Negras", 16: "Voz dos Mortos", 20: "Forma de Corvo" },
      },
    ],
  },
  {
    id: "Forjado de Osso",
    attributeBonus: { constituicao: 2 },
    traits: ["Construto Vivo", "Núcleo de Alma", "Composição de Monstros", "Manutenção"],
    milestones: {
      4: "Upgrade de Componente — 3ª parte",
      6: "Amortecimento de Impacto",
      8: "Processamento Avançado",
      10: "Instalação Rápida",
      12: "Estrutura Reforçada — +2 CA",
      14: "Quarta Parte",
      16: "Núcleo Aprimorado",
      18: "Autoreparo",
      20: "Obra-Prima dos Anões",
    },
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

export const CULINARY_LABELS: Record<CulinaryKey, string> = {
  trinchar: "Trinchar",
  harmonizacao: "Harmonização",
  coccao: "Coccão",
  estomagoDeFerro: "Estômago de Ferro",
};

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
  if (level === 1) out.push(`Dieta base: ${cls.dietBonus}`);
  if (level === 2) out.push("Escolhe Subclasse (Dieta Marcial)");
  if (classId === "Guerreiro") {
    if (level === 5 || level === 11 || level === 17) {
      const attacks = level === 5 ? 2 : level === 11 ? 3 : 4;
      out.push(`Ataque Extra — ${attacks} ataques/ação`);
    }
    if (level === 14) out.push("Golpe de Veterano — críticos 19–20");
    if (level === 20) out.push("Campeão Implacável");
  }
  if (classId === "Ladino" && level >= 1) {
    const dice = Math.min(10, 1 + Math.floor((level - 1) / 2));
    if ([1, 3, 5, 7, 9, 11, 13, 15, 17, 19].includes(level) || level === 20) {
      out.push(`Ataque Furtivo — ${dice}d6`);
    }
  }
  if (classId === "Bárbaro" && level === 1) out.push("Fúria — 2 usos");
  if (classId === "Bardo" && level >= 1) out.push("Inspiração de Bardo evolui com o nível");
  if (classId === "Druida" && level === 1) out.push("Forma Selvagem");
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

export function paMaxForLevel(level: number, base = 4): number {
  let pa = base;
  if (level >= 5) pa += 1;
  if (level >= 10) pa += 1;
  if (level >= 15) pa += 1;
  return pa;
}

/** @alias paMaxForLevel */
export const paMaxFor = paMaxForLevel;

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
