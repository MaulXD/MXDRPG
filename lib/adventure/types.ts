/** Campanha persistente — contém mesa ao vivo, fichas e membros. */
export type Adventure = {
  adventureId: string;
  ownerId: string;
  name: string;
  synopsis: string;
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

export type AdventureListItem = {
  adventureId: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  primaryRoomId: string;
  isOwner: boolean;
  updatedAt: number;
  deletedAt?: number | null;
};
