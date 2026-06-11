export type InventoryItemRequestStatus = "pending" | "approved" | "rejected";

export type InventoryItemRequest = {
  id: string;
  characterId: string;
  adventureId: string;
  roomId: string | null;
  requesterUserId: string;
  packId: string;
  entryId: string;
  quantity: number;
  mergeExisting: boolean;
  instanceId: string | null;
  itemLabel: string;
  status: InventoryItemRequestStatus;
  gmUserId: string | null;
  resolvedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export function newInventoryItemRequestId(): string {
  return `iir-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function inventoryRequestLabel(r: InventoryItemRequest): string {
  const qty = r.quantity > 1 ? ` ×${r.quantity}` : "";
  return `${r.itemLabel}${qty}`;
}

export function inventoryRequestStatusLabel(status: InventoryItemRequestStatus): string {
  switch (status) {
    case "pending":
      return "Aguardando mestre";
    case "approved":
      return "Aprovado";
    case "rejected":
      return "Recusado pelo mestre";
    default:
      return status;
  }
}
