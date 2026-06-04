import type { CharacterSheet } from "./types";
import { computeCulinary } from "./rules";
import { normalizeCharacter } from "./normalize";

export const DEMO_CHARACTERS: CharacterSheet[] = [
  normalizeCharacter({
    id: "pc-aventureiro",
    ownerId: "usr_demo_jogador",
    name: "Aventureiro",
    biography: "Explorador das galerias de Valdremor. Especialista em trinchar e sobreviver na masmorra.",
    identity: {
      nivel: 3,
      xpTotal: 2800,
      raca: "Humano",
      classe: "Guerreiro",
      subclasse: "Predador Voraz",
      antecedente: "Explorador",
      talentos: [],
    },
    attributes: {
      forca: 15,
      destreza: 13,
      constituicao: 14,
      inteligencia: 11,
      sabedoria: 11,
      carisma: 11,
    },
    culinary: computeCulinary("Guerreiro", "Humano"),
    resources: {
      vida: { value: 28, max: 28 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 7 },
    tactical: { defesa: 13, iniciativa: 1 },
    inventory: [
      {
        instanceId: "inv-seed-1",
        packId: "armas",
        entryId: "armas-wpn-s01",
        quantity: 1,
      },
      {
        instanceId: "inv-seed-2",
        packId: "armas",
        entryId: "armas-wpn-o02",
        quantity: 1,
      },
      {
        instanceId: "inv-seed-3",
        packId: "habilidades",
        entryId: "habilidades-investida-do-guerreiro",
        quantity: 1,
      },
      {
        instanceId: "inv-seed-4",
        packId: "habilidades",
        entryId: "habilidades-golpe-flanqueador",
        quantity: 1,
      },
      {
        instanceId: "inv-seed-5",
        packId: "habilidades",
        entryId: "habilidades-postura-defensiva",
        quantity: 1,
      },
      {
        instanceId: "inv-seed-6",
        packId: "equipamentos",
        entryId: "equipamentos-kit-de-trinchar",
        quantity: 1,
      },
    ],
    combatLoadout: { packId: "armas", entryId: "armas-wpn-s01" },
    lootEconomy: {
      po: 48,
      especiarias: { "ESP-12": 1, "ESP-07": 2 },
      minerios: { "MIN-03": 1 },
      tesouros: {},
    },
  }),
  normalizeCharacter({
    id: "pc-mestre-demo",
    ownerId: "usr_demo_mestre",
    name: "NPC Demo",
    biography: "Ficha de exemplo do mestre.",
    identity: {
      nivel: 1,
      xpTotal: 0,
      raca: "Elfo",
      classe: "Mago",
      antecedente: "Erudito",
      talentos: [],
    },
    attributes: {
      forca: 9,
      destreza: 15,
      constituicao: 10,
      inteligencia: 17,
      sabedoria: 12,
      carisma: 10,
    },
    culinary: computeCulinary("Mago", "Elfo"),
    resources: {
      vida: { value: 10, max: 10 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 12, iniciativa: 2 },
    inventory: [
      {
        instanceId: "inv-m-1",
        packId: "magias",
        entryId: "magias-chama-de-vinha",
        quantity: 1,
      },
      {
        instanceId: "inv-m-2",
        packId: "magias",
        entryId: "magias-nova-hex",
        quantity: 1,
      },
      {
        instanceId: "inv-m-3",
        packId: "magias",
        entryId: "magias-muralha-hexagonal",
        quantity: 1,
      },
    ],
    combatLoadout: { packId: "magias", entryId: "magias-nova-hex" },
  }),
];

/** Demo / cliente — sem Postgres. Servidor: `resolveCharacter`. */
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
