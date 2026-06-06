import { NextResponse } from "next/server";
import { restoreAdventure, softDeleteAdventure } from "@/lib/adventure/store";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ adventureId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { adventureId } = await params;
  const result = await softDeleteAdventure(adventureId, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "restore") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const { adventureId } = await params;
  const result = await restoreAdventure(adventureId, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    adventure: {
      adventureId: result.adventure.adventureId,
      name: result.adventure.name,
    },
  });
}
