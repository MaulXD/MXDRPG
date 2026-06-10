import { NextResponse } from "next/server";
import { listPendingJoinRequests } from "@/lib/adventure/join-requests";
import { getAdventure } from "@/lib/adventure/store";
import { canManageAdventure } from "@/lib/auth/adventure-access";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ adventureId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { adventureId } = await params;
  await ensureDbMigrations();

  const adventure = await getAdventure(adventureId);
  if (!adventure || !canManageAdventure(adventure, session.user)) {
    return NextResponse.json({ error: "Somente o mestre pode ver pedidos" }, { status: 403 });
  }

  const requests = await listPendingJoinRequests(adventureId, session.user.id);
  return NextResponse.json({ requests });
}
