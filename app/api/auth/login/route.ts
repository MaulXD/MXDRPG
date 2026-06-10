import { NextResponse } from "next/server";

/** Login local desativado — use Clerk (/sign-in). */
export async function POST() {
  return NextResponse.json(
    { error: "Login local desativado. Use /sign-in (Google ou Discord)." },
    { status: 410 }
  );
}
