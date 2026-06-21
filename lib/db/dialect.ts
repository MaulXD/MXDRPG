import { dbEnabled } from "./enabled";

/** Persistência — MariaDB exclusivo (Contabo / homolog local). */
export function persistenceLabel(): "mariadb" | "memory" {
  return dbEnabled() ? "mariadb" : "memory";
}
