/** Sala persistida criada por `npm run homolog:up` / `local:seed`. */
export const HOMOLOG_LOCAL_ROOM_ID = "mesa-local";

function homologDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return /127\.0\.0\.1:3306|localhost:3306/i.test(url) && /\/eldarin(\?|$)/i.test(url);
}

/** MariaDB local — nunca produção Contabo. */
export function isHomologLocalDev(): boolean {
  if (process.env.NEXT_PUBLIC_HOMOLOG === "1" || process.env.HOMOLOG_LOCAL === "1") {
    return true;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }
  return homologDatabaseUrl();
}

export function isHomologPublicRoom(roomId: string): boolean {
  return roomId === HOMOLOG_LOCAL_ROOM_ID && isHomologLocalDev();
}
