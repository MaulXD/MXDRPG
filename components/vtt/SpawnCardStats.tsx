"use client";

import type { ReactNode } from "react";
import { IconHeart, IconLightning, IconShield } from "@/components/character/SheetPopupIcons";
import { IconSkull } from "@/components/ui/EldarinIcons";

type StatProps = {
  icon: ReactNode;
  value: string | number;
  title: string;
};

function SpawnCardStat({ icon, value, title }: StatProps) {
  return (
    <span className="vtt-spawn-stat" title={title}>
      {icon}
      <strong>{value}</strong>
    </span>
  );
}

type RowProps = {
  hp: string | number;
  def: string | number;
  pa: string | number;
  threat?: number;
};

export function SpawnCardStatsRow({ hp, def, pa, threat }: RowProps) {
  return (
    <div className="vtt-spawn-stats" role="group" aria-label="Estatísticas">
      {threat != null ? (
        <SpawnCardStat icon={<IconSkull size={13} />} value={threat} title="Nível de ameaça" />
      ) : null}
      <SpawnCardStat icon={<IconHeart size={13} />} value={hp} title="Vida" />
      <SpawnCardStat icon={<IconShield size={13} />} value={def} title="Classe de armadura" />
      <SpawnCardStat icon={<IconLightning size={13} />} value={pa} title="Pontos de ação" />
    </div>
  );
}
