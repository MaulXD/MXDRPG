"use client";

import { useMemo, useState } from "react";
import type { CombatLogEntry, RoomSnapshot } from "@/lib/room/types";
import type { CombatLogKind } from "@/lib/room/combat-log";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  combatLog?: CombatLogEntry[];
  tokens: BattleToken[];
  combat: RoomSnapshot["combat"];
};

type LogFilter = "all" | "pa" | "turn" | "system";

const KIND_LABEL: Record<CombatLogKind, string> = {
  pa_spend: "Gasto PA",
  pa_refresh: "Refresh",
  pa_bank: "Banco",
  turn_start: "Início vez",
  turn_pass: "Fim vez",
  auto_pass: "Auto-passe",
  initiative: "Iniciativa",
  combat_on: "Combate ON",
  combat_off: "Combate OFF",
  repair: "Reparo",
  spawn: "Spawn",
  pools_zero: "Zerar pools",
};

const PHASE_LABEL = {
  exploration: "Exploração",
  combat_free: "Combate livre",
  combat_turn: "Turno",
} as const;

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function paDelta(entry: CombatLogEntry): string | null {
  if (entry.paCost != null && entry.paCost > 0) {
    return `−${entry.paCost}`;
  }
  if (entry.paBefore != null && entry.paAfter != null && entry.paBefore !== entry.paAfter) {
    return `${entry.paBefore} → ${entry.paAfter}`;
  }
  if (entry.paAfter != null) return String(entry.paAfter);
  return null;
}

function matchesFilter(entry: CombatLogEntry, filter: LogFilter): boolean {
  if (filter === "all") return true;
  if (filter === "pa") {
    return ["pa_spend", "pa_refresh", "pa_bank", "repair", "pools_zero", "spawn"].includes(entry.kind);
  }
  if (filter === "turn") {
    return ["turn_start", "turn_pass", "auto_pass", "initiative"].includes(entry.kind);
  }
  return ["combat_on", "combat_off", "initiative", "repair"].includes(entry.kind);
}

export function GmCombatLogPanel({ combatLog = [], tokens, combat }: Props) {
  const [filter, setFilter] = useState<LogFilter>("all");

  const entries = useMemo(
    () => [...combatLog].filter((e) => matchesFilter(e, filter)).sort((a, b) => b.at - a.at),
    [combatLog, filter]
  );

  const activeId = combat.order[combat.activeIndex] ?? null;

  return (
    <section className="vtt-panel vtt-gm-combat-log">
      <p className="vtt-eyebrow">Histórico de combate / PA</p>
      <p className="vtt-hint">
        Auditoria de gastos, refresh e turnos — só o mestre vê. Nova iniciativa limpa o log.
      </p>

      <div className="vtt-gm-combat-log__snapshot" aria-label="PA atual no mapa">
        <p className="vtt-gm-combat-log__snapshot-title">
          Rodada {combat.round}
          {activeId ? (
            <>
              {" "}
              · ativo:{" "}
              <strong>{tokens.find((t) => t.id === activeId)?.name ?? "?"}</strong>
            </>
          ) : null}
        </p>
        {tokens.length === 0 ? (
          <p className="vtt-hint">Nenhum token no mapa.</p>
        ) : (
          <ul className="vtt-gm-combat-log__pa-list">
            {tokens.map((t) => (
              <li key={t.id} className={t.id === activeId ? "is-active" : undefined}>
                <span className="vtt-gm-combat-log__pa-name">{t.name}</span>
                <span className="vtt-gm-combat-log__pa-values">
                  PA {t.pa ?? 0}
                  {(t.bankedPa ?? 0) > 0 ? ` +${t.bankedPa} pool` : ""}
                  {(t.paSpentThisTurn ?? 0) > 0 ? ` · gastou ${t.paSpentThisTurn}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="vtt-gm-combat-log__filters" role="tablist" aria-label="Filtrar histórico">
        {(
          [
            ["all", "Tudo"],
            ["pa", "PA"],
            ["turn", "Turnos"],
            ["system", "Sistema"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`vtt-gm-combat-log__filter${filter === id ? " is-active" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="vtt-hint">Nenhum evento registrado ainda.</p>
      ) : (
        <ol className="vtt-gm-history-list vtt-gm-combat-log__list" aria-label="Log de combate">
          {entries.map((entry) => {
            const delta = paDelta(entry);
            return (
              <li key={entry.id} className="vtt-gm-history-item vtt-gm-combat-log__item">
                <div className="vtt-gm-history-main">
                  <span className={`vtt-gm-history-kind vtt-gm-history-kind--${entry.kind}`}>
                    {KIND_LABEL[entry.kind]}
                  </span>
                  {entry.tokenName ? (
                    <span className="vtt-gm-history-token">{entry.tokenName}</span>
                  ) : null}
                  <span className="vtt-gm-combat-log__meta">
                    R{entry.round} · {PHASE_LABEL[entry.phase]}
                  </span>
                  <time className="vtt-gm-history-time" dateTime={new Date(entry.at).toISOString()}>
                    {formatTime(entry.at)}
                  </time>
                </div>
                <p className="vtt-gm-history-summary">{entry.summary}</p>
                {delta || entry.detail ? (
                  <p className="vtt-gm-combat-log__detail">
                    {delta ? <span className="vtt-gm-combat-log__delta">{delta} PA</span> : null}
                    {entry.detail ? <span>{entry.detail}</span> : null}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
