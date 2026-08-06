"use client";

import { useState } from "react";
import { postRoomChat } from "@/hooks/useRoomSync";
import { DiceBoxMini } from "@/components/vtt/DiceBoxMini";
import { diceRollSpecFromFormula } from "@/lib/vtt/combat-dice-model";
import type { RpgSystemId } from "@/lib/rpg/systems";

const QUICK_ELDARIN = ["1d20", "1d12", "1d10", "1d8", "1d6", "1d4", "2d6"];

/**
 * O Um Anel usa exatamente DOIS dados: o Dado de Proeza (d12) e os Dados de
 * Sucesso (d6, rolados em quantidade igual à graduação da habilidade). d20, d10,
 * d8 e d4 não existem no sistema — oferecê-los na mesa do Um Anel só convida a
 * rolar um dado que nenhuma regra do livro usa.
 *
 * Fonte: 02-resolucao-de-acoes.md, "Os Dados de O Um Anel" — seis d6 e dois d12.
 */
const QUICK_UM_ANEL = ["1d12", "1d6", "2d6", "3d6", "4d6", "5d6", "6d6"];

type Props = {
  roomId: string;
  onUpdate: () => void;
  /** Sistema da sala — define quais dados aparecem nos atalhos. */
  rpgSystemId?: RpgSystemId;
};

export function DiceRoller({ roomId, onUpdate, rpgSystemId = "eldarin" }: Props) {
  const isUmAnel = rpgSystemId === "um-anel";
  const QUICK = isUmAnel ? QUICK_UM_ANEL : QUICK_ELDARIN;
  const [formula, setFormula] = useState(isUmAnel ? "1d12" : "1d20");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [lastTotal, setLastTotal] = useState<number | null>(null);

  async function roll(f: string) {
    setBusy(true);
    setRolling(true);
    setErr(null);
    setFormula(f);
    try {
      const snapshot = await postRoomChat(roomId, { kind: "roll", formula: f });
      const lastRoll = [...(snapshot.chat ?? [])].reverse().find((m) => m.kind === "roll");
      if (lastRoll?.roll) setLastTotal(lastRoll.roll.total);
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
      setTimeout(() => setRolling(false), 1100);
    }
  }

  const displayValue = rolling ? null : lastTotal;

  return (
    <div className="dice-roller dice-roller--rail">
      <div className="dice-roller-stage">
        <DiceBoxMini
          spec={diceRollSpecFromFormula(formula, displayValue)}
          formula={formula}
          rolling={rolling}
          size="lg"
        />
        {lastTotal != null && !rolling ? (
          <p className="dice-roller-result">
            Total <strong>{lastTotal}</strong>
          </p>
        ) : (
          <p className="dice-roller-result dice-roller-result--hint">
            Escolha um dado ou digite a fórmula
          </p>
        )}
      </div>

      <p className="vtt-eyebrow" style={{ margin: "0.75rem 0 0.5rem" }}>
        Atalhos
      </p>
      <div className="dice-quick">
        {QUICK.map((d) => (
          <button
            key={d}
            type="button"
            className="dice-chip"
            disabled={busy}
            onClick={() => roll(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <form
        className="dice-custom"
        onSubmit={(e) => {
          e.preventDefault();
          roll(formula);
        }}
      >
        <input
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder={isUmAnel ? "1d12" : "1d20"}
          spellCheck={false}
        />
        <button type="submit" className="btn" disabled={busy}>
          Rolar
        </button>
      </form>
      {err ? <p className="dice-err">{err}</p> : null}
    </div>
  );
}
