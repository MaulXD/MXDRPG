/** Fundos animados do site (rotação diária). */

export const BACKGROUND_IDS = [
  "NevoaRoxa",
  "GridTatico",
  "Oceano",
  "Brasas",
  "Runas",
  "Pergaminho",
  "VoidArcano",
] as const;

export type BackgroundId = (typeof BACKGROUND_IDS)[number];

/** Epoch para rotação — altere se quiser reiniciar o ciclo. */
const ROTATION_EPOCH_MS = new Date("2026-01-01T00:00:00").getTime();

/** Índice do fundo ativo hoje (0 … BACKGROUND_IDS.length - 1). */
export function getDailyBackgroundIndex(date: Date = new Date()): number {
  const day = Math.floor((date.getTime() - ROTATION_EPOCH_MS) / 86_400_000);
  const n = BACKGROUND_IDS.length;
  return ((day % n) + n) % n;
}

export function getDailyBackgroundId(date?: Date): BackgroundId {
  return BACKGROUND_IDS[getDailyBackgroundIndex(date)];
}

/** Sobrescreve a rotação diária (útil em dev). `null` = automático. */
export const ACTIVE_BACKGROUND_OVERRIDE: BackgroundId | null = null;

export function resolveActiveBackgroundId(date?: Date): BackgroundId {
  if (ACTIVE_BACKGROUND_OVERRIDE) return ACTIVE_BACKGROUND_OVERRIDE;
  return getDailyBackgroundId(date);
}

/** Grade VTT ao vivo — única rota sem fundo animado (`/mesa/:roomId`). */
export function isMesaBattlefieldPath(pathname: string): boolean {
  return /^\/mesa\/[^/]+\/?$/.test(pathname);
}

export function shouldShowAnimatedBackground(pathname: string): boolean {
  return !isMesaBattlefieldPath(pathname);
}
