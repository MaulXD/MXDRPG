"use client";

import { useCallback, useMemo, useState } from "react";
import { patchTorSession, postRoomChat } from "@/hooks/useRoomSync";
import { TOR_UNDERTAKINGS } from "@/lib/character/um-anel/undertakings";
import {
  TOR_PHASES_PER_YEAR,
  TOR_PHASE_OUTCOMES,
  TOR_SHADOW_RELIEF,
  TOR_XP_COST_BY_LEVEL,
  advanceTorCalendar,
  formatTorCalendarMessage,
  torUndertakingBudget,
  validateTorUndertakings,
  type TorPhaseOutcome,
} from "@/lib/combat/um-anel/progression";
import type { TorFellowshipProgress } from "@/lib/combat/um-anel/session-state";
import "./tor-journey.css";

type Props = {
  roomId: string;
  /** Só o Mestre abre e encerra a Fase de Companhia. */
  canManage: boolean;
  /**
   * Estado vindo do snapshot da sala. O calendário da campanha (ano e Fase)
   * PRECISA persistir: é o que decide quando cai o Yule, e perder isso
   * desalinharia a progressão de toda a Companhia.
   */
  fellowship: TorFellowshipProgress | null;
  onUpdate: () => void;
};

const OUTCOME_LABEL: Record<TorPhaseOutcome, string> = {
  nenhum: "Sem efeito contra a Sombra",
  marginal: "Atrapalhou marginalmente",
  ativo: "Atrapalhou ou feriu o Inimigo",
  notavel: "Feito digno da atenção do Senhor Sombrio",
};

/** Estado inicial de uma campanha nova — 2965 T.E., como o Starter Set. */
const INITIAL: TorFellowshipProgress = {
  year: 2965,
  phasesThisYear: 0,
  companySize: 4,
  witsScore: 3,
  outcome: "marginal",
  picks: [],
};

export function TorFellowshipPanel({ roomId, canManage, fellowship, onUpdate }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Enquanto a sala não tem calendário, opera sobre o inicial. */
  const state = fellowship ?? INITIAL;

  /** A próxima Fase é Yule? Deriva do calendário — nunca de um botão manual. */
  const nextIsYule = state.phasesThisYear + 1 >= TOR_PHASES_PER_YEAR;

  const budget = useMemo(
    () => torUndertakingBudget({ isYule: nextIsYule, companySize: state.companySize }),
    [nextIsYule, state.companySize]
  );

  const undertakings = useMemo(
    () => TOR_UNDERTAKINGS.map((u) => ({ id: u.id, name: u.name, yuleOnly: Boolean(u.yuleOnly) })),
    []
  );

  const validation = useMemo(
    () =>
      validateTorUndertakings(
        state.picks.map((id) => ({
          id,
          yuleOnly: undertakings.find((u) => u.id === id)?.yuleOnly ?? false,
        })),
        { isYule: nextIsYule, companySize: state.companySize }
      ),
    [state.picks, state.companySize, undertakings, nextIsYule]
  );

  const guard = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setErr(null);
      try {
        await fn();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao salvar");
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  /** Grava um patch parcial do calendário/escolhas na sala. */
  const save = useCallback(
    (patch: Partial<TorFellowshipProgress>) =>
      guard(async () => {
        await patchTorSession(roomId, { fellowship: { ...state, ...patch } });
        onUpdate();
      }),
    [guard, roomId, state, onUpdate]
  );

  const toggle = useCallback(
    (id: string) => {
      const picks = state.picks.includes(id)
        ? state.picks.filter((x) => x !== id)
        : [...state.picks, id];
      void save({ picks });
    },
    [state.picks, save]
  );

  const closePhase = useCallback(
    () =>
      guard(async () => {
        if (!validation.ok) return;
        const advanced = advanceTorCalendar(
          { year: state.year, phasesThisYear: state.phasesThisYear },
          { witsScore: state.witsScore }
        );
        const chosen = state.picks
          .map((id) => undertakings.find((u) => u.id === id)?.name ?? id)
          .join(", ");
        const relief = TOR_SHADOW_RELIEF[state.outcome];

        const lines = [
          formatTorCalendarMessage(advanced),
          `Resultado da Fase de Aventura: ${OUTCOME_LABEL[state.outcome]}` +
            (relief > 0 ? ` — cada herói remove até ${relief} de Sombra` : ""),
          advanced.isYule
            ? "Yule: todos recuperam TODA a Esperança"
            : "Todos recuperam Esperança igual ao Coração",
          chosen ? `Empreitadas: ${chosen}` : "Nenhuma Empreitada escolhida",
        ];

        await postRoomChat(roomId, { kind: "chat", text: lines.join(" · ") });
        // O calendário avança e as escolhas zeram para a Fase seguinte.
        await patchTorSession(roomId, {
          fellowship: {
            ...state,
            year: advanced.calendar.year,
            phasesThisYear: advanced.calendar.phasesThisYear,
            picks: [],
          },
        });
        onUpdate();
      }),
    [guard, validation.ok, state, undertakings, roomId, onUpdate]
  );

  /** Cabeçalho do calendário — igual para Mestre e jogador. */
  const calendarHeader = (
    <>
      <p className="tor-journey__remaining">
        Ano {state.year} · Fase {state.phasesThisYear + 1}/{TOR_PHASES_PER_YEAR}
        {nextIsYule ? " — YULE" : ""}
      </p>
      {nextIsYule ? (
        <p className="tor-journey__pending-hint">
          Encerrar esta Fase vira o ano: todos envelhecem 1 ano e ganham pontos de Perícia
          iguais à Astúcia.
        </p>
      ) : null}
    </>
  );

  /* ── Jogador: calendário e Empreitadas em leitura ────────────────── */
  if (!canManage) {
    return (
      <div className="tor-journey">
        <section className="tor-journey__section">
          <p className="eyebrow">Fase de Companhia</p>
          {calendarHeader}
          {state.picks.length > 0 ? (
            <ul className="tor-journey__log">
              {state.picks.map((id) => (
                <li key={id}>{undertakings.find((u) => u.id === id)?.name ?? id}</li>
              ))}
            </ul>
          ) : (
            <p className="tor-journey__pending-hint">Nenhuma Empreitada escolhida ainda.</p>
          )}
        </section>
      </div>
    );
  }

  /* ── Mestre ───────────────────────────────────────────────────────── */
  return (
    <div className="tor-journey">
      {err ? <p className="dice-err">{err}</p> : null}

      <section className="tor-journey__section">
        <p className="eyebrow">Calendário</p>
        {calendarHeader}

        <div className="tor-journey__grid">
          <label>
            Heróis na Companhia
            <input
              type="number"
              min={1}
              max={8}
              value={state.companySize}
              disabled={busy}
              onChange={(e) =>
                void save({ companySize: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </label>
          <label>
            Astúcia (bônus de Yule)
            <input
              type="number"
              min={0}
              max={7}
              value={state.witsScore}
              disabled={busy}
              onChange={(e) => void save({ witsScore: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
        </div>
      </section>

      <section className="tor-journey__section">
        <p className="eyebrow">Recuperação</p>
        <div className="tor-journey__grid">
          <label>
            Resultado da Fase de Aventura
            <select
              value={state.outcome}
              disabled={busy}
              onChange={(e) => void save({ outcome: e.target.value as TorPhaseOutcome })}
            >
              {TOR_PHASE_OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {OUTCOME_LABEL[o]} ({TOR_SHADOW_RELIEF[o]})
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="tor-journey__pending-hint">
          Cicatrizes de Sombra não saem aqui — só pela Empreitada Curar Cicatrizes, em Yule.
        </p>
      </section>

      <section className="tor-journey__section">
        <p className="eyebrow">
          Empreitadas — {state.picks.length}/{budget.total}
        </p>
        <p className="tor-journey__pending-hint">
          {nextIsYule
            ? `Yule: ${budget.base} (uma por herói) + 1 grátis`
            : `Fase comum: ${budget.base} da Companhia + 1 grátis`}
        </p>

        <ul className="tor-fellowship__undertakings">
          {undertakings.map((u) => {
            const blocked = u.yuleOnly && !nextIsYule;
            return (
              <li key={u.id}>
                <label className={blocked ? "is-blocked" : undefined}>
                  <input
                    type="checkbox"
                    checked={state.picks.includes(u.id)}
                    disabled={blocked || busy}
                    onChange={() => toggle(u.id)}
                  />
                  {u.name}
                  {u.yuleOnly ? <span className="tor-fellowship__yule">Yule</span> : null}
                </label>
              </li>
            );
          })}
        </ul>

        {!validation.ok ? <p className="dice-err">{validation.reason}</p> : null}
      </section>

      <button
        type="button"
        className="btn"
        disabled={busy || !validation.ok}
        onClick={() => void closePhase()}
      >
        {nextIsYule ? "Encerrar Fase e virar o ano" : "Encerrar Fase de Companhia"}
      </button>

      <details className="tor-fellowship__costs">
        <summary>Custos de Experiência</summary>
        <table className="tor-compendium__table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Custo</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(TOR_XP_COST_BY_LEVEL).map(([level, cost]) => (
              <tr key={level}>
                <td>{level}</td>
                <td>{cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tor-journey__pending-hint">
          Perícia gasta pontos de Perícia. Proficiência, Valor e Sabedoria gastam pontos de
          Aventura. Máximo de 1 grau por Perícia e por Proficiência, e Valor <strong>ou</strong>{" "}
          Sabedoria — nunca os dois na mesma Fase.
        </p>
      </details>
    </div>
  );
}
