import { NextResponse } from "next/server";
import { joinAdventureByOneTimeToken } from "@/lib/adventure/join-tokens";
import { joinAdventureByInvite } from "@/lib/adventure/store";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  await ensureDbMigrations();
  const body = await request.json();
  const inviteCode = String(body.inviteCode ?? "").trim();
  const joinToken = String(body.joinToken ?? "").trim();
  const adventureId = String(body.adventureId ?? "").trim();

  if (joinToken) {
    if (!adventureId) {
      return NextResponse.json({ error: "adventureId obrigatório com senha única" }, { status: 400 });
    }
    const adventure = await joinAdventureByOneTimeToken(adventureId, joinToken, session.user.id);
    if (!adventure) {
      return NextResponse.json({ error: "Senha inválida ou já usada" }, { status: 404 });
    }
    return NextResponse.json({
      adventure: {
        adventureId: adventure.adventureId,
        name: adventure.name,
        inviteCode: adventure.inviteCode,
        primaryRoomId: adventure.primaryRoomId,
        isOwner: adventure.ownerId === session.user.id,
        permanentlyBound: true,
      },
    });
  }

  if (!inviteCode) {
    return NextResponse.json({ error: "Código ou senha obrigatório" }, { status: 400 });
  }

  const adventure = await joinAdventureByInvite(inviteCode, session.user.id);
  if (!adventure) {
    return NextResponse.json({ error: "Código inválido" }, { status: 404 });
  }

  const permanentlyBound =
    adventure.ownerId === session.user.id ||
    adventure.memberIds.includes(session.user.id);

  return NextResponse.json({
    adventure: {
      adventureId: adventure.adventureId,
      name: adventure.name,
      inviteCode: adventure.inviteCode,
      primaryRoomId: adventure.primaryRoomId,
      isOwner: adventure.ownerId === session.user.id,
      permanentlyBound,
    },
  });
}
