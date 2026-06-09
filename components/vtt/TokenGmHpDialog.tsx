"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { BattleToken } from "@/lib/vtt/types";
import { postGmCombatAction } from "@/hooks/useRoomSync";
import { formatTokenHpLine } from "@/lib/vtt/token-hp-display";

type Props = {
  open: boolean;
  token: BattleToken | null;
  roomId: string;
  onClose: () => void;
  onApplied: () => void;
};

function stopWheelBubble(e: React.WheelEvent) {
  e.stopPropagation();
}

export function TokenGmHpDialog({ open, token, roomId, onClose, onApplied }: Props) {
  const [mounted, setMounted] = useState(false);
  const [hpValue, setHpValue] = useState("0");
  const [hpMax, setHpMax] = useState("1");
  const [tempValue, setTempValue] = useState("0");
  const [showTemp, setShowTemp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !token) return;
    setHpValue(String(token.vida ?? 0));
    setHpMax(String(token.vidaMax ?? 1));
    const temp = token.vidaTemp ?? 0;
    setTempValue(String(temp));
    setShowTemp(temp > 0);
    setErr(null);
  }, [open, token?.id, token?.vida, token?.vidaMax, token?.vidaTemp]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function apply() {
    if (!token || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postGmCombatAction(roomId, {
        action: "set-hp",
        tokenId: token.id,
        value: Number(hpValue),
        max: Number(hpMax),
        temp: showTemp ? Number(tempValue) : 0,
      });
      onApplied();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao aplicar vida");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !open || !token || token.vidaMax == null) return null;

  return createPortal(
    <div
      className="vtt-gm-hp-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      onWheel={stopWheelBubble}
    >
      <div
        className="vtt-gm-hp-modal glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vtt-gm-hp-title"
        onClick={(e) => e.stopPropagation()}
        onWheel={stopWheelBubble}
      >
        <h3 id="vtt-gm-hp-title" className="vtt-gm-hp-modal__title">
          Ajustar vida — {token.name}
        </h3>
        <p className="vtt-gm-hp-modal__lead">
          Atual: <strong>{formatTokenHpLine(token)}</strong>
        </p>

        <div className="vtt-gm-hp-modal__grid">
          <label className="vtt-field">
            Vida atual
            <input
              type="number"
              min={0}
              value={hpValue}
              onChange={(e) => setHpValue(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="vtt-field">
            Vida máxima
            <input
              type="number"
              min={1}
              value={hpMax}
              onChange={(e) => setHpMax(e.target.value)}
              disabled={busy}
            />
          </label>
        </div>

        <div className="vtt-gm-hp-modal__temp-row">
          <button
            type="button"
            className={`btn btn-ghost vtt-gm-hp-modal__temp-toggle${showTemp ? " active" : ""}`}
            disabled={busy}
            onClick={() => setShowTemp((v) => !v)}
          >
            + Vida temporária
          </button>
          {showTemp ? (
            <label className="vtt-field vtt-field--inline vtt-gm-hp-modal__temp-field">
              Temp.
              <input
                type="number"
                min={0}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                disabled={busy}
              />
            </label>
          ) : null}
        </div>

        {err ? <p className="dice-err">{err}</p> : null}

        <div className="vtt-gm-hp-modal__actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void apply()}>
            {busy ? "Aplicando…" : "Aplicar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
