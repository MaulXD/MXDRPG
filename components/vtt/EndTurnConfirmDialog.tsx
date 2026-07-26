"use client";

import { useEffect, useRef } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { PaTurnRules } from "@/lib/combat/pa-economy";
import { PA_ACCUMULATION_CAP_DEFAULT, PA_RECOVERY_PER_TURN } from "@/lib/combat/pa-economy";
import { formatEndTurnPaBankMessage, planEndOfTurnPaBank } from "@/lib/combat/pa-turn";
import { isMonsterToken } from "@/lib/room/settings";

type Props = {
  open: boolean;
  token: BattleToken | null;
  paRules?: PaTurnRules;
  round: number;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function EndTurnConfirmDialog({
  open,
  token,
  paRules,
  round,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const rules =
    paRules ??
    (token
      ? {
          recoveryPerTurn: token.paMax || PA_RECOVERY_PER_TURN,
          accumulationCap: PA_ACCUMULATION_CAP_DEFAULT,
        }
      : undefined);
  const bankPlan =
    token && rules && !isMonsterToken(token) && !token.torCombat
      ? planEndOfTurnPaBank(token, rules)
      : null;
  const bankMessage =
    bankPlan && rules && bankPlan.saved > 0
      ? formatEndTurnPaBankMessage(bankPlan, rules)
      : null;

  return (
    <div
      className="vtt-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="vtt-modal-panel glass" role="dialog" aria-modal="true" aria-labelledby="end-turn-title">
        <h3 id="end-turn-title" className="vtt-modal-title">
          Passar turno?
        </h3>
        {token ? (
          <p className="vtt-modal-lead">
            <strong>{token.name}</strong> encerra a vez na rodada {round}.
          </p>
        ) : null}
        {bankMessage ? (
          <p className="vtt-modal-warn" role="status">
            {bankMessage}
          </p>
        ) : null}
        <div className="vtt-modal-actions">
          <button
            ref={confirmRef}
            type="button"
            className="btn"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Passando…" : "Confirmar e passar"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
