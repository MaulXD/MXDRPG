import type { ResultSetHeader } from "mysql2/promise";
import type { EldarinSql } from "@/lib/db/sql-types";

export { countSelectExpr } from "@/lib/db/count-expr";

/** `member_ids` contém userId (MariaDB `JSON_CONTAINS`). */
export function memberIdsHasUser(userId: string): { sql: string; params: unknown[] } {
  return {
    sql: "JSON_CONTAINS(member_ids, JSON_QUOTE(?), '$')",
    params: [userId],
  };
}

export async function queryCharactersByOwners<T>(
  sql: EldarinSql,
  ownerIds: string[],
  mode: "data" | "id_data" = "data"
): Promise<T[]> {
  if (ownerIds.length === 0) return [];
  const unique = [...new Set(ownerIds)];
  const placeholders = unique.map(() => "?").join(", ");
  if (mode === "data") {
    return (await sql.unsafe(
      `SELECT data FROM eldarin_characters WHERE owner_id IN (${placeholders}) ORDER BY updated_at DESC`,
      unique
    )) as T[];
  }
  return (await sql.unsafe(
    `SELECT id, data FROM eldarin_characters WHERE owner_id IN (${placeholders})`,
    unique
  )) as T[];
}

export async function queryRowsByIds<T>(
  sql: EldarinSql,
  table: string,
  select: string,
  ids: string[],
  idColumn = "id"
): Promise<T[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids.filter(Boolean))];
  const placeholders = unique.map(() => "?").join(", ");
  return (await sql.unsafe(
    `SELECT ${select} FROM ${table} WHERE ${idColumn} IN (${placeholders})`,
    unique
  )) as T[];
}

export async function sqlAffected(sql: EldarinSql, query: string, params: unknown[]): Promise<number> {
  const result = await sql.unsafe(query, params);
  if (result && typeof result === "object" && "affectedRows" in result) {
    return Number((result as ResultSetHeader).affectedRows ?? 0);
  }
  if (Array.isArray(result)) return result.length;
  return 0;
}
