import { NextResponse } from "next/server";
import { materializeSessionUser } from "@/lib/auth/session-user";
import { postAuthRedirect, safeRedirectPath } from "@/lib/auth/post-auth-redirect";
import { createSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { normalizeAvatarSource } from "@/lib/db/user-avatar";
import { setUserNickname, updateUserAvatar } from "@/lib/db/users";
import { getSession } from "@/lib/auth/session";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";

/** Primeiro acesso: apelido obrigatório + escolha de foto de perfil. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  if (!dbEnabled()) {
    return NextResponse.json({ error: "Perfil requer MariaDB (DATABASE_URL)" }, { status: 503 });
  }

  const body = (await request.json()) as {
    nickname?: string;
    avatarSource?: string;
    avatarUrl?: string | null;
    avatarFocus?: { x?: number; y?: number; scale?: number } | null;
    redirect?: string;
  };

  const nickname = String(body.nickname ?? "").trim();
  if (!nickname) {
    return NextResponse.json({ error: "Informe o apelido" }, { status: 400 });
  }

  const avatarSource = normalizeAvatarSource(body.avatarSource);

  try {
    await ensureDbMigrations();
    const dbUser = await materializeSessionUser(session.user);
    let user = await setUserNickname(dbUser.id, nickname);
    user = await updateUserAvatar(user.id, {
      avatarSource,
      avatarUrl: avatarSource === "custom" ? body.avatarUrl : null,
      avatarFocus:
        avatarSource === "custom"
          ? sanitizePortraitFocus(body.avatarFocus) ?? undefined
          : null,
    });
    await createSession(user);
    const redirect = postAuthRedirect(user, safeRedirectPath(body.redirect));
    return NextResponse.json({ ok: true, user, redirect });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erro ao salvar perfil";
    const safe =
      /column|relation|does not exist|mariadb|mysql/i.test(raw)
        ? "Banco desatualizado — tente de novo em alguns segundos ou avise o suporte."
        : raw;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
