/** Tom do fundo do mapa para paleta de highlights do grid. */
export type MapBackdropTone = "none" | "dark" | "light" | "green";

/** Luminância média (0–1) de uma amostra central da imagem. */
export function sampleImageLuminance(img: HTMLImageElement, sampleSize = 48): number {
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.35;

  try {
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]!;
      if (a < 32) continue;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      sum += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      n++;
    }
    return n ? sum / n : 0.35;
  } catch {
    return 0.35;
  }
}

/** Quão dominante é o verde no mapa (0–1). */
export function sampleImageGreenDominance(img: HTMLImageElement, sampleSize = 48): number {
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;

  try {
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]!;
      if (a < 32) continue;
      const r = data[i]! / 255;
      const g = data[i + 1]! / 255;
      const b = data[i + 2]! / 255;
      const dominance = Math.max(0, g - (r + b) / 2);
      sum += dominance;
      n++;
    }
    return n ? sum / n : 0;
  } catch {
    return 0;
  }
}

export function mapBackdropTone(
  hasMap: boolean,
  luminance: number,
  greenDominance = 0
): MapBackdropTone {
  if (!hasMap) return "none";
  if (greenDominance >= 0.1) return "green";
  return luminance > 0.52 ? "light" : "dark";
}
