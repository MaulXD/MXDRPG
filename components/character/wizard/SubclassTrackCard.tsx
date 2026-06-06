"use client";

import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import {
  subclassSpecialtyTooltip,
  subclassTalentTooltip,
} from "@/lib/character/subclass-wizard-tooltips";
import type { SubclassTrack } from "@/lib/character/subclass-tracks";

type Props = {
  track: SubclassTrack;
};

export function SubclassTrackCard({ track }: Props) {
  const windowTalents = track.talents.filter((t) => t.kind === "talent");
  const ascension = track.talents.find((t) => t.kind === "ascension");

  return (
    <article className="char-wizard-track">
      <strong>{track.subclass}</strong>
      <WizardHoverTip text={subclassSpecialtyTooltip(track.specialty)}>
        <span className="char-wizard-track__line">Nv 2 — {track.specialty}</span>
      </WizardHoverTip>
      <ul className="char-wizard-track__talents">
        {windowTalents.map((t) => (
          <li key={t.id}>
            <WizardHoverTip text={subclassTalentTooltip(track, t)}>
              <span>
                Nv {t.level} — {t.name}
              </span>
            </WizardHoverTip>
          </li>
        ))}
        {ascension ? (
          <li className="char-wizard-track__ascension">
            <WizardHoverTip text={subclassTalentTooltip(track, ascension)}>
              <span>Ascensão nv. 20 — {ascension.name}</span>
            </WizardHoverTip>
          </li>
        ) : null}
      </ul>
    </article>
  );
}
