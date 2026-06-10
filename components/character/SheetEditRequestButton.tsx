"use client";

import { IconPencil } from "@/components/ui/EldarinIcons";

import { useState } from "react";
import type { SheetEditScope } from "@/lib/character/sheet-edit-request";
import { sheetEditScopeLabel } from "@/lib/character/sheet-edit-request";

type Props = {
  characterId: string;
  adventureId: string;
  roomId?: string;
  variant?: "chrome" | "inline" | "ddb-toolbar";
  onRequested?: () => void;
};

export function SheetEditRequestButton({
  characterId,
  adventureId,
  roomId,
  variant = "inline",
  onRequested,
}: Props) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<SheetEditScope>("last_level");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/characters/${characterId}/edit-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ scope, adventureId, roomId }),
      });
      const data = (await res.json()) as { error?: string; alreadyPending?: boolean };
      if (!res.ok) throw new Error(data.error ?? "Falha ao enviar");
      setMsg(
        data.alreadyPending
          ? "Já existe uma solicitação pendente."
          : "Solicitação enviada ao mestre."
      );
      onRequested?.();
      window.setTimeout(() => setOpen(false), 1200);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  const btnClass =
    variant === "ddb-toolbar"
      ? "sheet-ddb-toolbar__btn"
      : variant === "chrome"
        ? "foundry-window__btn"
        : "btn btn-secondary btn-sm";

  return (
    <>
      <button
        type="button"
        className={btnClass}
        title="Solicitar edição ao mestre"
        aria-label="Solicitar edição ao mestre"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
          setMsg(null);
        }}
      >
        <IconPencil size={16} />
      </button>

      {open ? (
        <div className="sheet-edit-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="sheet-edit-modal glass-panel"
            role="dialog"
            aria-labelledby="sheet-edit-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="sheet-edit-modal-title">Solicitar edição da ficha</h3>
            <p className="sheet-edit-modal__hint">
              Em campanha, alterações na ficha precisam da aprovação do mestre.
            </p>

            <fieldset className="sheet-edit-modal__scopes">
              <legend className="sr-only">Escopo da edição</legend>
              <label className="sheet-edit-modal__option">
                <input
                  type="radio"
                  name="edit-scope"
                  value="last_level"
                  checked={scope === "last_level"}
                  onChange={() => setScope("last_level")}
                />
                <span>
                  <strong>{sheetEditScopeLabel("last_level")}</strong>
                  <small>Refaz escolhas do último nível (subclasse, talento, etc.)</small>
                </span>
              </label>
              <label className="sheet-edit-modal__option">
                <input
                  type="radio"
                  name="edit-scope"
                  value="full_rebuild"
                  checked={scope === "full_rebuild"}
                  onChange={() => setScope("full_rebuild")}
                />
                <span>
                  <strong>{sheetEditScopeLabel("full_rebuild")}</strong>
                  <small>Raça, classe e atributos — mantém inventário e XP</small>
                </span>
              </label>
            </fieldset>

            {msg ? <p className="sheet-edit-modal__msg" role="status">{msg}</p> : null}

            <div className="sheet-edit-modal__actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary-cta" onClick={() => void submit()} disabled={busy}>
                {busy ? "Enviando…" : "Enviar ao mestre"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
