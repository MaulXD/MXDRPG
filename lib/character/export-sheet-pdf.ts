/** Gera PDF a partir de um nó HTML (layout `.sheet-pdf-capture`). */

import {
  buildSheetPdfLinkUrl,
  parsePdfLinkAction,
  type PdfLinkAction,
} from "@/lib/character/sheet-pdf-links";
import type { SheetSkillId } from "@/lib/character/sheet-skills";

export function sheetPdfFilename(name: string): string {
  const base =
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "personagem";
  return `Eldarin-Ficha-${base}.pdf`;
}

export type SheetPdfExportOptions = {
  baseUrl: string;
  characterId: string;
  roomId?: string;
};

type PdfLinkRect = {
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function resolveCaptureBackground(root: HTMLElement): string {
  const shell = root.querySelector(".sheet-shell--popup") as HTMLElement | null;
  const frame = root.querySelector(".mf") as HTMLElement | null;
  const target = shell ?? frame ?? root;
  const bg = getComputedStyle(target).backgroundColor;
  if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
  return "#121921";
}

function rectInRoot(node: HTMLElement, root: HTMLElement) {
  const n = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return {
    left: n.left - r.left,
    top: n.top - r.top,
    width: n.width,
    height: n.height,
  };
}

function collectPdfLinks(root: HTMLElement, opts: SheetPdfExportOptions): PdfLinkRect[] {
  const rootW = root.scrollWidth || root.offsetWidth;
  const rootH = root.scrollHeight || root.offsetHeight;
  if (rootW <= 0 || rootH <= 0) return [];

  const links: PdfLinkRect[] = [];
  const nodes = root.querySelectorAll<HTMLElement>("[data-pdf-link]");

  for (const node of nodes) {
    const raw = node.dataset.pdfLink?.trim();
    if (!raw) continue;

    const parsed = parsePdfLinkAction(raw);
    if (!parsed) continue;

    const action: PdfLinkAction = parsed.action;
    const skill = parsed.skill as SheetSkillId | undefined;
    const url = buildSheetPdfLinkUrl({
      baseUrl: opts.baseUrl,
      roomId: opts.roomId,
      characterId: opts.characterId,
      action,
      skill,
    });

    const rect = rectInRoot(node, root);
    if (rect.width < 4 || rect.height < 4) continue;

    const padX = rect.width * 0.04;
    const padY = rect.height * 0.06;

    links.push({
      url,
      x: ((rect.left - padX) / rootW) * 100,
      y: ((rect.top - padY) / rootH) * 100,
      w: ((rect.width + padX * 2) / rootW) * 100,
      h: ((rect.height + padY * 2) / rootH) * 100,
    });
  }

  return links;
}

function addLinksToPdf(
  pdf: import("jspdf").jsPDF,
  links: PdfLinkRect[],
  imgWidth: number,
  imgHeight: number,
  pageHeight: number
): void {
  const totalPages = pdf.getNumberOfPages();

  for (const link of links) {
    const absX = (link.x / 100) * imgWidth;
    const absY = (link.y / 100) * imgHeight;
    const absW = Math.max(2, (link.w / 100) * imgWidth);
    const absH = Math.max(2, (link.h / 100) * imgHeight);

    const pageIndex = Math.max(0, Math.floor(absY / pageHeight));
    const yOnPage = absY - pageIndex * pageHeight;

    if (pageIndex >= totalPages) continue;

    pdf.setPage(pageIndex + 1);

    try {
      pdf.link(absX, yOnPage, absW, absH, { url: link.url });
    } catch {
      /* fallback abaixo */
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(0.01);
    try {
      pdf.textWithLink(" ", absX + absW / 2, yOnPage + absH / 2, { url: link.url });
    } catch {
      /* ignora */
    }
  }

  pdf.setPage(1);
}

export async function waitForSheetPdfCapture(root: HTMLElement): Promise<void> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((r) => setTimeout(r, 180));
}

function unhideCaptureTree(node: HTMLElement): void {
  let el: HTMLElement | null = node;
  while (el) {
    el.style.visibility = "visible";
    el.style.opacity = "1";
    el.style.display = el.style.display === "none" ? "block" : el.style.display;
    el = el.parentElement;
  }
}

export async function prepareSheetPdfCaptureHost(host: HTMLElement | null): Promise<() => void> {
  if (!host) return () => undefined;

  const prev = {
    position: host.style.position,
    left: host.style.left,
    top: host.style.top,
    width: host.style.width,
    visibility: host.style.visibility,
    opacity: host.style.opacity,
    zIndex: host.style.zIndex,
    pointerEvents: host.style.pointerEvents,
  };

  // Fora da tela, mas visível — html2canvas ignora nós com visibility:hidden (PDF em branco).
  host.style.position = "fixed";
  host.style.left = "-12000px";
  host.style.top = "0";
  host.style.width = "920px";
  host.style.visibility = "visible";
  host.style.opacity = "1";
  host.style.zIndex = "-1";
  host.style.pointerEvents = "none";

  return () => {
    host.style.position = prev.position;
    host.style.left = prev.left;
    host.style.top = prev.top;
    host.style.width = prev.width;
    host.style.visibility = prev.visibility;
    host.style.opacity = prev.opacity;
    host.style.zIndex = prev.zIndex;
    host.style.pointerEvents = prev.pointerEvents;
  };
}

export async function exportSheetPdf(
  root: HTMLElement,
  filename: string,
  opts?: SheetPdfExportOptions
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const host = root.closest(".sheet-pdf-capture-host") as HTMLElement | null;
  const restoreHost = await prepareSheetPdfCaptureHost(host);

  try {
    await waitForSheetPdfCapture(root);

    const backgroundColor = resolveCaptureBackground(root);
    const links = opts ? collectPdfLinks(root, opts) : [];

    const captureW = Math.max(root.scrollWidth, root.offsetWidth, 920);
    const captureH = Math.max(root.scrollHeight, root.offsetHeight, 400);

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor,
      width: captureW,
      height: captureH,
      windowWidth: captureW,
      windowHeight: captureH,
      onclone: (_doc, clonedRoot) => {
        unhideCaptureTree(clonedRoot);
        const clonedHost = clonedRoot.closest(".sheet-pdf-capture-host") as HTMLElement | null;
        if (clonedHost) {
          clonedHost.style.position = "fixed";
          clonedHost.style.left = "0";
          clonedHost.style.top = "0";
          clonedHost.style.width = "920px";
          clonedHost.style.zIndex = "1";
          unhideCaptureTree(clonedHost);
        }
        clonedRoot.style.width = "920px";
        clonedRoot.style.maxWidth = "920px";
      },
    });

    if (canvas.width < 8 || canvas.height < 8) {
      throw new Error("Captura da ficha vazia — recarregue a página e tente exportar de novo.");
    }

    const imgData = canvas.toDataURL("image/png");
    if (!imgData || imgData.length < 2000) {
      throw new Error("Não foi possível rasterizar a ficha. Tente novamente após a página carregar.");
    }
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    if (links.length) {
      addLinksToPdf(pdf, links, imgWidth, imgHeight, pageHeight);
    }

    pdf.save(filename);
  } finally {
    restoreHost();
  }
}
