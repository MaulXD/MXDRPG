export type DiceResult = {
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
};

/** Notação simples: 1d20, 2d6+3, 1d8-1 */
export function rollDice(formula: string): DiceResult {
  const raw = formula.trim().replace(/\s/g, "").toLowerCase();
  const match = raw.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error("Use formato 1d20, 2d6+3 ou 1d8-1");
  }

  const count = parseInt(match[1] || "1", 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1 || count > 30 || sides < 2 || sides > 100) {
    throw new Error("Quantidade ou faces inválidas");
  }

  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;

  return { formula: raw, rolls, modifier, total };
}

export function formatRollMessage(result: DiceResult): string {
  const mod =
    result.modifier === 0
      ? ""
      : result.modifier > 0
        ? ` + ${result.modifier}`
        : ` − ${Math.abs(result.modifier)}`;
  const detail = result.rolls.length > 1 ? `[${result.rolls.join(", ")}]${mod} ` : "";
  return `${detail}= ${result.total}`;
}
