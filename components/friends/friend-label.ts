import type { FriendSummary, PublicUserProfile } from "@/lib/friends/types";

export function friendLabel(f: Pick<FriendSummary, "nickname" | "displayName">): string {
  return f.nickname ? `@${f.nickname}` : f.displayName;
}

export function profileLabel(p: Pick<PublicUserProfile, "nickname" | "displayName">): string {
  return p.nickname ? `@${p.nickname}` : p.displayName;
}
