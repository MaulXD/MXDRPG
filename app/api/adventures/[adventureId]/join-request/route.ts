import { NextResponse } from "next/server";
import { createJoinRequest } from "@/lib/adventure/join-requests";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ adventureId: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { adventureId } = await params;
  await ensureDbMigrations();

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message : null;

  const result = await createJoinRequest(adventureId, session.user.id, message);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ request: result.request });
}
