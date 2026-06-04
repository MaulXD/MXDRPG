import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth/clerk-config";
import { dbEnabled } from "@/lib/db/enabled";
import { deleteUserAccount } from "@/lib/db/users";
import { destroySession, getSession } from "@/lib/auth/session";

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login" }, { status: 401 });
  }

  if (!dbEnabled()) {
    return NextResponse.json(
      { error: "Exclusão de conta requer Postgres (DATABASE_URL)" },
      { status: 503 }
    );
  }

  const userId = session.user.id;

  if (isClerkEnabled()) {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      const client = await clerkClient();
      try {
        await client.users.deleteUser(clerkId);
      } catch {
        /* conta Clerk pode já ter sido removida */
      }
    }
  }

  await deleteUserAccount(userId);
  await destroySession();

  return NextResponse.json({ ok: true, redirect: "/entrar" });
}
