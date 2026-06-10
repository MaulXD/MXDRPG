import { NextResponse } from "next/server";
import { listAllMesasForAdmin } from "@/lib/admin/mesas";
import { requireRole } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const mesas = await listAllMesasForAdmin();
  return NextResponse.json({ mesas });
}
