import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserPublicProfile } from "@/lib/friends/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  const { userId } = await params;
  const result = await getUserPublicProfile(session.user.id, userId.trim());
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ profile: result.profile });
}
