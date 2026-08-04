"use client";

import { useCallback, useMemo, useState } from "react";
import { postRoomChat } from "@/hooks/useRoomSync";
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
  type TorCalendar,
  type TorPhaseOutcome,
} from "@/lib/combat/um-anel/progression";
import "./tor-journey.css";

type Props = {
  roomId: string;
  /** Só o Mestre abre e encerra a Fase de Companhia. */
  canManage: boolean;
  onUpdate: () => void;
};

const OUTCOME_LABEL: Record<TorPhaseOutcome, string> = {
  nenhum: "Sem efeito contra a Sombra",
  marginal: "Atrapalhou marginalmente",
  ativo: "Atrapalhou ou feriu o Inimigo",
  notavel: "Feito digno da atenção do Senhor Sombrio",
};

export function TorFellowshipPanel({ roomId, canManage, onUpdate }: Props) {
  const [calendar, setCalendar] = useState<TorCalendar>({ year: 2965, phasesThisYear: 0 });
  const [companySize, setCompanySize] = useState(4);
  const [witsScore, setWitsScore] = useState(3);
  const [outcome, setOutcome] = useState<TorPhaseOutcome>("marginal");
  const [picks, setPicks] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** A próxima Fase é Yule? Deriva do calendário — nunca de um botão manual. */
  const nextIsYule = calendar.phasesThisYear + 1 >= TOR_PHASES_PER_YEAR;

  const budget = useMemo(
    () => torUndertakingBudget({ isYule: nextIsYule, companySize }),
    [nextIsYule, companySize]
  );

  const undertakings = useMemo(
    () => TOR_UNDERTAKINGS.map((u) => ({ id: u.id, name: u.name, yuleOnly: Boolean(u.yuleOnly) })),
    []
  );

  const validation = useMemo(
    () =>
      validateTorUndertakings(
        picks.map((id) => ({
          id,
          yuleOnly: undertakings.find((u) => u.id === id)?.yuleOnly ?? false,
        })),
        { isYule: nextIsYule, companySize }
      ),
    [picks, undertakings, nextIsYule, companySize]
  );

  const toggle = useCallback((id: string) => {
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }, []);

  const closePhase = useCallback(async () => {
    if (busy || !validation.ok) return;
    setBusy(true);
    setErr(null);
    try {
      const advanced = advanceTorCalendar(calendar, { witsScore });
      const chosen = picks
        .map((id) => undertakings.find((u) => u.id === id)?.name ?? id)
        .join(", ");

      const relief = TOR_SHADOW_RELIEF[outcome];
      const lines = [
        formatTorCalendarMessage(advanced),
        `Resultado da Fase de Aventura: ${OUTCOME_LABEL[outcome]}` +
          (relief > 0 ? ` — cada herói remove até ${relief} de Sombra` : ""),
        advanced.isYule
          ? "Yule: todos recuperam TODA a Esperança"
          : "Todos recuperam Esperança igual ao Coração",
        chosen ? `Empreitadas: ${chosen}` : "Nenhuma Empreitada escolhida",
      ];

      await postRoomChat(roomId, { kind: "chat", text: lines.join(" · ") });
      onUpdate();

      setCalendar(advanced.calendar);
      setPicks([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao publicar no chat");
    } finally {
      setBusy(false);
    }
  }, [busy, validation.ok, calendar, witsScore, picks, undertakings, outcome, roomId, onUpdate]);

  if (!canManage) {
    return (
      <div className="tor-journey">
        <p className="vtt-combat-hint">
          Só o Mestre conduz a Fase de Companhia. Acompanhe no chat da mesa.
        </p>
      </div>
    );
  }

  return (
    <div className="tor-journey">
      {err ? <p className="dice-err">{err}</p> : null}

      <section className="tor-journey__section">
        <p className="eyebrow">Calendário</p>
        <p className="tor-journey__remaining">
          Ano {calendar.year} · Fase {calendar.phasesThisYear + 1}/{TOR_PHASES_PER_YEAR}
          {nextIsYule ? " — YULE" : ""}
        </p>
        {nextIsYule ? (
          <p className="tor-journey__pending-hint">
            Encerrar esta Fase vira o ano: todos envelhecem 1 ano e ganham pontos de Perícia
            iguais à Astúcia.
          </p>
        ) : null}

        <div className="tor-journey__grid">
          <label>
            Heróis na Companhia
            <input
              type="number"
              min={1}
              max={8}
              value={companySize}
              onChange={(e) => setCompanySize(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label>
            Astúcia (bônus de Yule)
            <input
              type="number"
              min={0}
              max={6}
              value={witsScore}
              onChange={(e) => setWitsScore(Math.max(0, Number(e.target.value) || 0))}
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
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as TorPhaseOutcome)}
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
          Empreitadas — {picks.length}/{budget.total}
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
                    checked={picks.includes(u.id)}
                    disabled={blocked}
                    onChange={() => toggle(u.id)}
                  />
                  {u.name}
                  {u.yuleOnly ? <span className="tor-fellowship__yule">Yule</span> : null}
                </label>
              </li>
            );
          })}
        </ul>

        {!validation.ok ? (
          <p className="dice-err">{validation.reason}</p>
        ) : null}
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
