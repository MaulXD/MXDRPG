"use client";

import "@/components/world/world-lore.css";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import { getReligion, religionDisplayName } from "@/lib/character/pantheon";
import { religionBonusTooltip } from "@/lib/character/religion-tooltips";
import { ReligionDeityIcon } from "@/components/character/ReligionDeityIcon";
import { religionIconColor } from "@/lib/character/wizard-religion-icons";

type Props = {
  religiao: string | null | undefined;
  compact?: boolean;
};

export function ReligionSheetPanel({ religiao, compact }: Props) {
  const r = getReligion(religiao);
  if (!r) {
    return (
      <p className="sheet-track-empty">
        Devotion não definida — edite na ficha ou recrie com o assistente.
      </p>
    );
  }

  const tip = religionBonusTooltip(r.id);
  const color = religionIconColor(r.id);

  return (
    <div className={`sheet-religion${compact ? " sheet-religion--compact" : ""}`}>
      {compact ? <p className="sheet-religion__eyebrow">Devotion</p> : null}
      <div className="sheet-religion__header">
        <span
          className="sheet-religion__glyph sheet-religion__glyph--svg"
          style={{ color, borderColor: `${color}55`, background: `${color}18` }}
          aria-hidden
        >
          <ReligionDeityIcon religionId={r.id} size={22} />
        </span>
        <div>
          <WizardHoverTip text={tip}>
            <p className="sheet-religion__title">{religionDisplayName(r.id)}</p>
          </WizardHoverTip>
          <p className="sheet-religion__domain">{r.domain}</p>
        </div>
      </div>
      {!compact ? <p className="sheet-religion__summary">{r.summary}</p> : null}
      <ul className="sheet-religion__bonuses">
        {r.bonuses.map((b) => (
          <li key={b}>
            <WizardHoverTip text={b}>{b.split(":")[0] ?? b}</WizardHoverTip>
          </li>
        ))}
      </ul>
      {r.penalties?.length ? (
        <p className="sheet-religion__penalty">
          Limitações:{" "}
          {r.penalties.map((p, i) => (
            <span key={p}>
              {i > 0 ? " · " : null}
              <WizardHoverTip text={p}>{p.split(":")[0] ?? p}</WizardHoverTip>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
