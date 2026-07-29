import type { PortraitFocus } from "@/lib/media/portrait-focus";

export type FriendSummary = {
  id: string;
  nickname: string | null;
  /** Nome real nunca trafega pra outros usuários — só apelido/rótulo genérico. */
  displayName: string;
  avatarUrl: string | null;
  avatarFocus?: PortraitFocus | null;
  addedAt: number;
};

export type FriendRequestSummary = {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  fromNickname: string | null;
  fromAvatarUrl: string | null;
  toDisplayName: string;
  toNickname: string | null;
  toAvatarUrl: string | null;
  createdAt: number;
  direction: "incoming" | "outgoing";
};

export type PublicUserProfile = {
  id: string;
  nickname: string | null;
  /** Nome real só vem preenchido quando relationship é "self" — nunca pra outro usuário. */
  name?: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFocus?: PortraitFocus | null;
  relationship: "self" | "friend" | "incoming" | "outgoing" | "none";
  friendSince?: number;
  pendingRequestId?: string | null;
};

export type MesaInviteSummary = {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  fromAvatarUrl: string | null;
  roomId: string;
  adventureId: string;
  inviteCode: string;
  roomName: string;
  message: string | null;
  inviteUrl: string;
  createdAt: number;
};
