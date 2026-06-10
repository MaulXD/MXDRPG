import type { BattleScene } from "@/lib/vtt/types";

/** Garante IDs únicos — duplicatas quebram ordem de turno e vínculo com fichas. */
export function repairDuplicateTokenIds(scene: BattleScene): BattleScene {
  const seen = new Set<string>();
  let changed = false;

  const tokens = scene.tokens.map((token, index) => {
    if (!seen.has(token.id)) {
      seen.add(token.id);
      return token;
    }
    changed = true;
    let newId = `t-fix-${index}`;
    while (seen.has(newId)) {
      newId = `t-fix-${index}-${seen.size}`;
    }
    seen.add(newId);
    return { ...token, id: newId };
  });

  if (!changed) return scene;
  return { ...scene, tokens };
}

/** Repara ordem de combate: remove IDs inválidos/duplicados e inclui tokens novos. */
export function repairCombatOrderTokenIds(
  order: string[],
  tokens: BattleScene["tokens"]
): string[] {
  const valid = new Set(tokens.map((t) => t.id));
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    if (!valid.has(id) || seen.has(id)) continue;
    seen.add(id);
    deduped.push(id);
  }

  for (const t of tokens) {
    if (!seen.has(t.id)) {
      deduped.push(t.id);
      seen.add(t.id);
    }
  }

  return deduped;
}

/** Na demo, restaura IDs canônicos dos PCs (ex.: bardo = t5, não goblin). */
export function alignDemoPcTokenIds(scene: BattleScene, template: BattleScene): BattleScene {
  const pcSeeds = template.tokens.filter((t) => t.linked && t.actorId);
  if (!pcSeeds.length) return scene;

  const remap = new Map<string, string>();
  const tokens = scene.tokens.map((token) => {
    if (!token.actorId) return token;
    const seed = pcSeeds.find((s) => s.actorId === token.actorId);
    if (!seed || seed.id === token.id) return token;
    remap.set(token.id, seed.id);
    return { ...token, id: seed.id };
  });

  if (!remap.size) return scene;

  const seen = new Set<string>();
  const deduped = tokens.map((token, index) => {
    if (!seen.has(token.id)) {
      seen.add(token.id);
      return token;
    }
    let newId = `t-pc-clash-${index}`;
    while (seen.has(newId)) newId = `t-pc-clash-${index}-${seen.size}`;
    seen.add(newId);
    return { ...token, id: newId };
  });

  return { ...scene, tokens: deduped };
}

export function assertUniqueTokenIds(scene: BattleScene): void {
  const ids = scene.tokens.map((t) => t.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) {
    throw new Error(`Token IDs duplicados na cena: ${[...new Set(dup)].join(", ")}`);
  }
}
