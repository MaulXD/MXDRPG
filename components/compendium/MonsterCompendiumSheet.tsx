"use client";

import { useMemo, useState } from "react";
import { CompendiumIcon } from "@/components/compendium/CompendiumIcon";
import { entryBookRef } from "@/lib/compendium/format";
import { compendiumTypeColor } from "@/lib/compendium/icons";
import { getEntry } from "@/lib/compendium/registry";
import { formatCombatActionTooltipLines } from "@/lib/combat/action-tooltip";
import type { CombatActionOption } from "@/lib/combat/types";
import { biomeDisplayName, resolveMonsterBiomes } from "@/lib/vtt/monster-biomes";
import { getMonsterTemplate } from "@/lib/vtt/monsters";
import { CREATURE_SIZE_HEX_LABEL, CREATURE_SIZE_PT } from "@/lib/vtt/monster-sizes";
import { OrnamentCard } from "@/components/ui/OrnamentCard";
import "./monster-sheet.css";

const TIER_LABEL = {
  mob: "Horda",
  mini: "Mini-chefe",
  boss: "Chefe",
} as const;

type Props = {
  entryId: string;
  onClose?: () => void;
  /** Cabeçalho compacto (modal) vs página inteira */
  variant?: "dialog" | "embedded";
};

function attrMod(value: number): string {
  const mod = Math.floor((value - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

function MonsterActionBlock({ action }: { action: CombatActionOption }) {
  const lines = useMemo(() => formatCombatActionTooltipLines(action, null), [action]);

  return (
    <article className="monster-sheet-action">
      <header className="monster-sheet-action__head">
        <strong>{action.name}</strong>
        {action.paCost != null ? (
          <span className="monster-sheet-action__pa">PA {action.paCost}</span>
        ) : null}
      </header>
      {action.label && action.label !== action.name ? (
        <p className="monster-sheet-action__label">{action.label}</p>
      ) : null}
      {lines.length > 0 ? (
        <ul className="monster-sheet-action__lines">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function MonsterCompendiumSheet({ entryId, onClose, variant = "dialog" }: Props) {
  const template = getMonsterTemplate(entryId);
  const entry = getEntry("monstros", entryId);
  const [tab, setTab] = useState<"ficha" | "livro">("ficha");

  if (!template || !entry) {
    return (
      <div className="monster-sheet monster-sheet--empty">
        <p>Monstro não encontrado no compêndio.</p>
        {onClose ? (
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        ) : null}
      </div>
    );
  }

  const { catalogId, bookRef } = entryBookRef(entry.system);
  const biomes = resolveMonsterBiomes(template);
  const color = compendiumTypeColor(entry.type);
  const descriptionHtml = String(entry.system.description ?? template.description ?? "");

  return (
    <div className={`monster-sheet monster-sheet--${variant}`}>
      <header className="monster-sheet__header">
        <div className="monster-sheet__identity">
          <CompendiumIcon entry={entry} color={color} className="monster-sheet__icon" />
          <div className="monster-sheet__titles">
            <h2 className="monster-sheet__name">{template.name}</h2>
            {catalogId || bookRef ? (
              <p className="monster-sheet__ref">
                {catalogId ? <code>{catalogId}</code> : null}
                {catalogId && bookRef ? " · " : null}
                {bookRef ? <span>{bookRef}</span> : null}
              </p>
            ) : null}
            <div className="monster-sheet__tags">
              <span className="monster-sheet__tag">{TIER_LABEL[template.tier]}</span>
              <span className="monster-sheet__tag">Ameaça nv {template.ameaca}</span>
              <span className="monster-sheet__tag">
                {CREATURE_SIZE_PT[template.creatureSize]} ({CREATURE_SIZE_HEX_LABEL[template.creatureSize]})
              </span>
            </div>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            className="monster-sheet__close"
            onClick={onClose}
            aria-label="Fechar ficha"
          >
            ×
          </button>
        ) : null}
      </header>

      <div className="monster-sheet__tabs" role="tablist" aria-label="Seções da ficha">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ficha"}
          className={`monster-sheet__tab${tab === "ficha" ? " monster-sheet__tab--on" : ""}`}
          onClick={() => setTab("ficha")}
        >
          Ficha
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "livro"}
          className={`monster-sheet__tab${tab === "livro" ? " monster-sheet__tab--on" : ""}`}
          onClick={() => setTab("livro")}
        >
          Do livro
        </button>
      </div>

      {tab === "ficha" ? (
        <div className="monster-sheet__body">
          <OrnamentCard className="monster-sheet__stats-card">
            <div className="monster-sheet__vitals">
              <div className="monster-sheet__vital">
                <span className="monster-sheet__vital-label">Vida</span>
                <strong>{template.vidaMax}</strong>
              </div>
              <div className="monster-sheet__vital">
                <span className="monster-sheet__vital-label">PA</span>
                <strong>{template.paMax}</strong>
              </div>
              <div className="monster-sheet__vital">
                <span className="monster-sheet__vital-label">CA</span>
                <strong>{template.defesa}</strong>
              </div>
              <div className="monster-sheet__vital">
                <span className="monster-sheet__vital-label">Caminhada</span>
                <strong>{template.walk} hex</strong>
              </div>
              <div className="monster-sheet__vital">
                <span className="monster-sheet__vital-label">Corrida</span>
                <strong>{template.run} hex</strong>
              </div>
            </div>

            <div className="monster-sheet__attrs">
              <div className="monster-sheet__attr">
                <span>FOR</span>
                <strong>{template.forca}</strong>
                <em>{attrMod(template.forca)}</em>
              </div>
              <div className="monster-sheet__attr">
                <span>AGI</span>
                <strong>{template.agilidade}</strong>
                <em>{attrMod(template.agilidade)}</em>
              </div>
            </div>

            {biomes.length > 0 ? (
              <div className="monster-sheet__biomes">
                <p className="monster-sheet__section-label">Biomas</p>
                <p className="monster-sheet__biomes-list">
                  {biomes.map(biomeDisplayName).join(" · ")}
                </p>
              </div>
            ) : null}
          </OrnamentCard>

          <section className="monster-sheet__actions" aria-labelledby="monster-sheet-actions-title">
            <h3 id="monster-sheet-actions-title" className="monster-sheet__section-label">
              Ações e habilidades
            </h3>
            {template.actions.length === 0 ? (
              <p className="monster-sheet__muted">Sem ações catalogadas no compêndio.</p>
            ) : (
              <div className="monster-sheet__action-list">
                {template.actions.map((action) => (
                  <MonsterActionBlock key={action.entryId} action={action} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div
          className="monster-sheet__lore comp-detail-body"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      )}
    </div>
  );
}
