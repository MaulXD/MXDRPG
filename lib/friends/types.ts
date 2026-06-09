export type FriendSummary = {
  id: string;
  nickname: string | null;
  name: string;
  avatarUrl: string | null;
  addedAt: number;
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
