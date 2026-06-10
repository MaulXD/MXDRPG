import { NextResponse } from "next/server";
import { createOneTimeJoinToken } from "@/lib/adventure/join-tokens";
import { getAdventure } from "@/lib/adventure/store";
import { canManageAdventure } from "@/lib/auth/adventure-access";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ adventureId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { adventureId } = await params;
  await ensureDbMigrations();

  const adventure = await getAdventure(adventureId);
  if (!adventure || !canManageAdventure(adventure, session.user)) {
    return NextResponse.json({ error: "Somente o mestre pode gerar senhas" }, { status: 403 });
  }

  const result = await createOneTimeJoinToken(adventure, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    token: result.plaintext,
    tokenId: result.tokenId,
    message: "Copie a senha agora — ela não será exibida novamente.",
  });
}
