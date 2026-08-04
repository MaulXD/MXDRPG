"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { exportSheetPdf, sheetPdfFilename } from "@/lib/character/export-sheet-pdf";
import { TorSheetPdfDocument } from "@/components/character/TorSheetPdfDocument";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";
import "./sheet-pdf-capture.css";

type Props = {
  character: TorCharacterSheet;
  className?: string;
};

/**
 * Exporta a ficha do Um Anel em PDF, reaproveitando o motor do Eldarin
 * (`exportSheetPdf`: html2canvas → jsPDF). O que é próprio do sistema é só o
 * layout (`TorSheetPdfDocument`) — o motor de captura é infraestrutura sem
 * conteúdo de jogo, então usá-lo não fere o isolamento de hub.
 *
 * O documento é montado num host fora da tela e só existe durante a captura:
 * manter o layout de impressão sempre no DOM custaria render em toda ficha
 * aberta, e a ficha da mesa já é o componente mais pesado.
 */
export function TorSheetPdfExportButton({ character, className }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const waitForRoot = useCallback(async (): Promise<HTMLElement> => {
    for (let i = 0; i < 32; i++) {
      const root = hostRef.current?.querySelector(".sheet-pdf-doc") as HTMLElement | null;
      // Largura/altura mínimas: o host começa oculto e o layout só tem
      // dimensão depois do primeiro paint.
      if (root && root.offsetWidth > 8 && root.offsetHeight > 8) return root;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
    const root = hostRef.current?.querySelector(".sheet-pdf-doc") as HTMLElement | null;
    if (root) return root;
    throw new Error("Layout de exportação indisponível — recarregue a ficha e tente de novo.");
  }, []);

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    setMounted(true);
    try {
      const root = await waitForRoot();
      await exportSheetPdf(root, sheetPdfFilename(character.name));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao gerar o PDF");
    } finally {
      // Desmonta sempre, inclusive no erro — host oculto esquecido no DOM
      // atrapalharia a próxima captura.
      setMounted(false);
      setBusy(false);
    }
  }, [busy, character.name, waitForRoot]);

  return (
    <>
      <button
        type="button"
        className={className ?? "btn-ghost"}
        disabled={busy}
        onClick={() => void run()}
        title="Baixar a ficha em PDF"
      >
        {busy ? "Gerando…" : "Exportar PDF"}
      </button>
      {err ? <p className="dice-err">{err}</p> : null}

      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div className="sheet-pdf-capture-host" ref={hostRef} aria-hidden>
              <TorSheetPdfDocument character={character} />
            </div>,
            document.body
          )
        : null}
    </>
  );
}
