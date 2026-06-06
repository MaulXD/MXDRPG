"use client";

import "@/components/character/wizard/wizard.css";
import "@/components/world/world-lore.css";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import {
  MAJOR_RELIGIONS,
  MINOR_RELIGIONS,
  SECULAR_RELIGIONS,
  type ReligionDef,
} from "@/lib/character/pantheon";
import { religionCardTooltip, religionLoreSnippet } from "@/lib/character/religion-tooltips";
import { religionGlyph, religionIconColor } from "@/lib/character/wizard-religion-icons";

type Props = {
  value: string | null;
  onChange: (id: string) => void;
  compact?: boolean;
  disabled?: boolean;
};

function ReligionCard({
  r,
  selected,
  onPick,
  compact,
  disabled,
}: {
  r: ReligionDef;
  selected: boolean;
  onPick: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const tip = religionCardTooltip(r);
  const lore = religionLoreSnippet(r.id);
  const color = religionIconColor(r.id);
  const glyph = religionGlyph(r.id);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      className={`char-wizard-pick ${selected ? "char-wizard-pick--on" : ""}${compact ? " char-wizard-pick--compact" : ""}`}
      onClick={onPick}
    >
      <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
        <span
          className="char-wizard-pick__icon"
          style={{ color, borderColor: `${color}55`, background: `${color}18` }}
          aria-hidden
        >
          {glyph}
        </span>
        <span className="char-wizard-pick__check" aria-hidden>
          ✓
        </span>
      </div>
      <WizardHoverTip text={tip}>
        <strong>
          {r.name}
          {r.tier !== "secular" ? (
            <span className="char-wizard-pick__epithet"> — {r.epithet}</span>
          ) : null}
        </strong>
      </WizardHoverTip>
      <span>{r.summary}</span>
      {!compact ? (
        <span className="char-wizard-pick__domain">
          <WizardHoverTip text={lore}>{r.domain}</WizardHoverTip>
          {" · "}
          {r.bonuses.length} bônus
          {r.penalties?.length ? ` · ${r.penalties.length} limitação` : ""}
        </span>
      ) : null}
    </button>
  );
}

export function ReligionPickGrid({ value, onChange, compact, disabled }: Props) {
  return (
    <div className="religion-pick">
      <section className="religion-pick__section">
        <h4 className="religion-pick__heading">Deuses do panteão</h4>
        <p className="char-wizard-meta">
          Passe o mouse no nome para ver bônus completos; no domínio para lore e cultos.
        </p>
        <div
          className="char-wizard-pick-grid char-wizard-pick-grid--wide"
          role="listbox"
          aria-label="Deuses principais"
        >
          {MAJOR_RELIGIONS.map((r) => (
            <ReligionCard
              key={r.id}
              r={r}
              selected={value === r.id}
              onPick={() => onChange(r.id)}
              compact={compact}
              disabled={disabled}
            />
          ))}
        </div>
      </section>

      <section className="religion-pick__section">
        <h4 className="religion-pick__heading">Cultos menores</h4>
        <div
          className="char-wizard-pick-grid char-wizard-pick-grid--wide"
          role="listbox"
          aria-label="Cultos menores"
        >
          {MINOR_RELIGIONS.map((r) => (
            <ReligionCard
              key={r.id}
              r={r}
              selected={value === r.id}
              onPick={() => onChange(r.id)}
              compact={compact}
              disabled={disabled}
            />
          ))}
        </div>
      </section>

      <section className="religion-pick__section">
        <h4 className="religion-pick__heading">Sem devoção</h4>
        <div className="char-wizard-pick-grid" role="listbox" aria-label="Sem deus">
          {SECULAR_RELIGIONS.map((r) => (
            <ReligionCard
              key={r.id}
              r={r}
              selected={value === r.id}
              onPick={() => onChange(r.id)}
              compact={compact}
              disabled={disabled}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
