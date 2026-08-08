"use client";

import { useState } from "react";
import { postRoomTorHazard } from "@/hooks/useRoomSync";
import {
  TOR_HAZARD_LEVELS,
  TOR_HAZARD_LEVEL_META,
  TOR_HAZARD_SOURCES,
  TOR_HAZARD_SOURCE_META,
  torPoisonHealingPenalty,
  type TorHazardLevel,
  type TorHazardSource,
} from "@/lib/combat/um-anel/hazards";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  roomId: string;
  token: BattleToken;
  /** Só o Mestre expõe a Companhia ao frio, ao fogo ou ao veneno. */
  canManage: boolean;
  onUpdate: () => void;
};

/** Graduações de CURA que a mesa pode ter — mesmo seletor dos outros painéis. */
const RANKS = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * Fontes de Dano fora do combate.
 *
 * O capítulo 8 traz o sistema inteiro — Frio Extremo, Queda, Fogo, Asfixia e
 * Veneno — e nada dele existia no app: a única forma de um herói perder
 * Resistência era levar um golpe.
 *
 * A tabela de Perda de Resistência é lida **ao contrário** do resto do jogo (a
 * Runa é Ileso, o Olho é zero), por isso o nível moderado rola Favorecida e o
 * gravíssimo rola Desfavorecida. O painel mostra isso em texto para o Mestre não
 * precisar confiar na intuição, que aqui erra.
 */
export function TorHazardPanel({ roomId, token, canManage, onUpdate }: Props) {
  const [source, setSource] = useState<TorHazardSource>("queda");
  const [level, setLevel] = useState<TorHazardLevel>("severo");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const combat = token.torCombat;
  if (combat?.kind !== "hero") return null;

  const poison = combat.poison;

  async function run(body: Parameters<typeof postRoomTorHazard>[2]) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postRoomTorHazard(roomId, token.id, body);
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao aplicar a Fonte de Dano");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tor-shadow-panel">
      <p className="vtt-eyebrow">Fontes de Dano</p>

      {/* O estado do veneno aparece para todos: é ele que impede o descanso. */}
      {poison ? (
        <p className="vtt-field__hint">
          ENVENENADO ({TOR_HAZARD_LEVEL_META[poison].label}) — não pode descansar, e rola perda de
          Resistência ao fim de cada dia. Uma Runa de Gandalf nessa rolagem cura.
        </p>
      ) : null}

      {canManage ? (
        <>
          <label className="vtt-field">
            Fonte
            <select
              value={source}
              disabled={busy}
              onChange={(e) => setSource(e.target.value as TorHazardSource)}
            >
              {TOR_HAZARD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {TOR_HAZARD_SOURCE_META[s].label}
                </option>
              ))}
            </select>
            <span className="vtt-field__hint">
              Rola {TOR_HAZARD_SOURCE_META[source].cadence}. A zero de Resistência o herói{" "}
              {TOR_HAZARD_SOURCE_META[source].atZero === "morrendo"
                ? "está MORRENDO"
                : "fica FERIDO"}
              .
            </span>
          </label>

          <label className="vtt-field">
            Nível da perda
            <select
              value={level}
              disabled={busy}
              onChange={(e) => setLevel(e.target.value as TorHazardLevel)}
            >
              {TOR_HAZARD_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {TOR_HAZARD_LEVEL_META[l].label} — {TOR_HAZARD_SOURCE_META[source].examples[l]}
                </option>
              ))}
            </select>
            <span className="vtt-field__hint">{TOR_HAZARD_LEVEL_META[level].description}</span>
          </label>

          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void run({ action: "apply", source, level })}
          >
            {busy ? "Rolando…" : "Rolar Perda de Resistência"}
          </button>

          {/* A rolagem de CURA é de quem TRATA — por isso pede a graduação de
              quem cuida, não a do doente. A penalidade vem do veneno do doente. */}
          {poison ? (
            <>
              <p className="vtt-field__hint">
                Rolagem de CURA no início do dia — graduação de quem trata
                {torPoisonHealingPenalty(poison) > 0
                  ? ` · perde (${torPoisonHealingPenalty(poison)}d) pelo veneno`
                  : ""}
              </p>
              <div className="tor-journey__ranks">
                {RANKS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="btn-ghost"
                    disabled={busy}
                    onClick={() => void run({ action: "cure-poison", healerRank: r })}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {err ? <p className="dice-err">{err}</p> : null}
    </div>
  );
}
