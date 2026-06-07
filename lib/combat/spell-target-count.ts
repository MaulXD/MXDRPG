import type { CombatActionOption } from "@/lib/combat/types";

const WORD_NUMBERS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
};

function parseCountToken(raw: string): number | null {
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return WORD_NUMBERS[raw.toLowerCase()] ?? null;
}

/** Extrai quantos alvos individuais a magia permite (1 = alvo único). */
export function parseSpellTargetCount(
  description: string,
  spellMeta?: { targets?: number }
): number {
  if (spellMeta?.targets != null && spellMeta.targets > 1) {
    return spellMeta.targets;
  }

  const plain = description
    .replace(/<[^>]+>/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const chain = plain.match(/primeiro alvo.*?(\d+)\s+alvos?\s+adicionais/);
  if (chain) return 1 + Number(chain[1]);

  const ate = plain.match(/ate\s+(\d+)\s+(?:criaturas?|aliados?|inimigos?)/);
  if (ate) return Number(ate[1]);

  const salta = plain.match(/salta\s+ate\s+(\d+)\s+alvos?\s+adicionais/);
  if (salta) return 1 + Number(salta[1]);

  const raios = plain.match(/(\d+|um|uma|dois|duas|tres|quatro|cinco|seis)\s+raios?/);
  if (raios) {
    const n = parseCountToken(raios[1]);
    if (n) return n;
  }

  const generic = plain.match(/(\d+)\s+alvos?/);
  if (generic) return Number(generic[1]);

  return 1;
}

export function spellTargetCount(action: CombatActionOption): number {
  return Math.max(1, action.targetCount ?? 1);
}

/** Magia de alvos individuais (não área no mapa) com mais de um alvo. */
export function isMultiTargetSpell(action: CombatActionOption | null | undefined): boolean {
  if (!action || action.kind !== "spell") return false;
  if (action.areaShape && action.areaShape !== "single") return false;
  if (action.selfTarget) return false;
  return spellTargetCount(action) > 1;
}
