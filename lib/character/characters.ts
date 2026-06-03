import type { CharacterSheet } from "./types";
import { computeCulinary } from "./rules";
import { normalizeCharacter } from "./normalize";

const DEMO_CHARACTERS: CharacterSheet[] = [
  normalizeCharacter({
    id: "pc-aventureiro",
    ownerId: "usr_demo_jogador",
    name: "Aventureiro",
    biography: "Explorador das galerias de Valdremor. Especialista em trinchar e sobreviver na masmorra.",
    identity: {
      nivel: 3,
      xpTotal: 600,
      raca: "Humano",
      classe: "Guerreiro",
      subclasse: "Acougueiro de Batalha",
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
      pontosAcao: { value: 4, max: 4 },
    },
    movement: { walk: 4, run: 7 },
    tactical: { defesa: 13, iniciativa: 1 },
    inventory: [
      {
        instanceId: "inv-seed-1",
        packId: "armas",
        entryId: "armas-lamina-de-vinha",
        quantity: 1,
      },
      {
        instanceId: "inv-seed-2",
        packId: "armas",
        entryId: "armas-adagas-gemeas",
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
    combatLoadout: { packId: "armas", entryId: "armas-lamina-de-vinha" },
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
      pontosAcao: { value: 4, max: 4 },
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

export function listCharactersForUser(userId: string): CharacterSheet[] {
  return DEMO_CHARACTERS.filter((c) => c.ownerId === userId).map((c) =>
    normalizeCharacter({ ...c })
  );
}

export function createCharacter(userId: string, name: string): CharacterSheet {
  const sheet = normalizeCharacter({
    id: `pc-${Date.now().toString(36)}`,
    ownerId: userId,
    name: name.trim().slice(0, 80) || "Novo personagem",
    biography: "",
    identity: {
      nivel: 1,
      xpTotal: 0,
      raca: "Humano",
      classe: "Guerreiro",
      antecedente: "Aventureiro",
      talentos: [],
    },
    attributes: {
      forca: 12,
      destreza: 12,
      constituicao: 12,
      inteligencia: 10,
      sabedoria: 10,
      carisma: 10,
    },
    culinary: computeCulinary("Guerreiro", "Humano"),
    resources: {
      vida: { value: 20, max: 20 },
      pontosAcao: { value: 4, max: 4 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 11, iniciativa: 0 },
    inventory: [],
    combatLoadout: null,
  });
  DEMO_CHARACTERS.push(sheet);
  return sheet;
}
