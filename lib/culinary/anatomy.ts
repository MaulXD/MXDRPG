/** Cap. 5.1 — CD do estudo de anatomia. */
export function anatomyStudyDc(monsterLevel: number): number {
  const level = Math.max(1, Math.floor(monsterLevel));
  return 10 + Math.floor(level / 2);
}

export function anatomyStudyBonus(classe: string): number {
  if (classe === "Patrulheiro") return 3;
  if (classe === "Artífice") return 5;
  return 0;
}

export function druidAutoKnowsFloraFungi(raca: string, classe: string): boolean {
  return classe === "Druida";
}
