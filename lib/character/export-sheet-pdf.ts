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

function collectPdfLinks(
  root: HTMLElement,
  opts: SheetPdfExportOptions
): PdfLinkRect[] {
  const rootRect = root.getBoundingClientRect();
  const rootW = root.scrollWidth || rootRect.width;
  const rootH = root.scrollHeight || rootRect.height;
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

    const rect = node.getBoundingClientRect();
    links.push({
      url,
      x: ((rect.left - rootRect.left) / rootW) * 100,
      y: ((rect.top - rootRect.top) / rootH) * 100,
      w: (rect.width / rootW) * 100,
      h: (rect.height / rootH) * 100,
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
  for (const link of links) {
    const absX = (link.x / 100) * imgWidth;
    const absY = (link.y / 100) * imgHeight;
    const absW = (link.w / 100) * imgWidth;
    const absH = (link.h / 100) * imgHeight;

    const pageIndex = Math.floor(absY / pageHeight);
    const yOnPage = absY - pageIndex * pageHeight;

    if (pageIndex > 0) pdf.setPage(pageIndex + 1);
    pdf.link(absX, yOnPage, absW, absH, { url: link.url });
  }
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
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );

  await new Promise((r) => setTimeout(r, 120));
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

  await waitForSheetPdfCapture(root);

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: "#121921",
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const links = opts ? collectPdfLinks(root, opts) : [];

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  if (links.length) {
    pdf.setPage(1);
    addLinksToPdf(pdf, links, imgWidth, imgHeight, pageHeight);
  }

  pdf.save(filename);
}
