"use client";

import { useState } from "react";
import { postRoomChat } from "@/hooks/useRoomSync";

const QUICK = ["1d20", "1d12", "1d10", "1d8", "1d6", "1d4", "2d6", "1d20+3"];

type Props = {
  roomId: string;
  onUpdate: () => void;
};

export function DiceRoller({ roomId, onUpdate }: Props) {
  const [formula, setFormula] = useState("1d20");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function roll(f: string) {
    setBusy(true);
    setErr(null);
    try {
      await postRoomChat(roomId, { kind: "roll", formula: f });
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dice-roller">
      <p className="vtt-eyebrow" style={{ margin: "0 0 0.5rem" }}>
        Rolador
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
