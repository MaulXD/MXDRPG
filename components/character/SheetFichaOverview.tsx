"use client";

import type { CharacterSheet } from "@/lib/character/types";
import { CULINARY_LABELS, type CulinaryKey } from "@/lib/character/rules";
import { religionDisplayName } from "@/lib/character/pantheon";
import { buildSheetSavingThrows } from "@/lib/character/sheet-skills";
import {
  backgroundChipTip,
  classChipTip,
  culinaryTip,
  deityChipTip,
  raceChipTip,
  savingThrowTip,
  subclassChipTip,
} from "@/lib/character/sheet-tooltips";
import { SheetHoverTip } from "@/components/character/SheetHoverTip";
import { SheetDdbSkillsPanel } from "@/components/character/SheetDdbSkillsPanel";

type Props = {
  character: CharacterSheet;
  inRoom: boolean;
  roomId?: string;
  onRoll?: () => void;
};

/** Perícias, salvaguardas e traços — aba “Ficha” no layout V2. */
export function SheetFichaOverview({ character, inRoom, roomId, onRoll }: Props) {
  const { identity } = character;
  const nivel = identity.nivel;
  const saves = buildSheetSavingThrows(character);

  return (
    <div className="sheet-v2-overview">
      <section className="sheet-v2-overview__skills" aria-label="Perícias">
        <SheetDdbSkillsPanel
          actor={character}
          roomId={inRoom ? roomId : undefined}
          onRoll={onRoll}
        />
      </section>

      <aside className="sheet-v2-overview__aside">
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
                <div className="sheet-ddb-trait">
                  <span className="sheet-ddb-trait__tag">Raça</span>
                  <span className="sheet-ddb-trait__value">{identity.raca}</span>
                </div>
              </SheetHoverTip>
            ) : null}
            {identity.classe ? (
              <SheetHoverTip className="sheet-ddb-trait-tip" tip={classChipTip(identity.classe)}>
                <div className="sheet-ddb-trait">
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
                <div className="sheet-ddb-trait sheet-ddb-trait--accent">
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
                <div className="sheet-ddb-trait">
                  <span className="sheet-ddb-trait__tag">Antecedente</span>
                  <span className="sheet-ddb-trait__value">{identity.antecedente}</span>
                </div>
              </SheetHoverTip>
            ) : null}
            <SheetHoverTip className="sheet-ddb-trait-tip" tip={deityChipTip(identity.religiao)}>
              <div className="sheet-ddb-trait">
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
  );
}
