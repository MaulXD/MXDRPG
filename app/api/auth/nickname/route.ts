import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "Apelido requer Postgres (DATABASE_URL)" }, { status: 503 });
  }

  const body = await request.json();
  const nickname = String(body.nickname ?? "").trim();
  if (!nickname) {
    return NextResponse.json({ error: "Informe o apelido" }, { status: 400 });
  }

  try {
    await ensureDbMigrations();
    const user = await setUserNickname(session.user.id, nickname);
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Apelido inválido";
    const safe =
      /column|relation|does not exist|postgres/i.test(raw)
        ? "Banco desatualizado — tente de novo em alguns segundos ou avise o suporte."
        : raw;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
