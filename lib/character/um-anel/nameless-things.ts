/**
 * Coisas Sem Nome — gerador de adversário único, extraído de
 * livros/um-anel/13-apendice-patronos-e-ficha.md ("Nameless Things").
 * Referência de mesa pro Mestre (rolagens de Dado de Proeza/Sucesso pra
 * gerar identidade + estatísticas de uma criatura formidável e única) —
 * não mecanizado (é o Mestre quem rola e escolhe, como no livro).
 */

export const TOR_NAMELESS_FEAT_NAMES: Record<string, string> = {
  olho: "O Flagelo",
  "1": "O Açoite",
  "2": "O Horror",
  "3": "O Terror",
  "4": "O Profanador",
  "5": "O Devorador",
  "6": "O Perseguidor",
  "7": "O Caçador",
  "8": "O Vigia",
  "9": "O Rastejante",
  "10": "O Espreitador",
  runa: "A Chama",
};

export const TOR_NAMELESS_PLACE_SUFFIX: Record<number, string> = {
  1: "…nas Trevas",
  2: "…do Abismo",
  3: "…nas Profundezas",
  4: "…da Fossa",
  5: "…de Udûn",
  6: "…na Água",
};

export const TOR_NAMELESS_KNOWN_BY: Record<number, string> = {
  1: "…pelos Homens",
  2: "…pelos Elfos",
  3: "…pelos Anões",
  4: "…pelos Orcs",
  5: "…pelos Sábios",
  6: "…no saber antigo",
};

export const TOR_NAMELESS_FORM: Record<string, string> = {
  olho: "Como um Morcego",
  "1": "Como uma Aranha",
  "2": "Como um Peixe",
  "3": "Como uma Lesma",
  "4": "Como uma Minhoca",
  "5": "Como uma Centopeia",
  "6": "Como um Inseto",
  "7": "Como um Crustáceo",
  "8": "Como um Polvo",
  "9": "Como um Peixe",
  "10": "Como um Sapo",
  runa: "Como um Troll",
};

export const TOR_NAMELESS_FEATURE: Record<number, string> = {
  1: "…com olhos impiedosos",
  2: "…com grandes chifres",
  3: "…com pele luminosa",
  4: "…com uma cabeça enorme",
  5: "…com um corpo inchado",
  6: "…ainda maior",
};

/** Tabela 6 — Características (Dado de Proeza). */
export type TorNamelessCharacteristics = {
  roll: string;
  attributeLevelAndHate: number;
  armour: string;
  parry: string;
  endurance: number;
  might: number;
  combatProficiency: number;
  fellAbilityCount: number;
};

export const TOR_NAMELESS_CHARACTERISTICS: TorNamelessCharacteristics[] = [
  { roll: "Olho", attributeLevelAndHate: 12, armour: "6d", parry: "+4", endurance: 128, might: 3, combatProficiency: 4, fellAbilityCount: 5 },
  { roll: "1-2", attributeLevelAndHate: 11, armour: "5d", parry: "+3", endurance: 112, might: 3, combatProficiency: 4, fellAbilityCount: 5 },
  { roll: "3-4", attributeLevelAndHate: 10, armour: "5d", parry: "+2", endurance: 96, might: 3, combatProficiency: 4, fellAbilityCount: 4 },
  { roll: "5-6", attributeLevelAndHate: 9, armour: "4d", parry: "+1", endurance: 72, might: 2, combatProficiency: 3, fellAbilityCount: 4 },
  { roll: "7-8", attributeLevelAndHate: 8, armour: "4d", parry: "—", endurance: 64, might: 2, combatProficiency: 3, fellAbilityCount: 3 },
  { roll: "9-10", attributeLevelAndHate: 7, armour: "3d", parry: "—", endurance: 56, might: 2, combatProficiency: 2, fellAbilityCount: 3 },
  { roll: "Runa", attributeLevelAndHate: 6, armour: "2d", parry: "—", endurance: 48, might: 2, combatProficiency: 2, fellAbilityCount: 2 },
];

/** Tabela 7 — Formas de Ataque (Dado de Sucesso, role 2x: primário e secundário). */
export type TorNamelessAttackForm = { roll: string; name: string; damage: string; injury: number; specialDamage: string };

export const TOR_NAMELESS_ATTACK_FORMS: TorNamelessAttackForm[] = [
  { roll: "1-2", name: "Esmagar (cascos, patas)", damage: "Nível de Atributo", injury: 14, specialDamage: "Atropelar" },
  { roll: "3-4", name: "Morder (mandíbulas, bico)", damage: "Nível de Atributo −2", injury: 16, specialDamage: "Quebrar Escudo" },
  { roll: "5-6", name: "Rasgar (presas, garras)", damage: "Nível de Atributo −3", injury: 18, specialDamage: "Perfurar" },
];

/** Tabela 8 — Habilidades Sinistras (Dado de Proeza). Todas as Coisas Sem Nome
 * também têm Medo do Fogo e Odeia a Luz do Sol (compartilhadas, iguais aos Orcs). */
export type TorNamelessFellAbility = { roll: string; name: string; effect: string };

export const TOR_NAMELESS_FELL_ABILITIES: TorNamelessFellAbility[] = [
  { roll: "Olho", name: "Resistência Hedionda", effect: "Quando sofreria dano que a levaria a 0 de Resistência, cancele e sofra uma Ferida em vez disso." },
  { roll: "1", name: "Ferida Mortal", effect: "Alvos feridos rolam a Severidade da Ferida Desfavorecida." },
  { roll: "2", name: "Morador das Trevas", effect: "Todas as rolagens são Favorecidas na escuridão." },
  { roll: "3", name: "Fedor Nauseante", effect: "Um fedor esmagador faz qualquer herói engajado perder (1d) em rolagens de ataque." },
  { roll: "4", name: "Força Terrível", effect: "Se acertar e causar Golpe Perfurante, gaste 1 Ódio pra tornar a Proteção do alvo Desfavorecida." },
  { roll: "5", name: "Veneno", effect: "Gaste 1 ícone de sucesso pra infligir uma perda grave de Resistência ao alvo." },
  { roll: "6", name: "Investida Selvagem", effect: "Gaste 1 Ódio após um ataque pra rolar um segundo ataque imediato no mesmo alvo (com outra forma de ataque)." },
  { roll: "7", name: "Agarrar Vítima", effect: "Num ataque bem-sucedido, agarra o alvo — só pode lutar em Avançado com ataques desarmados. Atacantes podem gastar 1 ícone de sucesso pra libertar o alvo." },
  { roll: "8", name: "Golpe de Pavor", effect: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem Sombra (Pavor) igual ao Vigor da criatura. Quem falhar fica atordoado e não pode gastar Esperança pelo resto da luta." },
  { roll: "9", name: "Golpe Arrasador", effect: "Gaste 1 ícone de sucesso pra atingir todos os adversários engajados: o mesmo resultado é comparado ao Bloqueio de cada alvo separadamente." },
  { roll: "10", name: "Pele Grossa", effect: "Gaste 1 Ódio pra ganhar (1d) numa rolagem de Proteção." },
  { roll: "Runa", name: "Coisa de Terror", effect: "No início do combate, todos os heróis à vista ganham Sombra (Pavor) igual ao Vigor da criatura. Se Arrasados, ficam Desfavorecidos em ataques." },
];
