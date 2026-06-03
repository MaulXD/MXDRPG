"use client";

import type { CharacterSheet } from "@/lib/character/types";
import {
  describeTrackProgress,
  getSubclassTrack,
  parseCharacterTalents,
} from "@/lib/character/subclass-tracks";
import { habilidadeEntryForTalent } from "@/lib/character/subclass-vtt";

type Props = {
  actor: CharacterSheet;
};

export function SubclassTrackPanel({ actor }: Props) {
  const track = getSubclassTrack(actor.identity.subclasse);
  if (!track) {
    if (!actor.identity.subclasse) {
      return (
        <p className="sheet-track-empty">
          Escolha subclasse no nv 2 para ver trilha de talentos (Cap. 12).
        </p>
      );
    }
    return <p className="sheet-track-empty">Trilha não encontrada para esta subclasse.</p>;
  }

  const owned = parseCharacterTalents(actor.identity.talentos);
  const rows = describeTrackProgress(track, owned, actor.identity.nivel);

  return (
    <div className="sheet-track">
      <p className="eyebrow">Trilha — {track.subclass}</p>
      <p className="sheet-track-meta">
        {track.specialty} · Dieta nv2 ativa após refeição Comum+
      </p>
      <ol className="sheet-track-list">
        {rows.map((row) => {
          const talent = track.talents.find((t) => t.level === row.level);
          const onVtt =
            row.state === "done" &&
            talent &&
            talent.kind === "talent" &&
            habilidadeEntryForTalent(talent, track.classId);
          return (
            <li key={`${row.level}-${row.label}`} className={`sheet-track-item sheet-track-${row.state}`}>
              <span className="sheet-track-lv">Nv {row.level}</span>
              <span className="sheet-track-label">
                {row.label}
                {onVtt ? <small className="sheet-track-vtt"> · mesa</small> : null}
              </span>
              <span className="sheet-track-state">
                {row.state === "done"
                  ? "✓"
                  : row.state === "available"
                    ? "→"
                    : row.state === "locked"
                      ? "!"
                      : "·"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
