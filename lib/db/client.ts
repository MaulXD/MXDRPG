import { dbEnabled } from "./enabled";
import { getMariaSql, mariaDbPing } from "./client-mariadb";
import type { EldarinSql } from "./sql-types";

export { dbEnabled };
export type { EldarinSql };

export function getSql(): EldarinSql | null {
  if (!dbEnabled()) return null;
  return getMariaSql();
}

export async function dbPing(): Promise<{ ok: boolean; error?: string }> {
  if (!dbEnabled()) return { ok: false, error: "DATABASE_URL not set" };
  return mariaDbPing();
}
