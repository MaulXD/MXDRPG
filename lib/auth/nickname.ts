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

const DEFAULT_NICKNAME_PREFIX = "jogador";

function randomNicknameCandidate(): string {
  const suffix = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `${DEFAULT_NICKNAME_PREFIX}${suffix}`;
}

/**
 * Apelido genérico numerado (ex. "jogador048213") pra toda conta nova nascer
 * com apelido preenchido — nunca deixar nickname vazio evita cair no fallback
 * pro nome real em qualquer lugar que exibe pra outros usuários (chat, amigos,
 * perfil público, membros de mesa). O dono troca por um apelido próprio quando
 * quiser, em /conta.
 */
export async function generateUniqueDefaultNickname(
  isTaken: (nickname: string) => Promise<boolean> | boolean,
  attempts = 10
): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const candidate = randomNicknameCandidate();
    if (!(await isTaken(candidate))) return candidate;
  }
  // Praticamente impossível (10 tentativas de 1 em 1M) — ainda genérico, nunca nome real.
  return `${DEFAULT_NICKNAME_PREFIX}${Date.now().toString(36)}`;
}
