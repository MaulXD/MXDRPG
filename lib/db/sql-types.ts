/** Cliente SQL explícito — tagged template + helpers (MariaDB). */
export type EldarinSql = {
  <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  json: (value: unknown) => unknown;
  unsafe: (query: string, params?: unknown[]) => Promise<unknown>;
  end: (opts?: { timeout?: number }) => Promise<void>;
};

const JSON_MARKER = Symbol("eldarin.sql.json");

export function markJson(value: unknown): unknown {
  return { [JSON_MARKER]: true, value };
}

export function isJsonMarker(v: unknown): v is { value: unknown } {
  return typeof v === "object" && v !== null && JSON_MARKER in v;
}

export function serializeSqlValue(value: unknown): unknown {
  if (isJsonMarker(value)) {
    return JSON.stringify(value.value);
  }
  return value;
}
