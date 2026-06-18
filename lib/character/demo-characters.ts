import type { CharacterSheet } from "./types";
import { computeCulinary } from "./rules";
import { normalizeCharacter } from "./normalize";

/** Mesa demo — 4 PCs nv.6 para teste de combate (classes/trilhas distintas). */
export const DEMO_CHARACTERS: CharacterSheet[] = [
  normalizeCharacter({
    id: "pc-thrain-ferroescudo",
    ownerId: "usr_demo_jogador",
    adventureId: "demo",
    name: "Thrain Ferroescudo",
    biography:
      "Anão guerreiro nv.6 — Quebrador de Carapaças. Trilha nv.4: Percussão Penetrante; Ataque Extra (nv.5).",
    identity: {
      nivel: 6,
      xpTotal: 1500,
      raca: "Anão",
      classe: "Guerreiro",
      subclasse: "Quebrador de Carapaças",
      antecedente: "Soldado",
      talentos: [{ level: 4, id: "percussao-penetrante", name: "Percussão Penetrante" }],
    },
    attributes: {
      forca: 17,
      destreza: 12,
      constituicao: 18,
      inteligencia: 10,
      sabedoria: 12,
      carisma: 10,
    },
    culinary: computeCulinary("Guerreiro", "Anão"),
    resources: {
      vida: { value: 64, max: 64 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 7 },
    tactical: { defesa: 15, iniciativa: 1 },
    inventory: [
      { instanceId: "inv-thrain-1", packId: "armas", entryId: "armas-wpn-s02", quantity: 1 },
      { instanceId: "inv-thrain-2", packId: "armas", entryId: "armas-wpn-o02", quantity: 1 },
      { instanceId: "inv-thrain-3", packId: "habilidades", entryId: "habilidades-investida-do-guerreiro", quantity: 1 },
      { instanceId: "inv-thrain-4", packId: "habilidades", entryId: "habilidades-postura-defensiva", quantity: 1 },
      { instanceId: "inv-thrain-5", packId: "habilidades", entryId: "habilidades-golpe-flanqueador", quantity: 1 },
      { instanceId: "inv-thrain-6", packId: "equipamentos", entryId: "equipamentos-arm-03", quantity: 1 },
      { instanceId: "inv-thrain-7", packId: "equipamentos", entryId: "equipamentos-kit-de-trinchar", quantity: 1 },
    ],
    combatLoadout: { packId: "armas", entryId: "armas-wpn-s02" },
    armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-03" },
    lootEconomy: { po: 80, especiarias: { "ESP-07": 1 }, minerios: { "MIN-02": 2 }, tesouros: {} },
  }),
  normalizeCharacter({
    id: "pc-lyanna-umbral",
    ownerId: "usr_demo_jogador",
    adventureId: "demo",
    name: "Lyanna Umbral",
    biography:
      "Elfa maga nv.6 — Piromante das Brasas. Trilha nv.4: Chama Controlada; Afinidade Arcânica (nv.5).",
    identity: {
      nivel: 6,
      xpTotal: 1500,
      raca: "Elfo",
      classe: "Mago",
      subclasse: "Piromante das Brasas",
      antecedente: "Erudito",
      talentos: [{ level: 4, id: "chama-controlada", name: "Chama Controlada" }],
    },
    attributes: {
      forca: 8,
      destreza: 15,
      constituicao: 14,
      inteligencia: 18,
      sabedoria: 12,
      carisma: 10,
    },
    culinary: computeCulinary("Mago", "Elfo"),
    resources: {
      vida: { value: 38, max: 38 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 13, iniciativa: 2 },
    inventory: [
      { instanceId: "inv-lyanna-1", packId: "magias", entryId: "magias-bola-de-fogo", quantity: 1 },
      { instanceId: "inv-lyanna-2", packId: "magias", entryId: "magias-cone-de-frio", quantity: 1 },
      { instanceId: "inv-lyanna-3", packId: "magias", entryId: "magias-parede-de-fogo", quantity: 1 },
      { instanceId: "inv-lyanna-4", packId: "magias", entryId: "magias-nova-radiante", quantity: 1 },
      { instanceId: "inv-lyanna-5", packId: "magias", entryId: "magias-relampago", quantity: 1 },
      { instanceId: "inv-lyanna-6", packId: "magias", entryId: "magias-escudo-arcano", quantity: 1 },
      { instanceId: "inv-lyanna-7", packId: "magias", entryId: "magias-maos-gelidas", quantity: 1 },
      { instanceId: "inv-lyanna-8", packId: "magias", entryId: "magias-muralha-segmentada", quantity: 1 },
    ],
    combatLoadout: { packId: "magias", entryId: "magias-bola-de-fogo" },
    lootEconomy: { po: 95, especiarias: { "ESP-03": 1 }, minerios: {}, tesouros: {} },
  }),
  normalizeCharacter({
    id: "pc-maelis-purificador",
    ownerId: "usr_demo_jogador",
    adventureId: "demo",
    name: "Maelis Purificador",
    biography:
      "Humana clériga nv.6 — Sacerdote Purificador. Trilha nv.4: Purificar Veneno; suporte e dano sagrado.",
    identity: {
      nivel: 6,
      xpTotal: 1500,
      raca: "Humano",
      classe: "Clérigo",
      subclasse: "Sacerdote Purificador",
      antecedente: "Acólito",
      talentos: [{ level: 4, id: "purificar-veneno", name: "Purificar Veneno" }],
    },
    attributes: {
      forca: 12,
      destreza: 10,
      constituicao: 14,
      inteligencia: 12,
      sabedoria: 17,
      carisma: 13,
    },
    culinary: computeCulinary("Clérigo", "Humano"),
    resources: {
      vida: { value: 45, max: 45 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 14, iniciativa: 0 },
    inventory: [
      { instanceId: "inv-maelis-1", packId: "magias", entryId: "magias-curar-ferimentos", quantity: 1 },
      { instanceId: "inv-maelis-2", packId: "magias", entryId: "magias-purificar-veneno", quantity: 1 },
      { instanceId: "inv-maelis-3", packId: "magias", entryId: "magias-cura-em-massa", quantity: 1 },
      { instanceId: "inv-maelis-4", packId: "magias", entryId: "magias-estabilizar", quantity: 1 },
      { instanceId: "inv-maelis-5", packId: "magias", entryId: "magias-raios-de-enfraquecimento", quantity: 1 },
      { instanceId: "inv-maelis-6", packId: "habilidades", entryId: "habilidades-canalizar-energia", quantity: 1 },
      { instanceId: "inv-maelis-7", packId: "habilidades", entryId: "habilidades-escudo-magico", quantity: 1 },
      { instanceId: "inv-maelis-8", packId: "armas", entryId: "armas-wpn-s01", quantity: 1 },
      { instanceId: "inv-maelis-9", packId: "equipamentos", entryId: "equipamentos-arm-02", quantity: 1 },
    ],
    combatLoadout: { packId: "habilidades", entryId: "habilidades-canalizar-energia" },
    armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-02" },
    lootEconomy: { po: 55, especiarias: {}, minerios: {}, tesouros: {} },
  }),
  normalizeCharacter({
    id: "pc-pippin-sussurro",
    ownerId: "usr_demo_jogador",
    adventureId: "demo",
    name: "Pippin Sussurro",
    biography:
      "Halfling ladino nv.6 — Assassino Venenoso. Trilha nv.4: Resistência a Veneno; furtividade e emboscada.",
    identity: {
      nivel: 6,
      xpTotal: 1500,
      raca: "Halfling",
      classe: "Ladino",
      subclasse: "Assassino Venenoso",
      antecedente: "Criminoso",
      talentos: [{ level: 4, id: "resistencia-a-veneno", name: "Resistência a Veneno" }],
    },
    attributes: {
      forca: 8,
      destreza: 18,
      constituicao: 12,
      inteligencia: 12,
      sabedoria: 14,
      carisma: 12,
    },
    culinary: computeCulinary("Ladino", "Halfling"),
    resources: {
      vida: { value: 39, max: 39 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 15, iniciativa: 4 },
    inventory: [
      { instanceId: "inv-pippin-1", packId: "armas", entryId: "armas-wpn-s01", quantity: 1 },
      { instanceId: "inv-pippin-2", packId: "habilidades", entryId: "habilidades-passo-das-sombras", quantity: 1 },
      { instanceId: "inv-pippin-3", packId: "habilidades", entryId: "habilidades-emboscada", quantity: 1 },
      { instanceId: "inv-pippin-4", packId: "habilidades", entryId: "habilidades-finta", quantity: 1 },
      { instanceId: "inv-pippin-5", packId: "habilidades", entryId: "habilidades-golpe-flanqueador", quantity: 1 },
      { instanceId: "inv-pippin-6", packId: "equipamentos", entryId: "equipamentos-arm-01", quantity: 1 },
    ],
    combatLoadout: { packId: "armas", entryId: "armas-wpn-s01" },
    armorLoadout: { packId: "equipamentos", entryId: "equipamentos-arm-01" },
    lootEconomy: { po: 42, especiarias: { "ESP-12": 2 }, minerios: {}, tesouros: {} },
  }),
];

/** @deprecated Use `resolveCharacter` (servidor) ou `getCharacterFromRegistry`. */
export function getCharacter(id: string): CharacterSheet | null {
  const found = DEMO_CHARACTERS.find((c) => c.id === id);
  return found ? normalizeCharacter({ ...found }) : null;
}

export function canEditCharacter(
  character: CharacterSheet,
  userId: string,
  role: "admin" | "member"
): boolean {
  if (role === "admin") return true;
  return character.ownerId === userId;
}
