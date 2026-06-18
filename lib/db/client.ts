import postgres from "postgres";
import { dbEnabled } from "./enabled";
import { isNeonDirectHost, isServerlessRuntime, normalizeDatabaseUrl } from "./normalize-url";

export { dbEnabled };

let sql: ReturnType<typeof postgres> | null = null;
let warnedDirectNeon = false;

export function getSql(): ReturnType<typeof postgres> | null {
  if (!dbEnabled()) return null;
  if (!sql) {
    const url = normalizeDatabaseUrl(process.env.DATABASE_URL!);
    const local =
      url.includes("localhost") || url.includes("127.0.0.1");
    const serverless = isServerlessRuntime();

    if (serverless && isNeonDirectHost(url) && !warnedDirectNeon) {
      warnedDirectNeon = true;
      console.warn(
        "[eldarin-db] Neon: use a pooled connection string (-pooler host) to avoid connection limits."
      );
    }

    sql = postgres(url, {
      max: serverless ? 1 : 10,
      idle_timeout: serverless ? 5 : 20,
      connect_timeout: 15,
      ssl: local ? false : "require",
      prepare: serverless ? false : true,
    });
  }
  return sql;
}

export async function dbPing(): Promise<{ ok: boolean; error?: string }> {
  const client = getSql();
  if (!client) return { ok: false, error: "DATABASE_URL not set" };
  try {
    await client`SELECT 1`;
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
