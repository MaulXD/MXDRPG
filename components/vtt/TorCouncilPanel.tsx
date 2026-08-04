"use client";

import { useCallback, useState } from "react";
import { postRoomChat } from "@/hooks/useRoomSync";
import { rollTorCheck, featDieRollPayload } from "@/lib/character/um-anel/dice";
import { SKILL_LABEL } from "@/lib/character/um-anel/data";
import {
  TOR_COUNCIL_RESISTANCES,
  TOR_INTERACTION_SKILLS,
  TOR_INTRODUCTION_SKILLS,
  TOR_RESISTANCE_META,
  formatTorInteractionMessage,
  formatTorIntroductionMessage,
  resolveTorIntroduction,
  resolveTorInteraction,
  startTorCouncil,
  torCouncilOutcome,
  type TorCouncilResistance,
  type TorCouncilState,
} from "@/lib/combat/um-anel/council";
import "./tor-journey.css";

type Props = {
  roomId: string;
  /** Só o Mestre define a Resistência e conduz o Conselho. */
  canManage: boolean;
  onUpdate: () => void;
};

/** Graduações possíveis de uma perícia (0–6 Dados de Sucesso). */
const RANKS = [0, 1, 2, 3, 4, 5, 6] as const;

/** ND padrão de mesa quando o Mestre não define outro. */
const DEFAULT_TN = 14;

function skillLabel(id: string): string {
  return (SKILL_LABEL as Record<string, string>)[id] ?? id;
}

export function TorCouncilPanel({ roomId, canManage, onUpdate }: Props) {
  const [resistance, setResistance] = useState<TorCouncilResistance>(6);
  const [state, setState] = useState<TorCouncilState | null>(null);
  const [introSkill, setIntroSkill] = useState<string>(TOR_INTRODUCTION_SKILLS[0]);
  const [interSkill, setInterSkill] = useState<string>(TOR_INTERACTION_SKILLS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const outcome = state ? torCouncilOutcome(state) : null;
  const finished = outcome != null && outcome !== "ongoing";

  const say = useCallback(
    async (text: string, featValue?: number) => {
      try {
        await postRoomChat(roomId, {
          kind: "chat",
          text,
          ...(featValue != null ? { torFeatDie: { sides: 12, value: featValue } } : {}),
        });
        onUpdate();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao publicar no chat");
      }
    },
    [roomId, onUpdate]
  );

  /** Introdução: a rolagem do porta-voz define o limite de tempo do Conselho. */
  const introduce = useCallback(
    async (rank: number) => {
      if (busy) return;
      setBusy(true);
      setErr(null);
      try {
        const roll = rollTorCheck({ rank, tn: DEFAULT_TN });
        const intro = resolveTorIntroduction({
          resistance,
          passed: roll.success,
          successIcons: roll.successIcons,
        });
        setState(startTorCouncil(resistance, intro));
        await say(
          `Conselho — ${TOR_RESISTANCE_META[resistance].label} (Resistência ${resistance}). ` +
            formatTorIntroductionMessage("Porta-voz", skillLabel(introSkill), intro),
          featDieRollPayload(roll.featDie).value
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, resistance, introSkill, say]
  );

  /** Uma tentativa de Interação. Conta mesmo na falha — é o que aperta o tempo. */
  const interact = useCallback(
    async (rank: number) => {
      if (!state || busy || finished) return;
      setBusy(true);
      setErr(null);
      try {
        const roll = rollTorCheck({ rank, tn: DEFAULT_TN });
        const result = resolveTorInteraction(state, {
          passed: roll.success,
          successIcons: roll.successIcons,
        });
        setState(result.state);
        await say(
          formatTorInteractionMessage("Herói", skillLabel(interSkill), result),
          featDieRollPayload(roll.featDie).value
        );
      } finally {
        setBusy(false);
      }
    },
    [state, busy, finished, interSkill, say]
  );

  if (!canManage) {
    return (
      <div className="tor-journey">
        <p className="vtt-combat-hint">
          Só o Mestre conduz o Conselho. Acompanhe no chat da mesa.
        </p>
      </div>
    );
  }

  return (
    <div className="tor-journey">
      {err ? <p className="dice-err">{err}</p> : null}

      {!state ? (
        <>
          <section className="tor-journey__section">
            <p className="eyebrow">Resistência</p>
            <div className="tor-journey__grid">
              <label>
                Dificuldade do pedido
                <select
                  value={resistance}
                  onChange={(e) =>
                    setResistance(Number(e.target.value) as TorCouncilResistance)
                  }
                >
                  {TOR_COUNCIL_RESISTANCES.map((r) => (
                    <option key={r} value={r}>
                      {TOR_RESISTANCE_META[r].label} ({r})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="tor-journey__pending-hint">
              {TOR_RESISTANCE_META[resistance].description}
            </p>
          </section>

          <section className="tor-journey__section">
            <p className="eyebrow">Introdução</p>
            <div className="tor-journey__grid">
              <label>
                Perícia do porta-voz
                <select value={introSkill} onChange={(e) => setIntroSkill(e.target.value)}>
                  {TOR_INTRODUCTION_SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {skillLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="tor-journey__ranks">
              <p className="tor-journey__pending-hint">
                Graduação do porta-voz — o resultado define quantas tentativas a Companhia terá
              </p>
              {RANKS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="btn-ghost"
                  disabled={busy}
                  onClick={() => void introduce(r)}
                >
                  {r}d
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="tor-journey__section">
            <p className="eyebrow">Interação</p>
            <p className="tor-journey__remaining">
              {state.successes}/{state.resistance} sucessos ·{" "}
              {Math.max(0, state.timeLimit - state.attemptsUsed)} tentativa
              {state.timeLimit - state.attemptsUsed === 1 ? "" : "s"}
            </p>
            {state.disasterOnFailure ? (
              <p className="tor-journey__pending-hint">
                A Introdução falhou — se o Conselho falhar, termina em Desastre.
              </p>
            ) : null}

            {finished ? (
              <div className="tor-journey__pending">
                <p className="tor-journey__pending-title">
                  {outcome === "success"
                    ? "Conselho ganho"
                    : outcome === "disaster"
                      ? "Desastre"
                      : "Conselho falhou"}
                </p>
              </div>
            ) : (
              <>
                <div className="tor-journey__grid">
                  <label>
                    Perícia usada
                    <select value={interSkill} onChange={(e) => setInterSkill(e.target.value)}>
                      {TOR_INTERACTION_SKILLS.map((s) => (
                        <option key={s} value={s}>
                          {skillLabel(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="tor-journey__ranks">
                  <p className="tor-journey__pending-hint">Graduação de quem está falando</p>
                  {RANKS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() => void interact(r)}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              type="button"
              className="btn-ghost tor-journey__reset"
              onClick={() => setState(null)}
            >
              {finished ? "Novo conselho" : "Encerrar conselho"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
