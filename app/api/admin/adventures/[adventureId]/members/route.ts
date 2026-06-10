import { NextResponse } from "next/server";
import {
  adminAddMesaMember,
  adminRemoveMesaMember,
  adminSetMesaOwner,
  getMesaAdminDetail,
} from "@/lib/admin/mesas";
import { requireRole } from "@/lib/auth/session";

type Params = { params: Promise<{ adventureId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { adventureId } = await params;
  const mesa = await getMesaAdminDetail(adventureId);
  if (!mesa) {
    return NextResponse.json({ error: "Mesa não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ mesa });
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { adventureId } = await params;
  const body = (await request.json()) as {
    action?: "add" | "remove" | "setOwner";
    userId?: string;
    nickname?: string;
  };

  const input = { userId: body.userId, nickname: body.nickname };
  let result;

  switch (body.action) {
    case "add":
      result = await adminAddMesaMember(adventureId, input);
      break;
    case "remove":
      result = await adminRemoveMesaMember(adventureId, input);
      break;
    case "setOwner":
      result = await adminSetMesaOwner(adventureId, input);
      break;
    default:
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const mesa = await getMesaAdminDetail(adventureId);
  return NextResponse.json({ ok: true, mesa });
}
