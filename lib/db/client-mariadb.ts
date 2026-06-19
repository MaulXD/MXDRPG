import mysql from "mysql2/promise";
import type { Pool, QueryResult } from "mysql2/promise";
import type { EldarinSql } from "@/lib/db/sql-types";
import {
  isExecutableSql,
  isSqlFragment,
  markJson,
  markSqlFragment,
  serializeSqlValue,
} from "@/lib/db/sql-types";
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
    const value = values[i];
    if (isSqlFragment(value)) {
      text += value.sql;
      continue;
    }
    text += "?";
    params.push(serializeSqlValue(value));
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

  tag.unsafe = (query: string, params: unknown[] = []) => {
    const trimmed = query.trim();
    if (!isExecutableSql(trimmed)) {
      return markSqlFragment(query);
    }
    return (async () => {
      const statements = query
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      let last: unknown = undefined;
      for (const stmt of statements) {
        const [rows] = await p.execute(
          stmt,
          params as (string | number | boolean | null | Buffer)[]
        );
        last = rows;
      }
      return last;
    })();
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
  let url = raw.replace(/^mariadb:/i, "mysql:");
  try {
    const u = new URL(url);
    // mysql2 não aceita estes params na URI — SSL via pool `ssl` option
    u.searchParams.delete("sslaccept");
    u.searchParams.delete("ssl_mode");
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

function poolSslOption(url: string): { rejectUnauthorized: boolean } | undefined {
  const local = url.includes("localhost") || url.includes("127.0.0.1");
  if (local) return undefined;

  if (process.env.MARIADB_SSL_REJECT_UNAUTHORIZED === "1") {
    return { rejectUnauthorized: true };
  }

  try {
    const u = new URL(url);
    const accept = u.searchParams.get("sslaccept")?.toLowerCase();
    if (accept === "accept_invalid_certs" || accept === "skip_verify") {
      return { rejectUnauthorized: false };
    }
  } catch {
    /* keep default */
  }

  // Contabo e outros MariaDB gerenciados usam cert self-signed — aceita por padrão.
  return { rejectUnauthorized: false };
}

export function getMariaSql(): EldarinSql | null {
  const raw = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
  if (/^postgres(ql)?:\/\//i.test(raw)) return null; // protocolo errado — não é MariaDB
  const url = mariadbPoolUrl(raw);
  if (!url) return null;

  if (!pool) {
    pool = mysql.createPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 3000,
      enableKeepAlive: true,
      ssl: poolSslOption(url),
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
