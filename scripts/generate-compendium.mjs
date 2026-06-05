/**
 * Gera compêndios Eldarin a partir do Livro do Mestre / Parte X (magias).
 * Uso: node scripts/generate-compendium.mjs
 *
 * Variantes Elite/Colossal na mesa são aplicadas em runtime por
 * lib/vtt/monster-scaling.ts (spawn), não duplicam entradas aqui.
 * Cap. XII groupLevelDelta também é runtime no painel de invocação.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const MONSTER_TAMANHOS = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "data", "monster-tamanhos.json"), "utf8")
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "compendiums");

function mod(n) {
  return Math.floor((n - 10) / 2);
}

function monsterActions(name, nivel, tier, attrs) {
  const forMod = mod(attrs.forca);
  const bite = tier === "boss" ? "2d8" : tier === "mini" ? "1d10" : "1d6";
  const actions = [
    {
      packId: "unarmed",
      entryId: `${slug(name)}-mordida`,
      name: "Mordida",
      kind: "weapon",
      resolution: "attack",
      damageFormula: bite,
      damageType: "perfurante",
      attackBonus: nivel >= 4 ? 2 : nivel >= 2 ? 1 : 0,
      rangeHex: 1,
      paCost: 2,
      label: "Mordida · 1 hex · PA 2",
    },
  ];
  if (tier !== "mob" || nivel >= 2) {
    actions.push({
      packId: "unarmed",
      entryId: `${slug(name)}-garras`,
      name: "Garras",
      kind: "weapon",
      resolution: "attack",
      damageFormula: tier === "boss" ? "2d6" : "1d8",
      damageType: "cortante",
      attackBonus: mod(attrs.agilidade),
      rangeHex: 1,
      paCost: 2,
      label: "Garras · 1 hex · PA 2",
    });
  }
  if (nivel >= 4) {
    actions.push({
      packId: "unarmed",
      entryId: `${slug(name)}-special`,
      name: "Ataque especial",
      kind: "spell",
      resolution: "attack",
      damageFormula: tier === "boss" ? "3d10" : "2d8",
      damageType: "mágico",
      attackBonus: nivel,
      rangeHex: tier === "boss" ? 6 : 4,
      paCost: 2,
      label: `Ataque especial · ${tier === "boss" ? 6 : 4} hex · PA 2`,
    });
  } else if (nivel >= 2) {
    actions.push({
      packId: "unarmed",
      entryId: `${slug(name)}-special`,
      name: "Investida",
      kind: "weapon",
      resolution: "attack",
      damageFormula: "1d10",
      damageType: "contundente",
      attackBonus: forMod,
      rangeHex: 2,
      paCost: 2,
      label: "Investida · 2 hex · PA 2",
    });
  }
  return actions;
}

function slug(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Template base; Elite/Colossal são multiplicadores no spawn VTT. */
function mob(
  name,
  nivel,
  hp,
  ca,
  tier,
  attrs = { forca: 10, agilidade: 10 },
  move = { walk: 4, run: 6 },
  pa = 6,
  desc = ""
) {
  const paMin = 6;
  const paMax = Math.max(paMin, pa);
  const entryId = `monstros-${slug(name)}`;
  const tamanho = MONSTER_TAMANHOS[entryId] ?? "medium";
  return {
    id: entryId,
    name,
    type: "npc",
    system: {
      description: `<p>${desc || `${name} — espécime nv ${nivel} (Eldarin v4).`}</p>`,
      attributes: {
        forca: { value: attrs.forca, mod: mod(attrs.forca) },
        agilidade: { value: attrs.agilidade, mod: mod(attrs.agilidade) },
      },
      resources: {
        vida: { value: hp, max: hp },
        pontosAcao: { value: paMax, max: paMax },
      },
      movement: { hex: { walk: { value: move.walk }, run: { value: move.run } } },
      tactical: { defesa: { value: ca }, ameaca: { value: nivel }, tier, tamanho },
      actions: monsterActions(name, nivel, tier, attrs),
    },
  };
}

function monCod(n) {
  return `MON-${String(n).padStart(3, "0")}`;
}

/** 001–060 + extras (ordem = LIVRO-DO-JOGADOR §6.2) */
const MONSTERS = [
  mob("Zumbi de Masmorra", 2, 22, 10, "mob", { forca: 13, agilidade: 8 }, { walk: 3, run: 5 }),
  mob("Esqueleto Armado", 2, 18, 13, "mob", { forca: 10, agilidade: 14 }),
  mob("Ghoul", 3, 36, 12, "mob", { forca: 13, agilidade: 15 }),
  mob("Espectro", 4, 28, 14, "mini", { forca: 8, agilidade: 14 }),
  mob("Lich (Arquiliche)", 18, 285, 17, "boss", { forca: 11, agilidade: 16 }, { walk: 4, run: 6 }, 4),
  mob("Assombração", 3, 45, 13, "mob", { forca: 6, agilidade: 16 }),
  mob("Vampiro", 10, 144, 16, "boss", { forca: 18, agilidade: 18 }, { walk: 5, run: 8 }),
  mob("Cavaleiro Espectral", 5, 45, 14, "mini", { forca: 16, agilidade: 12 }),
  mob("Múmia", 5, 58, 13, "mini", { forca: 16, agilidade: 10 }),
  mob("Dragonete de Magma", 6, 68, 15, "mini", { forca: 17, agilidade: 12 }, { walk: 4, run: 7 }),
  mob("Wyvern", 9, 110, 14, "mini", { forca: 19, agilidade: 14 }, { walk: 4, run: 10 }),
  mob("Dragão Jovem de Gelo", 13, 178, 17, "boss", { forca: 22, agilidade: 12 }, { walk: 5, run: 9 }),
  mob("Drake de Pedra", 5, 62, 16, "mini", { forca: 19, agilidade: 10 }),
  mob("Dragão Ancião de Fogo", 19, 546, 19, "boss", { forca: 27, agilidade: 12 }, { walk: 6, run: 10 }, 5),
  mob("Golem de Pedra", 8, 92, 17, "mini", { forca: 20, agilidade: 8 }, { walk: 3, run: 5 }),
  mob("Armadura Animada", 1, 33, 18, "mob", { forca: 14, agilidade: 8 }, { walk: 2, run: 4 }),
  mob("Golem de Ferro Vulcânico", 10, 105, 18, "mini", { forca: 22, agilidade: 8 }, { walk: 3, run: 5 }),
  mob("Autômato de Gênio", 7, 76, 16, "mini", { forca: 16, agilidade: 14 }),
  mob("Minotauro", 6, 52, 14, "mini", { forca: 18, agilidade: 11 }),
  mob("Basilisco", 7, 52, 15, "mini", { forca: 16, agilidade: 8 }),
  mob("Manticora", 8, 98, 14, "mini", { forca: 17, agilidade: 15 }, { walk: 5, run: 8 }),
  mob("Grifo", 5, 59, 13, "mini", { forca: 18, agilidade: 15 }, { walk: 5, run: 10 }),
  mob("Cocatriz", 4, 27, 12, "mob", { forca: 12, agilidade: 14 }),
  mob("Aranha Tecerrochas", 2, 26, 13, "mob", { forca: 12, agilidade: 16 }),
  mob("Escorpião Gigante", 3, 52, 15, "mob", { forca: 15, agilidade: 12 }),
  mob("Centopeia Cáustica", 4, 65, 13, "mob", { forca: 14, agilidade: 13 }),
  mob("Besouro-Diamante", 5, 45, 15, "mini", { forca: 16, agilidade: 12 }),
  mob("Sapo-Engolidor", 6, 75, 12, "mini", { forca: 18, agilidade: 10 }),
  mob("Kraken Menor", 12, 152, 16, "boss", { forca: 22, agilidade: 10 }, { walk: 3, run: 6 }),
  mob("Serpente-do-Abismo", 8, 85, 14, "mini", { forca: 18, agilidade: 14 }),
  mob("Tubarão-Cego", 5, 58, 13, "mini", { forca: 18, agilidade: 14 }, { walk: 5, run: 8 }),
  mob("Goblin de Caverna", 1, 7, 13, "mob", { forca: 8, agilidade: 14 }, { walk: 4, run: 6 }, 3),
  mob("Hobgoblin Guerreiro", 3, 11, 15, "mob", { forca: 13, agilidade: 12 }),
  mob("Orc de Masmorra", 4, 15, 14, "mob", { forca: 16, agilidade: 10 }),
  mob("Cogumelo-Rei", 7, 68, 12, "mini", { forca: 14, agilidade: 8 }),
  mob("Treant Podre", 9, 136, 15, "mini", { forca: 20, agilidade: 8 }, { walk: 3, run: 5 }),
  mob("Planta Carnívora Gigante", 5, 55, 11, "mob", { forca: 17, agilidade: 6 }),
  mob("Slime Ácido", 2, 22, 8, "mob", { forca: 12, agilidade: 6 }, { walk: 2, run: 3 }),
  mob("Slime de Cristal", 3, 38, 10, "mob", { forca: 10, agilidade: 8 }),
  mob("Elemental de Fogo", 6, 72, 13, "mini", { forca: 14, agilidade: 16 }),
  mob("Elemental de Gelo", 6, 75, 14, "mini", { forca: 16, agilidade: 14 }),
  mob("Yeti das Profundezas", 8, 114, 13, "mini", { forca: 20, agilidade: 10 }),
  mob("Lobo do Inverno", 3, 22, 12, "mob", { forca: 14, agilidade: 15 }, { walk: 5, run: 8 }),
  mob("Mímico de Baú", 4, 52, 12, "mob", { forca: 17, agilidade: 10 }),
  mob("Doppelganger", 5, 52, 14, "mini", { forca: 14, agilidade: 16 }),
  mob("Hidra das Cavernas", 9, 168, 15, "boss", { forca: 20, agilidade: 12 }),
  mob("Quimera", 10, 114, 14, "boss", { forca: 19, agilidade: 14 }, { walk: 5, run: 8 }),
  mob("Anjo Caído", 14, 220, 18, "boss", { forca: 22, agilidade: 18 }, { walk: 5, run: 10 }),
  mob("Gárgula de Cristal", 4, 52, 15, "mob", { forca: 14, agilidade: 15 }),
  mob("Aberração Tentacular", 8, 84, 14, "mini", { forca: 18, agilidade: 10 }),
  mob("Basilisco de Magma", 8, 88, 15, "mini", { forca: 17, agilidade: 10 }),
  mob("Sereia das Profundezas", 6, 65, 13, "mini", { forca: 14, agilidade: 14 }),
  mob("Troll de Pedra", 7, 105, 15, "mini", { forca: 20, agilidade: 8 }),
  mob("Ciclope", 9, 138, 14, "boss", { forca: 22, agilidade: 8 }),
  mob("Harpia de Caverna", 4, 38, 12, "mob", { forca: 12, agilidade: 16 }, { walk: 4, run: 8 }),
  mob("Roper", 5, 93, 20, "mini", { forca: 18, agilidade: 6 }),
  mob("Aboleth", 16, 195, 17, "boss", { forca: 16, agilidade: 10 }, { walk: 3, run: 5 }),
  mob("Pudim Negro", 7, 85, 7, "mini", { forca: 14, agilidade: 6 }, { walk: 2, run: 4 }),
  mob("Lagosta-Gigante Abissal", 4, 52, 16, "mob", { forca: 16, agilidade: 10 }),
  mob("Caranguejo-Eremita Colossal", 7, 88, 18, "mini", { forca: 18, agilidade: 8 }),
  mob("Aranha-Cavaleira", 9, 105, 14, "mini", { forca: 14, agilidade: 18 }),
  mob("Mosca-Carniça Colossal", 2, 8, 11, "mob", { forca: 8, agilidade: 14 }, { walk: 4, run: 6 }),
  mob("Besouro-Trovão", 5, 45, 15, "mini", { forca: 14, agilidade: 12 }),
  mob("Verme Gigante de Pedra", 10, 142, 18, "boss", { forca: 22, agilidade: 6 }, { walk: 4, run: 6 }),
  mob("Salamandra Gigante", 6, 65, 13, "mini", { forca: 15, agilidade: 12 }),
  mob("Behemoth de Pedra", 14, 230, 19, "boss", { forca: 24, agilidade: 6 }, { walk: 4, run: 6 }),
  mob("Fera da Sombra", 8, 78, 14, "mini", { forca: 12, agilidade: 16 }),
  mob("Medusa", 7, 75, 15, "mini", { forca: 14, agilidade: 14 }),
  mob("Fênix de Caverna", 13, 152, 16, "boss", { forca: 16, agilidade: 18 }, { walk: 5, run: 10 }),
  mob("Gigante de Pedra", 12, 126, 17, "boss", { forca: 23, agilidade: 8 }, { walk: 4, run: 6 }),
  mob("Bruxa da Masmorra", 8, 82, 17, "mini", { forca: 12, agilidade: 14 }),
  mob("Fera Seminal", 11, 108, 13, "boss", { forca: 16, agilidade: 12 }),
  mob("Carniçal Alado", 9, 104, 15, "mini", { forca: 15, agilidade: 16 }, { walk: 5, run: 10 }),
  mob("Balor", 19, 262, 19, "boss", { forca: 26, agilidade: 14 }, { walk: 5, run: 8 }, 5),
  mob("Enxame de Ratos-Cadáveres", 2, 24, 10, "mob", { forca: 10, agilidade: 14 }, { walk: 4, run: 6 }),
  mob("Elemental de Terra", 8, 126, 17, "mini", { forca: 20, agilidade: 8 }, { walk: 3, run: 5 }),
  mob("Banshee", 8, 58, 12, "mini", { forca: 8, agilidade: 14 }),
  mob("Morcego-Tirano", 5, 65, 12, "mini", { forca: 16, agilidade: 14 }, { walk: 5, run: 10 }),
  mob("Ooze Ocular", 6, 72, 13, "mini", { forca: 12, agilidade: 10 }, { walk: 2, run: 4 }),
  mob("Tarrasque (Bebê)", 20, 676, 25, "boss", { forca: 30, agilidade: 10 }, { walk: 6, run: 10 }, 5),
  // aliases mesa spawn (sem codigo 001–080)
  { ...mob("Goblin", 1, 7, 13, "mob", { forca: 8, agilidade: 14 }, { walk: 4, run: 6 }, 3, "Alias de Goblin de Caverna para spawn rápido."), spawnAlias: true },
  { ...mob("Esqueleto de Guarda", 2, 22, 14, "mob", { forca: 12, agilidade: 10 }), spawnAlias: true },
  { ...mob("Slime de Masmorra", 2, 30, 11, "mob", { forca: 14, agilidade: 6 }, { walk: 2, run: 3 }), spawnAlias: true },
];

let catalogSeq = 0;
for (const entry of MONSTERS) {
  if (entry.spawnAlias) {
    entry.system.catalogId = `MON-SPAWN-${slug(entry.name)}`;
    continue;
  }
  catalogSeq += 1;
  entry.system.catalogId = monCod(catalogSeq);
}

function spell(
  name,
  nivel,
  escola,
  alcanceHex,
  pa,
  desc,
  opts = {}
) {
  const s = {
    id: `magias-${slug(name)}`,
    name,
    type: "magia",
    system: {
      catalogId: `MAG-${slug(name)}`,
      description: `<p>${desc}</p>`,
      tactical: { alcanceHex: { value: alcanceHex, min: 0 }, custoPontosAcao: { value: pa, min: 0 } },
      spell: {
        nivel,
        escola,
        tempo: opts.tempo ?? "1 ação",
        alcance: `${alcanceHex} hex`,
        ...(opts.save ? { save: { attribute: opts.save } } : {}),
        ...(opts.area ? { area: opts.area } : {}),
        ...(opts.channel ? { channel: { maxExtraPa: 2, bonusPerPa: "1d6" } } : {}),
      },
    },
  };
  if (opts.dano) {
    s.system.weapon = {
      dano: { formula: opts.dano, tipo: opts.tipo ?? "mágico" },
      ataque: { bonus: 0 },
    };
  }
  return s;
}

const SPELLS = [
  spell("Chama de Fogareiro", 0, "Evocação", 1, 1, "Chama controlável; uso culinário.", { tempo: "1 ação" }),
  spell("Lâmina de Espírito", 0, "Transmutação", 1, 1, "Lâmina etérea 1d4; +2 Trinchar.", { dano: "1d4", tipo: "força" }),
  spell("Detectar Veneno", 0, "Adivinhação", 3, 1, "Detecta toxinas em 3 hex.", { tempo: "1 ação" }),
  spell("Estabilizar", 0, "Abjuração", 1, 1, "Criatura a 0 HP para de falhar morte."),
  spell("Mãos Firmes", 0, "Transmutação", 1, 1, "+2 Trinchar por 1 hora."),
  spell("Extração Amplificada", 1, "Biomancia", 1, 1, "Dobra ingredientes; +4 Trinchar 1h.", { tempo: "1 minuto" }),
  spell("Mãos Gelidas", 1, "Evocação", 2, 2, "Cone 2d6 frio; save CON. Canalizável.", {
    dano: "2d6",
    tipo: "frio",
    save: "constituicao",
    area: { shape: "cone", lengthHex: 2 },
    channel: true,
  }),
  spell("Crescimento Acelerado", 1, "Transmutação", 1, 1, "Semente vira planta em 1h.", { tempo: "1 hora" }),
  spell("Purificar Veneno", 1, "Abjuração", 1, 1, "Remove envenenado ou toxina em ingrediente."),
  spell("Identificar Ingrediente", 1, "Adivinhação", 1, 1, "Revela origem e propriedades biomágicas.", { tempo: "1 minuto" }),
  spell("Armadura Arcana", 1, "Abjuração", 1, 1, "CA 13 + INT por 8h."),
  spell("Onda de Trovão", 1, "Evocação", 2, 2, "Cubo 2d8 trovão; save CON. Canalizável.", {
    dano: "2d8",
    tipo: "trovão",
    save: "constituicao",
    area: { shape: "cube", radiusHex: 2 },
    channel: true,
  }),
  spell("Curar Ferimentos", 1, "Abjuração", 1, 1, "Cura 1d8 + mod conjuração."),
  spell("Chama de Vinha", 1, "Evocação", 4, 2, "Projétil 2d6 fogo. Canalizável.", {
    dano: "2d6",
    tipo: "fogo",
    channel: true,
  }),
  spell("Sussurro de Masmorra", 1, "Adivinhação", 10, 1, "Telepatia com aliado visível."),
  spell("Aprimoramento Biomágico", 2, "Biomancia", 1, 2, "+1 habilidade assimilacao na próxima refeição.", { tempo: "10 minutos" }),
  spell("Raios de Enfraquecimento", 2, "Necromancia", 6, 1, "3 raios; save CON ou desvantagem.", { save: "constituicao" }),
  spell("Esfera Ácida de Monstro", 2, "Evocação", 6, 2, "4d6 ácido; save DES. Canalizável.", {
    dano: "4d6",
    tipo: "ácido",
    save: "destreza",
    channel: true,
  }),
  spell("Transmutação de Carne", 2, "Transmutação", 1, 2, "Converte ingrediente em equivalente.", { tempo: "1 hora" }),
  spell("Inspiração Culinária", 2, "Encantamento", 4, 1, "+3 Coccão/Harmonização 1h."),
  spell("Preservação Perfeita", 2, "Transmutação", 1, 1, "Ingrediente preservado 30 dias."),
  spell("Forma Menor", 2, "Transmutação", 0, 1, "Polimorfo em besta pequena."),
  spell("Escudo Arcano", 2, "Abjuração", 0, 1, "Reação: +5 CA 1 rodada.", { tempo: "reação" }),
  spell("Ilusão Menor", 2, "Ilusão", 6, 1, "Som ou imagem estática."),
  spell("Muralha Hexagonal", 2, "Abjuração", 3, 2, "Barreira em 3 hex.", { area: { shape: "wall", hexCount: 3 } }),
  spell("Animação de Mortos", 3, "Necromancia", 3, 2, "Anima 2 cadáveres por 24h.", { tempo: "1 minuto" }),
  spell("Injeção Biomágica", 3, "Biomancia", 1, 1, "Habilidade assimilacao 12h do ingrediente."),
  spell("Bola de Fogo", 3, "Evocação", 10, 3, "Raio 8d6 fogo; save DES. Canalizável.", {
    dano: "8d6",
    tipo: "fogo",
    save: "destreza",
    area: { shape: "burst", radiusHex: 2 },
    channel: true,
  }),
  spell("Nova Hex", 3, "Evocação", 5, 2, "Explosão 3d6 fogo em área.", {
    dano: "3d6",
    tipo: "fogo",
    save: "destreza",
    area: { shape: "burst", radiusHex: 2 },
  }),
  spell("Contágio Necrótico", 3, "Necromancia", 1, 2, "Save CON ou envenenado prolongado.", { save: "constituicao" }),
  spell("Ventania", 3, "Evocação", 6, 1, "Linha 6 hex empurra; save FOR.", {
    dano: "2d6",
    tipo: "contundente",
    save: "forca",
    area: { shape: "line", lengthHex: 6 },
  }),
  spell("Ler Mentes", 3, "Adivinhação", 4, 1, "Lê pensamentos superficiais."),
  spell("Relâmpago", 3, "Evocação", 8, 2, "Raio 4d8 relâmpago; save DES. Canalizável.", {
    dano: "4d8",
    tipo: "relâmpago",
    save: "destreza",
    area: { shape: "line", lengthHex: 6 },
    channel: true,
  }),
  spell("Sono", 3, "Encantamento", 6, 1, "Até 5 alvos; save SAB.", { save: "sabedoria" }),
  spell("Raio do Limiar", 3, "Necromancia", 6, 2, "4d8 necrótico; save CON. Canalizável.", {
    dano: "4d8",
    tipo: "necrótico",
    save: "constituicao",
    channel: true,
  }),
  spell("Visão do Ecossistema", 4, "Adivinhação", 0, 2, "Visão através de criatura do bioma.", { tempo: "10 minutos" }),
  spell("Murcha", 4, "Necromancia", 2, 3, "8d8 necrótico; save CON. Canalizável.", {
    dano: "8d8",
    tipo: "necrótico",
    save: "constituicao",
    channel: true,
  }),
  spell("Mutação Forçada", 4, "Biomancia", 6, 1, "Mutação negativa aleatória 1h."),
  spell("Parede de Fogo", 4, "Evocação", 8, 1, "Parede 5d8 fogo.", { dano: "5d8", tipo: "fogo", area: { shape: "wall", hexCount: 4 } }),
  spell("Preservação Anual", 4, "Transmutação", 1, 1, "Preserva ingrediente 1 ano."),
  spell("Cura em Massa", 4, "Abjuração", 6, 1, "Até 6 alvos: 3d8 + mod."),
  spell("Ressurreição Incompleta", 5, "Necromancia", 1, 3, "Aliado volta com 1 HP.", { tempo: "1 hora" }),
  spell("Grande Transmutação Biomágica", 5, "Biomancia", 1, 3, "Mutacao forte 7 dias (boss).", { tempo: "1 hora" }),
  spell("Cone de Frio", 5, "Evocação", 6, 3, "8d8 frio em cone. Canalizável.", {
    dano: "8d8",
    tipo: "frio",
    save: "constituicao",
    area: { shape: "cone", lengthHex: 4 },
    channel: true,
  }),
  spell("Despertar", 5, "Transmutação", 1, 3, "Planta ou besta ganha INT 10.", { tempo: "8 horas" }),
  spell("Salto Dimensional", 5, "Conjuração", 6, 1, "Teletransporte 6 hex.", { tempo: "ação bônus" }),
  spell("Restaurar Vigor", 5, "Abjuração", 1, 2, "Remove 1 exaustão e doença leve.", { tempo: "1 hora" }),
  spell("Causar Praga", 6, "Necromancia", 6, 1, "10d6 veneno; save CON.", { dano: "10d6", tipo: "veneno", save: "constituicao" }),
  spell("Desintegrar", 6, "Transmutação", 6, 1, "10d6+40 força; save DES.", { dano: "10d6+40", tipo: "força", save: "destreza" }),
  spell("Cadeia de Relâmpago", 6, "Evocação", 10, 3, "10d8 relâmpago em cadeia. Canalizável.", {
    dano: "10d8",
    tipo: "relâmpago",
    save: "destreza",
    channel: true,
  }),
  spell("Forma de Monstro", 7, "Biomancia", 1, 2, "Polimorfo em monstro do bestiário."),
  spell("Prisão de Gelo", 7, "Evocação", 6, 1, "Restringido + 5d6 frio/turno.", { dano: "5d6", tipo: "frio" }),
  spell("Regeneração Biomágica", 7, "Biomancia", 1, 1, "4d8+15 HP no início de cada turno."),
  spell("Invisibilidade Maior", 7, "Ilusão", 1, 1, "Até 6 aliados invisíveis."),
  spell("Terremoto", 8, "Evocação", 20, 2, "Área 30 hex; save DES prostrado.", {
    dano: "6d6",
    tipo: "contundente",
    save: "destreza",
    area: { shape: "burst", radiusHex: 5 },
  }),
  spell("Biomancia Suprema — Transcendência", 9, "Biomancia", 0, 3, "Integra DNA de 3 bosses.", { tempo: "1 hora" }),
  spell("Desejo de Morte", 9, "Necromancia", 0, 3, "Condição irrevogável de morte."),
  // Subclasse (mesa / grimório)
  spell("Mãos Ardentes", 1, "Evocação", 1, 1, "Piromante: 3d6 fogo ao toque.", { dano: "3d6", tipo: "fogo", save: "destreza" }),
  spell("Gelo de Conservação", 2, "Transmutação", 1, 1, "Criomante: estase de ingrediente 8h."),
  spell("Fermentação Acelerada", 2, "Transmutação", 1, 2, "Mago Fermentador: fermenta em 1 min.", { tempo: "10 minutos" }),
  spell("Purificação Abençoada", 4, "Abjuração", 1, 1, "Remove maldição ou veneno."),
  spell("Esporos Necróticos", 0, "Necromancia", 2, 1, "Nuvem: save CON ou envenenado.", {
    dano: "1d6",
    tipo: "necrótico",
    save: "constituicao",
    area: { shape: "burst", radiusHex: 1 },
  }),
  spell("Grande Decomposição", 5, "Transmutação", 4, 2, "Decompõe orgânico em cubo 3 hex.", {
    area: { shape: "cube", radiusHex: 1 },
  }),
  spell("Doce Confuso", 1, "Encantamento", 6, 1, "Save CON ou amedrontado.", { save: "constituicao" }),
];

const ABILITIES = [
  ["Investida Hexagonal", 2, 1, "charge", "Movimento 2 hex sem provocar."],
  ["Golpe Flanqueador", 1, 2, "melee_attack_bonus", "Ataque cac com vantagem se flanqueio."],
  ["Postura Defensiva", 0, 1, "defense_buff", "+2 defesa até próximo turno."],
  ["Reflexos de Masmorra", 1, 1, "reacao", "Reação: desloca 1 hex."],
  ["Olhar do Caçador", 5, 1, "mark", "Marca alvo; +2 próximo ataque à distância."],
  ["Investida do Guerreiro", 2, 1, "charge", "Corrida em linha reta."],
  ["Golpe Devastador", 1, 2, "melee_attack_bonus", "+2 no próximo ataque corpo a corpo."],
  ["Esquiva Tática", 0, 1, "defense_buff", "+2 defesa até seu próximo turno."],
  ["Tiro Certeiro", 5, 1, "mark", "Próximo ataque à distância com vantagem."],
  ["Emboscada", 1, 2, "melee_attack_bonus", "Ataque furtivo adjacente."],
  ["Finta", 1, 1, "mark", "Alvo tem desvantagem no próximo ataque contra ele."],
  ["Passo das Sombras", 2, 1, "charge", "Teleporte curto 2 hex (movimento)."],
  ["Raio Arcano", 6, 1, "spell", "Truque ofensivo 1d10+INT."],
  ["Escudo Mágico", 0, 1, "defense_buff", "+3 defesa 1 rodada."],
  ["Canalizar Energia", 1, 2, "melee_attack_bonus", "Ataque sagrado +2d6 radiante."],
  ["Fúria Controlada", 0, 1, "defense_buff", "Resistência contundente 1 turno."],
  ["Investida Bárbara", 3, 1, "charge", "Corre 3 hex em linha."],
  ["Inspiração de Batalha", 4, 1, "mark", "Aliado ganha vantagem no próximo ataque."],
  ["Canção de Cura", 1, 1, "buff", "Aliado recupera 1d6 HP."],
  ["Forma Selvagem", 0, 2, "charge", "Prepara transformação (movimento)."],
  ["Raízes Prendentes", 4, 2, "spell", "Restringe alvo 1 turno."],
  ["Disparo de Artilheiro", 6, 1, "spell", "Projétil 2d8."],
  ["Barreira de Cobre", 0, 1, "defense_buff", "+2 defesa contra magia."],
].map(([name, range, pa, tipo, desc]) => ({
  id: `habilidades-${slug(name)}`,
  name,
  type: "habilidade",
  system: {
    catalogId: `HAB-${slug(name)}`,
    description: `<p>${desc}</p>`,
    tactical: { alcanceHex: { value: range, min: 0 }, custoPontosAcao: { value: pa, min: 0 } },
    ability: { tipo: tipo === "reacao" ? "reacao" : "ativa", recarga: tipo === "charge" ? "1/turno" : "" },
  },
}));

writeFileSync(join(OUT, "monstros.json"), JSON.stringify(MONSTERS, null, 2) + "\n");
writeFileSync(join(OUT, "magias.json"), JSON.stringify(SPELLS, null, 2) + "\n");
writeFileSync(join(OUT, "habilidades.json"), JSON.stringify(ABILITIES, null, 2) + "\n");

console.log(
  `OK: ${MONSTERS.length} monstros, ${SPELLS.length} magias, ${ABILITIES.length} habilidades (armas/equipamentos: scripts/gen-equipment-compendium.py)`
);
