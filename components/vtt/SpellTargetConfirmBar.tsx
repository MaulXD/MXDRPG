"use client";

type Props = {
  spellName: string;
  picked: number;
  max: number;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Barra para confirmar conjuração antes de completar todos os alvos. */
export function SpellTargetConfirmBar({
  spellName,
  picked,
  max,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  if (picked <= 0 || picked >= max) return null;

  return (
    <div className="vtt-spell-target-bar glass-panel" role="region" aria-label="Confirmar magia">
      <div className="vtt-spell-target-bar__copy">
        <strong className="vtt-spell-target-bar__title">{spellName}</strong>
        <span className="vtt-spell-target-bar__count">
          {picked}/{max} alvos — clique no mapa para adicionar ou confirme agora
        </span>
      </div>
      <div className="vtt-spell-target-bar__actions">
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={onConfirm}>
          {busy ? "Conjurando…" : "Confirmar lançamento"}
        </button>
      </div>
    </div>
  );
}
