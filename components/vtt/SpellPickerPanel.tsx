"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import { spellLevelLabel } from "@/lib/character/spell-prep";
import type { CombatActionOption } from "@/lib/combat/types";
import { formatCombatActionTooltipLines } from "@/lib/combat/action-tooltip";
import { paCostForToken } from "@/lib/combat/pa-economy";
import type { BattleToken } from "@/lib/vtt/types";
import "./spell-picker.css";

type Props = {
  spells: CombatActionOption[];
  actor: CharacterSheet | null;
  token: BattleToken;
  onPick: (spell: CombatActionOption) => void;
  onClose: () => void;
};

function groupSpells(spells: CombatActionOption[]): Map<number, CombatActionOption[]> {
  const map = new Map<number, CombatActionOption[]>();
  for (const s of spells) {
    const lv = s.spellLevel ?? 1;
    const list = map.get(lv) ?? [];
    list.push(s);
    map.set(lv, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
  return map;
}

export function SpellPickerPanel({ spells, actor, token, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spells;
    return spells.filter((s) => {
      const hay = `${s.name} ${s.spellSchool ?? ""} ${s.label}`.toLowerCase();
      return hay.includes(q);
    });
  }, [spells, query]);

  const grouped = useMemo(() => groupSpells(filtered), [filtered]);
  const levels = useMemo(() => [...grouped.keys()].sort((a, b) => a - b), [grouped]);

  const detailSpell = detailId ? spells.find((s) => s.entryId === detailId) ?? null : null;

  return (
    <div className="spell-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="spell-picker glass-panel"
        role="dialog"
        aria-label="Escolher magia"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="spell-picker__head">
          <div>
            <p className="spell-picker__eyebrow">Conjuração</p>
            <h2 className="spell-picker__title">Escolha a magia</h2>
          </div>
          <button type="button" className="btn btn-ghost spell-picker__close" onClick={onClose}>
            Fechar
          </button>
        </header>

        <input
          className="spell-picker__search"
          type="search"
          placeholder="Buscar por nome ou escola…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="spell-picker__body">
          <div className="spell-picker__list">
            {levels.length === 0 ? (
              <p className="spell-picker__empty">
                Nenhuma magia preparada. Abra a ficha → aba Magias e marque as preparadas.
              </p>
            ) : (
              levels.map((lv) => (
                <section key={lv} className="spell-picker__level">
                  <h3 className="spell-picker__level-title">{spellLevelLabel(lv)}</h3>
                  <ul className="spell-picker__cards">
                    {grouped.get(lv)!.map((spell) => {
                      const pa = paCostForToken(actor, spell, token);
                      const active = detailId === spell.entryId;
                      return (
                        <li key={spell.entryId}>
                          <button
                            type="button"
                            className={`spell-picker__card${active ? " spell-picker__card--on" : ""}`}
                            onMouseEnter={() => setDetailId(spell.entryId)}
                            onFocus={() => setDetailId(spell.entryId)}
                            onClick={() => onPick(spell)}
                          >
                            <span className="spell-picker__card-name">{spell.name}</span>
                            <span className="spell-picker__card-meta">
                              {spell.spellSchool ? `${spell.spellSchool} · ` : ""}
                              {pa} PA
                              {spell.rangeCells ? ` · ${spell.rangeCells} cél.` : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>

          {detailSpell ? (
            <aside className="spell-picker__detail">
              <h3 className="spell-picker__detail-title">{detailSpell.name}</h3>
              <ul className="spell-picker__detail-lines">
                {formatCombatActionTooltipLines(detailSpell, actor, token).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
