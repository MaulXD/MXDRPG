import type { UserRole } from "@/lib/auth/types";

export type ItemType = "arma" | "habilidade" | "magia" | "equipamento" | "efeito";
export type ActorType = "character" | "npc";

export type CompendiumPackId = "armas" | "habilidades" | "magias" | "monstros" | "equipamentos";

export type CompendiumEntryRaw = {
  id?: string;
  name: string;
  type: ItemType | ActorType;
  img?: string;
  system: Record<string, unknown>;
};

export type CompendiumEntry = CompendiumEntryRaw & {
  id: string;
  packId: CompendiumPackId;
};

export type CompendiumPackMeta = {
  id: CompendiumPackId;
  label: string;
  description: string;
  documentKind: "item" | "actor";
  /** Roles that can browse this pack. Empty = public. */
  roles: UserRole[] | "public";
};
