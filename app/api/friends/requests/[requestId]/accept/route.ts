import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { acceptFriendRequest } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ requestId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { requestId } = await params;
  await ensureDbMigrations();
  const result = await acceptFriendRequest(session.user.id, requestId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ friend: result.friend });
}
