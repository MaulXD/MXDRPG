import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { safeDbRead } from "@/lib/db/safe-query";
import {
  countNotificationsForUser,
  listNotificationsForUser,
} from "@/lib/notifications/store";
import { getSession } from "@/lib/auth/session";
import { materializeSessionUser } from "@/lib/auth/session-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  try {
    await ensureDbMigrations();
  } catch {
    /* leitura abaixo degrada */
  }

  const accountUser = await materializeSessionUser(session.user).catch(() => session.user);

  const [items, count] = await Promise.all([
    safeDbRead("notifications-list", [], () => listNotificationsForUser(accountUser.id)),
    safeDbRead("notifications-count", 0, () => countNotificationsForUser(accountUser.id)),
  ]);

  return NextResponse.json({ items, count });
}
