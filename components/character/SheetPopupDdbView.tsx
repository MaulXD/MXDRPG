"use client";

import type { ReactNode } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  CULINARY_LABELS,
  type AttributeKey,
  type CulinaryKey,
} from "@/lib/character/rules";
import { formatXpProgressDetail, xpProgressRatio, MAX_LEVEL } from "@/lib/character/xp";
import { SheetHoverTip } from "@/components/character/SheetHoverTip";
import { religionDisplayName } from "@/lib/character/pantheon";
import { buildSheetSavingThrows } from "@/lib/character/sheet-skills";
import {
  attributeTip,
  backgroundChipTip,
  classChipTip,
  combatStatTip,
  culinaryTip,
  deityChipTip,
  levelTip,
  raceChipTip,
  savingThrowTip,
  subclassChipTip,
  xpBarTip,
} from "@/lib/character/sheet-tooltips";
import { SheetDdbShieldAc } from "@/components/character/SheetDdbShieldAc";
import { SheetDdbSkillsPanel } from "@/components/character/SheetDdbSkillsPanel";
import type { FoundryWindowDragHandlers } from "@/hooks/vtt/useFoundryWindowDrag";
import "./sheet-ddb.css";

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
  /** Página /personagem/:id — sem arraste, toolbar só com ações */
  standalone?: boolean;
  loadout?: ReactNode;
  drawer: ReactNode;
  inRoom: boolean;
  roomId?: string;
  onRoll?: () => void;
};

export function SheetPopupDdbView({
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
  loadout,
  drawer,
  inRoom,
  roomId,
  onRoll,
}: Props) {
  const { identity, resources, movement, tactical } = character;
  const nivel = identity.nivel;
  const xpTotal = identity.xpTotal ?? 0;
  const xpPct = Math.round(xpProgressRatio(nivel, xpTotal) * 100);
  const xpDetail = formatXpProgressDetail(nivel, xpTotal);
  const saves = buildSheetSavingThrows(character);
  const paPct =
    resources.pontosAcao.max > 0
      ? Math.round((resources.pontosAcao.value / resources.pontosAcao.max) * 100)
      : 0;

  const classLine = [identity.classe, nivel ? `NV ${nivel}` : null]
    .filter(Boolean)
    .join(" • ");
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
    "sheet-shell--ddb",
    standalone ? "sheet-shell--ddb-standalone" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      {toolbar || toolbarLeading || toolbarTrailing ? (
        <div className="sheet-ddb-toolbar" {...dragHandle}>
          {toolbarLeading ? (
            <div className="sheet-ddb-toolbar__leading">{toolbarLeading}</div>
          ) : standalone ? (
            <span className="sheet-ddb-toolbar__label">Ficha de personagem</span>
          ) : (
            <span className="sheet-ddb-toolbar__drag-hint" aria-hidden>
              ⠿
            </span>
          )}
          <div className="sheet-ddb-toolbar__actions" data-no-drag>
            {toolbar}
            {toolbarTrailing}
          </div>
        </div>
      ) : null}

      <div className="sheet-ddb-hero">
        <div className="sheet-ddb-hero__portrait" data-no-drag>
          <div className="sheet-ddb-portrait-wrap">{portrait}</div>
        </div>

        <header className="sheet-ddb-header" {...dragHandle}>
          <div className="sheet-ddb-header__main">
            <h2 className="sheet-ddb-header__name">{character.name}</h2>
            <p className="sheet-ddb-header__class">{classLine.toUpperCase()}</p>
          </div>
          <div className="sheet-ddb-header__meta" data-no-drag>
            <SheetHoverTip
              className="sheet-ddb-header__level-tip"
              tip={levelTip(nivel, xpTotal)}
            >
              <div className="sheet-ddb-header__level" tabIndex={0} aria-label={`Nível ${nivel}`}>
                {nivel}
              </div>
            </SheetHoverTip>
            <SheetHoverTip
              className="sheet-ddb-header__xp-tip"
              tip={xpBarTip(nivel, xpTotal)}
            >
              <div className="sheet-ddb-header__xp" tabIndex={0} title={xpDetail.secondary}>
                <span className="sheet-ddb-header__xp-text">{xpDetail.primary}</span>
                <div
                  className="sheet-ddb-header__xp-bar"
                  role="progressbar"
                  aria-valuenow={nivel >= MAX_LEVEL ? 100 : xpPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${xpDetail.primary} — ${xpDetail.secondary}`}
                >
                  <span style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </SheetHoverTip>
          </div>
        </header>

        <div className="sheet-ddb-attrs" role="group" aria-label="Atributos">
          {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => {
            const m = attributeMod(character.attributes[k]);
            const sign = m > 0 ? "pos" : m < 0 ? "neg" : "zero";
            return (
              <SheetHoverTip
                key={k}
                className="sheet-ddb-attr-tip"
                tip={attributeTip(k, character.attributes[k], m)}
              >
                <div className="sheet-ddb-attr" tabIndex={0}>
                  <span className="sheet-ddb-attr__label">{ATTRIBUTE_LABELS[k]}</span>
                  <strong className="sheet-ddb-attr__score">{character.attributes[k]}</strong>
                  <span className={`sheet-ddb-attr__mod sheet-ddb-attr__mod--${sign}`}>
                    {m >= 0 ? `+${m}` : m}
                  </span>
                </div>
              </SheetHoverTip>
            );
          })}
        </div>
      </div>

      <div className="sheet-ddb-body">
        <aside className="sheet-ddb-col sheet-ddb-col--left">
          <div className="sheet-ddb-hex-row" aria-label="Combate rápido">
            <SheetHoverTip
              className="sheet-ddb-hex-tip"
              tip={combatStatTip("iniciativa", { iniciativa: tactical.iniciativa })}
            >
              <div className="sheet-ddb-hex" tabIndex={0}>
                <span className="sheet-ddb-hex__label">Inic.</span>
                <strong>
                  {tactical.iniciativa >= 0 ? `+${tactical.iniciativa}` : tactical.iniciativa}
                </strong>
              </div>
            </SheetHoverTip>
            <SheetHoverTip
              className="sheet-ddb-hex-tip"
              tip={combatStatTip("movement", { walk: movement.walk, run: movement.run })}
            >
              <div className="sheet-ddb-hex sheet-ddb-hex--center" tabIndex={0}>
                <span className="sheet-ddb-hex__label">Desloc.</span>
                <strong>
                  {movement.walk}/{movement.run}
                </strong>
              </div>
            </SheetHoverTip>
            <SheetHoverTip
              className="sheet-ddb-hex-tip"
              tip={combatStatTip("prof", { prof: profBonus })}
            >
              <div className="sheet-ddb-hex" tabIndex={0}>
                <span className="sheet-ddb-hex__label">Prof.</span>
                <strong>+{profBonus}</strong>
              </div>
            </SheetHoverTip>
            <SheetHoverTip
              className="sheet-ddb-shield-tip"
              tip={combatStatTip("ca", { ca: displayDefesa })}
            >
              <SheetDdbShieldAc value={displayDefesa} tabIndex={0} />
            </SheetHoverTip>
          </div>

          <SheetHoverTip
            className="sheet-ddb-resource-tip"
            tip={combatStatTip("hp", {
              hp: `${resources.vida.value}/${resources.vida.max}`,
            })}
          >
            <div className="sheet-ddb-resource" tabIndex={0}>
              <div className="sheet-ddb-resource__head">
                <span>Pontos de vida</span>
                <strong>
                  {resources.vida.value}/{resources.vida.max}
                </strong>
              </div>
              <div className="sheet-ddb-resource__bar sheet-ddb-resource__bar--hp">
                <span style={{ width: `${hpPct}%` }} />
              </div>
            </div>
          </SheetHoverTip>

          <SheetHoverTip
            className="sheet-ddb-resource-tip"
            tip={combatStatTip("pa", {
              pa: `${resources.pontosAcao.value}/${resources.pontosAcao.max}`,
            })}
          >
            <div className="sheet-ddb-resource" tabIndex={0}>
              <div className="sheet-ddb-resource__head">
                <span>Pontos de ação</span>
                <strong>
                  {resources.pontosAcao.value}/{resources.pontosAcao.max}
                </strong>
              </div>
              <div className="sheet-ddb-resource__bar sheet-ddb-resource__bar--pa">
                <span style={{ width: `${paPct}%` }} />
              </div>
            </div>
          </SheetHoverTip>
        </aside>

        <main className="sheet-ddb-col sheet-ddb-col--skills">
          <SheetDdbSkillsPanel
            actor={character}
            roomId={inRoom ? roomId : undefined}
            onRoll={onRoll}
          />
        </main>

        <aside className="sheet-ddb-col sheet-ddb-col--right">
          <section className="sheet-ddb-panel sheet-ddb-panel--saves" aria-label="Salvaguardas">
            <header className="sheet-ddb-panel__head">
              <h3>Salvaguardas</h3>
            </header>
            <div className="sheet-ddb-saves">
              {saves.map((save) => (
                <SheetHoverTip
                  key={save.attr}
                  className="sheet-ddb-save-tip"
                  tip={savingThrowTip(save, nivel)}
                >
                  <div
                    className={`sheet-ddb-save${save.trained ? " is-trained" : ""}`}
                    tabIndex={0}
                  >
                    <span className={`sheet-ddb-save__dot${save.trained ? " is-on" : ""}`} />
                    <span className="sheet-ddb-save__label">{save.label}</span>
                    <strong>{save.display}</strong>
                  </div>
                </SheetHoverTip>
              ))}
            </div>
          </section>

          <section className="sheet-ddb-panel sheet-ddb-panel--traits" aria-label="Traços">
            <header className="sheet-ddb-panel__head">
              <h3>Traços</h3>
            </header>
            <div className="sheet-ddb-trait-cards">
              {identity.raca ? (
                <SheetHoverTip className="sheet-ddb-trait-tip" tip={raceChipTip(identity)}>
                  <div className="sheet-ddb-trait" tabIndex={0}>
                    <span className="sheet-ddb-trait__tag">Raça</span>
                    <span className="sheet-ddb-trait__value">{identity.raca}</span>
                  </div>
                </SheetHoverTip>
              ) : null}
              {identity.classe ? (
                <SheetHoverTip className="sheet-ddb-trait-tip" tip={classChipTip(identity.classe)}>
                  <div className="sheet-ddb-trait" tabIndex={0}>
                    <span className="sheet-ddb-trait__tag">Classe</span>
                    <span className="sheet-ddb-trait__value">{identity.classe}</span>
                  </div>
                </SheetHoverTip>
              ) : null}
              {identity.subclasse ? (
                <SheetHoverTip
                  className="sheet-ddb-trait-tip"
                  tip={subclassChipTip(identity.classe, identity.subclasse, nivel)}
                >
                  <div className="sheet-ddb-trait sheet-ddb-trait--accent" tabIndex={0}>
                    <span className="sheet-ddb-trait__tag">Subclasse</span>
                    <span className="sheet-ddb-trait__value">{identity.subclasse}</span>
                  </div>
                </SheetHoverTip>
              ) : null}
              {identity.antecedente ? (
                <SheetHoverTip
                  className="sheet-ddb-trait-tip"
                  tip={backgroundChipTip(identity.antecedente)}
                >
                  <div className="sheet-ddb-trait" tabIndex={0}>
                    <span className="sheet-ddb-trait__tag">Antecedente</span>
                    <span className="sheet-ddb-trait__value">{identity.antecedente}</span>
                  </div>
                </SheetHoverTip>
              ) : null}
              <SheetHoverTip className="sheet-ddb-trait-tip" tip={deityChipTip(identity.religiao)}>
                <div className="sheet-ddb-trait" tabIndex={0}>
                  <span className="sheet-ddb-trait__tag">Religião</span>
                  <span className="sheet-ddb-trait__value">
                    {identity.religiao ? religionDisplayName(identity.religiao) : "Sem Deus"}
                  </span>
                </div>
              </SheetHoverTip>
            </div>
          </section>

          <section className="sheet-ddb-panel sheet-ddb-panel--culinary" aria-label="Culinária">
            <header className="sheet-ddb-panel__head">
              <h3>Culinária</h3>
            </header>
            <div className="sheet-ddb-culinary">
              {(Object.keys(CULINARY_LABELS) as CulinaryKey[]).map((k) => (
                <SheetHoverTip
                  key={k}
                  className="sheet-ddb-culinary-tip"
                  tip={culinaryTip(k, character.culinary[k] ?? 0)}
                >
                  <div className="sheet-ddb-culinary__item" tabIndex={0}>
                    <span>{CULINARY_LABELS[k]}</span>
                    <strong>+{character.culinary[k] ?? 0}</strong>
                  </div>
                </SheetHoverTip>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {loadout ? <div className="sheet-ddb-loadout">{loadout}</div> : null}

      <div className="sheet-ddb-drawer">{drawer}</div>
    </div>
  );
}
