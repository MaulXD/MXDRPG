import type { InventoryItem } from "@/lib/character/types";

type Stock = { count: number; quantity: number };

/**
 * Soma o estoque por item do compendio (packId:entryId), sem olhar o instanceId.
 * instanceId muda a cada normalizacao (ex.: loadout que falta no inventario em ficha
 * legada), entao nao serve para dizer se algo foi adicionado.
 */
function stockByEntry(items: readonly InventoryItem[]): Map<string, Stock> {
  const map = new Map<string, Stock>();
  for (const item of items) {
    const key = `${item.packId}:${item.entryId}`;
    const stock = map.get(key) ?? { count: 0, quantity: 0 };
    stock.count += 1;
    stock.quantity += item.quantity;
    map.set(key, stock);
  }
  return map;
}

/**
 * BV-045b: decide se um novo inventário ADICIONA algo à ficha.
 *
 * Adiciona: alguma entrada do compendio (packId + entryId) aparece mais vezes
 * ou com quantidade total maior que antes.
 * Não adiciona: remover item, diminuir quantidade (uso de consumível), trocar
 * instanceId sem mudar a entrada e juntar instâncias mantendo o total.
 * Recurso de classe ainda inexistente (classResourceKeys) não conta.
 */
export function inventoryPatchAddsItems(
  current: readonly InventoryItem[],
  next: readonly InventoryItem[],
  classResourceKeys: ReadonlySet<string> = new Set()
): boolean {
  const before = stockByEntry(current);
  const after = stockByEntry(next);

  for (const [key, now] of after) {
    const prev = before.get(key) ?? { count: 0, quantity: 0 };
    // Recurso de classe/subclasse (sincronizado sozinho, ver classResourceKeysFor): nao conta.
    // Só uma cópia, com quantidade 1, como a sincronização cria; mais que isso conta.
    if (prev.count === 0 && classResourceKeys.has(key) && now.count === 1 && now.quantity <= 1) continue;
    if (now.count > prev.count || now.quantity > prev.quantity) return true;
  }
  return false;
}
