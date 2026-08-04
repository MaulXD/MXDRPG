"use client";

import { useCallback, useState } from "react";
import { patchTorSession, postRoomChat } from "@/hooks/useRoomSync";
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
  /**
   * Estado vindo do snapshot da sala — sobrevive a recarga e chega a todos os
   * jogadores por SSE, então o placar do Conselho é público.
   */
  council: TorCouncilState | null;
  onUpdate: () => void;
};

const RANKS = [0, 1, 2, 3, 4, 5, 6] as const;

/** ND padrão de mesa quando o Mestre não define outro. */
const DEFAULT_TN = 14;

function skillLabel(id: string): string {
  return (SKILL_LABEL as Record<string, string>)[id] ?? id;
}

export function TorCouncilPanel({ roomId, canManage, council, onUpdate }: Props) {
  // Só a Resistência e a perícia escolhida são locais — o resto vem da sala.
  const [draftResistance, setDraftResistance] = useState<TorCouncilResistance>(6);
  const [introSkill, setIntroSkill] = useState<string>(TOR_INTRODUCTION_SKILLS[0]);
  const [interSkill, setInterSkill] = useState<string>(TOR_INTERACTION_SKILLS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const outcome = council ? torCouncilOutcome(council) : null;
  const finished = outcome != null && outcome !== "ongoing";

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

  /** Narra no chat e persiste na sala. Ver TorJourneyPanel para a mesma ordem. */
  const commit = useCallback(
    async (text: string, featValue: number, next: TorCouncilState | null) => {
      await postRoomChat(roomId, {
        kind: "chat",
        text,
        torFeatDie: { sides: 12, value: featValue },
      });
      await patchTorSession(roomId, { council: next });
      onUpdate();
    },
    [roomId, onUpdate]
  );

  const introduce = useCallback(
    (rank: number) =>
      guard(async () => {
        const roll = rollTorCheck({ rank, tn: DEFAULT_TN });
        const intro = resolveTorIntroduction({
          resistance: draftResistance,
          passed: roll.success,
          successIcons: roll.successIcons,
        });
        await commit(
          `Conselho — ${TOR_RESISTANCE_META[draftResistance].label} (Resistência ${draftResistance}). ` +
            formatTorIntroductionMessage("Porta-voz", skillLabel(introSkill), intro),
          featDieRollPayload(roll.featDie).value,
          startTorCouncil(draftResistance, intro)
        );
      }),
    [guard, commit, draftResistance, introSkill]
  );

  const interact = useCallback(
    (rank: number) =>
      guard(async () => {
        if (!council || finished) return;
        const roll = rollTorCheck({ rank, tn: DEFAULT_TN });
        const result = resolveTorInteraction(council, {
          passed: roll.success,
          successIcons: roll.successIcons,
        });
        await commit(
          formatTorInteractionMessage("Herói", skillLabel(interSkill), result),
          featDieRollPayload(roll.featDie).value,
          result.state
        );
      }),
    [guard, commit, council, finished, interSkill]
  );

  const end = useCallback(
    () =>
      guard(async () => {
        await patchTorSession(roomId, { council: null });
        onUpdate();
      }),
    [guard, roomId, onUpdate]
  );

  /** Placar — igual para Mestre e jogador. */
  const scoreboard = council ? (
    <>
      <p className="tor-journey__remaining">
        {council.successes}/{council.resistance} sucessos ·{" "}
        {Math.max(0, council.timeLimit - council.attemptsUsed)} tentativa
        {council.timeLimit - council.attemptsUsed === 1 ? "" : "s"}
      </p>
      {council.disasterOnFailure ? (
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
      ) : null}
    </>
  ) : null;

  /* ── Jogador: placar somente leitura ─────────────────────────────── */
  if (!canManage) {
    return (
      <div className="tor-journey">
        {council ? (
          <section className="tor-journey__section">
            <p className="eyebrow">Conselho</p>
            {scoreboard}
          </section>
        ) : (
          <p className="vtt-combat-hint">Nenhum conselho em curso.</p>
        )}
      </div>
    );
  }

  /* ── Mestre ───────────────────────────────────────────────────────── */
  return (
    <div className="tor-journey">
      {err ? <p className="dice-err">{err}</p> : null}

      {!council ? (
        <>
          <section className="tor-journey__section">
            <p className="eyebrow">Resistência</p>
            <div className="tor-journey__grid">
              <label>
                Dificuldade do pedido
                <select
                  value={draftResistance}
                  onChange={(e) =>
                    setDraftResistance(Number(e.target.value) as TorCouncilResistance)
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
              {TOR_RESISTANCE_META[draftResistance].description}
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
        <section className="tor-journey__section">
          <p className="eyebrow">Interação</p>
          {scoreboard}

          {!finished ? (
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
          ) : null}

          <button
            type="button"
            className="btn-ghost tor-journey__reset"
            disabled={busy}
            onClick={() => void end()}
          >
            {finished ? "Novo conselho" : "Encerrar conselho"}
          </button>
        </section>
      )}
    </div>
  );
}
