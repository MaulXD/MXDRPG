export type NotificationType =
  | "friend_request"
  | "mesa_invite"
  | "sheet_edit_gm"
  | "sheet_edit_player"
  | "join_request";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: number;
  meta?: {
    requestId?: string;
    inviteId?: string;
    adventureId?: string;
    roomId?: string;
    characterId?: string;
    fromUserId?: string;
    fromDisplayName?: string;
    canAccept?: boolean;
    canDismiss?: boolean;
  };
};
