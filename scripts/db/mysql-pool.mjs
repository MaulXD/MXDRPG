import mysql from "mysql2/promise";
import { normalizeDatabaseUrl } from "./normalize-url.mjs";

export function mariaDbUrl(raw) {
  return normalizeDatabaseUrl(raw ?? "").replace(/^mariadb:/i, "mysql:");
}

export async function createMariaPool(rawUrl, { multipleStatements = false } = {}) {
  const url = mariaDbUrl(rawUrl);
  if (!url) throw new Error("DATABASE_URL não definida");
  const local = url.includes("localhost") || url.includes("127.0.0.1");
  return mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements,
    ssl: local ? undefined : { rejectUnauthorized: true },
  });
}

export function maskUrl(url) {
  return url.replace(/:[^:@/]+@/, ":****@");
}
