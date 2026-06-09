"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import { exportSheetPdf, sheetPdfFilename } from "@/lib/character/export-sheet-pdf";
import { SheetPdfDocument } from "@/components/character/SheetPdfDocument";
import { useVttToast } from "@/components/vtt/VttToast";

type Props = {
  character: CharacterSheet;
  inventory?: InventoryItem[];
  characterId?: string;
  roomId?: string;
  className?: string;
  compact?: boolean;
  /** Botão quadrado na barra da janela Foundry (minimizar/fechar) */
  variant?: "default" | "chrome";
};

function captureRootReady(host: HTMLElement): HTMLElement | null {
  const root = host.querySelector(".sheet-pdf-doc") as HTMLElement | null;
  if (!root) return null;
  if (root.offsetWidth < 8 || root.offsetHeight < 8) return null;
  return root;
}

async function waitForHost(getHost: () => HTMLDivElement | null): Promise<HTMLDivElement> {
  for (let i = 0; i < 24; i++) {
    const host = getHost();
    if (host) return host;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await new Promise((resolve) => setTimeout(resolve, 150));
  const host = getHost();
  if (host) return host;
  throw new Error("Exportação ainda não está pronta — tente de novo em instantes.");
}

async function waitForCaptureRoot(host: HTMLElement): Promise<HTMLElement> {
  for (let i = 0; i < 32; i++) {
    const root = captureRootReady(host);
    if (root) return root;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  const root = captureRootReady(host);
  if (root) return root;
  throw new Error("Layout de exportação indisponível — recarregue a ficha e tente de novo.");
}

export function SheetPdfExportButton({
  character,
  inventory = [],
  characterId,
  roomId,
  className,
  compact,
  variant = "default",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useVttToast();
  const resolvedCharacterId = characterId ?? character.id;
  const isChrome = variant === "chrome";

  const notify = useCallback(
    (message: string, variant: "warn" | "success" = "warn") => {
      toast.push(message, variant);
      if (variant === "warn") setError(message);
    },
    [toast]
  );

  const exportPdf = useCallback(async () => {
    if (busy) return;

    setBusy(true);
    setError("");
    try {
      const host = await waitForHost(() => hostRef.current);
      const root = await waitForCaptureRoot(host);
      await exportSheetPdf(root, sheetPdfFilename(character.name), {
        baseUrl: window.location.origin,
        characterId: resolvedCharacterId,
        roomId,
      });
      notify(`PDF de ${character.name} baixado.`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao gerar PDF";
      console.error("[ficha] export PDF:", e);
      notify(msg, "warn");
    } finally {
      setBusy(false);
    }
  }, [busy, character.name, notify, resolvedCharacterId, roomId]);

  const offscreen = (
    <div ref={hostRef} aria-hidden className="sheet-pdf-capture-host">
      <SheetPdfDocument character={character} inventory={inventory} roomId={roomId} />
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
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void exportPdf();
        }}
        disabled={busy}
        title={
          error ||
          "Baixar ficha em PDF (ações rápidas com link para a mesa)"
        }
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
