import type { CharacterSheet } from "./types";
import { computeCulinary } from "./rules";
import { normalizeCharacter } from "./normalize";

export const DEMO_CHARACTERS: CharacterSheet[] = [
  normalizeCharacter({
    id: "pc-aventureiro",
    ownerId: "usr_demo_jogador",
    adventureId: "demo",
    name: "Aventureiro",
    biography: "Explorador das galerias de Valdremor. Especialista em trinchar e sobreviver na masmorra.",
    identity: {
      nivel: 3,
      xpTotal: 2800,
      raca: "Humano",
      classe: "Guerreiro",
      subclasse: "Caçador de Feras",
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
    id: "pc-aventureira-maga",
    ownerId: "usr_demo_jogador",
    adventureId: "demo",
    name: "Aventureira Maga",
    biography:
      "Piromante das Brasas nv. 5 — grimório de teste com magias de área (burst, cone, linha, muralha e cubo) para validar alvos no VTT.",
    identity: {
      nivel: 5,
      xpTotal: 1000,
      raca: "Humano",
      classe: "Mago",
      subclasse: "Piromante das Brasas",
      antecedente: "Erudito",
      talentos: [{ level: 4, id: "chama-controlada", name: "Chama Controlada" }],
    },
    attributes: {
      forca: 8,
      destreza: 14,
      constituicao: 14,
      inteligencia: 17,
      sabedoria: 12,
      carisma: 10,
    },
    culinary: computeCulinary("Mago", "Humano"),
    resources: {
      vida: { value: 32, max: 32 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 12, iniciativa: 2 },
    inventory: [
      { instanceId: "inv-mg-1", packId: "magias", entryId: "magias-chama-de-vinha", quantity: 1 },
      { instanceId: "inv-mg-2", packId: "magias", entryId: "magias-maos-gelidas", quantity: 1 },
      { instanceId: "inv-mg-3", packId: "magias", entryId: "magias-onda-de-trovao", quantity: 1 },
      { instanceId: "inv-mg-4", packId: "magias", entryId: "magias-muralha-hexagonal", quantity: 1 },
      { instanceId: "inv-mg-5", packId: "magias", entryId: "magias-nova-hex", quantity: 1 },
      { instanceId: "inv-mg-6", packId: "magias", entryId: "magias-ventania", quantity: 1 },
      { instanceId: "inv-mg-7", packId: "magias", entryId: "magias-bola-de-fogo", quantity: 1 },
      { instanceId: "inv-mg-8", packId: "magias", entryId: "magias-relampago", quantity: 1 },
      { instanceId: "inv-mg-9", packId: "magias", entryId: "magias-parede-de-fogo", quantity: 1 },
      { instanceId: "inv-mg-10", packId: "magias", entryId: "magias-cone-de-frio", quantity: 1 },
      { instanceId: "inv-mg-11", packId: "magias", entryId: "magias-grande-decomposicao", quantity: 1 },
    ],
    combatLoadout: { packId: "magias", entryId: "magias-bola-de-fogo" },
    lootEconomy: {
      po: 120,
      especiarias: { "ESP-03": 2 },
      minerios: {},
      tesouros: {},
    },
  }),
  normalizeCharacter({
    id: "pc-bardo-suporte",
    ownerId: "usr_demo_jogador",
    adventureId: "demo",
    name: "Lyra Cantochama",
    biography:
      "Barda de apoio — Inspiração de Batalha, Canção de Cura e Curar Ferimentos para testar vantagem, cura e buffs na mesa.",
    identity: {
      nivel: 6,
      xpTotal: 1500,
      raca: "Humano",
      classe: "Bardo",
      subclasse: "Estratega de Masmorra",
      antecedente: "Aventureiro",
      talentos: [],
    },
    attributes: {
      forca: 10,
      destreza: 14,
      constituicao: 12,
      inteligencia: 12,
      sabedoria: 11,
      carisma: 16,
    },
    culinary: computeCulinary("Bardo", "Humano"),
    resources: {
      vida: { value: 34, max: 34 },
      pontosAcao: { value: 5, max: 5 },
    },
    movement: { walk: 4, run: 6 },
    tactical: { defesa: 13, iniciativa: 2 },
    inventory: [
      {
        instanceId: "inv-bd-1",
        packId: "habilidades",
        entryId: "habilidades-inspiracao-de-batalha",
        quantity: 1,
      },
      {
        instanceId: "inv-bd-2",
        packId: "habilidades",
        entryId: "habilidades-cancao-de-cura",
        quantity: 1,
      },
      {
        instanceId: "inv-bd-3",
        packId: "magias",
        entryId: "magias-curar-ferimentos",
        quantity: 1,
      },
      {
        instanceId: "inv-bd-4",
        packId: "habilidades",
        entryId: "habilidades-tiro-certeiro",
        quantity: 1,
      },
    ],
    combatLoadout: { packId: "habilidades", entryId: "habilidades-inspiracao-de-batalha" },
    lootEconomy: {
      po: 35,
      especiarias: {},
      minerios: {},
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
