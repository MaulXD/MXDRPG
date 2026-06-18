import { dbEnabled } from "@/lib/db/enabled";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { hashPassword } from "@/lib/auth/password";
import {
  hashCpfPrefix,
  userHasRecoveryIdentity,
  validateRecoveryIdentity,
  verifyUserRecoveryIdentity,
  type RecoveryIdentityInput,
} from "@/lib/auth/recovery-identity";
import { fetchUserByEmail, type StoredUser } from "@/lib/db/users";
import { getLocalUserByEmail, getLocalUserById, updateLocalUserRecord } from "@/lib/auth/user-store";

export type RecoverPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export type RecoveryCheckResult = {
  /** E-mail existe e tem dados de recuperação cadastrados. */
  canRecover: boolean;
  /** Mensagem genérica quando não pode recuperar online. */
  hint: string;
};

const GENERIC_FAIL =
  "Não foi possível redefinir a senha. Confira e-mail, CPF (5 dígitos) e data de nascimento.";

export async function checkPasswordRecovery(email: string): Promise<RecoveryCheckResult> {
  const key = email.trim().toLowerCase();
  if (!key.includes("@")) {
    return {
      canRecover: false,
      hint: "Informe um e-mail válido cadastrado na conta.",
    };
  }

  if (dbEnabled()) {
    await ensureDbMigrations();
    const user = await fetchUserByEmail(key);
    if (!user?.passwordHash) {
      return {
        canRecover: false,
        hint: "Conta social (Google/Discord) — entre pelo botão correspondente ou defina senha em Criar conta.",
      };
    }
    if (!user.cpfPrefixHash || !user.birthDate) {
      return {
        canRecover: false,
        hint: "Esta conta não tem recuperação cadastrada. Em /conta, adicione CPF (5 dígitos) e data de nascimento.",
      };
    }
    return {
      canRecover: true,
      hint: "Informe os 5 primeiros dígitos do CPF e sua data de nascimento (cadastrados em /conta).",
    };
  }

  const local = getLocalUserByEmail(key);
  if (!local?.passwordHash) {
    return { canRecover: false, hint: GENERIC_FAIL };
  }
  if (!local.cpfPrefixHash || !local.birthDate) {
    return {
      canRecover: false,
      hint: "Cadastre recuperação em /conta (requer banco MariaDB em produção).",
    };
  }
  return {
    canRecover: true,
    hint: "Informe os 5 primeiros dígitos do CPF e sua data de nascimento.",
  };
}

export async function recoverPassword(
  email: string,
  identity: RecoveryIdentityInput,
  newPassword: string
): Promise<RecoverPasswordResult> {
  const key = email.trim().toLowerCase();
  if (!key.includes("@")) return { ok: false, error: "E-mail inválido" };
  if (newPassword.length < 6) {
    return { ok: false, error: "Nova senha deve ter pelo menos 6 caracteres" };
  }

  const parsed = validateRecoveryIdentity(identity);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  if (dbEnabled()) {
    await ensureDbMigrations();
    const user = await fetchUserByEmail(key);
    if (!user?.passwordHash) return { ok: false, error: GENERIC_FAIL };
    if (
      !verifyUserRecoveryIdentity(user, parsed.cpfPrefix, parsed.birthDate)
    ) {
      return { ok: false, error: GENERIC_FAIL };
    }

    const { getSql } = await import("@/lib/db/client");
    const sql = getSql();
    if (!sql) return { ok: false, error: "Banco indisponível" };

    await sql`
      UPDATE eldarin_users
      SET password_hash = ${hashPassword(newPassword)}
      WHERE id = ${user.id}
    `;
    return { ok: true };
  }

  const local = getLocalUserByEmail(key);
  if (!local?.passwordHash) return { ok: false, error: GENERIC_FAIL };
  if (!verifyUserRecoveryIdentity(local, parsed.cpfPrefix, parsed.birthDate)) {
    return { ok: false, error: GENERIC_FAIL };
  }

  const updated: StoredUser = {
    ...local,
    passwordHash: hashPassword(newPassword),
  };
  updateLocalUserRecord(updated);
  return { ok: true };
}

export async function userHasRecoveryConfigured(userId: string): Promise<boolean> {
  if (dbEnabled()) {
    await ensureDbMigrations();
    const { getSql } = await import("@/lib/db/client");
    const sql = getSql();
    if (!sql) return false;
    const rows = await sql<{ cpf_prefix_hash: string | null; birth_date: string | Date | null }[]>`
      SELECT cpf_prefix_hash, birth_date FROM eldarin_users WHERE id = ${userId} LIMIT 1
    `;
    const r = rows[0];
    if (!r) return false;
    const birth =
      r.birth_date instanceof Date
        ? r.birth_date.toISOString().slice(0, 10)
        : r.birth_date
          ? String(r.birth_date).slice(0, 10)
          : null;
    return userHasRecoveryIdentity({ cpfPrefixHash: r.cpf_prefix_hash, birthDate: birth });
  }
  const local = getLocalUserById(userId);
  return local ? userHasRecoveryIdentity(local) : false;
}

export async function saveRecoveryIdentityForUser(
  userId: string,
  identity: RecoveryIdentityInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = validateRecoveryIdentity(identity);
  if (!parsed.ok) return parsed;

  const cpfHash = hashCpfPrefix(parsed.cpfPrefix);

  if (dbEnabled()) {
    await ensureDbMigrations();
    const { getSql } = await import("@/lib/db/client");
    const sql = getSql();
    if (!sql) return { ok: false, error: "Banco indisponível" };

    await sql`
      UPDATE eldarin_users
      SET cpf_prefix_hash = ${cpfHash}, birth_date = ${parsed.birthDate}
      WHERE id = ${userId}
    `;
    return { ok: true };
  }

  const local = getLocalUserById(userId);
  if (!local) return { ok: false, error: "Conta não encontrada" };
  updateLocalUserRecord({
    ...local,
    cpfPrefixHash: cpfHash,
    birthDate: parsed.birthDate,
  });
  return { ok: true };
}
