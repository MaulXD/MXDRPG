/** Valida data URL de imagem para persistência na sala (demo) */
const MAX_BYTES = 600_000;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImageDataUrl(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return null;
  if (!value.startsWith("data:image/")) return null;

  const mime = value.slice(5, value.indexOf(";"));
  if (!ALLOWED.includes(mime)) return null;
  if (value.length > MAX_BYTES * 1.4) return null;

  return value;
}

export const IMAGE_UPLOAD_HINT =
  "JPEG, PNG, GIF ou WebP · convertido automaticamente para WebP · máx ~450 KB";

export async function fileToDataUrl(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Arquivo grande demais (máx ~450 KB).");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Falha ao ler imagem"));
        return;
      }
      if (result.length > MAX_BYTES * 1.4) {
        reject(new Error("Imagem codificada excede limite."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(file);
  });
}
