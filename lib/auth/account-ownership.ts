import type { SessionUser } from "@/lib/auth/types";

function clerkAlias(clerkId: string | null | undefined): string | null {
  const id = clerkId?.trim();
  return id ? `clerk-${id}` : null;
}

/** Ficha pertence à conta (id canônico ou alias `clerk-*` da sessão). */
export function characterOwnedBySessionUser(
  sheet: { ownerId: string },
  user: Pick<SessionUser, "id" | "clerkId">
): boolean {
  if (sheet.ownerId === user.id) return true;
  const alias = clerkAlias(user.clerkId);
  if (alias && sheet.ownerId === alias) return true;
  if (user.id.startsWith("clerk-") && sheet.ownerId === user.id) return true;
  return false;
}
