"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import {
  buildFutureLevelRoadmap,
  upcomingRacialMilestones,
} from "@/lib/character/future-levels";

type Props = {
  actor: CharacterSheet;
  compact?: boolean;
};

export function FutureLevelsPanel({ actor, compact }: Props) {
  const [open, setOpen] = useState(false);
  const roadmap = useMemo(() => (open ? buildFutureLevelRoadmap(actor) : []), [actor, open]);
  const racialNext = useMemo(
    () => (open ? upcomingRacialMilestones(actor) : []),
    [actor, open]
  );

  if (actor.identity.nivel >= 20) {
    return (
      <p className="sheet-future-levels__done">Nível máximo — todos os marcos desbloqueados.</p>
    );
  }

  return (
    <div className={`sheet-future-levels${compact ? " sheet-future-levels--compact" : ""}`}>
      <button
        type="button"
        className="sheet-future-levels__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sheet-future-levels__toggle-title">Níveis futuros</span>
        <span className="sheet-future-levels__toggle-hint">
          {open ? "Ocultar" : `Nv ${actor.identity.nivel + 1}–20`}
        </span>
      </button>

      {open ? (
        <div className="sheet-future-levels__body">
          <p className="sheet-future-levels__intro">
            Cada nível traz ganhos de classe, raça ou subclasse. O que você já tem fica na ficha;
            aqui está só o que vem pela frente.
          </p>

          {racialNext.length > 0 ? (
            <p className="sheet-future-levels__race-hint">
              Próximos marcos raciais:{" "}
              {racialNext
                .slice(0, 3)
                .map((m) => `nv ${m.level} ${m.name}`)
                .join(" · ")}
            </p>
          ) : null}

          <ol className="sheet-future-levels__list">
            {roadmap.map((entry) => (
              <li key={entry.level} className="sheet-future-levels__row">
                <span className="sheet-future-levels__lv">Nv {entry.level}</span>
                <ul className="sheet-future-levels__gains">
                  {entry.gains.map((g, i) => (
                    <li key={`${entry.level}-${i}`}>
                      <span className="sheet-future-levels__source">{g.source}</span>
                      {g.text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
