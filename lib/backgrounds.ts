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

/** Fundo padrão do site — demais animações permanecem no catálogo. */
export const DEFAULT_BACKGROUND_ID: BackgroundId = "Brasas";

/** Epoch para rotação horária opcional (dev / override). */
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

/** Sobrescreve o fundo padrão. `null` = **Brasas**; defina outro id ou use rotação horária em dev. */
export const ACTIVE_BACKGROUND_OVERRIDE: BackgroundId | null = null;

/** Se true, usa rotação horária em vez do padrão Brasas. */
export const USE_HOURLY_BACKGROUND_ROTATION = false;

export function resolveActiveBackgroundId(date?: Date): BackgroundId {
  if (ACTIVE_BACKGROUND_OVERRIDE) return ACTIVE_BACKGROUND_OVERRIDE;
  if (USE_HOURLY_BACKGROUND_ROTATION) return getHourlyBackgroundId(date);
  return DEFAULT_BACKGROUND_ID;
}

/** Grade VTT ao vivo — única rota sem fundo animado (`/mesa/:roomId`). */
export function isMesaBattlefieldPath(pathname: string): boolean {
  return /^\/mesa\/[^/]+\/?$/.test(pathname);
}

export function shouldShowAnimatedBackground(pathname: string): boolean {
  return !isMesaBattlefieldPath(pathname);
}
