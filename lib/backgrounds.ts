/** Fundos animados do site (rotação a cada hora). */

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

const HOUR_MS = 3_600_000;

/** Índice do fundo ativo na hora atual (0 … BACKGROUND_IDS.length - 1). */
export function getHourlyBackgroundIndex(date: Date = new Date()): number {
  const hour = Math.floor((date.getTime() - ROTATION_EPOCH_MS) / HOUR_MS);
  const n = BACKGROUND_IDS.length;
  return ((hour % n) + n) % n;
}

export function getHourlyBackgroundId(date?: Date): BackgroundId {
  return BACKGROUND_IDS[getHourlyBackgroundIndex(date)];
}

/** @deprecated Use getHourlyBackgroundIndex */
export function getDailyBackgroundIndex(date?: Date): number {
  return getHourlyBackgroundIndex(date);
}

/** @deprecated Use getHourlyBackgroundId */
export function getDailyBackgroundId(date?: Date): BackgroundId {
  return getHourlyBackgroundId(date);
}

/** Milissegundos até a próxima troca de fundo (início da próxima hora). */
export function msUntilNextBackgroundChange(date: Date = new Date()): number {
  const nextHour = (Math.floor(date.getTime() / HOUR_MS) + 1) * HOUR_MS;
  return Math.max(0, nextHour - date.getTime());
}

/** Sobrescreve a rotação automática (útil em dev). `null` = automático. */
export const ACTIVE_BACKGROUND_OVERRIDE: BackgroundId | null = null;

export function resolveActiveBackgroundId(date?: Date): BackgroundId {
  if (ACTIVE_BACKGROUND_OVERRIDE) return ACTIVE_BACKGROUND_OVERRIDE;
  return getHourlyBackgroundId(date);
}

/** Grade VTT ao vivo — única rota sem fundo animado (`/mesa/:roomId`). */
export function isMesaBattlefieldPath(pathname: string): boolean {
  return /^\/mesa\/[^/]+\/?$/.test(pathname);
}

export function shouldShowAnimatedBackground(pathname: string): boolean {
  return !isMesaBattlefieldPath(pathname);
}
