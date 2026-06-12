import type { AdventureAccessMode } from "@/lib/adventure/access";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import type { RpgSystemId } from "@/lib/rpg/systems";

/** Campanha persistente — contém mesa ao vivo, fichas e membros. */
export type Adventure = {
  adventureId: string;
  ownerId: string;
  name: string;
  synopsis: string;
  /** Hub MXDRPG — qual RPG esta mesa pertence. */
  rpgSystemId: RpgSystemId;
  /** Pública: entrada livre; fechada: só convite mestre, senha única ou aprovação. */
  accessMode: AdventureAccessMode;
  inviteCode: string;
  /** Jogadores vinculados permanentemente (só cresce; não remover ao sair da mesa). */
  memberIds: string[];
  /** Mesa VTT desta aventura (1:1 por enquanto). */
  primaryRoomId: string;
  createdAt: number;
  updatedAt: number;
  /** Exclusão suave — só o mestre restaura em até 30 dias. */
  deletedAt?: number | null;
};

export type AdventureListMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isOwner: boolean;
  online: boolean;
};

export type AdventureListItem = {
  adventureId: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  primaryRoomId: string;
  isOwner: boolean;
  updatedAt: number;
  deletedAt?: number | null;
  /** Capa da mesa VTT (mestre) ou arte padrão Eldarin. */
  coverUrl?: string | null;
  coverFocus?: PortraitFocus | null;
  members?: AdventureListMember[];
  onlineCount?: number;
};
