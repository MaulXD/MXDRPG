import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { saveBugReport } from "@/lib/bugs/bug-report-store";
import { validateImageDataUrl } from "@/lib/media/image-data-url";

const MIN_DESC = 10;
const MAX_DESC = 4000;

export async function POST(request: Request) {
  let body: {
    description?: unknown;
    screenshotDataUrl?: unknown;
    pageUrl?: unknown;
    userAgent?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length < MIN_DESC) {
    return NextResponse.json(
      { error: `Descreva o bug com pelo menos ${MIN_DESC} caracteres` },
      { status: 400 }
    );
  }
  if (description.length > MAX_DESC) {
    return NextResponse.json({ error: "Descrição muito longa (máx 4000)" }, { status: 400 });
  }

  let screenshotDataUrl: string | null = null;
  if (body.screenshotDataUrl != null && body.screenshotDataUrl !== "") {
    screenshotDataUrl = validateImageDataUrl(body.screenshotDataUrl);
    if (!screenshotDataUrl) {
      return NextResponse.json({ error: "Imagem inválida ou grande demais" }, { status: 400 });
    }
  }

  const session = await getSession();
  const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl : null;
  const userAgent = typeof body.userAgent === "string" ? body.userAgent : null;

  const record = saveBugReport({
    description,
    screenshotDataUrl,
    pageUrl,
    userAgent,
    userId: session?.user.id ?? null,
    userDisplay: session?.user.nickname ?? session?.user.email ?? null,
  });

  return NextResponse.json({
    ok: true,
    id: record.id,
    message: "Relato recebido. Obrigado por ajudar a melhorar o Eldarin!",
  });
}
