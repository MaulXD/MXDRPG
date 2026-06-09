import { memberIdsHasUser } from "@/lib/auth/member-ids";
import type { Adventure } from "@/lib/adventure/types";

export function isAdventureOwner(
  adventure: Pick<Adventure, "ownerId">,
  userId: string | undefined
): boolean {
  return Boolean(userId && adventure.ownerId === userId);
}

export function isAdventureMember(
  adventure: Pick<Adventure, "ownerId" | "memberIds">,
  userId: string | undefined,
  clerkId?: string | null
): boolean {
  if (!userId) return false;
  if (isAdventureOwner(adventure, userId)) return true;
  return memberIdsHasUser(adventure.memberIds, userId, clerkId);
}

export function canManageAdventure(
  adventure: Pick<Adventure, "ownerId">,
  user: { id: string; role: string } | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isAdventureOwner(adventure, user.id);
}
