"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import type { CombatActionOption } from "@/lib/combat/types";
import { formatCombatActionTooltipLines } from "@/lib/combat/action-tooltip";
import { paCostForToken } from "@/lib/combat/pa-economy";
import { isActionOnRecharge } from "@/lib/combat/recharge";
import { IconHourglass } from "@/components/ui/EldarinIcons";
import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "@/lib/room/combat";
import "./ability-picker.css";

type Props = {
  abilities: CombatActionOption[];
  actor: CharacterSheet | null;
  token: BattleToken;
  combat: CombatTrack | null | undefined;
  onPick: (ability: CombatActionOption) => void;
  onClose: () => void;
};

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function TargetIcon({ ability }: { ability: CombatActionOption }) {
  if (ability.selfTarget) {
    return (
      <svg width={11} height={11} viewBox="0 0 24 24" aria-hidden {...S}>
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (ability.allyTarget) {
    return (
      <svg width={11} height={11} viewBox="0 0 24 24" aria-hidden {...S}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" aria-hidden {...S}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function abilityMetaLine(ability: CombatActionOption, actor: CharacterSheet | null, token: BattleToken): string {
  const parts: string[] = [];
  const pa = paCostForToken(actor, ability, token);
  if (ability.chiCost) {
    parts.push(`${pa} PA · ${ability.chiCost} Chi`);
  } else {
    parts.push(`${pa} PA`);
  }
  if (!ability.selfTarget && !ability.allyTarget) {
    parts.push(`${ability.rangeCells} cél.`);
  }
  if (ability.recharge?.label) {
    parts.push(ability.recharge.label);
  }
  return parts.join(" · ");
}

export function AbilityPickerPanel({ abilities, actor, token, combat, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const round = combat?.round ?? 1;

  const sorted = useMemo(
    () => [...abilities].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [abilities]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((a) => a.name.toLowerCase().includes(q));
  }, [sorted, query]);

  const detailAbility = detailId ? abilities.find((a) => a.entryId === detailId) ?? null : null;

  return (
    <div className="ability-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ability-picker glass-panel"
        role="dialog"
        aria-label="Escolher habilidade"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ability-picker__head">
          <div>
            <p className="ability-picker__eyebrow">Ação tática</p>
            <h2 className="ability-picker__title">Escolha a habilidade</h2>
          </div>
          <button type="button" className="btn btn-ghost ability-picker__close" onClick={onClose}>
            Fechar
          </button>
        </header>

        {abilities.length > 6 && (
          <input
            className="ability-picker__search"
            type="search"
            placeholder="Buscar por nome…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        )}

        <div className="ability-picker__body">
          <ul className="ability-picker__list">
            {filtered.length === 0 ? (
              <li className="ability-picker__empty">Nenhuma habilidade encontrada.</li>
            ) : (
              filtered.map((ability) => {
                const cd = isActionOnRecharge(token, ability, round);
                const active = detailId === ability.entryId;
                const meta = abilityMetaLine(ability, actor, token);
                return (
                  <li key={ability.entryId}>
                    <button
                      type="button"
                      className={`ability-picker__card${active ? " ability-picker__card--on" : ""}${cd.blocked ? " ability-picker__card--cd" : ""}`}
                      disabled={cd.blocked}
                      onMouseEnter={() => setDetailId(ability.entryId)}
                      onFocus={() => setDetailId(ability.entryId)}
                      onClick={() => !cd.blocked && onPick(ability)}
                    >
                      <span className="ability-picker__card-name">
                        <span className="ability-picker__card-target" aria-hidden>
                          <TargetIcon ability={ability} />
                        </span>
                        {ability.name}
                        {cd.blocked && (
                          <span className="ability-picker__cd-badge" aria-label={`Recarga: ${cd.hint}`}>
                            <IconHourglass size={10} />
                            {cd.hint}
                          </span>
                        )}
                      </span>
                      <span className="ability-picker__card-meta">{meta}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {detailAbility ? (
            <aside className="ability-picker__detail">
              <h3 className="ability-picker__detail-title">{detailAbility.name}</h3>
              <ul className="ability-picker__detail-lines">
                {formatCombatActionTooltipLines(detailAbility, actor, token).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </aside>
          ) : (
            <aside className="ability-picker__detail ability-picker__detail--empty">
              <p>Passe o mouse em uma habilidade para ver a descrição.</p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
