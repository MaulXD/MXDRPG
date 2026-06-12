import "server-only";

import { isAdventureMember, canManageAdventure } from "@/lib/auth/adventure-access";
import { canManageRoom } from "@/lib/auth/room-access";
import { characterOwnedBySessionUser } from "@/lib/auth/account-ownership";
import type { SessionUser } from "@/lib/auth/types";
import type { Adventure } from "@/lib/adventure/types";
import type { CharacterSheet } from "@/lib/character/types";
import type { RoomState } from "@/lib/room/types";

export function characterNameMatchesConfirm(name: string, confirm: string): boolean {
  const norm = (s: string) => s.trim().normalize("NFC").toLowerCase();
  return norm(name) === norm(confirm);
}

export function isCharacterOwner(
  sheet: Pick<CharacterSheet, "ownerId">,
  userId: string | undefined
): boolean {
  return Boolean(userId && sheet.ownerId === userId);
}

export function canDeleteCharacterSheet(
  sheet: CharacterSheet,
  user: SessionUser,
  opts?: {
    adventure?: Pick<Adventure, "ownerId" | "memberIds" | "adventureId"> | null;
    room?: Pick<RoomState, "ownerId" | "adventureId"> | null;
  }
): boolean {
  if (user.role === "admin") return true;
  if (characterOwnedBySessionUser(sheet, user)) return true;
  if (opts?.room && canManageRoom(opts.room, user)) return true;
  if (opts?.adventure && canManageAdventure(opts.adventure, user)) return true;
  return false;
}

export function canTransferCharacterSheet(
  sheet: CharacterSheet,
  user: SessionUser,
  opts?: {
    adventure?: Pick<Adventure, "ownerId" | "memberIds"> | null;
    room?: Pick<RoomState, "ownerId"> | null;
    asGm?: boolean;
  }
): boolean {
  if (user.role === "admin") return true;
  if (opts?.asGm) {
    if (opts.room && canManageRoom(opts.room, user)) return true;
    if (opts.adventure && canManageAdventure(opts.adventure, user)) return true;
    return false;
  }
  return characterOwnedBySessionUser(sheet, user);
}

export function canAssignCharacterToMember(
  adventure: Pick<Adventure, "ownerId" | "memberIds">,
  targetUserId: string,
  clerkId?: string | null
): boolean {
  if (targetUserId === adventure.ownerId) return true;
  return isAdventureMember(adventure, targetUserId, clerkId);
}
