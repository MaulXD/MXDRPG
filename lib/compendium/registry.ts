import type { UserRole } from "@/lib/auth/types";
import armasData from "@/data/compendiums/armas.json";
import habilidadesData from "@/data/compendiums/habilidades.json";
import magiasData from "@/data/compendiums/magias.json";
import monstrosData from "@/data/compendiums/monstros.json";
import equipamentosData from "@/data/compendiums/equipamentos.json";
import consumiveisData from "@/data/compendiums/consumiveis.json";
import type {
  CompendiumEntry,
  CompendiumEntryRaw,
  CompendiumPackId,
  CompendiumPackMeta,
} from "./types";
import { slugId } from "./format";

const PACK_DATA: Record<CompendiumPackId, CompendiumEntryRaw[]> = {
  armas: armasData as CompendiumEntryRaw[],
  habilidades: habilidadesData as CompendiumEntryRaw[],
  magias: magiasData as CompendiumEntryRaw[],
  monstros: monstrosData as CompendiumEntryRaw[],
  equipamentos: equipamentosData as CompendiumEntryRaw[],
  consumiveis: consumiveisData as CompendiumEntryRaw[],
};

export const COMPENDIUM_PACKS: CompendiumPackMeta[] = [
  {
    id: "armas",
    label: "Armas",
    description: "Armas corpo a corpo e à distância com alcance em células e PA.",
    documentKind: "item",
    roles: "public",
  },
  {
    id: "habilidades",
    label: "Habilidades",
    description: "Talentos táticos, reações e manobras de combate.",
    documentKind: "item",
    roles: "public",
  },
  {
    id: "magias",
    label: "Magias",
    description: "Feitiços do sistema Eldarin (nível, escola, alcance).",
    documentKind: "item",
    roles: "public",
  },
  {
    id: "equipamentos",
    label: "Equipamentos",
    description: "Armaduras, ferramentas e itens de aventura.",
    documentKind: "item",
    roles: "public",
  },
  {
    id: "consumiveis",
    label: "Consumíveis",
    description: "Poções, antídotos e elixires usáveis em combate.",
    documentKind: "item",
    roles: "public",
  },
  {
    id: "monstros",
    label: "Monstros",
    description: "NPCs prontos para o mestre colocar na mesa.",
    documentKind: "actor",
    roles: ["admin"],
  },
];

function normalizeEntry(packId: CompendiumPackId, raw: CompendiumEntryRaw, index: number): CompendiumEntry {
  const id = raw.id ?? `${packId}-${slugId(raw.name) || index}`;
  return { ...raw, id, packId };
}

function entriesForPack(packId: CompendiumPackId): CompendiumEntry[] {
  return PACK_DATA[packId].map((raw, i) => normalizeEntry(packId, raw, i));
}

export function canViewPack(
  pack: CompendiumPackMeta,
  role: UserRole | null,
  opts?: { isRoomGm?: boolean }
): boolean {
  if (pack.roles === "public") return true;
  if (pack.id === "monstros") {
    return role === "admin" || Boolean(opts?.isRoomGm);
  }
  if (!role) return false;
  if (Array.isArray(pack.roles)) return pack.roles.includes(role);
  return false;
}

export function getVisiblePacks(role: UserRole | null, opts?: { isRoomGm?: boolean }): CompendiumPackMeta[] {
  return COMPENDIUM_PACKS.filter((p) => canViewPack(p, role, opts));
}

export function getPackEntries(
  packId: CompendiumPackId,
  opts?: { query?: string; role?: UserRole | null; isRoomGm?: boolean }
): CompendiumEntry[] {
  const pack = COMPENDIUM_PACKS.find((p) => p.id === packId);
  if (!pack || !canViewPack(pack, opts?.role ?? null, { isRoomGm: opts?.isRoomGm })) return [];

  const q = opts?.query?.trim().toLowerCase() ?? "";
  let entries = entriesForPack(packId);

  if (packId === "equipamentos") {
    entries = entries.filter((e) => e.system.consumable !== true);
  }

  if (q) {
    entries = entries.filter((e) => {
      const desc = String((e.system.description as string | undefined) ?? "").toLowerCase();
      return e.name.toLowerCase().includes(q) || desc.includes(q);
    });
  }

  return entries;
}

export function getEntry(packId: CompendiumPackId, entryId: string): CompendiumEntry | null {
  return entriesForPack(packId).find((e) => e.id === entryId) ?? null;
}
