import { hashPassword, verifyPassword } from "@/lib/auth/password";

const CPF_PREFIX_PEPPER = "eldarin:cpf5:";

export type RecoveryIdentityInput = {
  cpfPrefix: string;
  birthDate: string;
};

export function hashCpfPrefix(digits: string): string {
  return hashPassword(`${CPF_PREFIX_PEPPER}${digits}`);
}

export function verifyCpfPrefix(digits: string, hash: string | null | undefined): boolean {
  if (!hash) return false;
  return verifyPassword(`${CPF_PREFIX_PEPPER}${digits}`, hash);
}

/** Aceita só os 5 primeiros dígitos numéricos do CPF. */
export function parseCpfPrefix(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").slice(0, 5);
  if (digits.length !== 5) return null;
  return digits;
}

/** Normaliza data para YYYY-MM-DD (entrada do input type=date). */
export function parseBirthDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const [y, m, d] = trimmed.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return null;

  const minYear = today.getFullYear() - 120;
  if (y < minYear) return null;

  return trimmed;
}

export function validateRecoveryIdentity(
  input: RecoveryIdentityInput
): { ok: true; cpfPrefix: string; birthDate: string } | { ok: false; error: string } {
  const cpfPrefix = parseCpfPrefix(input.cpfPrefix);
  if (!cpfPrefix) {
    return { ok: false, error: "Informe os 5 primeiros dígitos do CPF (somente números)." };
  }

  const birthDate = parseBirthDate(input.birthDate);
  if (!birthDate) {
    return { ok: false, error: "Informe uma data de aniversário válida." };
  }

  return { ok: true, cpfPrefix, birthDate };
}

export function userHasRecoveryIdentity(user: {
  cpfPrefixHash?: string | null;
  birthDate?: string | null;
}): boolean {
  return Boolean(user.cpfPrefixHash && user.birthDate);
}

export function verifyUserRecoveryIdentity(
  user: { cpfPrefixHash?: string | null; birthDate?: string | null },
  cpfPrefix: string,
  birthDate: string
): boolean {
  if (!userHasRecoveryIdentity(user)) return false;
  if (user.birthDate !== birthDate) return false;
  return verifyCpfPrefix(cpfPrefix, user.cpfPrefixHash);
}
