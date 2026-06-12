"use client";

import type { ReactNode } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import { formatXpProgressDetail, xpProgressRatio, MAX_LEVEL } from "@/lib/character/xp";
import { SheetHoverTip } from "@/components/character/SheetHoverTip";
import { SheetDdbShieldAc } from "@/components/character/SheetDdbShieldAc";
import {
  combatStatTip,
  levelTip,
  xpBarTip,
} from "@/lib/character/sheet-tooltips";
import type { FoundryWindowDragHandlers } from "@/hooks/vtt/useFoundryWindowDrag";
import "./sheet-v2.css";

export type SheetV2TabId =
  | "ficha"
  | "inventário"
  | "tesouro"
  | "habilidades"
  | "magias"
  | "bestiário"
  | "gestão";

export type SheetV2SideTab = {
  id: SheetV2TabId;
  label: string;
  icon: ReactNode;
  count?: number;
};

type Props = {
  character: CharacterSheet;
  displayDefesa: number;
  profBonus: number;
  hpPct: number;
  portrait: ReactNode;
  toolbar?: ReactNode;
  toolbarLeading?: ReactNode;
  toolbarTrailing?: ReactNode;
  toolbarDrag?: FoundryWindowDragHandlers;
  standalone?: boolean;
  progression?: ReactNode;
  loadout?: ReactNode;
  inRoom: boolean;
  tabs: SheetV2SideTab[];
  activeTab: SheetV2TabId;
  onTabChange: (id: SheetV2TabId) => void;
  main: ReactNode;
};

export function SheetPopupV2View({
  character,
  displayDefesa,
  profBonus,
  hpPct,
  portrait,
  toolbar,
  toolbarLeading,
  toolbarTrailing,
  toolbarDrag,
  standalone = false,
  progression,
  loadout,
  inRoom,
  tabs,
  activeTab,
  onTabChange,
  main,
}: Props) {
  const { identity, resources, movement, tactical } = character;
  const nivel = identity.nivel;
  const xpTotal = identity.xpTotal ?? 0;
  const xpPct = Math.round(xpProgressRatio(nivel, xpTotal) * 100);
  const xpDetail = formatXpProgressDetail(nivel, xpTotal);
  const paPct =
    resources.pontosAcao.max > 0
      ? Math.round((resources.pontosAcao.value / resources.pontosAcao.max) * 100)
      : 0;

  const classLine = [identity.classe, identity.subclasse, nivel ? `Nv ${nivel}` : null]
    .filter(Boolean)
    .join(" · ");

  const dragHandle =
    !standalone && toolbarDrag
      ? {
          onPointerDown: toolbarDrag.onPointerDown,
          onPointerMove: toolbarDrag.onPointerMove,
          onPointerUp: toolbarDrag.onPointerUp,
          onPointerCancel: toolbarDrag.onPointerCancel,
        }
      : undefined;

  const shellClass = [
    "sheet-shell",
    "sheet-shell--popup",
    "sheet-shell--v2",
    standalone ? "sheet-shell--v2-standalone" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      {toolbar || toolbarLeading || toolbarTrailing ? (
        <div className="sheet-v2-toolbar" {...dragHandle}>
          {toolbarLeading ? (
            <div className="sheet-v2-toolbar__leading">{toolbarLeading}</div>
          ) : standalone ? (
            <span className="sheet-v2-toolbar__label">Ficha V2 (teste)</span>
          ) : (
            <span className="sheet-v2-toolbar__drag-hint" aria-hidden>
              ⠿
            </span>
          )}
          <div className="sheet-v2-toolbar__actions" data-no-drag>
            {toolbar}
            {toolbarTrailing}
          </div>
        </div>
      ) : null}

      <header className="sheet-v2-header" {...dragHandle}>
        <div className="sheet-v2-header__main">
          <h2 className="sheet-v2-header__name">{character.name}</h2>
          <p className="sheet-v2-header__class">{classLine}</p>
        </div>
        <div className="sheet-v2-header__meta" data-no-drag>
          <SheetHoverTip className="sheet-v2-header__level-tip" tip={levelTip(nivel, xpTotal)}>
            <div className="sheet-v2-header__level" tabIndex={0} aria-label={`Nível ${nivel}`}>
              {nivel}
            </div>
          </SheetHoverTip>
          <SheetHoverTip className="sheet-v2-header__xp-tip" tip={xpBarTip(nivel, xpTotal)}>
            <div className="sheet-v2-header__xp" tabIndex={0} title={xpDetail.secondary}>
              <span className="sheet-v2-header__xp-text">{xpDetail.primary}</span>
              <div
                className="sheet-v2-header__xp-bar"
                role="progressbar"
                aria-valuenow={nivel >= MAX_LEVEL ? 100 : xpPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </SheetHoverTip>
        </div>
      </header>

      {progression ? (
        <div className="sheet-v2-progression" data-no-drag>
          {progression}
        </div>
      ) : null}

      <div className="sheet-v2-frame">
        <aside className="sheet-v2-rail-left" aria-label="Retrato e combate">
          <div className="sheet-v2-portrait-wrap" data-no-drag>
            {portrait}
          </div>

          <SheetHoverTip
            className="sheet-v2-ac-tip"
            tip={combatStatTip("ca", { ca: displayDefesa })}
          >
            <div className="sheet-v2-ac">
              <SheetDdbShieldAc value={displayDefesa} tabIndex={0} />
            </div>
          </SheetHoverTip>

          <div className="sheet-v2-diamonds" aria-label="Estatísticas rápidas">
            <SheetHoverTip
              className="sheet-v2-diamond-tip"
              tip={combatStatTip("iniciativa", { iniciativa: tactical.iniciativa })}
            >
              <div className="sheet-v2-diamond" tabIndex={0}>
                <span>Inic.</span>
                <strong>
                  {tactical.iniciativa >= 0 ? `+${tactical.iniciativa}` : tactical.iniciativa}
                </strong>
              </div>
            </SheetHoverTip>
            <SheetHoverTip
              className="sheet-v2-diamond-tip"
              tip={combatStatTip("movement", { walk: movement.walk, run: movement.run })}
            >
              <div className="sheet-v2-diamond sheet-v2-diamond--wide" tabIndex={0}>
                <span>Desloc.</span>
                <strong>
                  {movement.walk}/{movement.run}
                </strong>
              </div>
            </SheetHoverTip>
            <SheetHoverTip
              className="sheet-v2-diamond-tip"
              tip={combatStatTip("prof", { prof: profBonus })}
            >
              <div className="sheet-v2-diamond" tabIndex={0}>
                <span>Prof.</span>
                <strong>+{profBonus}</strong>
              </div>
            </SheetHoverTip>
          </div>

          <SheetHoverTip
            className="sheet-v2-resource-tip"
            tip={combatStatTip("hp", { hp: `${resources.vida.value}/${resources.vida.max}` })}
          >
            <div className="sheet-v2-resource" tabIndex={0}>
              <div className="sheet-v2-resource__head">
                <span>Pontos de vida</span>
                <strong>
                  {resources.vida.value}/{resources.vida.max}
                </strong>
              </div>
              <div className="sheet-v2-resource__bar sheet-v2-resource__bar--hp">
                <span style={{ width: `${hpPct}%` }} />
              </div>
            </div>
          </SheetHoverTip>

          <SheetHoverTip
            className="sheet-v2-resource-tip"
            tip={combatStatTip("pa", {
              pa: `${resources.pontosAcao.value}/${resources.pontosAcao.max}`,
            })}
          >
            <div className="sheet-v2-resource" tabIndex={0}>
              <div className="sheet-v2-resource__head">
                <span>Pontos de ação</span>
                <strong>
                  {resources.pontosAcao.value}/{resources.pontosAcao.max}
                </strong>
              </div>
              <div className="sheet-v2-resource__bar sheet-v2-resource__bar--pa">
                <span style={{ width: `${paPct}%` }} />
              </div>
            </div>
          </SheetHoverTip>

          {inRoom ? (
            <p className="sheet-v2-sync" data-no-drag>
              <span className="sheet-live-dot" aria-hidden />
              Sync mesa
            </p>
          ) : null}
        </aside>

        <main className="sheet-v2-main" data-no-drag>
          {loadout ? <div className="sheet-v2-loadout">{loadout}</div> : null}
          <div className="sheet-v2-main__scroll">{main}</div>
        </main>

        <nav className="sheet-v2-rail-tabs" aria-label="Seções da ficha">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sheet-v2-tab${activeTab === t.id ? " is-active" : ""}`}
              aria-label={t.label}
              aria-current={activeTab === t.id ? "page" : undefined}
              title={t.label}
              onClick={() => onTabChange(t.id)}
            >
              <span className="sheet-v2-tab__icon">{t.icon}</span>
              {t.count && t.count > 0 ? (
                <span className="sheet-v2-tab__badge">{t.count}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
