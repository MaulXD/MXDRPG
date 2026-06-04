/** Apelido de login: 3–24 chars, letras, números, _ e - */
export const NICKNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateNickname(raw: string): { ok: true; nickname: string } | { ok: false; error: string } {
  const nickname = normalizeNickname(raw);
  if (!NICKNAME_RE.test(nickname)) {
    return {
      ok: false,
      error: "Apelido: 3–24 caracteres (letras, números, _ ou -)",
    };
  }
  return { ok: true, nickname };
}
