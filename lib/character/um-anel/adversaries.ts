import type { TorAdversaryStats } from "./adversary-types";

/**
 * Adversários de exemplo pro combate tático (v1) — extraídos de
 * livros/um-anel/08-mestre-e-adversarios.md. Habilidades Sinistras são
 * texto informativo pro Mestre no v1 (gasto de Ódio pra ativá-las não é
 * mecanizado ainda — ver plano, "Deferido pra v1.1").
 */
export const TOR_ADVERSARIES: TorAdversaryStats[] = [
  {
    id: "soldado-orc",
    name: "Soldado Orc",
    traits: "Rebelde, Vingativo",
    tier: "mob",
    attributeLevel: 3,
    endurance: 12,
    might: 1,
    hate: 3,
    hateKind: "hate",
    parry: 1,
    armour: 2,
    description:
      "Armados com as clássicas espadas tortas, os Soldados Orc são barulhentos e indisciplinados.",
    actions: [
      { id: "cimitarra", label: "Cimitarra", rating: 3, damage: 3, injury: 16 },
      { id: "lanca", label: "Lança", rating: 2, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      {
        name: "Covarde",
        text: "No início da rodada, foge do campo de batalha se estiver com 0 de Ódio e desengajado.",
      },
    ],
  },
  {
    id: "cacique-orc",
    name: "Cacique Orc",
    traits: "Cruel, Endurecido",
    tier: "elite",
    attributeLevel: 5,
    endurance: 20,
    might: 1,
    hate: 5,
    hateKind: "hate",
    parry: 3,
    armour: 3,
    description:
      "Só os Orcs mais cruéis vivem o bastante pra virar caciques e liderar seu bando à batalha.",
    actions: [
      { id: "cimitarra", label: "Cimitarra", rating: 3, damage: 3, injury: 16 },
      { id: "lanca", label: "Lança", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Grande Salto", text: "Gaste 1 Ódio pra atacar qualquer herói, em qualquer postura, incluindo Retaguarda." },
      { name: "Velocidade de Serpente", text: "Quando alvo de um ataque, gaste 1 Ódio pra tornar a rolagem de ataque Desfavorecida." },
      { name: "Grito de Triunfo", text: "Gaste 1 Ódio pra restaurar 1 Ódio a todos os outros Orcs na luta." },
    ],
  },
  {
    id: "warg",
    name: "Warg",
    traits: "Olhos Aguçados, Sombrio",
    tier: "mob",
    attributeLevel: 3,
    endurance: 12,
    might: 1,
    hate: 3,
    hateKind: "hate",
    parry: 0,
    armour: 1,
    description: "Lobos malignos de astúcia perversa e intenção maliciosa.",
    actions: [{ id: "presas", label: "Presas", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"] }],
    fellAbilities: [
      {
        name: "Medo do Fogo",
        text: "Perde 1 Ódio no início de cada rodada engajado em combate corpo a corpo com um adversário empunhando tocha ou item em chamas.",
      },
      { name: "Velocidade de Serpente", text: "Quando alvo de um ataque, gaste 1 Ódio pra tornar a rolagem de ataque Desfavorecida." },
    ],
  },
  {
    id: "grande-troll-das-cavernas",
    name: "Grande Troll das Cavernas",
    traits: "Brutal, Perverso",
    tier: "boss",
    attributeLevel: 10,
    endurance: 80,
    might: 2,
    hate: 10,
    hateKind: "hate",
    parry: 0,
    armour: 3,
    description: "Enviado por Orcs pra esmagar as defesas e o moral dos inimigos que mais temem.",
    actions: [
      { id: "esmagar", label: "Esmagar", rating: 3, damage: 6, injury: 12, specialDamage: ["Agarrar"] },
      { id: "mordida", label: "Mordida", rating: 2, damage: 6, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      {
        name: "Resistência Hedionda",
        text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima.",
      },
      {
        name: "Golpe de Pavor",
        text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 2 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica atordoado e não pode gastar Esperança pelo resto da luta.",
      },
      { name: "Pele Grossa", text: "Gaste 1 ponto de Ódio pra ganhar (2d) numa rolagem de Proteção." },
      {
        name: "Obtuso",
        text: "Heróis em postura Avançado podem tentar uma Tarefa de Combate especial: rolagem de ENIGMA — sucesso reduz o Ódio do Troll em 1 (+1 por ícone de sucesso).",
      },
    ],
  },
];

export const TOR_ADVERSARY_BY_ID: Record<string, TorAdversaryStats> = Object.fromEntries(
  TOR_ADVERSARIES.map((a) => [a.id, a])
);
