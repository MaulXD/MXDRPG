import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { countIncomingFriendRequests, listFriendRequests } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  await ensureDbMigrations();

  const countOnly = new URL(request.url).searchParams.get("countOnly") === "1";
  if (countOnly) {
    const count = await countIncomingFriendRequests(session.user.id);
    return NextResponse.json({ count });
  }

  const { incoming, outgoing } = await listFriendRequests(session.user.id);
  return NextResponse.json({ incoming, outgoing });
}
