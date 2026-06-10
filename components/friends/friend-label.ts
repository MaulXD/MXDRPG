import type { FriendSummary, PublicUserProfile } from "@/lib/friends/types";

export function friendLabel(f: Pick<FriendSummary, "nickname" | "name">): string {
  return f.nickname ? `@${f.nickname}` : f.name;
}

export function profileLabel(p: Pick<PublicUserProfile, "nickname" | "displayName" | "name">): string {
  return p.nickname ? `@${p.nickname}` : p.displayName || p.name;
}
