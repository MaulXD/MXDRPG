export type RollMode = "normal" | "advantage" | "disadvantage";

export type D20Roll = {
  natural: number;
  /** Segundo d20 se vantagem/desvantagem */
  secondary?: number;
  mode: RollMode;
};

/** Vantagem + desvantagem cancelam → normal */
export function combineRollModes(...modes: RollMode[]): RollMode {
  let adv = 0;
  let dis = 0;
  for (const m of modes) {
    if (m === "advantage") adv++;
    if (m === "disadvantage") dis++;
  }
  if (adv > 0 && dis > 0) return "normal";
  if (adv > 0) return "advantage";
  if (dis > 0) return "disadvantage";
  return "normal";
}

export function rollD20(mode: RollMode = "normal"): D20Roll {
  const a = Math.floor(Math.random() * 20) + 1;
  if (mode === "normal") return { natural: a, mode };

  const b = Math.floor(Math.random() * 20) + 1;
  if (mode === "advantage") {
    return { natural: Math.max(a, b), secondary: Math.min(a, b), mode };
  }
  return { natural: Math.min(a, b), secondary: Math.max(a, b), mode };
}

export function formatRollMode(mode: RollMode): string {
  if (mode === "advantage") return "vantagem";
  if (mode === "disadvantage") return "desvantagem";
  return "";
}

export function formatD20Detail(roll: D20Roll): string {
  const tag = formatRollMode(roll.mode);
  if (!tag || roll.secondary == null) return `1d20=${roll.natural}`;
  return `1d20 [${tag}] ${roll.natural}/${roll.secondary}→${roll.natural}`;
}
