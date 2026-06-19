import { NextResponse } from "next/server";
import { materializeSessionUser } from "@/lib/auth/session-user";
import { createSession } from "@/lib/auth/session";
import { dbEnabled } from "@/lib/db/enabled";
import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { setUserNickname } from "@/lib/db/users";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }
  if (!dbEnabled()) {
    return NextResponse.json({ error: "Apelido requer MariaDB (DATABASE_URL)" }, { status: 503 });
  }

  const body = await request.json();
  const nickname = String(body.nickname ?? "").trim();
  if (!nickname) {
    return NextResponse.json({ error: "Informe o apelido" }, { status: 400 });
  }

  try {
    await ensureDbMigrations();
    const dbUser = await materializeSessionUser(session.user);
    const user = await setUserNickname(dbUser.id, nickname);
    await createSession(user);
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Apelido inválido";
    const safe =
      /column|relation|does not exist|mariadb|mysql|certificate|ssl/i.test(raw)
        ? "Banco indisponível ou desatualizado — tente de novo ou avise o suporte."
        : raw;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
