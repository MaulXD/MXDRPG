import "server-only";

import { dbEnabled } from "@/lib/db/enabled";
import { getMariaSql } from "@/lib/db/client-mariadb";

/** `DATABASE_URL` válida e cliente MariaDB disponível (rejeita `postgresql://`). */
export function dbSqlReady(): boolean {
  if (!dbEnabled()) return false;
  return getMariaSql() !== null;
}
