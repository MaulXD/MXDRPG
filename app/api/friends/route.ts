import { NextResponse } from "next/server";
import { addFriendByNickname, listFriends } from "@/lib/friends/store";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  const friends = await listFriends(session.user.id);
  return NextResponse.json({ friends });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const nickname = String(body.nickname ?? "").trim();
  if (!nickname) {
    return NextResponse.json({ error: "Informe o apelido" }, { status: 400 });
  }

  const result = await addFriendByNickname(session.user.id, nickname);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ friend: result.friend });
}
