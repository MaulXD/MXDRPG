import { stripHtml } from "@/lib/compendium/format";
import type { MonsterTemplate } from "@/lib/vtt/monsters";

/** Biomas canônicos (TABELA-IDS-ELDARIN.md). */
export const DUNGEON_BIOMES = [
  { id: "bio-01", name: "Cidadela Pálida" },
  { id: "bio-02", name: "Mar de Prata Cega" },
  { id: "bio-03", name: "Estômago Botânico" },
  { id: "bio-04", name: "Fornalhas Douradas" },
  { id: "bio-05", name: "Prisão Gélida" },
  { id: "bio-06", name: "Labirinto Prismático" },
  { id: "bio-07", name: "Cemitério de Colossos" },
  { id: "bio-08", name: "Engrenagens Esquecidas" },
  { id: "bio-09", name: "Abismo Invertido" },
  { id: "bio-10", name: "Pântano da Decomposição" },
  { id: "bio-11", name: "Arquivos Soterrados" },
  { id: "bio-12", name: "Ninho Crepuscular" },
  { id: "bio-13", name: "Oásis Neon" },
  { id: "bio-14", name: "Matriz de Extrusão" },
  { id: "bio-15", name: "Deserto de Carne e Tendões" },
  { id: "bio-16", name: "Jardim de Cinzas Petrificadas" },
  { id: "bio-17", name: "Arquipélago de Pedra" },
  { id: "bio-18", name: "Floresta de Fios de Prata" },
  { id: "bio-19", name: "Fosso das Emoções" },
  { id: "bio-20", name: "Abatedouro Celestial" },
] as const;

export type DungeonBiomeId = (typeof DUNGEON_BIOMES)[number]["id"];

const BIOME_KEYWORDS: { id: DungeonBiomeId; keywords: string[] }[] = [
  { id: "bio-01", keywords: ["cidadela pálida", "cidadela palida"] },
  { id: "bio-02", keywords: ["mar de prata", "prata cega", "boca azul"] },
  { id: "bio-03", keywords: ["estômago botânico", "estomago botanico", "fungos", "fúngic"] },
  { id: "bio-04", keywords: ["fornalhas douradas", "fornalha", "magma", "vulcân", "vulcan"] },
  { id: "bio-05", keywords: ["prisão gélida", "prisao gelida", "gelo", "gélid", "gelid"] },
  { id: "bio-06", keywords: ["labirinto prismático", "labirinto prismatico", "prismát"] },
  { id: "bio-07", keywords: ["cemitério de colossos", "cemiterio de colossos", "colossos"] },
  { id: "bio-08", keywords: ["engrenagens esquecidas", "autômato", "autômat", "golem"] },
  { id: "bio-09", keywords: ["abismo invertido", "abissal", "abismo"] },
  { id: "bio-10", keywords: ["pântano", "pantano", "decomposição", "úmid", "umid", "podrid"] },
  { id: "bio-11", keywords: ["arquivos soterrados", "biblioteca", "leitor"] },
  { id: "bio-12", keywords: ["ninho crepuscular", "teia", "aranha", "crepuscular"] },
  { id: "bio-13", keywords: ["oásis neon", "oasis neon", "bioluminesc", "neon"] },
  { id: "bio-14", keywords: ["matriz de extrusão", "matriz de extrusao", "extrusão"] },
  { id: "bio-15", keywords: ["deserto de carne", "carne e tendões", "carne e tendoes"] },
  { id: "bio-16", keywords: ["jardim de cinzas", "cinzas petrificadas"] },
  { id: "bio-17", keywords: ["arquipélago de pedra", "arquipelago de pedra"] },
  { id: "bio-18", keywords: ["floresta de fios", "fios de prata", "boca verde"] },
  { id: "bio-19", keywords: ["fosso das emoções", "fosso das emocoes", "espectro", "assombração"] },
  { id: "bio-20", keywords: ["abatedouro celestial"] },
];

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Infere biomas pelo texto do compêndio + biomas explícitos na ficha. */
export function resolveMonsterBiomes(
  monster: Pick<MonsterTemplate, "name" | "description" | "biomas">
): DungeonBiomeId[] {
  if (monster.biomas?.length) {
    return monster.biomas.filter((id): id is DungeonBiomeId =>
      DUNGEON_BIOMES.some((b) => b.id === id)
    );
  }

  const text = normalizeSearchText(`${monster.name} ${stripHtml(monster.description)}`);
  const hits = new Set<DungeonBiomeId>();

  for (const row of BIOME_KEYWORDS) {
    if (row.keywords.some((kw) => text.includes(normalizeSearchText(kw)))) {
      hits.add(row.id);
    }
  }

  return [...hits];
}

export function biomeDisplayName(id: DungeonBiomeId): string {
  return DUNGEON_BIOMES.find((b) => b.id === id)?.name ?? id;
}
