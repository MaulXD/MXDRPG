"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import { exportSheetPdf, sheetPdfFilename } from "@/lib/character/export-sheet-pdf";
import { SheetPdfCapture } from "@/components/character/SheetPdfCapture";

type Props = {
  character: CharacterSheet;
  inventory: InventoryItem[];
  characterId?: string;
  roomId?: string;
  className?: string;
  compact?: boolean;
  /** Botão quadrado na barra da janela Foundry (minimizar/fechar) */
  variant?: "default" | "chrome";
};

export function SheetPdfExportButton({
  character,
  inventory,
  characterId,
  roomId,
  className,
  compact,
  variant = "default",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resolvedCharacterId = characterId ?? character.id;
  const isChrome = variant === "chrome";

  const exportPdf = useCallback(async () => {
    if (busy || !hostRef.current) return;
    setBusy(true);
    setError("");
    try {
      const root = hostRef.current.querySelector(".sheet-pdf-capture") as HTMLElement | null;
      if (!root) throw new Error("Layout de exportação indisponível");

      await exportSheetPdf(root, sheetPdfFilename(character.name), {
        baseUrl: window.location.origin,
        characterId: resolvedCharacterId,
        roomId,
      });
    } catch (e) {
      console.error("[ficha] export PDF:", e);
      setError(e instanceof Error ? e.message : "Falha ao gerar PDF");
    } finally {
      setBusy(false);
    }
  }, [busy, character.name, resolvedCharacterId, roomId]);

  const offscreen = (
    <div ref={hostRef} aria-hidden className="sheet-pdf-capture-host">
      <SheetPdfCapture character={character} inventory={inventory} roomId={roomId} />
    </div>
  );

  const btnClass = isChrome
    ? `foundry-window__btn foundry-window__btn--pdf${busy ? " is-busy" : ""}${className ? ` ${className}` : ""}`
    : `btn btn-secondary sheet-pdf-export-btn${compact ? " sheet-pdf-export-btn--toolbar" : ""}${className ? ` ${className}` : ""}`;

  return (
    <>
      <button
        type="button"
        className={btnClass}
        onClick={() => void exportPdf()}
        disabled={busy}
        title="Baixar ficha em PDF (ações rápidas com link para a mesa)"
        aria-label="Exportar ficha em PDF"
      >
        {busy ? "…" : isChrome ? "PDF" : compact ? "PDF" : "Exportar PDF"}
      </button>
      {error && !isChrome ? (
        <span className="sheet-pdf-doc__muted" role="alert" style={{ marginLeft: "0.5rem" }}>
          {error}
        </span>
      ) : null}
      {typeof document !== "undefined" ? createPortal(offscreen, document.body) : null}
    </>
  );
}
