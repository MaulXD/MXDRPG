"use client";

import { useEffect, useRef } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import { isMonsterToken } from "@/lib/room/settings";

type Props = {
  open: boolean;
  token: BattleToken | null;
  /** Token está na vez na iniciativa (aviso, não bloqueia). */
  isOnTurn?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteTokenConfirmDialog({
  open,
  token,
  isOnTurn = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open || !token) return null;

  const isMonster = isMonsterToken(token);
  const lead = isMonster
    ? `O monstro "${token.name}" será removido do mapa. A ficha no bestiário não é apagada.`
    : token.linked
      ? `"${token.name}" sai do mapa, mas a ficha do jogador permanece na aventura.`
      : `"${token.name}" será removido do mapa.`;

  return (
    <div
      className="vtt-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="vtt-modal-panel glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-token-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="delete-token-title" className="vtt-modal-title">
          Remover token do mapa?
        </h3>
        <p className="vtt-modal-lead">{lead}</p>
        <p className="vtt-modal-warn" role="status">
          Token selecionado: <strong>{token.name}</strong>
          {isOnTurn ? " — está na vez; a iniciativa segue para o próximo." : null}
        </p>
        <div className="vtt-modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Removendo…" : "Remover do mapa"}
          </button>
        </div>
      </div>
    </div>
  );
}
