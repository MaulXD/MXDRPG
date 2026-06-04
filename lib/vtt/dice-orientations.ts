/** Rotação final para exibir o valor do dado (Euler XYZ em radianos). */

export function eulerForDieValue(sides: number, value: number): [number, number, number] {
  const v = Math.max(1, Math.min(sides, Math.floor(value)));

  if (sides === 6) {
    const map: Record<number, [number, number, number]> = {
      1: [0, 0, 0],
      2: [0, Math.PI / 2, 0],
      3: [-Math.PI / 2, 0, 0],
      4: [Math.PI / 2, 0, 0],
      5: [Math.PI, 0, 0],
      6: [0, 0, Math.PI],
    };
    return map[v] ?? [0, 0, 0];
  }

  if (sides === 4) {
    const step = (Math.PI * 2) / 4;
    return [0.95 + (v % 2) * 0.15, v * step, 0.25];
  }

  const step = (Math.PI * 2) / sides;
  return [0.65 + ((v * 3) % 5) * 0.08, v * step * 0.85, ((v * 7) % 11) * 0.12];
}
