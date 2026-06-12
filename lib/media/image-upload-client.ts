"use client";

import { validateImageDataUrl } from "@/lib/media/image-data-url";
import {
  DEFAULT_PORTRAIT_FOCUS,
  normalizePortraitFocus,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";

export const MAX_INPUT_BYTES = 8_000_000;
const MAX_DATA_URL_CHARS = 600_000 * 1.4;
const INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const PORTRAIT_MAX_EDGE = 1024;
const TOKEN_MAX_EDGE = 512;
const MAP_MAX_EDGE = 1920;
const BUG_SCREENSHOT_MAX_EDGE = 1280;

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

/** Token quadrado — scale 1 = preenche o quadro; >1 = zoom com pan. */
function drawFramedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  focus: PortraitFocus
): void {
  const f = normalizePortraitFocus(focus);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = Math.max(1, f.scale ?? 1);
  const coverScale = Math.max(width / iw, height / ih);
  const scale = coverScale * zoom;
  const sw = width / scale;
  const sh = height / scale;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * f.x));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * f.y));
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
}

function encodeWebpFramedSquare(
  img: HTMLImageElement,
  maxEdge: number,
  focus: PortraitFocus
): string {
  const canvas = document.createElement("canvas");
  canvas.width = maxEdge;
  canvas.height = maxEdge;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");

  drawFramedImage(ctx, img, maxEdge, maxEdge, focus);

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
    canvas.width = edge;
    canvas.height = edge;
    drawFramedImage(ctx, img, edge, edge, focus);
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

function encodeWebpFit(img: HTMLImageElement, maxEdge: number): string {
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");
  ctx.drawImage(img, 0, 0, width, height);

  let edge = maxEdge;
  while (edge >= 320) {
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
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  throw new Error("Mapa grande demais mesmo após compressão WebP.");
}

/** Captura de tela para report de bug — WebP comprimido. */
export async function buildBugScreenshotFromFile(file: File): Promise<string> {
  if (!INPUT_TYPES.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Arquivo grande demais (máx ~8 MB antes da compressão).");
  }
  const img = await loadImageFromFile(file);
  return encodeWebpFit(img, BUG_SCREENSHOT_MAX_EDGE);
}

const ROOM_COVER_MAX_EDGE = 1280;

/** Capa da mesa — WebP data URL para `RoomSettings.coverUrl`. */
export async function buildRoomCoverFromFile(file: File): Promise<string> {
  if (!INPUT_TYPES.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Arquivo grande demais (máx ~8 MB antes da compressão).");
  }
  const img = await loadImageFromFile(file);
  return encodeWebpFit(img, ROOM_COVER_MAX_EDGE);
}

/** Imagem de piso do hex — WebP data URL para `mapImageUrl`. */
export async function buildMapImageFromFile(file: File): Promise<string> {
  if (!INPUT_TYPES.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Arquivo grande demais (máx ~8 MB antes da compressão).");
  }
  const img = await loadImageFromFile(file);
  return encodeWebpFit(img, MAP_MAX_EDGE);
}

/** Lê arquivo de imagem (até ~8 MB) para data URL — servidor normaliza para WebP. */
export async function readAvatarImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Formato inválido. Escolha um arquivo de imagem.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Arquivo grande demais (máx ~8 MB antes da compressão).");
  }
  return loadImageFromFile(file).then(
    (img) =>
      new Promise<string>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas indisponível neste navegador"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.92);
          if (!dataUrl.startsWith("data:image/")) {
            reject(new Error("Falha ao ler imagem"));
            return;
          }
          resolve(dataUrl);
        } catch {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string" || !result.startsWith("data:image/")) {
              reject(new Error("Falha ao ler imagem"));
              return;
            }
            resolve(result);
          };
          reader.onerror = () => reject(new Error("Falha ao ler imagem"));
          reader.readAsDataURL(file);
        }
      })
  );
}

export async function buildPortraitBundleFromImage(
  img: HTMLImageElement,
  focuses: PortraitFocus | PortraitFocusSet
): Promise<PortraitBundle> {
  const set = normalizeFocusSet(focuses);
  const portraitUrl = encodeWebpFit(img, PORTRAIT_MAX_EDGE);
  const tokenImageUrl = encodeWebpFramedSquare(img, TOKEN_MAX_EDGE, set.tokenFocus);
  return {
    portraitUrl,
    tokenImageUrl,
    portraitFocus: set.portraitFocus,
    coverFocus: set.coverFocus,
    tokenFocus: set.tokenFocus,
  };
}
