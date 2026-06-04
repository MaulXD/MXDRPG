import "server-only";

import * as dbAdventures from "@/lib/db/adventures";
import { dbEnabled } from "@/lib/db/enabled";

export const INVITE_CODE_MIN = 4;
export const INVITE_CODE_MAX = 16;

const INVITE_PATTERN = /^[A-Z0-9]+$/;

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateInviteCode(code: string): { ok: true } | { ok: false; error: string } {
  const normalized = normalizeInviteCode(code);
  if (!normalized) {
    return { ok: false, error: "Informe um código de convite" };
  }
  if (normalized.length < INVITE_CODE_MIN || normalized.length > INVITE_CODE_MAX) {
    return {
      ok: false,
      error: `O código deve ter entre ${INVITE_CODE_MIN} e ${INVITE_CODE_MAX} caracteres (letras e números)`,
    };
  }
  if (!INVITE_PATTERN.test(normalized)) {
    return { ok: false, error: "Use apenas letras A–Z e números 2–9 (sem espaços)" };
  }
  return { ok: true };
}

export function randomInviteCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Verifica se o código já está em uso (aventuras em memória, DB ou salas legadas). */
export async function isInviteCodeTaken(code: string): Promise<boolean> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return true;

  if (dbEnabled()) {
    const taken = await dbAdventures.isInviteCodeTaken(normalized);
    if (taken) return true;
    const { isRoomInviteTaken } = await import("@/lib/db/rooms");
    if (await isRoomInviteTaken(normalized)) return true;
  }

  const advMap = globalThis.__eldarinAdventures;
  if (advMap) {
    for (const adv of advMap.values()) {
      if (adv.inviteCode.toUpperCase() === normalized) return true;
    }
  }

  const roomMap = globalThis.__eldarinRooms;
  if (roomMap) {
    for (const room of roomMap.values()) {
      if (room.inviteCode.toUpperCase() === normalized) return true;
    }
  }

  return false;
}

export async function resolveInviteCodeForCreate(
  requested?: string | null
): Promise<{ code: string } | { error: string }> {
  const trimmed = requested?.trim();
  if (!trimmed) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = randomInviteCode();
      if (!(await isInviteCodeTaken(code))) return { code };
    }
    return { error: "Não foi possível gerar um código único; tente novamente" };
  }

  const validation = validateInviteCode(trimmed);
  if (!validation.ok) return { error: validation.error };

  const code = normalizeInviteCode(trimmed);
  if (await isInviteCodeTaken(code)) {
    return { error: "Este código já está em uso; escolha outro" };
  }
  return { code };
}
