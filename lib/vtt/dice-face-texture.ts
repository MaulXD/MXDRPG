/** Textura de face numerada para dados 3D (Three.js). */

const cache = new Map<string, import("three").CanvasTexture>();

export function createDiceFaceTexture(
  THREE: typeof import("three"),
  value: number,
  sides: number
): import("three").CanvasTexture {
  const key = `${sides}-${value}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#5c4f3a");
  grad.addColorStop(0.5, "#2a2218");
  grad.addColorStop(1, "#4a4030");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(201, 169, 98, 0.75)";
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, size - 12, size - 12);

  ctx.fillStyle = "#f5e6c8";
  ctx.font = `bold ${sides >= 20 ? 44 : sides >= 12 ? 52 : 58}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), size / 2, size / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

function faceCountForSides(sides: number): number {
  if (sides <= 4) return 4;
  if (sides === 6) return 6;
  if (sides === 8 || sides === 10) return 8;
  if (sides === 12) return 12;
  return 20;
}

export function faceMaterialsForDie(
  THREE: typeof import("three"),
  sides: number
): import("three").MeshStandardMaterial[] {
  const faceCount = faceCountForSides(sides);
  const values =
    sides === 6
      ? [1, 6, 2, 5, 3, 4]
      : Array.from({ length: faceCount }, (_, i) => i + 1);

  return values.map((v) => {
    const map = createDiceFaceTexture(THREE, v, sides);
    return new THREE.MeshStandardMaterial({
      map,
      metalness: 0.38,
      roughness: 0.42,
      emissive: 0x1a1208,
      emissiveIntensity: 0.12,
    });
  });
}
