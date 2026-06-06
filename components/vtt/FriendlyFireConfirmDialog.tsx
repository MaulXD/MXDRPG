"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  open: boolean;
  attacker: BattleToken | null;
  defender: BattleToken | null;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function FriendlyFireConfirmDialog({
  open,
  attacker,
  defender,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!mounted || !open || !attacker || !defender) return null;

  return createPortal(
    <div
      className="vtt-friendly-fire-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="vtt-friendly-fire-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="friendly-fire-title"
        aria-describedby="friendly-fire-desc"
      >
        <div className="vtt-friendly-fire-modal__header">
          <span className="vtt-friendly-fire-modal__icon" aria-hidden>
            ⚠
          </span>
          <h3 id="friendly-fire-title" className="vtt-friendly-fire-modal__title">
            Atacar um aliado?
          </h3>
        </div>

        <div className="vtt-friendly-fire-modal__matchup" aria-hidden>
          <span className="vtt-friendly-fire-modal__token vtt-friendly-fire-modal__token--attacker">
            {attacker.name}
          </span>
          <span className="vtt-friendly-fire-modal__arrow">→</span>
          <span className="vtt-friendly-fire-modal__token vtt-friendly-fire-modal__token--ally">
            {defender.name}
          </span>
        </div>

        <p id="friendly-fire-desc" className="vtt-friendly-fire-modal__lead">
          <strong>{attacker.name}</strong> vai atacar <strong>{defender.name}</strong>, que
          está do seu lado. Essa ação pode ferir ou derrotar um companheiro.
        </p>

        <p className="vtt-friendly-fire-modal__warn" role="status">
          Confirme apenas se for intencional.
        </p>

        <div className="vtt-friendly-fire-modal__actions">
          <button
            type="button"
            className="btn vtt-friendly-fire-modal__cancel"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="btn vtt-friendly-fire-modal__confirm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Atacando…" : "Atacar mesmo assim"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
