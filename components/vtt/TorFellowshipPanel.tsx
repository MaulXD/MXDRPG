"use client";

import { useCallback, useMemo, useState } from "react";
import { patchTorSession, postRoomChat } from "@/hooks/useRoomSync";
import { TOR_UNDERTAKINGS } from "@/lib/character/um-anel/undertakings";
import { TorAdvancePanel } from "@/components/vtt/TorAdvancePanel";
import {
  TOR_PHASES_PER_YEAR,
  TOR_PHASE_OUTCOMES,
  TOR_SHADOW_RELIEF,
  TOR_XP_COST_BY_LEVEL,
  advanceTorCalendar,
  appendTorChronicle,
  formatTorCalendarMessage,
  torFellowshipLevel,
  torUndertakingBudget,
  validateTorUndertakings,
  type TorPhaseOutcome,
} from "@/lib/combat/um-anel/progression";
import {
  TOR_MAX_COMPANY,
  type TorFellowshipHero,
  type TorFellowshipProgress,
} from "@/lib/combat/um-anel/session-state";
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
  /**
   * Base do NA em uso na mesa. Mora aqui, e não na ficha, porque é decisão de
   * campanha — o mesmo herói pode jogar uma one-shot com 18 e uma campanha longa
   * com 20. Este painel já é o de escopo de campanha (calendário, Yule).
   */
  attributeTnBase?: number;
  /** Fichas do Um Anel no mapa — quem pode gastar pontos nesta Fase. */
  characterIds?: string[];
  onUpdate: () => void;
};

const OUTCOME_LABEL: Record<TorPhaseOutcome, string> = {
  nenhum: "Sem efeito contra a Sombra",
  marginal: "Atrapalhou marginalmente",
  ativo: "Atrapalhou ou feriu o Inimigo",
  notavel: "Feito digno da atenção do Senhor Sombrio",
};

/** Troca um campo de um herói sem mutar a lista (o estado vem do snapshot). */
function patchHero(
  heroes: TorFellowshipHero[],
  index: number,
  patch: Partial<TorFellowshipHero>
): TorFellowshipHero[] {
  return heroes.map((h, i) => (i === index ? { ...h, ...patch } : h));
}

/** Estado inicial de uma campanha nova — 2965 T.E., como o Starter Set. */
const INITIAL: TorFellowshipProgress = {
  year: 2965,
  phasesThisYear: 0,
  heroes: [
    { name: "Herói 1", wits: 3 },
    { name: "Herói 2", wits: 3 },
    { name: "Herói 3", wits: 3 },
    { name: "Herói 4", wits: 3 },
  ],
  outcome: "marginal",
  picks: [],
};

export function TorFellowshipPanel({
  roomId,
  canManage,
  fellowship,
  attributeTnBase,
  characterIds = [],
  onUpdate,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Enquanto a sala não tem calendário, opera sobre o inicial. */
  const state = fellowship ?? INITIAL;

  /* Máximo derivado: número de heróis + bônus Cultural/Virtudes + Patrono. */
  const fellowshipMax = torFellowshipLevel({
    baseLevel: state.heroes.length + (state.culturalFellowshipBonus ?? 0),
    patronBonus: state.patronBonus,
  });

  async function patchFellowship(patch: Partial<TorFellowshipProgress>) {
    setBusy(true);
    setErr(null);
    try {
      await patchTorSession(roomId, { fellowship: { ...state, ...patch } });
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao salvar a Companhia");
    } finally {
      setBusy(false);
    }
  }

  async function setTnBase(usar18: boolean) {
    setBusy(true);
    setErr(null);
    try {
      // `null` apaga a opção e volta ao padrão do livro — gravar 20 deixaria a
      // mesa que desligou indistinguível da que nunca mexeu.
      await patchTorSession(roomId, { attributeTnBase: usar18 ? 18 : null });
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao salvar a regra de campanha");
    } finally {
      setBusy(false);
    }
  }

  /** A próxima Fase é Yule? Deriva do calendário — nunca de um botão manual. */
  const nextIsYule = state.phasesThisYear + 1 >= TOR_PHASES_PER_YEAR;

  const budget = useMemo(
    () => torUndertakingBudget({ isYule: nextIsYule, companySize: state.heroes.length }),
    [nextIsYule, state.heroes.length]
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
        { isYule: nextIsYule, companySize: state.heroes.length }
      ),
    [state.picks, state.heroes.length, undertakings, nextIsYule]
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
          { heroes: state.heroes }
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
        // O calendário avança, as escolhas zeram para a Fase seguinte, e a Fase
        // que terminou entra na crônica — é o registro que sobrevive à mesa.
        // Guarda o ano/Fase ANTES de avançar: a linha da crônica descreve a Fase
        // que acabou, não a que começa.
        await patchTorSession(roomId, {
          fellowship: {
            ...state,
            year: advanced.calendar.year,
            phasesThisYear: advanced.calendar.phasesThisYear,
            picks: [],
            purchases: {},
            chronicle: appendTorChronicle(state.chronicle ?? [], {
              year: state.year,
              phase: state.phasesThisYear,
              isYule: advanced.isYule,
              undertakings: state.picks,
              outcome: state.outcome,
            }),
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
          Encerrar esta Fase vira o ano: todos envelhecem 1 ano e cada herói ganha pontos de
          Perícia iguais à própria Astúcia.
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

      {/* O avanço é a razão de existir da Fase de Companhia — fica aqui, não na
          ficha, porque o limite é POR FASE e é este painel que fecha a Fase. */}
      <TorAdvancePanel roomId={roomId} characterIds={characterIds} onUpdate={onUpdate} />

      {/* Reserva de Companhia: "valor inicial igual ao número de heróis, podendo
          ser aumentado por Virtudes/Bênçãos Culturais e pelo bônus do Patrono".
          O MÁXIMO é derivado, nunca guardado — guardá-lo daria duas fontes de
          verdade que divergem assim que um herói entra ou sai. */}
      <section className="tor-journey__section">
        <p className="eyebrow">Companhia</p>
        <p className="tor-journey__remaining">
          {Math.max(0, fellowshipMax - (state.fellowshipSpent ?? 0))} de {fellowshipMax} pontos
          disponíveis
        </p>
        <div className="vtt-special-damage">
          <label>
            Bônus do Patrono
            <input
              type="number"
              min={0}
              max={6}
              value={state.patronBonus ?? 0}
              disabled={busy || !canManage}
              onChange={(e) => void patchFellowship({ patronBonus: Number(e.target.value) || 0 })}
            />
          </label>
          <label>
            Bônus Cultural / Virtudes
            <input
              type="number"
              min={0}
              max={12}
              value={state.culturalFellowshipBonus ?? 0}
              disabled={busy || !canManage}
              onChange={(e) =>
                void patchFellowship({ culturalFellowshipBonus: Number(e.target.value) || 0 })
              }
            />
          </label>
        </div>
        <div className="vtt-special-damage">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || (state.fellowshipSpent ?? 0) >= fellowshipMax}
            onClick={() => void patchFellowship({ fellowshipSpent: (state.fellowshipSpent ?? 0) + 1 })}
          >
            Gastar 1 ponto
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || (state.fellowshipSpent ?? 0) === 0}
            onClick={() => void patchFellowship({ fellowshipSpent: 0 })}
          >
            Renovar (fim de sessão)
          </button>
        </div>
        <p className="tor-journey__pending-hint">
          Gasta-se para recuperar Esperança ao descansar e para acionar efeitos do Patrono. Os pontos
          são plenamente renovados ao fim de cada sessão de jogo.
        </p>
      </section>

      {(state.chronicle ?? []).length > 0 ? (
        <section className="tor-journey__section">
          <p className="eyebrow">Crônica</p>
          <ul className="tor-journey__log">
            {(state.chronicle ?? []).map((c, i) => (
              <li key={i}>
                {c.year}, Fase {c.phase + 1}
                {c.isYule ? " (Yule)" : ""} — {OUTCOME_LABEL[c.outcome]}
                {c.undertakings.length > 0
                  ? ` · ${c.undertakings
                      .map((id) => undertakings.find((u) => u.id === id)?.name ?? id)
                      .join(", ")}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="tor-journey__section">
        <p className="eyebrow">Regras da campanha</p>
        <label className="vtt-inline-check">
          <input
            type="checkbox"
            checked={attributeTnBase === 18}
            disabled={busy || !canManage}
            onChange={(e) => void setTnBase(e.target.checked)}
          />
          Números-Alvo derivados de 18 (campanha curta ou jogo de uma sessão)
        </label>
        <p className="tor-journey__pending-hint">
          Regra opcional do livro: em vez de NA = 20 − Atributo, use 18 − Atributo. É o que explica
          o NA impresso nas fichas do Starter Set. Vale para todas as rolagens feitas nesta mesa.
        </p>
      </section>

      <section className="tor-journey__section">
        <p className="eyebrow">Calendário</p>
        {calendarHeader}

        {/* Um herói por linha, com a ASTÚCIA dele. O bônus de Perícia do Yule é
            por herói, conforme a própria Astúcia — um campo único pra Companhia
            dava o mesmo bônus a todos e errava a maioria numa Companhia mista. */}
        <p className="tor-journey__remaining">
          Companhia — a Astúcia de cada herói define o bônus de Perícia dele no Yule
        </p>
        <div className="tor-journey__heroes">
          {state.heroes.map((hero, i) => (
            <div className="tor-journey__hero" key={i}>
              <label>
                Herói {i + 1}
                <input
                  type="text"
                  value={hero.name}
                  maxLength={40}
                  disabled={busy}
                  onChange={(e) => void save({ heroes: patchHero(state.heroes, i, { name: e.target.value }) })}
                />
              </label>
              <label>
                Astúcia
                <input
                  type="number"
                  min={0}
                  max={7}
                  value={hero.wits}
                  disabled={busy}
                  onChange={(e) =>
                    void save({
                      heroes: patchHero(state.heroes, i, {
                        wits: Math.max(0, Math.min(7, Number(e.target.value) || 0)),
                      }),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="tor-journey__hero-remove"
                disabled={busy || state.heroes.length <= 1}
                onClick={() => void save({ heroes: state.heroes.filter((_, k) => k !== i) })}
                aria-label={`Remover ${hero.name}`}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={busy || state.heroes.length >= TOR_MAX_COMPANY}
          onClick={() =>
            void save({
              heroes: [...state.heroes, { name: `Herói ${state.heroes.length + 1}`, wits: 3 }],
            })
          }
        >
          Adicionar herói
        </button>
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
