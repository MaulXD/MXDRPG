"use client";

import {
  IconBoot,
  IconHeart,
  IconLightning,
  IconShield,
  IconStar,
} from "@/components/character/SheetPopupIcons";

type Props = {
  defesa: number;
  iniciativa: number;
  movimentoWalk: number;
  movimentoRun: number;
  profBonus: number;
  hpValue: number;
  hpMax: number;
  hpPct: number;
};

export function SheetPopupCombatStrip({
  defesa,
  iniciativa,
  movimentoWalk,
  movimentoRun,
  profBonus,
  hpValue,
  hpMax,
  hpPct,
}: Props) {
  const initLabel = iniciativa >= 0 ? `+${iniciativa}` : `${iniciativa}`;

  return (
    <div className="sheet-popup-combat-strip">
      <div className="sheet-popup-combat-strip__main">
        <div className="sheet-popup-shield" title="Classe de Armadura (CA)">
          <IconShield size={32} className="sheet-popup-shield__icon" />
          <span className="sheet-popup-shield__value">{defesa}</span>
          <span className="sheet-popup-shield__label">CA</span>
        </div>

        <div className="sheet-popup-stat-pills" role="list" aria-label="Estatísticas de combate">
        <div className="sheet-popup-stat-pill" role="listitem" title="Iniciativa — ordem no combate">
          <IconLightning size={16} />
          <span className="sheet-popup-stat-pill__label">Iniciativa</span>
          <strong>{initLabel}</strong>
        </div>
        <div
          className="sheet-popup-stat-pill"
          role="listitem"
          title="Movimento — caminhada / corrida em hexes por turno"
        >
          <IconBoot size={16} />
          <span className="sheet-popup-stat-pill__label">Movimento</span>
          <strong>
            {movimentoWalk}/{movimentoRun}
          </strong>
        </div>
        <div
          className="sheet-popup-stat-pill"
          role="listitem"
          title="Proficiência — bônus em perícias treinadas e ataques"
        >
          <IconStar size={16} />
          <span className="sheet-popup-stat-pill__label">Proficiência</span>
          <strong>+{profBonus}</strong>
        </div>
        </div>
      </div>

      <div className="sheet-popup-resource sheet-popup-resource--hp sheet-popup-resource--inline">
        <div className="sheet-popup-resource__head">
          <span className="sheet-popup-resource__title">
            <IconHeart size={14} />
            Vida
          </span>
          <strong>
            {hpValue}/{hpMax}
          </strong>
        </div>
        <div className="sheet-popup-bar">
          <span className="sheet-popup-bar-fill--hp" style={{ width: `${hpPct}%` }} />
        </div>
      </div>
    </div>
  );
}
