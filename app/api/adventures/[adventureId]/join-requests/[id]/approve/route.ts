import { NextResponse } from "next/server";
import { approveJoinRequest } from "@/lib/adventure/join-requests";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ adventureId: string; id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { id } = await params;
  await ensureDbMigrations();

  const result = await approveJoinRequest(session.user.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
