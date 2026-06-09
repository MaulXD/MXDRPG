export type SheetEditScope = "full_rebuild" | "last_level";

export type SheetEditRequestStatus = "pending" | "approved" | "rejected" | "consumed";

export type SheetEditRequest = {
  id: string;
  characterId: string;
  adventureId: string;
  roomId: string | null;
  requesterUserId: string;
  scope: SheetEditScope;
  status: SheetEditRequestStatus;
  gmUserId: string | null;
  resolvedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

/** Concessão ativa para editar ficha em campanha (uma vez por aprovação). */
export type SheetEditGrant = Pick<
  SheetEditRequest,
  "id" | "characterId" | "scope" | "status"
>;

export function isActiveSheetEditGrant(
  grant: SheetEditGrant | null | undefined
): grant is SheetEditGrant {
  return Boolean(grant && grant.status === "approved" && grant.characterId);
}

export function sheetEditScopeLabel(scope: SheetEditScope): string {
  return scope === "full_rebuild"
    ? "Reconstruir do nível 1 (raça/classe)"
    : "Editar só o último nível";
}

export function sheetEditStatusLabel(status: SheetEditRequestStatus): string {
  switch (status) {
    case "pending":
      return "Aguardando mestre";
    case "approved":
      return "Aprovada — clique para editar";
    case "rejected":
      return "Recusada pelo mestre";
    case "consumed":
      return "Edição concluída";
    default:
      return status;
  }
}

export function newSheetEditRequestId(): string {
  return `ser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
