import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import {
  countNotificationsForUser,
  listNotificationsForUser,
} from "@/lib/notifications/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  await ensureDbMigrations();
  const [items, count] = await Promise.all([
    listNotificationsForUser(session.user.id),
    countNotificationsForUser(session.user.id),
  ]);

  return NextResponse.json({ items, count });
}
