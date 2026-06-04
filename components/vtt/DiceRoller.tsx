"use client";

import { useState } from "react";
import { postRoomChat } from "@/hooks/useRoomSync";
import { DiceMiniature } from "@/components/vtt/DiceMiniature";

const QUICK = ["1d20", "1d12", "1d10", "1d8", "1d6", "1d4", "2d6", "1d20+3"];

type Props = {
  roomId: string;
  onUpdate: () => void;
};

export function DiceRoller({ roomId, onUpdate }: Props) {
  const [formula, setFormula] = useState("1d20");
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
      setTimeout(() => setRolling(false), 480);
    }
  }

  const displayValue = rolling ? null : lastTotal;

  return (
    <div className="dice-roller dice-roller--rail">
      <div className="dice-roller-stage">
        <DiceMiniature formula={formula} value={displayValue} rolling={rolling} size="lg" />
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
          placeholder="1d20+3"
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
