"use client";

import "@/components/character/wizard/wizard.css";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import { RELIGION_LIST } from "@/lib/character/pantheon";
import { religionCardTooltip, religionLoreSnippet } from "@/lib/character/religion-tooltips";
import { ReligionDeityIcon } from "@/components/character/ReligionDeityIcon";
import { religionIconColor } from "@/lib/character/wizard-religion-icons";

export function PantheonLoreSection() {
  return (
    <section className="world-pantheon">
      <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>Panteão — 12 devoções</h2>
      <p className="world-lore__hint">
        Oito deuses do panteão maior, três cultos menores e o caminho Sem Deus. Escolha na criação de
        personagem com cartas e tooltips — mesmos dados aqui.
      </p>
      <div className="world-pantheon__grid">
        {RELIGION_LIST.map((r) => {
          const color = religionIconColor(r.id);
          const tip = religionCardTooltip(r);
          const lore = religionLoreSnippet(r.id);
          return (
            <article key={r.id} className="world-pantheon-card">
              <span
                className="world-pantheon-card__glyph world-pantheon-card__glyph--svg"
                style={{ color, borderColor: `${color}55`, background: `${color}18` }}
                aria-hidden
              >
                <ReligionDeityIcon religionId={r.id} size={24} />
              </span>
              <WizardHoverTip text={tip}>
                <h3 className="world-pantheon-card__title">
                  {r.name}
                  {r.tier !== "secular" ? (
                    <span className="world-pantheon-card__epithet"> — {r.epithet}</span>
                  ) : null}
                </h3>
              </WizardHoverTip>
              <p className="world-pantheon-card__domain">
                <WizardHoverTip text={lore}>{r.domain}</WizardHoverTip>
              </p>
              <p className="world-pantheon-card__summary">{r.summary}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
