import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { markFriendMessagesRead } from "@/lib/db/friend-messages";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ friendId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  await ensureDbMigrations();
  const { friendId } = await params;
  const marked = await markFriendMessagesRead(session.user.id, friendId);
  return NextResponse.json({ ok: true, marked });
}
