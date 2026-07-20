/**
 * Gera compêndios Eldarin a partir do Livro do Mestre / Parte X (magias).
 * Uso: node scripts/generate-compendium.mjs [--monsters-only]
 *
 * Variantes Elite/Colossal na mesa são aplicadas em runtime por
 * lib/vtt/monster-scaling.ts (spawn), não duplicam entradas aqui.
 * Cap. XII groupLevelDelta também é runtime no painel de invocação.
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  mod,
  defaultMonsterHp,
  defaultMonsterCa,
  monsterAttackBonus,
} from "./monster-balance.mjs";

const MONSTERS_ONLY = process.argv.includes("--monsters-only");

const MONSTER_TAMANHOS = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "data", "monster-tamanhos.json"), "utf8")
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "compendiums");
const LM_PATH = join(__dirname, "..", "livros", "LIVRO-DO-MESTRE.md");
const SPELL_BOOK = join(__dirname, "..", "livros", "_parte_x_magias_v4_revisada.md");

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Extrai Lore + Comportamento de LIVRO-DO-MESTRE §001–080 */
function parseMonsterLoreBook() {
  const md = readFileSync(LM_PATH, "utf8");
  const map = {};
  const chunks = md.split(/\n## (\d{3}) — /);
  for (let i = 1; i < chunks.length; i += 2) {
    const num = chunks[i];
    const body = chunks[i + 1] ?? "";
    const title = body.split("\n")[0]?.trim() ?? "";
    const loreMatch = body.match(/\*\*Lore:\*\*\s*\n([\s\S]*?)(?=\n\*\*Comportamento|\n\| Estatística|\n\*\*Habilidades)/);
    const behaviorMatch = body.match(
      /\*\*Comportamento na mesa:\*\*\s*\n([\s\S]*?)(?=\n\| Estatística|\n\*\*Habilidades|\n---)/
    );
    const lore = loreMatch?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const behaviorRaw = behaviorMatch?.[1] ?? "";
    const behavior = behaviorRaw
      .split("\n")
      .map((l) => l.replace(/^\s*-\s*\*\*([^*]+):\*\*\s*/, "$1: ").replace(/^\s*-\s*/, "").trim())
      .filter((l) => l && !l.startsWith("|"))
      .filter((l) => !/^culinária:/i.test(l));
    if (title || lore) map[num] = { title, lore, behavior };
  }
  return map;
}

function buildMonsterDescription(entry, loreEntry, nivel) {
  if (!loreEntry?.lore && !loreEntry?.behavior?.length) {
    return `<p><strong>${escapeHtml(entry.name)}</strong> — criatura nv ${nivel} das masmorras de Eldarin.</p>`;
  }
  let html = `<p><strong>${escapeHtml(loreEntry.title || entry.name)}</strong> (ameaça nv ${nivel}).</p>`;
  if (loreEntry.lore) html += `<p>${escapeHtml(loreEntry.lore)}</p>`;
  if (loreEntry.behavior?.length) {
    html += `<p><strong>Comportamento na mesa</strong></p><ul>`;
    for (const b of loreEntry.behavior.slice(0, 5)) {
      html += `<li>${escapeHtml(b)}</li>`;
    }
    html += `</ul>`;
  }
  return html;
}

/** Descrições do grimório (Cap. 18) */
function parseSpellLoreBook() {
  const md = readFileSync(SPELL_BOOK, "utf8");
  const start = md.indexOf("## CAPÍTULO 18");
  const slice = start >= 0 ? md.slice(start) : md;
  const map = {};
  const re = /\*\*([^*]+)\*\* — ([^\n]+)\n([\s\S]*?)(?=\n\*\*|\n## |\n---\s*$|$)/g;
  let m;
  while ((m = re.exec(slice)) !== null) {
    const name = m[1].trim();
    const meta = m[2].trim();
    const desc = m[3]
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (name && desc && !name.startsWith("NIVEL")) map[name] = { meta, desc };
  }
  return map;
}

const MONSTER_LORE = parseMonsterLoreBook();
const SPELL_LORE = parseSpellLoreBook();

function monsterActions(name, nivel, tier, attrs) {
  const forMod = mod(attrs.forca);
  const agiMod = mod(attrs.agilidade);
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
      attackBonus: monsterAttackBonus(nivel, tier, "bite"),
      rangeCells: 1,
      paCost: 2,
      label: "Mordida · 1 célula · PA 2",
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
      attackBonus: monsterAttackBonus(nivel, tier, "claw", agiMod),
      rangeCells: 1,
      paCost: 2,
      label: "Garras · 1 célula · PA 2",
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
      attackBonus: monsterAttackBonus(nivel, tier, "special"),
      rangeCells: tier === "boss" ? 6 : 4,
      paCost: 2,
      label: `Ataque especial · ${tier === "boss" ? 6 : 4} célula · PA 2`,
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
      attackBonus: Math.max(monsterAttackBonus(nivel, tier, "claw", agiMod), forMod),
      rangeCells: 2,
      paCost: 2,
      label: "Investida · 2 célula · PA 2",
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

/**
 * Template base; HP/CA seguem curvas em monster-balance.mjs (flags opcionais).
 * Elite/Colossal são multiplicadores no spawn VTT.
 */
function mob(
  name,
  nivel,
  tier,
  attrs = { forca: 10, agilidade: 10 },
  move = { walk: 4, run: 6 },
  pa = null,
  desc = "",
  flags = {}
) {
  const hp = defaultMonsterHp(nivel, tier, flags);
  const ca = defaultMonsterCa(nivel, tier, flags);
  const paDefault = tier === "boss" ? 9 : 6;
  const paMax = pa ?? paDefault;
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
      movement: { cells: { walk: { value: move.walk }, run: { value: move.run } } },
      tactical: { defesa: { value: ca }, ameaca: { value: nivel }, tier, tamanho },
      actions: monsterActions(name, nivel, tier, attrs),
    },
  };
}

function monCod(n) {
  return `MON-${String(n).padStart(3, "0")}`;
}

/** 001–080 + extras (ordem = LIVRO-DO-JOGADOR §6.2). HP/CA: scripts/monster-balance.mjs */
const MONSTERS = [
  mob("Zumbi de Masmorra", 2, "mob", { forca: 13, agilidade: 8 }, { walk: 3, run: 5 }, 7),
  mob("Esqueleto Armado", 2, "mob", { forca: 10, agilidade: 14 }, { walk: 4, run: 6 }, 7, "", { nimble: true }),
  mob("Necrófago", 3, "mob", { forca: 13, agilidade: 15 }, { walk: 4, run: 6 }, 7),
  mob("Espectro", 4, "mini", { forca: 8, agilidade: 14 }),
  mob("Necroarca (Arquiliche)", 18, "boss", { forca: 11, agilidade: 16 }, { walk: 4, run: 6 }),
  mob("Assombração", 3, "mob", { forca: 6, agilidade: 16 }),
  mob("Vampiro", 10, "boss", { forca: 18, agilidade: 18 }, { walk: 5, run: 8 }),
  mob("Cavaleiro Espectral", 5, "mini", { forca: 16, agilidade: 12 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Múmia", 5, "mini", { forca: 16, agilidade: 10 }, { walk: 3, run: 5 }, null, "", { heavy: true, caDelta: -1 }),
  mob("Dragonete de Magma", 6, "mini", { forca: 17, agilidade: 12 }, { walk: 4, run: 7 }),
  mob("Wyvern", 9, "mini", { forca: 19, agilidade: 14 }, { walk: 4, run: 10 }),
  mob("Dragão Jovem de Gelo", 13, "boss", { forca: 22, agilidade: 12 }, { walk: 5, run: 9 }),
  mob("Drake de Pedra", 5, "mini", { forca: 19, agilidade: 10 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Dragão Ancião de Fogo", 19, "boss", { forca: 27, agilidade: 12 }, { walk: 6, run: 10 }),
  mob("Golem de Pedra", 8, "mini", { forca: 20, agilidade: 8 }, { walk: 3, run: 5 }, null, "", { heavy: true, tank: true }),
  mob("Armadura Animada", 1, "mob", { forca: 14, agilidade: 8 }, { walk: 2, run: 4 }, null, "", { heavy: true, tank: true }),
  mob("Golem de Ferro Vulcânico", 10, "mini", { forca: 22, agilidade: 8 }, { walk: 3, run: 5 }, null, "", { heavy: true, tank: true }),
  mob("Autômato de Gênio", 7, "mini", { forca: 16, agilidade: 14 }),
  mob("Minotauro", 6, "mini", { forca: 18, agilidade: 11 }),
  mob("Basilisco", 7, "mini", { forca: 16, agilidade: 8 }),
  mob("Manticora", 8, "mini", { forca: 17, agilidade: 15 }, { walk: 5, run: 8 }),
  mob("Grifo", 5, "mini", { forca: 18, agilidade: 15 }, { walk: 5, run: 10 }),
  mob("Cocatriz", 4, "mob", { forca: 12, agilidade: 14 }, { walk: 4, run: 6 }, null, "", { glass: true }),
  mob("Aranha Tecerrochas", 2, "mob", { forca: 12, agilidade: 16 }, { walk: 4, run: 6 }, null, "", { nimble: true }),
  mob("Escorpião Gigante", 3, "mob", { forca: 15, agilidade: 12 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Centopeia Cáustica", 4, "mob", { forca: 14, agilidade: 13 }),
  mob("Besouro-Diamante", 5, "mini", { forca: 16, agilidade: 12 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Sapo-Engolidor", 6, "mini", { forca: 18, agilidade: 10 }),
  mob("Kraken Menor", 12, "boss", { forca: 22, agilidade: 10 }, { walk: 3, run: 6 }),
  mob("Serpente-do-Abismo", 8, "mini", { forca: 18, agilidade: 14 }),
  mob("Tubarão-Cego", 5, "mini", { forca: 18, agilidade: 14 }, { walk: 5, run: 8 }),
  mob("Goblin de Caverna", 1, "mob", { forca: 8, agilidade: 14 }, { walk: 4, run: 6 }, 3, "", { swarm: true, nimble: true }),
  mob("Hobgoblin Guerreiro", 3, "mob", { forca: 13, agilidade: 12 }),
  mob("Orc de Masmorra", 4, "mob", { forca: 16, agilidade: 10 }),
  mob("Cogumelo-Rei", 7, "mini", { forca: 14, agilidade: 8 }),
  mob("Treant Podre", 9, "mini", { forca: 20, agilidade: 8 }, { walk: 3, run: 5 }, null, "", { tank: true }),
  mob("Planta Carnívora Gigante", 5, "mob", { forca: 17, agilidade: 6 }, { walk: 2, run: 3 }, null, "", { soft: true }),
  mob("Slime Ácido", 2, "mob", { forca: 12, agilidade: 6 }, { walk: 2, run: 3 }, null, "", { soft: true }),
  mob("Slime de Cristal", 3, "mob", { forca: 10, agilidade: 8 }, { walk: 2, run: 3 }, null, "", { soft: true }),
  mob("Elemental de Fogo", 6, "mini", { forca: 14, agilidade: 16 }),
  mob("Elemental de Gelo", 6, "mini", { forca: 16, agilidade: 14 }),
  mob("Yeti das Profundezas", 8, "mini", { forca: 20, agilidade: 10 }, { walk: 4, run: 6 }, null, "", { tank: true }),
  mob("Lobo do Inverno", 3, "mob", { forca: 14, agilidade: 15 }, { walk: 5, run: 8 }),
  mob("Mímico de Baú", 4, "mob", { forca: 17, agilidade: 10 }),
  mob("Metamorfo Dúbio", 5, "mini", { forca: 14, agilidade: 16 }),
  mob("Hidra das Cavernas", 9, "boss", { forca: 20, agilidade: 12 }),
  mob("Quimera", 10, "boss", { forca: 19, agilidade: 14 }, { walk: 5, run: 8 }),
  mob("Anjo Caído", 14, "boss", { forca: 22, agilidade: 18 }, { walk: 5, run: 10 }),
  mob("Gárgula de Cristal", 4, "mob", { forca: 14, agilidade: 15 }, { walk: 4, run: 8 }, null, "", { heavy: true }),
  mob("Aberração Tentacular", 8, "mini", { forca: 18, agilidade: 10 }),
  mob("Basilisco de Magma", 8, "mini", { forca: 17, agilidade: 10 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Sereia das Profundezas", 6, "mini", { forca: 14, agilidade: 14 }),
  mob("Troll de Pedra", 7, "mini", { forca: 20, agilidade: 8 }, { walk: 4, run: 6 }, null, "", { tank: true }),
  mob("Ciclope", 9, "boss", { forca: 22, agilidade: 8 }),
  mob("Harpia de Caverna", 4, "mob", { forca: 12, agilidade: 16 }, { walk: 4, run: 8 }, null, "", { nimble: true }),
  mob("Roper", 5, "mini", { forca: 18, agilidade: 6 }, { walk: 2, run: 3 }, null, "", { heavy: true, tank: true, ca: 15 }),
  mob("Aboleth", 16, "boss", { forca: 16, agilidade: 10 }, { walk: 3, run: 5 }),
  mob("Pudim Negro", 7, "mini", { forca: 14, agilidade: 6 }, { walk: 2, run: 4 }, null, "", { soft: true }),
  mob("Lagosta-Gigante Abissal", 4, "mob", { forca: 16, agilidade: 10 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Caranguejo-Eremita Colossal", 7, "mini", { forca: 18, agilidade: 8 }, { walk: 3, run: 5 }, null, "", { heavy: true, tank: true }),
  mob("Aranha-Cavaleira", 9, "mini", { forca: 14, agilidade: 18 }),
  mob("Mosca-Carniça Colossal", 2, "mob", { forca: 8, agilidade: 14 }, { walk: 4, run: 6 }, null, "", { swarm: true }),
  mob("Besouro-Trovão", 5, "mini", { forca: 14, agilidade: 12 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Verme Gigante de Pedra", 10, "boss", { forca: 22, agilidade: 6 }, { walk: 4, run: 6 }, null, "", { heavy: true }),
  mob("Salamandra Gigante", 6, "mini", { forca: 15, agilidade: 12 }),
  mob("Behemoth de Pedra", 14, "boss", { forca: 24, agilidade: 6 }, { walk: 4, run: 6 }, null, "", { tank: true }),
  mob("Fera da Sombra", 8, "mini", { forca: 12, agilidade: 16 }),
  mob("Medusa", 7, "mini", { forca: 14, agilidade: 14 }),
  mob("Fênix de Caverna", 13, "boss", { forca: 16, agilidade: 18 }, { walk: 5, run: 10 }),
  mob("Gigante de Pedra", 12, "boss", { forca: 23, agilidade: 8 }, { walk: 4, run: 6 }),
  mob("Bruxa da Masmorra", 8, "mini", { forca: 12, agilidade: 14 }),
  mob("Fera Seminal", 11, "boss", { forca: 16, agilidade: 12 }),
  mob("Carniçal Alado", 9, "mini", { forca: 15, agilidade: 16 }, { walk: 5, run: 10 }),
  mob("Arquidemônio Flamejante", 19, "boss", { forca: 26, agilidade: 14 }, { walk: 5, run: 8 }),
  mob("Enxame de Ratos-Cadáveres", 2, "mob", { forca: 10, agilidade: 14 }, { walk: 4, run: 6 }, null, "", { swarm: true }),
  mob("Elemental de Terra", 8, "mini", { forca: 20, agilidade: 8 }, { walk: 3, run: 5 }, null, "", { heavy: true, tank: true }),
  mob("Banshee", 8, "mini", { forca: 8, agilidade: 14 }, { walk: 4, run: 8 }, null, "", { glass: true }),
  mob("Morcego-Tirano", 5, "mini", { forca: 16, agilidade: 14 }, { walk: 5, run: 10 }),
  mob("Ooze Ocular", 6, "mini", { forca: 12, agilidade: 10 }, { walk: 2, run: 4 }, null, "", { soft: true }),
  mob("Devorador Ancião (Filhote)", 20, "boss", { forca: 30, agilidade: 10 }, { walk: 6, run: 10 }, null, "", { heavy: true, hp: 480, ca: 22 }),
  { ...mob("Goblin", 1, "mob", { forca: 8, agilidade: 14 }, { walk: 4, run: 6 }, 3, "Alias de Goblin de Caverna para spawn rápido.", { swarm: true, nimble: true }), spawnAlias: true },
  { ...mob("Esqueleto de Guarda", 2, "mob", { forca: 12, agilidade: 10 }, { walk: 4, run: 6 }, null, "", { heavy: true }), spawnAlias: true },
  { ...mob("Slime de Masmorra", 2, "mob", { forca: 14, agilidade: 6 }, { walk: 2, run: 3 }, null, "", { soft: true, hpDelta: 4 }), spawnAlias: true },
];

let catalogSeq = 0;
for (const entry of MONSTERS) {
  if (entry.spawnAlias) {
    entry.system.catalogId = `MON-SPAWN-${slug(entry.name)}`;
    entry.system.bookRef = "LIVRO-DO-MESTRE.md";
    continue;
  }
  catalogSeq += 1;
  entry.system.catalogId = monCod(catalogSeq);
  entry.system.bookRef = "LIVRO-DO-MESTRE.md";
  const loreKey = String(catalogSeq).padStart(3, "0");
  const loreEntry = MONSTER_LORE[loreKey];
  const nivel = entry.system.tactical?.ameaca?.value ?? catalogSeq;
  entry.system.description = buildMonsterDescription(entry, loreEntry, nivel);
}

function spell(
  name,
  nivel,
  escola,
  alcanceCells,
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
      tactical: { alcanceCells: { value: alcanceCells, min: 0 }, custoPontosAcao: { value: pa, min: 0 } },
      spell: {
        nivel,
        escola,
        tempo: opts.tempo ?? "1 ação",
        alcance: `${alcanceCells} célula`,
        ...(opts.save ? { save: { attribute: opts.save } } : {}),
        ...(opts.area ? { area: opts.area } : {}),
        ...(opts.channel ? { channel: { maxExtraPa: 2, bonusPerPa: "1d6" } } : {}),
        ...(opts.recarga ? { recarga: opts.recarga } : {}),
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
  spell("Detectar Veneno", 0, "Adivinhação", 3, 1, "Detecta toxinas em 3 célula.", { tempo: "1 ação" }),
  spell("Estabilizar", 0, "Abjuração", 1, 1, "Criatura a 0 HP para de falhar morte."),
  spell("Mãos Firmes", 0, "Transmutação", 1, 1, "+2 Trinchar por 1 hora."),
  spell("Extração Amplificada", 1, "Biomancia", 1, 1, "Dobra ingredientes; +4 Trinchar 1h.", { tempo: "1 minuto" }),
  spell("Mãos Gelidas", 1, "Evocação", 2, 2, "Cone 2d6 frio; save CON. Canalizável.", {
    dano: "2d6",
    tipo: "frio",
    save: "constituicao",
    area: { shape: "cone", lengthCells: 3 },
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
    area: { shape: "cube", radiusCells: 1 },
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
  spell("Raios de Enfraquecimento", 2, "Necromancia", 6, 2, "3 raios; save CON ou desvantagem.", { save: "constituicao" }),
  spell("Esfera Ácida de Monstro", 2, "Evocação", 6, 3, "4d6 ácido; save DES. Canalizável.", {
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
  spell("Ilusão Menor", 2, "Ilusão", 6, 1, "Som ou imagem estática em cubo 1 célula.", {
    area: { shape: "cube", radiusCells: 1 },
  }),
  spell("Muralha de Energia", 2, "Abjuração", 3, 2, "Barreira reta em 3 células.", { area: { shape: "wall", cellCount: 3 } }),
  spell("Animação de Mortos", 3, "Necromancia", 3, 2, "Anima 2 cadáveres por 24h.", { tempo: "1 minuto" }),
  spell("Injeção Biomágica", 3, "Biomancia", 1, 1, "Habilidade assimilacao 12h do ingrediente."),
  spell("Bola de Fogo", 3, "Evocação", 10, 3, "Raio 6 m: 8d6 fogo; save DES. Canalizável.", {
    dano: "8d6",
    tipo: "fogo",
    save: "destreza",
    area: { shape: "burst", radiusCells: 4 },
    channel: true,
  }),
  spell("Nova Arcana", 3, "Evocação", 5, 3, "Explosão 3d6 fogo em área (raio 3 m).", {
    dano: "3d6",
    tipo: "fogo",
    save: "destreza",
    area: { shape: "burst", radiusCells: 2 },
  }),
  spell("Contágio Necrótico", 3, "Necromancia", 1, 3, "Save CON ou envenenado prolongado.", {
    save: "constituicao",
    recarga: "1/turno",
  }),
  spell("Ventania", 3, "Evocação", 6, 2, "Linha 6 célula empurra; save FOR.", {
    dano: "2d6",
    tipo: "contundente",
    save: "forca",
    area: { shape: "line", lengthCells: 12 },
  }),
  spell("Ler Mentes", 3, "Adivinhação", 4, 1, "Lê pensamentos superficiais."),
  spell("Relâmpago", 3, "Evocação", 8, 3, "Um alvo: 4d8 relâmpago; save DES. Canalizável.", {
    dano: "4d8",
    tipo: "relâmpago",
    save: "destreza",
    channel: true,
  }),
  spell("Sono", 3, "Encantamento", 6, 2, "Até 5 alvos; save SAB.", { save: "sabedoria", recarga: "1/turno" }),
  spell("Raio do Limiar", 3, "Necromancia", 6, 3, "4d8 necrótico; save CON. Canalizável.", {
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
    recarga: "1/turno",
  }),
  spell("Mutação Forçada", 4, "Biomancia", 6, 1, "Mutação negativa aleatória 1h."),
  spell("Parede de Fogo", 4, "Evocação", 8, 3, "Parede até 18 m: 5d8 fogo.", {
    dano: "5d8",
    tipo: "fogo",
    area: { shape: "wall", cellCount: 12 },
    recarga: "1/turno",
  }),
  spell("Preservação Anual", 4, "Transmutação", 1, 1, "Preserva ingrediente 1 ano."),
  spell("Cura em Massa", 4, "Abjuração", 6, 3, "Até 6 alvos: 3d8 + mod.", { recarga: "1/turno" }),
  spell("Ressurreição Incompleta", 5, "Necromancia", 1, 3, "Aliado volta com 1 HP.", {
    tempo: "1 hora",
    recarga: "1/combate",
  }),
  spell("Grande Transmutação Biomágica", 5, "Biomancia", 1, 3, "Mutacao forte 7 dias (boss).", { tempo: "1 hora" }),
  spell("Cone de Frio", 5, "Evocação", 6, 3, "8d8 frio em cone. Canalizável.", {
    dano: "8d8",
    tipo: "frio",
    save: "constituicao",
    area: { shape: "cone", lengthCells: 12 },
    channel: true,
    recarga: "1/turno",
  }),
  spell("Despertar", 5, "Transmutação", 1, 3, "Planta ou besta ganha INT 10.", {
    tempo: "8 horas",
    recarga: "1/combate",
  }),
  spell("Salto Dimensional", 5, "Conjuração", 6, 2, "Teletransporte 6 célula.", {
    tempo: "ação bônus",
    recarga: "1/turno",
  }),
  spell("Restaurar Vigor", 5, "Abjuração", 1, 3, "Remove 1 exaustão e doença leve.", {
    tempo: "1 hora",
    recarga: "1/turno",
  }),
  spell("Causar Praga", 6, "Necromancia", 6, 3, "10d6 veneno; save CON.", {
    dano: "10d6",
    tipo: "veneno",
    save: "constituicao",
    recarga: "1/turno",
  }),
  spell("Desintegrar", 6, "Transmutação", 6, 3, "10d6+40 força; save DES.", {
    dano: "10d6+40",
    tipo: "força",
    save: "destreza",
    recarga: "1/turno",
  }),
  spell("Cadeia de Relâmpago", 6, "Evocação", 10, 3, "10d8 relâmpago em cadeia. Canalizável.", {
    dano: "10d8",
    tipo: "relâmpago",
    save: "destreza",
    channel: true,
    recarga: "1/turno",
  }),
  spell("Forma de Monstro", 7, "Biomancia", 1, 3, "Polimorfo em monstro do bestiário.", { recarga: "1/combate" }),
  spell("Prisão de Gelo", 7, "Evocação", 6, 3, "Restringido + 5d6 frio/turno.", {
    dano: "5d6",
    tipo: "frio",
    recarga: "1/turno",
  }),
  spell("Regeneração Biomágica", 7, "Biomancia", 1, 2, "4d8+15 HP no início de cada turno."),
  spell("Invisibilidade Maior", 7, "Ilusão", 1, 1, "Até 6 aliados invisíveis."),
  spell("Terremoto", 8, "Evocação", 20, 3, "Área 30 célula; save DES prostrado.", {
    dano: "6d6",
    tipo: "contundente",
    save: "destreza",
    area: { shape: "burst", radiusCells: 10 },
  }),
  spell("Biomancia Suprema — Transcendência", 9, "Biomancia", 0, 3, "Integra DNA de 3 bosses.", {
    tempo: "1 hora",
    recarga: "1/combate",
  }),
  spell("Desejo de Morte", 9, "Necromancia", 0, 3, "Condição irrevogável de morte.", { recarga: "1/combate" }),
  // Subclasse (mesa / grimório)
  spell("Mãos Ardentes", 1, "Evocação", 1, 2, "Piromante: 3d6 fogo ao toque.", { dano: "3d6", tipo: "fogo", save: "destreza" }),
  spell("Gelo de Conservação", 2, "Transmutação", 1, 1, "Criomante: estase de ingrediente 8h."),
  spell("Fermentação Acelerada", 2, "Transmutação", 1, 2, "Mago Fermentador: fermenta em 1 min.", { tempo: "10 minutos" }),
  spell("Purificação Abençoada", 4, "Abjuração", 1, 1, "Remove maldição ou veneno."),
  spell("Esporos Necróticos", 0, "Necromancia", 2, 1, "Nuvem: save CON ou envenenado.", {
    dano: "1d6",
    tipo: "necrótico",
    save: "constituicao",
    area: { shape: "burst", radiusCells: 1 },
  }),
  spell("Grande Decomposição", 5, "Transmutação", 4, 3, "Decompõe orgânico em cubo 3 célula.", {
    area: { shape: "cube", radiusCells: 1 },
    recarga: "1/turno",
  }),
  spell("Doce Confuso", 1, "Encantamento", 6, 2, "Save CON ou amedrontado.", { save: "constituicao" }),
];

const BOOK_HAB = "CATALOGO-HABILIDADES-TATICAS.md";

const ABILITY_CATALOG = [
  ["Investida em Linha", 2, 1, "ativa", "1/turno", "Desloca em linha reta até 2 célula sem provocar ataques de oportunidade durante o movimento."],
  ["Golpe Flanqueador", 1, 2, "ativa", "", "Gasta 2 PA: próximo ataque corpo a corpo com vantagem se você flanquear o alvo."],
  ["Postura Defensiva", 0, 1, "ativa", "", "+2 defesa até o início do seu próximo turno."],
  ["Reflexos de Masmorra", 1, 1, "reacao", "", "Reação a um ataque: desloca 1 célula imediatamente (não provoca oportunidades)."],
  ["Olhar do Caçador", 5, 1, "ativa", "", "Marca um alvo visível a até 5 célula; seu próximo ataque à distância contra ele ganha +2."],
  ["Investida do Guerreiro", 2, 1, "ativa", "1/turno", "Corrida em linha reta até 2 célula; ideal terminar adjacente a um inimigo para atacar no mesmo turno."],
  ["Golpe Devastador", 1, 3, "ativa", "", "Próximo ataque corpo a corpo recebe +2 no teste de ataque."],
  ["Esquiva Tática", 0, 1, "ativa", "", "+2 defesa até o início do seu próximo turno."],
  ["Tiro Certeiro", 5, 1, "ativa", "", "Próximo ataque à distância contra alvo visível é feito com vantagem."],
  ["Emboscada", 1, 2, "ativa", "", "Ataque furtivo adjacente; vantagem se o alvo não viu você no início do turno."],
  ["Finta", 1, 1, "ativa", "", "Alvo marcado tem desvantagem no próximo ataque contra você."],
  ["Passo das Sombras", 2, 1, "ativa", "1/turno", "Teleporte curto de até 2 célula; conta como movimento."],
  ["Raio Arcano", 6, 1, "ativa", "", "Truque ofensivo: 1d10+INT de dano mágico em um alvo a até 6 célula."],
  ["Escudo Mágico", 0, 1, "ativa", "", "+3 defesa até o início do seu próximo turno."],
  ["Canalizar Energia", 1, 2, "ativa", "", "Ataque corpo a corpo sagrado: +2 no ataque e +2d6 radiante no dano."],
  ["Fúria Controlada", 0, 1, "ativa", "", "Resistência a dano contundente até o fim do seu próximo turno."],
  ["Investida Bárbara", 3, 1, "ativa", "1/turno", "Corre até 3 célula em linha reta sem provocar oportunidades."],
  ["Inspiração de Batalha", 4, 1, "ativa", "", "Aliado visível a até 4 célula ganha vantagem no próximo ataque."],
  ["Canção de Cura", 1, 1, "ativa", "", "Aliado adjacente recupera 1d6 HP."],
  ["Forma Selvagem", 0, 3, "ativa", "1/combate", "Prepara transformação biomágica (3 PA; Mestre valida a forma)."],
  ["Raízes Prendentes", 4, 2, "ativa", "", "Restringe alvo 1 turno (save FOR); raízes no célula do alvo."],
  ["Disparo de Artilheiro", 6, 1, "ativa", "", "Projétil concentrado: 2d8 de dano à distância."],
  ["Barreira de Cobre", 0, 1, "ativa", "", "+2 defesa contra efeitos mágicos até seu próximo turno."],
  ["Imposição de Mãos", 1, 1, "ativa", "", "Aliado adjacente recupera 1d8+CAR HP, ou 2d8 radiante vs morto-vivo."],
  ["Golpe Sagrado", 1, 1, "ativa", "", "Próximo ataque corpo a corpo +2d8 radiante (PA extra)."],
  ["Raio do Pacto", 6, 1, "ativa", "", "Truque: 1d10+CAR de dano mágico em um alvo a até 6 célula."],
  ["Raio do Pacto Psíquico", 6, 1, "ativa", "", "Raio psíquico 1d10+CAR; empurra 1,5m em acerto (FOR CD 13)."],
  ["Raio do Pacto Ardente", 6, 1, "ativa", "", "Raio de fogo 1d10+CAR; marca Sangue no acerto (+2d6 fogo depois)."],
  ["Raio do Pacto Salino", 6, 1, "ativa", "", "Raio de frio 1d10+CAR."],
  ["Luz Penitente", 2, 1, "ativa", "1/descanso curto", "Flash radiante 3m: mortos-vivos sofrem 2d8 radiante (sem save)."],
  ["Escudo Solar", 1, 1, "reacao", "", "Reação: aliado adjacente reduz dano sofrido em 1d10+CAR (mín. 1)."],
  ["Julgamento Ardente", 9, 1, "ativa", "1/descanso curto", "Marca inimigo visível 9m; Golpe Sagrado contra ele não gasta PA extra 1×/turno."],
  ["Coroa de Fogo", 3, 2, "ativa", "1/combate", "Explosão solar 4,5m: 4d8 radiante (DES CD 15 metade); aliados imunes."],
  ["Lâmina dos Sepulcros", 1, 1, "ativa", "", "Próximo ataque vs morto-vivo +1d8 radiante ou necrótico."],
  ["Voto de Caça", 9, 1, "ativa", "", "Marca tipo de morto-vivo declarado; +3 dano e vantagem em Percepção vs esse tipo."],
  ["Marca do Limiar", 6, 1, "ativa", "", "Marca liminar: próximo morto-vivo que atacar aliado marcado sofre 2d8 necrótico."],
  ["Processão Silenciosa", 2, 2, "ativa", "1/descanso longo", "Forma espectral 10 min: atravessa portas, +10 Furtividade vs mortos-vivos."],
  ["Mordida do Voto", 1, 1, "ativa", "", "Ação bônus: +2 FOR e +3m movimento por 1 minuto; oportunidades têm desvantagem."],
  ["Fera Interior", 1, 1, "ativa", "", "Primeiro ataque corpo a corpo do turno +1d8 perfurante."],
  ["Carga do Juramento", 6, 2, "ativa", "1/descanso curto", "Investida 12m: vantagem no primeiro ataque; derruba em acerto (FOR CD 14)."],
  ["Pele de Quimera", 1, 1, "reacao", "", "Retalho 2d6+FOR (tipo da quimera); usos = CON/descanso curto."],
  ["Olhar Entre Dimensões", 6, 1, "reacao", "", "Reação: 2d6 psíquico a quem faz aliado falhar save mental."],
  ["Agarrão do Pacto", 5, 2, "ativa", "1/combate", "Tentáculos 9m: até 2 alvos Restringidos (FOR CD 15)."],
  ["Mente Partida", 6, 2, "ativa", "1/descanso longo", "Confusão 1 min (INT CD 16); aberrações INT ≤ 8 falham automaticamente."],
  ["Sangue do Patrono", 0, 1, "ativa", "", "Sacrifica 1d8 HP para recuperar 1 slot de Pacto."],
  ["Pacto de Ferro", 5, 2, "ativa", "1/combate", "Correntes 3d8 fogo + Restringir alvo (FOR CD 15)."],
  ["Correntes Infernais", 3, 3, "ativa", "1/turno", "Selo de sangue 3m: 3d6 fogo a quem entrar; fogo ignora resistência."],
  ["Corrente Mental", 6, 1, "ativa", "1/descanso curto", "Eco mental: repete encantamento nv.1 sem slot."],
  ["Manto de Bruma", 3, 2, "ativa", "", "Névoa 6m 1 min: aliados furtivos; inimigos −2 em ataques à distância."],
  ["Puxão Abissal", 5, 3, "ativa", "1/turno", "Puxa alvo 9m e 2d8 frio (FOR CD 15)."],
];

const BOOK_CHI = "ESPIRITUALISTA-CRIACAO-PERSONAGEM.md";

// Técnicas de Chi (Espiritualista) — custo em PA + Chi, ver guias-criacao/Espiritualista-*.md
const CHI_ABILITY_CATALOG = [
  ["Golpe de Chi", 1, 1, 1, "ativa", "", "Ataque desarmado aprimorado: causa +1d6 de dano de força além do dano normal. O alvo é empurrado 1 célula na direção oposta se falhar em um teste de FOR (CD 12 + mod SAB)."],
  ["Passo do Vácuo", 3, 1, 1, "ativa", "", "Move até 3 células sem provocar ataques de oportunidade. Se terminar adjacente a um inimigo, o próximo ataque feito contra ele neste turno tem vantagem."],
  ["Ferida Aberta", 1, 1, 2, "ativa", "1/turno", "Golpe preciso em ponto de pressão vital: o alvo fica <em>Vulnerável</em> até o fim do próximo turno do Espiritualista (todos os danos recebidos são acrescidos de +1d6 enquanto durar o efeito). Não funciona contra criaturas sem anatomia discernível (construtos, elementais sem forma)."],
  ["Golpe do Vácuo", 1, 1, 1, "ativa", "", "Golpe desarmado canalizado com Chi: causa +1d6 de dano de força além do dano normal, abalando a resistência interna do alvo."],
  ["Muro de Chi", 0, 1, 1, "ativa", "", "Concentra Chi ao redor do corpo como um escudo: ganha +2 CA até o início do próximo turno."],
];

const ABILITIES = [
  ...ABILITY_CATALOG.map(([name, range, pa, tipo, recarga, desc]) => ({
    id: `habilidades-${slug(name)}`,
    name,
    type: "habilidade",
    system: {
      catalogId: `HAB-${slug(name)}`,
      bookRef: BOOK_HAB,
      description: `<p>${desc}</p>`,
      tactical: { alcanceCells: { value: range, min: 0 }, custoPontosAcao: { value: pa, min: 0 } },
      ability: { tipo, recarga },
    },
  })),
  ...CHI_ABILITY_CATALOG.map(([name, range, pa, chi, tipo, recarga, desc]) => ({
    id: `chi-${slug(name)}`,
    name,
    type: "habilidade",
    system: {
      catalogId: `CHI-${slug(name)}`,
      bookRef: BOOK_CHI,
      description: `<p><strong>Custo: ${chi} Chi.</strong> ${desc}</p>`,
      tactical: {
        alcanceCells: { value: range, min: 0 },
        custoPontosAcao: { value: pa, min: 0 },
        custoChi: { value: chi, min: 0 },
      },
      ability: { tipo, recarga },
    },
  })),
];

for (const s of SPELLS) {
  const lore = SPELL_LORE[s.name];
  if (lore) {
    const escola = s.system.spell?.escola ?? "";
    const nv = s.system.spell?.nivel ?? 0;
    const pa = s.system.tactical?.custoPontosAcao?.value ?? 1;
    const cell = s.system.tactical?.alcanceCells?.value ?? 0;
    s.system.description = `<p>${escapeHtml(lore.desc)}</p><p><em>${escapeHtml(lore.meta)} · nv ${nv} · ${pa} PA · ${cell} células</em></p>`;
    s.system.bookRef = "_parte_x_magias_v4_revisada.md";
  } else {
    const escola = s.system.spell?.escola ?? "Magia";
    const nv = s.system.spell?.nivel ?? 0;
    const base = stripHtmlTag(s.system.description);
    s.system.description = `<p>${escapeHtml(base)}</p><p><em>${escola} · nv ${nv}</em></p>`;
    s.system.bookRef = "_parte_x_magias_v4_revisada.md";
  }
}

function stripHtmlTag(html) {
  return String(html).replace(/<[^>]+>/g, "").trim();
}

writeFileSync(join(OUT, "monstros.json"), JSON.stringify(MONSTERS, null, 2) + "\n");
if (!MONSTERS_ONLY) {
  writeFileSync(join(OUT, "magias.json"), JSON.stringify(SPELLS, null, 2) + "\n");
  writeFileSync(join(OUT, "habilidades.json"), JSON.stringify(ABILITIES, null, 2) + "\n");
}

console.log(
  MONSTERS_ONLY
    ? `OK: ${MONSTERS.length} monstros (magias/habilidades preservados)`
    : `OK: ${MONSTERS.length} monstros, ${SPELLS.length} magias, ${ABILITIES.length} habilidades (armas/equipamentos: scripts/gen-equipment-compendium.py)`
);
