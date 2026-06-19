import mysql from "mysql2/promise";
import type { Pool, QueryResult } from "mysql2/promise";
import type { EldarinSql } from "@/lib/db/sql-types";
import { isJsonMarker, markJson, serializeSqlValue } from "@/lib/db/sql-types";
import { normalizeDatabaseUrl } from "@/lib/db/normalize-url";

let pool: Pool | null = null;

function parseJsonColumns<T>(rows: T[]): T[] {
  const jsonKeys = new Set([
    "data",
    "member_ids",
    "scene",
    "actors",
    "combat",
    "chat",
    "settings",
    "avatar_focus",
  ]);
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    const next = { ...(row as Record<string, unknown>) };
    for (const key of Object.keys(next)) {
      if (!jsonKeys.has(key)) continue;
      const v = next[key];
      if (typeof v === "string") {
        try {
          next[key] = JSON.parse(v);
        } catch {
          /* keep string */
        }
      }
    }
    return next as T;
  });
}

function buildQuery(strings: TemplateStringsArray, values: unknown[]) {
  let text = "";
  const params: unknown[] = [];
  for (let i = 0; i < values.length; i++) {
    text += strings[i];
    text += "?";
    params.push(serializeSqlValue(values[i]));
  }
  text += strings[strings.length - 1];
  return { text, params };
}

function createMariaSql(p: Pool): EldarinSql {
  const tag = (async <T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> => {
    const { text, params } = buildQuery(strings, values);
    const [rows] = await p.execute(text, params as (string | number | boolean | null | Buffer)[]);
    if (Array.isArray(rows)) {
      return parseJsonColumns(rows as T[]) as T;
    }
    return [] as T;
  }) as EldarinSql;

  tag.json = (value: unknown) => markJson(value);

  tag.unsafe = async (query: string, params: unknown[] = []) => {
    const statements = query
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    let last: unknown = undefined;
    for (const stmt of statements) {
      const [rows] = await p.execute(stmt, params as (string | number | boolean | null | Buffer)[]);
      last = rows;
    }
    return last;
  };

  tag.end = async () => {
    if (pool) {
      await pool.end();
      pool = null;
    }
  };

  return tag;
}

function mariadbPoolUrl(raw: string): string {
  return raw.replace(/^mariadb:/i, "mysql:");
}

export function getMariaSql(): EldarinSql | null {
  const raw = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
  if (/^postgres(ql)?:\/\//i.test(raw)) return null; // protocolo errado — não é MariaDB
  const url = mariadbPoolUrl(raw);
  if (!url) return null;

  if (!pool) {
    const local = url.includes("localhost") || url.includes("127.0.0.1");
    pool = mysql.createPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 3000,
      enableKeepAlive: true,
      ssl: local ? undefined : { rejectUnauthorized: true },
    });
  }

  return createMariaSql(pool);
}

export async function mariaDbPing(): Promise<{ ok: boolean; error?: string }> {
  const sql = getMariaSql();
  if (!sql) return { ok: false, error: "DATABASE_URL not set" };
  try {
    await sql`SELECT 1 AS ok`;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
