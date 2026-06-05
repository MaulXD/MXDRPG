"use client";

import { validateImageDataUrl } from "@/lib/media/image-data-url";
import {
  DEFAULT_PORTRAIT_FOCUS,
  normalizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";

const MAX_INPUT_BYTES = 8_000_000;
const MAX_DATA_URL_CHARS = 600_000 * 1.4;
const INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const PORTRAIT_MAX_EDGE = 1024;
const TOKEN_MAX_EDGE = 512;

export type PortraitFocusSet = {
  portraitFocus: PortraitFocus;
  coverFocus?: PortraitFocus;
  tokenFocus?: PortraitFocus;
};

export type PortraitBundle = {
  portraitUrl: string;
  tokenImageUrl: string;
  portraitFocus: PortraitFocus;
  coverFocus: PortraitFocus;
  tokenFocus: PortraitFocus;
};

function normalizeFocusSet(input: PortraitFocus | PortraitFocusSet): Required<PortraitFocusSet> {
  if ("portraitFocus" in input) {
    const portraitFocus = normalizePortraitFocus(input.portraitFocus);
    return {
      portraitFocus,
      coverFocus: normalizePortraitFocus(input.coverFocus ?? input.portraitFocus),
      tokenFocus: normalizePortraitFocus(input.tokenFocus ?? input.portraitFocus),
    };
  }
  const f = normalizePortraitFocus(input);
  return { portraitFocus: f, coverFocus: f, tokenFocus: f };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao decodificar imagem"));
    };
    img.src = url;
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = dataUrl;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): string | null {
  try {
    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (!dataUrl.startsWith("data:image/webp")) return null;
    return dataUrl;
  } catch {
    return null;
  }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  focus: PortraitFocus
): void {
  const f = normalizePortraitFocus(focus);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = f.scale ?? 1;
  const scale = Math.max(width / iw, height / ih) * zoom;
  const sw = width / scale;
  const sh = height / scale;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * f.x));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * f.y));
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
}

function encodeWebpCover(
  img: HTMLImageElement,
  maxEdge: number,
  focus: PortraitFocus
): string {
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");

  drawCover(ctx, img, width, height, focus);

  let edge = maxEdge;
  while (edge >= 256) {
    for (let quality = 0.88; quality >= 0.45; quality -= 0.08) {
      const dataUrl = canvasToWebp(canvas, quality);
      if (dataUrl && dataUrl.length <= MAX_DATA_URL_CHARS) {
        const valid = validateImageDataUrl(dataUrl);
        if (valid) return valid;
      }
    }
    edge = Math.floor(edge * 0.75);
    const nextScale = (edge / maxEdge) * scale;
    canvas.width = Math.max(1, Math.round(img.naturalWidth * nextScale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * nextScale));
    drawCover(ctx, img, canvas.width, canvas.height, focus);
  }

  throw new Error("Imagem grande demais mesmo após compressão WebP.");
}

/** Retrato + token WebP a partir do arquivo e focos por slot */
export async function buildPortraitBundle(
  file: File,
  focuses: PortraitFocus | PortraitFocusSet = DEFAULT_PORTRAIT_FOCUS
): Promise<PortraitBundle> {
  if (!INPUT_TYPES.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Arquivo grande demais (máx ~8 MB antes da compressão).");
  }

  const img = await loadImageFromFile(file);
  return buildPortraitBundleFromImage(img, focuses);
}

/** Regenera retrato/token a partir de data URL existente */
export async function buildPortraitBundleFromDataUrl(
  portraitDataUrl: string,
  focuses: PortraitFocus | PortraitFocusSet
): Promise<PortraitBundle> {
  const img = await loadImageFromDataUrl(portraitDataUrl);
  return buildPortraitBundleFromImage(img, focuses);
}

export async function buildPortraitBundleFromImage(
  img: HTMLImageElement,
  focuses: PortraitFocus | PortraitFocusSet
): Promise<PortraitBundle> {
  const set = normalizeFocusSet(focuses);
  const portraitUrl = encodeWebpCover(img, PORTRAIT_MAX_EDGE, set.portraitFocus);
  const tokenImageUrl = encodeWebpCover(img, TOKEN_MAX_EDGE, set.tokenFocus);
  return {
    portraitUrl,
    tokenImageUrl,
    portraitFocus: set.portraitFocus,
    coverFocus: set.coverFocus,
    tokenFocus: set.tokenFocus,
  };
}
