import { NextResponse } from "next/server";
import {
  canEditCharacterWithGrant,
  grantFromRequest,
  resolveCharacter,
  saveCharacter,
} from "@/lib/character/characters";
import {
  applyLevelUp,
  canLevelUp,
  validateLevelUpChoices,
  type LevelUpChoices,
} from "@/lib/character/level-up";
import { normalizeCharacter } from "@/lib/character/normalize";
import { getApprovedGrantForCharacter } from "@/lib/character/sheet-edit-request-store";
import { getSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const existing = await resolveCharacter(id);
  if (!existing) {
    return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  }

  const approved = await getApprovedGrantForCharacter(id, session.user.id);
  const grant = grantFromRequest(approved);
  if (!canEditCharacterWithGrant(existing, session.user.id, session.user.role, { grant })) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (!canLevelUp(existing)) {
    return NextResponse.json({ error: "XP insuficiente ou nível máximo" }, { status: 400 });
  }

  let choices: LevelUpChoices = {};
  try {
    const body = await req.json();
    if (body && typeof body === "object") choices = body as LevelUpChoices;
  } catch {
    /* body vazio ok se não houver escolhas */
  }

  const err = validateLevelUpChoices(existing, choices);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const leveled = normalizeCharacter(applyLevelUp(existing, choices));
  const saved = await saveCharacter(leveled);

  return NextResponse.json({ ok: true, character: saved });
}
