import { NextResponse } from "next/server";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { insertFriendMessage, listFriendMessages } from "@/lib/db/friend-messages";
import { isFriendLink } from "@/lib/db/friends";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ friendId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  await ensureDbMigrations();
  const { friendId } = await params;

  const isFriend = await isFriendLink(session.user.id, friendId);
  if (!isFriend) {
    return NextResponse.json({ error: "Só é possível ver mensagens de amigos" }, { status: 403 });
  }

  const url = new URL(req.url);
  const afterRaw = url.searchParams.get("after");
  const after = afterRaw ? Number(afterRaw) : undefined;

  const messages = await listFriendMessages(session.user.id, friendId, after);
  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  await ensureDbMigrations();
  const { friendId } = await params;

  const isFriend = await isFriendLink(session.user.id, friendId);
  if (!isFriend) {
    return NextResponse.json({ error: "Só é possível enviar mensagens a amigos" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = String(body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Mensagem longa demais (máx. 2000 caracteres)" }, { status: 400 });
  }

  const message = await insertFriendMessage(session.user.id, friendId, text);
  if (!message) {
    return NextResponse.json({ error: "Não foi possível enviar" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message });
}
