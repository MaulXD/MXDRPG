import { NextResponse } from "next/server";
import { joinAdventureByInvite } from "@/lib/adventure/store";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = await request.json();
  const inviteCode = String(body.inviteCode ?? "").trim();
  if (!inviteCode) {
    return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
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
