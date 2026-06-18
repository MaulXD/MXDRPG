/** Persistência — MariaDB exclusivo (Contabo / local). */
export function persistenceLabel(): "mariadb" | "memory" {
  if (!process.env.DATABASE_URL?.trim()) return "memory";
  return "mariadb";
}
