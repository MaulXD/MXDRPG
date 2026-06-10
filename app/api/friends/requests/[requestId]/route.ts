import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { cancelFriendRequest, rejectFriendRequest } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ requestId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { requestId } = await params;
  await ensureDbMigrations();
  const rejected = await rejectFriendRequest(session.user.id, requestId);
  if (rejected.ok) return NextResponse.json({ ok: true, action: "rejected" });

  const cancelled = await cancelFriendRequest(session.user.id, requestId);
  if (cancelled.ok) return NextResponse.json({ ok: true, action: "cancelled" });

  return NextResponse.json({ error: rejected.error ?? cancelled.error }, { status: 400 });
}
