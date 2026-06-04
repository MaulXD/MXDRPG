/**
 * Ajusta connection strings Neon/Vercel: SSL e aviso de endpoint direto em serverless.
 */
export function normalizeDatabaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const isNeon = host.includes("neon.tech");
    const isLocal = host === "localhost" || host === "127.0.0.1";

    if (isNeon && !u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }

    return u.toString();
  } catch {
    return trimmed;
  }
}

export function isNeonDirectHost(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return host.includes("neon.tech") && !host.includes("-pooler");
  } catch {
    return false;
  }
}

export function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}
