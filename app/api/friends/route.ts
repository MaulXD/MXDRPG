import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { addFriendByNickname, addFriendByUserId, listFriends } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  await ensureDbMigrations();
  const friends = await listFriends(session.user.id);
  return NextResponse.json({ friends });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId ?? "").trim();
  const nickname = String(body.nickname ?? "").trim();

  await ensureDbMigrations();

  if (!userId && !nickname) {
    return NextResponse.json({ error: "Informe o apelido ou o jogador" }, { status: 400 });
  }

  const result = userId
    ? await addFriendByUserId(session.user.id, userId)
    : await addFriendByNickname(session.user.id, nickname);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (result.kind === "friend") {
    return NextResponse.json({ kind: "friend", friend: result.friend });
  }
  return NextResponse.json({ kind: "request", request: result.request });
}
