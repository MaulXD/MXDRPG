/** Cliente SQL explícito — tagged template + helpers (MariaDB). */
export type EldarinSql = {
  <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  json: (value: unknown) => unknown;
  /** Fragmento SQL (ex. lista de colunas) ou query completa executável. */
  unsafe: (query: string, params?: unknown[]) => SqlFragment | Promise<unknown>;
  end: (opts?: { timeout?: number }) => Promise<void>;
};

const JSON_MARKER = Symbol("eldarin.sql.json");
const SQL_FRAGMENT = Symbol("eldarin.sql.fragment");

export type SqlFragment = { sql: string };

export function markJson(value: unknown): unknown {
  return { [JSON_MARKER]: true, value };
}

export function isJsonMarker(v: unknown): v is { value: unknown } {
  return typeof v === "object" && v !== null && JSON_MARKER in v;
}

export function markSqlFragment(sql: string): SqlFragment {
  return { [SQL_FRAGMENT]: true, sql } as SqlFragment;
}

export function isSqlFragment(v: unknown): v is SqlFragment {
  return typeof v === "object" && v !== null && SQL_FRAGMENT in v;
}

export function isExecutableSql(query: string): boolean {
  return /^(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP|TRUNCATE|REPLACE|SHOW|DESCRIBE|EXPLAIN)\b/i.test(
    query.trim()
  );
}

export function serializeSqlValue(value: unknown): unknown {
  if (isJsonMarker(value)) {
    return JSON.stringify(value.value);
  }
  if (value instanceof Promise) {
    throw new Error(
      "[db] sql.unsafe() retornou Promise dentro de sql`…` — use fragmento síncrono ou query fora do template"
    );
  }
  return value;
}
