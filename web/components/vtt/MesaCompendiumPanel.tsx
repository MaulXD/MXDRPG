"use client";

import { CompendiumBrowser } from "@/components/compendium/CompendiumBrowser";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";
import type { UserRole } from "@/lib/auth/types";

type Props = {
  packs: CompendiumPackMeta[];
  data: Record<CompendiumPackId, CompendiumEntry[]>;
  role: UserRole | null;
};

export function MesaCompendiumPanel({ packs, data, role }: Props) {
  return (
    <div className="mesa-panel-scroll">
      <CompendiumBrowser packs={packs} data={data} role={role} />
    </div>
  );
}
