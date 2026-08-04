/**
 * Registry de compêndio do Um Anel — gerado por scripts/gen-um-anel.mjs.
 *
 * Isolamento de hub (princípio fundacional do PRD-MESA-UM-ANEL): este módulo é
 * deliberadamente separado de lib/compendium/registry.ts, que é do Eldarin.
 * Nada aqui importa pack, tipo ou dado do Eldarin, e vice-versa.
 *
 * Os JSON são gerados a partir de livros/um-anel/compendio/*.md (D13/D15) —
 * nunca editar o JSON à mão; editar o markdown e rodar `npm run sync:data`.
 */
import posturasData from "@/data/compendiums/um-anel/posturas.json";
import jornadaData from "@/data/compendiums/um-anel/jornada.json";
import sombraData from "@/data/compendiums/um-anel/sombra.json";
import conselhoData from "@/data/compendiums/um-anel/conselho.json";
import progressaoData from "@/data/compendiums/um-anel/progressao.json";
import indexData from "@/data/compendiums/um-anel/index.json";

export type TorPackId = "posturas" | "jornada" | "sombra" | "conselho" | "progressao";

export type TorCompendiumEntry = {
  id: string;
  name: string;
  type: string;
  system: Record<string, unknown> & {
    /** Subtítulo vindo do `# Grupo` no markdown (ex.: "Regras gerais"). */
    grupo?: string;
    descricao?: string;
    /** Ordem de exibição dentro do grupo; entradas sem ordem vão para o fim. */
    ordem?: number;
  };
};

export type TorPackMeta = {
  id: TorPackId;
  label: string;
  description: string;
  count: number;
};

const PACK_DATA: Record<TorPackId, TorCompendiumEntry[]> = {
  posturas: posturasData as TorCompendiumEntry[],
  jornada: jornadaData as TorCompendiumEntry[],
  sombra: sombraData as TorCompendiumEntry[],
  conselho: conselhoData as TorCompendiumEntry[],
  progressao: progressaoData as TorCompendiumEntry[],
};

export const TOR_PACKS: TorPackMeta[] = indexData as TorPackMeta[];

export function torPackLabel(packId: TorPackId): string {
  return TOR_PACKS.find((p) => p.id === packId)?.label ?? packId;
}

export function torPackEntries(packId: TorPackId): TorCompendiumEntry[] {
  return PACK_DATA[packId] ?? [];
}

/**
 * Entradas agrupadas pelo `# Grupo` do markdown, preservando a ordem em que os
 * grupos aparecem no arquivo — é a ordem didática que o livro usa, então não
 * vale reordenar alfabeticamente.
 */
export function torPackGroups(
  packId: TorPackId
): { group: string | null; entries: TorCompendiumEntry[] }[] {
  const out: { group: string | null; entries: TorCompendiumEntry[] }[] = [];
  const byGroup = new Map<string | null, TorCompendiumEntry[]>();

  for (const entry of torPackEntries(packId)) {
    const key = entry.system.grupo ?? null;
    let bucket = byGroup.get(key);
    if (!bucket) {
      bucket = [];
      byGroup.set(key, bucket);
      out.push({ group: key, entries: bucket });
    }
    bucket.push(entry);
  }

  for (const bucket of out) {
    bucket.entries.sort((a, b) => (a.system.ordem ?? 1e9) - (b.system.ordem ?? 1e9));
  }
  return out;
}

/** Campos que já têm tratamento próprio na UI e não entram na lista de atributos. */
const RESERVED_FIELDS = new Set(["grupo", "descricao", "ordem"]);

/** Pares rótulo/valor para renderizar, na ordem em que vieram do markdown. */
export function torEntryFields(entry: TorCompendiumEntry): { label: string; value: string }[] {
  return Object.entries(entry.system)
    .filter(([key]) => !RESERVED_FIELDS.has(key))
    .map(([key, value]) => ({
      label: key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
      value: String(value),
    }));
}
