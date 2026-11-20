import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/enabled";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { deleteUserAccount, updateUserAvatar } from "@/lib/db/users";
import { normalizeAvatarSource } from "@/lib/db/user-avatar";
import { applySessionCookie, destroySession, getSession } from "@/lib/auth/session";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  if (!dbEnabled()) {
    console.error("[account] banco indisponível: DATABASE_URL ausente ou inválida");
    return NextResponse.json(
      { error: "Não foi possível salvar a foto agora. Tente de novo em instantes." },
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
    const response = NextResponse.json({ ok: true, user });
    applySessionCookie(response, user);
    return response;
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
    console.error("[account] exclusão sem banco: DATABASE_URL ausente ou inválida");
    return NextResponse.json(
      { error: "Não foi possível excluir a conta agora. Tente de novo em instantes." },
      { status: 503 }
    );
  }

  await deleteUserAccount(session.user.id);
  await destroySession();

  return NextResponse.json({ ok: true, redirect: "/entrar" });
}
