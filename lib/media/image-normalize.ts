import "server-only";

import sharp from "sharp";

const MAX_DATA_URL_CHARS = 600_000 * 1.4;
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
  "image/tiff",
  "image/heif",
  "image/heic",
];

function parseDataUrl(value: string): { mime: string; buffer: Buffer } | null {
  if (!value.startsWith("data:image/")) return null;
  const semi = value.indexOf(";");
  const comma = value.indexOf(",");
  if (semi < 0 || comma < 0) return null;
  const mime = value.slice(5, semi);
  if (!ALLOWED.includes(mime) && !mime.startsWith("image/")) return null;
  const b64 = value.slice(comma + 1);
  try {
    return { mime, buffer: Buffer.from(b64, "base64") };
  } catch {
    return null;
  }
}

function toDataUrl(buffer: Buffer): string {
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

async function transcodeToWebp(buffer: Buffer, maxEdge: number): Promise<Buffer> {
  let quality = 82;
  let last = await sharp(buffer)
    .rotate()
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  for (let i = 0; i < 5 && toDataUrl(last).length > MAX_DATA_URL_CHARS; i++) {
    quality = Math.max(40, quality - 10);
    last = await sharp(buffer)
      .rotate()
      .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }

  if (toDataUrl(last).length > MAX_DATA_URL_CHARS) {
    const smaller = Math.max(256, Math.floor(maxEdge * 0.75));
    last = await sharp(buffer)
      .rotate()
      .resize(smaller, smaller, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();
  }

  return last;
}

/**
 * Converte data URLs para WebP e descarta o formato anterior (substitui o campo).
 * URLs externas (https://) passam sem alteração.
 */
export async function normalizeImageDataUrl(
  value: unknown,
  opts: { maxEdge?: number } = {}
): Promise<string | null> {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return null;
  if (!value.startsWith("data:image/")) return null;

  const parsed = parseDataUrl(value);
  if (!parsed) return null;

  const maxEdge = opts.maxEdge ?? 1024;

  if (parsed.mime === "image/webp" && value.length <= MAX_DATA_URL_CHARS) {
    return value;
  }

  const webp = await transcodeToWebp(parsed.buffer, maxEdge);
  const out = toDataUrl(webp);
  if (out.length > MAX_DATA_URL_CHARS) return null;
  return out;
}
