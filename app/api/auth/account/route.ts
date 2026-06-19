import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/enabled";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { deleteUserAccount, updateUserAvatar } from "@/lib/db/users";
import { normalizeAvatarSource } from "@/lib/db/user-avatar";
import { destroySession, getSession } from "@/lib/auth/session";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  if (!dbEnabled()) {
    return NextResponse.json(
      { error: "Perfil requer MariaDB (DATABASE_URL)" },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    avatarSource?: string;
    avatarUrl?: string | null;
    avatarFocus?: { x?: number; y?: number; scale?: number } | null;
  };

  try {
    await ensureDbMigrations();
    const user = await updateUserAvatar(session.user.id, {
      avatarSource: normalizeAvatarSource(body.avatarSource),
      avatarUrl: body.avatarUrl,
      avatarFocus: sanitizePortraitFocus(body.avatarFocus) ?? undefined,
    });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao salvar avatar" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  if (!dbEnabled()) {
    return NextResponse.json(
      { error: "Exclusão de conta requer MariaDB (DATABASE_URL)" },
      { status: 503 }
    );
  }

  await deleteUserAccount(session.user.id);
  await destroySession();

  return NextResponse.json({ ok: true, redirect: "/entrar" });
}
