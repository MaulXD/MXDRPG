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
import { religionDisplayName } from "@/lib/character/pantheon";
import { buildSheetSavingThrows } from "@/lib/character/sheet-skills";
import { SheetDdbSkillsPanel } from "@/components/character/SheetDdbSkillsPanel";
import "./sheet-ddb.css";

type Props = {
  character: CharacterSheet;
  displayDefesa: number;
  profBonus: number;
  hpPct: number;
  portrait: ReactNode;
  toolbar?: ReactNode;
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

  const classLine = [identity.classe, nivel ? `Nv ${nivel}` : null].filter(Boolean).join(" · ");

  return (
    <div className="sheet-shell sheet-shell--popup sheet-shell--ddb">
      {toolbar ? <div className="sheet-ddb-toolbar">{toolbar}</div> : null}

      <header className="sheet-ddb-header">
        <div className="sheet-ddb-header__main">
          <h2 className="sheet-ddb-header__name">{character.name}</h2>
          <p className="sheet-ddb-header__class">{classLine.toUpperCase()}</p>
        </div>
        <div className="sheet-ddb-header__meta">
          <div className="sheet-ddb-header__level" aria-label={`Nível ${nivel}`}>
            {nivel}
          </div>
          <div className="sheet-ddb-header__xp">
            <span className="sheet-ddb-header__xp-text">{xpDetail.secondary}</span>
            <div
              className="sheet-ddb-header__xp-bar"
              role="progressbar"
              aria-valuenow={nivel >= MAX_LEVEL ? 100 : xpPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={xpDetail.barLabel}
            >
              <span style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="sheet-ddb-attrs" role="group" aria-label="Atributos">
        {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => {
          const m = attributeMod(character.attributes[k]);
          const sign = m > 0 ? "pos" : m < 0 ? "neg" : "zero";
          return (
            <div className="sheet-ddb-attr" key={k}>
              <span className="sheet-ddb-attr__label">{ATTRIBUTE_LABELS[k]}</span>
              <strong className="sheet-ddb-attr__score">{character.attributes[k]}</strong>
              <span className={`sheet-ddb-attr__mod sheet-ddb-attr__mod--${sign}`}>
                {m >= 0 ? `+${m}` : m}
              </span>
            </div>
          );
        })}
      </div>

      <div className="sheet-ddb-body">
        <aside className="sheet-ddb-col sheet-ddb-col--left">
          <div className="sheet-ddb-portrait-wrap">{portrait}</div>

          <div className="sheet-ddb-hex-row" aria-label="Combate rápido">
            <div className="sheet-ddb-hex">
              <span className="sheet-ddb-hex__label">Inic.</span>
              <strong>
                {tactical.iniciativa >= 0 ? `+${tactical.iniciativa}` : tactical.iniciativa}
              </strong>
            </div>
            <div className="sheet-ddb-hex sheet-ddb-hex--center">
              <span className="sheet-ddb-hex__label">Desloc.</span>
              <strong>
                {movement.walk}/{movement.run}
              </strong>
            </div>
            <div className="sheet-ddb-hex">
              <span className="sheet-ddb-hex__label">Prof.</span>
              <strong>+{profBonus}</strong>
            </div>
          </div>

          <div className="sheet-ddb-resource">
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

          <div className="sheet-ddb-resource">
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

          <div className="sheet-ddb-ca">
            <span>Classe de armadura</span>
            <strong>{displayDefesa}</strong>
          </div>
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
                <div
                  key={save.attr}
                  className={`sheet-ddb-save${save.trained ? " is-trained" : ""}`}
                >
                  <span className={`sheet-ddb-save__dot${save.trained ? " is-on" : ""}`} />
                  <span className="sheet-ddb-save__label">{save.label}</span>
                  <strong>{save.display}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="sheet-ddb-panel sheet-ddb-panel--traits" aria-label="Traços">
            <header className="sheet-ddb-panel__head">
              <h3>Traços</h3>
            </header>
            <div className="sheet-ddb-trait-cards">
              {identity.raca ? (
                <div className="sheet-ddb-trait">
                  <span className="sheet-ddb-trait__tag">Raça</span>
                  <span className="sheet-ddb-trait__value">{identity.raca}</span>
                </div>
              ) : null}
              {identity.classe ? (
                <div className="sheet-ddb-trait">
                  <span className="sheet-ddb-trait__tag">Classe</span>
                  <span className="sheet-ddb-trait__value">{identity.classe}</span>
                </div>
              ) : null}
              {identity.subclasse ? (
                <div className="sheet-ddb-trait sheet-ddb-trait--accent">
                  <span className="sheet-ddb-trait__tag">Subclasse</span>
                  <span className="sheet-ddb-trait__value">{identity.subclasse}</span>
                </div>
              ) : null}
              {identity.antecedente ? (
                <div className="sheet-ddb-trait">
                  <span className="sheet-ddb-trait__tag">Antecedente</span>
                  <span className="sheet-ddb-trait__value">{identity.antecedente}</span>
                </div>
              ) : null}
              <div className="sheet-ddb-trait">
                <span className="sheet-ddb-trait__tag">Religião</span>
                <span className="sheet-ddb-trait__value">
                  {identity.religiao ? religionDisplayName(identity.religiao) : "Sem Deus"}
                </span>
              </div>
            </div>
          </section>

          <section className="sheet-ddb-panel sheet-ddb-panel--culinary" aria-label="Culinária">
            <header className="sheet-ddb-panel__head">
              <h3>Culinária</h3>
            </header>
            <div className="sheet-ddb-culinary">
              {(Object.keys(CULINARY_LABELS) as CulinaryKey[]).map((k) => (
                <div className="sheet-ddb-culinary__item" key={k}>
                  <span>{CULINARY_LABELS[k]}</span>
                  <strong>+{character.culinary[k] ?? 0}</strong>
                </div>
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
