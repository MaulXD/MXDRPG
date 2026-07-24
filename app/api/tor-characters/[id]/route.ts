import { NextResponse } from "next/server";
import {
  patchTorCharacterResources,
  resolveTorCharacter,
  type TorResourcePatch,
} from "@/lib/character/um-anel/characters";
import { materializeSessionUser } from "@/lib/auth/session-user";
import { getSession } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login" }, { status: 401 });

  const { id } = await params;
  const character = await resolveTorCharacter(id);
  if (!character) return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  return NextResponse.json({ character });
}

export async function PATCH(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as TorResourcePatch;
  try {
    const user = await materializeSessionUser(session.user);
    const character = await patchTorCharacterResources(id, body, user.id, {
      clerkId: user.clerkId ?? session.user.clerkId,
    });
    return NextResponse.json({ ok: true, character });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao atualizar ficha" },
      { status: 400 }
    );
  }
}
