/** Espelho ESM de lib/db/normalize-url.ts para scripts Node. */
export function normalizeDatabaseUrl(raw) {
  const trimmed = String(raw).trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.toLowerCase().includes("neon.tech") && !u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}
