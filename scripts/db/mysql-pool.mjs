import mysql from "mysql2/promise";
import { normalizeDatabaseUrl } from "./normalize-url.mjs";

export function mariaDbUrl(raw) {
  return normalizeDatabaseUrl(raw ?? "").replace(/^mariadb:/i, "mysql:");
}

export async function createMariaPool(rawUrl, { multipleStatements = false } = {}) {
  const url = mariaDbUrl(rawUrl);
  if (!url) throw new Error("DATABASE_URL não definida");
  const local = url.includes("localhost") || url.includes("127.0.0.1");
  let ssl;
  if (!local) {
    if (process.env.MARIADB_SSL_REJECT_UNAUTHORIZED === "0") {
      ssl = { rejectUnauthorized: false };
    } else {
      try {
        const u = new URL(url);
        const accept = u.searchParams.get("sslaccept")?.toLowerCase();
        if (accept === "accept_invalid_certs" || accept === "skip_verify") {
          ssl = { rejectUnauthorized: false };
        } else {
          ssl = { rejectUnauthorized: true };
        }
      } catch {
        ssl = { rejectUnauthorized: true };
      }
    }
  }
  return mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements,
    ssl,
  });
}

export function maskUrl(url) {
  return url.replace(/:[^:@/]+@/, ":****@");
}
