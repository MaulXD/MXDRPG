export type DiceResult = {
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
};

/** Notação: 1d20, 2d6+3, 1d8-1, 2d6+2d6, 2d8+2d6 (canalização de magia) */
export function rollDice(formula: string): DiceResult {
  const raw = formula.trim().replace(/\s/g, "").toLowerCase();
  const simple = raw.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (simple) {
    const count = parseInt(simple[1] || "1", 10);
    const sides = parseInt(simple[2], 10);
    const modifier = simple[3] ? parseInt(simple[3], 10) : 0;
    if (count < 1 || count > 30 || sides < 2 || sides > 100) {
      throw new Error("Quantidade ou faces inválidas");
    }
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    return { formula: raw, rolls, modifier, total: rolls.reduce((a, b) => a + b, 0) + modifier };
  }

  const terms = raw.match(/[+-]?\d*d\d+|[+-]\d+/g);
  if (!terms?.length) {
    throw new Error("Use formato 1d20, 2d6+3 ou 2d6+2d6");
  }

  const rolls: number[] = [];
  let modifier = 0;
  for (const term of terms) {
    const diceMatch = term.match(/^([+-]?)(\d*)d(\d+)$/);
    if (diceMatch) {
      if (diceMatch[1] === "-") {
        throw new Error("Dados negativos não são suportados");
      }
      const count = parseInt(diceMatch[2] || "1", 10);
      const sides = parseInt(diceMatch[3], 10);
      if (count < 1 || count > 30 || sides < 2 || sides > 100) {
        throw new Error("Quantidade ou faces inválidas");
      }
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
    } else {
      modifier += parseInt(term, 10);
    }
  }

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
