import { NextResponse } from "next/server";
import { dbEnabled, dbPing } from "@/lib/db/client";

export async function GET() {
  const hasUrl = dbEnabled();
  const ping = hasUrl ? await dbPing() : { ok: false as const, error: "DATABASE_URL not set" };
  const db = ping.ok;

  const body: Record<string, unknown> = {
    ok: true,
    app: "eldarin-rpg",
    db,
    persistence: hasUrl ? "postgres" : "memory",
  };

  if (hasUrl && !db && ping.error) {
    body.dbError = ping.error;
  }

  return NextResponse.json(body);
}
