import "server-only";

import { withDbTimeout } from "@/lib/db/timeout";

/** Leitura MariaDB — falha silenciosa com fallback (evita 500 quando DB cai). */
export async function safeDbRead<T>(
  label: string,
  fallback: T,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await withDbTimeout(fn(), 4000, label);
  } catch (err) {
    console.error(`[db:${label}]`, err);
    return fallback;
  }
}
