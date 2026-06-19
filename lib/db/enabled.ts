/** Env-only check — safe to import from client bundles. */
export function dbEnabled(): boolean {
  if (process.env.ELDARIN_DISABLE_DB === "1") return false;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  if (/password@host|user:password@|ep-xxxx/i.test(url)) return false;
  return true;
}

/** Apelido persistido — MariaDB configurado (não valida conexão; seguro no client). */
export function dbNicknameFlowEnabled(): boolean {
  if (!dbEnabled()) return false;
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return !/^postgres(ql)?:\/\//i.test(url);
}
