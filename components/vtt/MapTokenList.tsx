"use client";

import type { BattleToken } from "@/lib/vtt/types";
import { PaDotMeter } from "@/components/vtt/PaDotMeter";
import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";

type Props = {
  tokens: BattleToken[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canViewTokenPa: (token: BattleToken) => boolean;
  fogHint?: boolean;
  /** Texto curto acima da lista. */
  label?: string;
};

/** Lista de tokens no mapa — seleção e PA (substitui trecho do antigo painel Personagens). */
export function MapTokenList({
  tokens,
  selectedId,
  onSelect,
  canViewTokenPa,
  fogHint = false,
  label = "No mapa",
}: Props) {
  return (
    <div className="vtt-map-token-list">
      <p className="vtt-eyebrow vtt-sidebar-map-label">{label}</p>
      {fogHint ? (
        <p className="vtt-combat-hint vtt-fog-list-hint">
          Só aparecem jogadores e criaturas no seu campo de visão.
        </p>
      ) : (
        <p className="vtt-combat-hint">Clique para selecionar ou use o mapa.</p>
      )}
      {tokens.length === 0 ? (
        <p className="vtt-combat-hint">Nenhum token visível no momento.</p>
      ) : (
        <ul className="vtt-token-list">
          {tokens.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={t.id === selectedId ? "active" : ""}
                onClick={() => onSelect(t.id)}
              >
                <span className="token-dot" style={{ background: t.color }} />
                <span className="vtt-token-list-label">
                  <span className="vtt-token-list-name">{t.name}</span>
                  {canViewTokenPa(t) ? (
                    <PaDotMeter
                      current={t.pa}
                      max={t.paMax}
                      banked={t.bankedPa}
                      showLabel={false}
                      size="sm"
                      compact
                    />
                  ) : null}
                  <TokenEffectsRow token={t} className="vtt-effect-chips--list" max={4} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
