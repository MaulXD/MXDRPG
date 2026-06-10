import type { BattleToken } from "@/lib/vtt/types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Nome numerado para instâncias do mesmo monstro na cena (Goblin 1, Goblin 2, …).
 */
export function nextMonsterDisplayName(tokens: BattleToken[], baseName: string): string {
  const root = baseName.trim();
  if (!root) return "Monstro 1";

  const numbered = new RegExp(`^${escapeRegExp(root)}\\s*(\\d+)$`, "i");
  let max = 0;

  for (const token of tokens) {
    const name = token.name.trim();
    if (name.toLowerCase() === root.toLowerCase()) {
      max = Math.max(max, 1);
      continue;
    }
    const match = name.match(numbered);
    if (match) max = Math.max(max, parseInt(match[1]!, 10));
  }

  return `${root} ${max + 1}`;
}
