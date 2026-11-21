// BV-070: kits iniciais por classe (lib/character/starter-kits.ts) batem com a tabela
// "Kits por classe (escolha 1)" do livros/LIVRO-DO-JOGADOR.md.
// Regras: magia que o livro nao cita sai do kit; armadura so onde o livro cita;
// combatLoadout: o original quando o item continua no kit (o livro deixa a magia ser
// o foco); se o item saiu, a magia ou habilidade que ficou no kit (parecer da Lupa);
// todo entryId precisa existir no compendio.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = process.env.KITS_FILE ?? join(root, "lib/character/starter-kits.ts");
const src = readFileSync(file, "utf8");

const start = src.indexOf("const CLASS_STARTER_KITS");
const end = src.indexOf("\n};", start);
if (start < 0 || end < 0) {
  console.error("FALHA: CLASS_STARTER_KITS nao encontrado");
  process.exit(1);
}
const block = src.slice(start, end);

// Esperado segundo o livro (pack:entryId). armor null = kit sem armadura.
// Excecao: mago-adaga, bruxo-cajado, espiritualista-bastao e espiritualista-lamina fixam
// substitutos porque Brasa Espectral, Cajado, Bastao e Espada curta ainda nao existem no
// compendio (pendencia na pagina 07; truques do Bruxo na decisao D-23).
const ESPERADO = {
  Guerreiro: [
    ["guerreiro-lamina", ["armas:armas-wpn-s01", "equipamentos:equipamentos-arm-01"], "armas:armas-wpn-s01", "equipamentos:equipamentos-arm-01"],
    ["guerreiro-espada", ["armas:armas-wpn-s02", "equipamentos:equipamentos-arm-05"], "armas:armas-wpn-s02", "equipamentos:equipamentos-arm-05"],
    ["guerreiro-arco", ["armas:armas-arc-l01", "equipamentos:equipamentos-arm-02"], "armas:armas-arc-l01", "equipamentos:equipamentos-arm-02"],
  ],
  Patrulheiro: [
    ["patrulheiro-arco", ["armas:armas-arc-c01", "equipamentos:equipamentos-arm-01"], "armas:armas-arc-c01", "equipamentos:equipamentos-arm-01"],
    ["patrulheiro-duas-armas", ["armas:armas-wpn-s08", "equipamentos:equipamentos-arm-03"], "armas:armas-wpn-s08", "equipamentos:equipamentos-arm-03"],
    ["patrulheiro-melee", ["armas:armas-wpn-s05", "equipamentos:equipamentos-arm-07"], "armas:armas-wpn-s05", "equipamentos:equipamentos-arm-07"],
  ],
  Ladino: [
    ["ladino-rapieira", ["armas:armas-wpn-s05", "equipamentos:equipamentos-arm-01"], "armas:armas-wpn-s05", "equipamentos:equipamentos-arm-01"],
    ["ladino-adagas", ["armas:armas-wpn-o02", "equipamentos:equipamentos-arm-02"], "armas:armas-wpn-o02", "equipamentos:equipamentos-arm-02"],
    ["ladino-arco", ["armas:armas-arc-c01"], "armas:armas-arc-c01", null],
  ],
  Mago: [
    ["mago-adaga", ["armas:armas-wpn-o01", "magias:magias-lamina-de-espirito", "magias:magias-chama-de-fogareiro"], "magias:magias-lamina-de-espirito", null],
    ["mago-bestia", ["armas:armas-bst-01", "equipamentos:equipamentos-arm-01", "magias:magias-raio-do-limiar"], "armas:armas-bst-01", "equipamentos:equipamentos-arm-01"],
    ["mago-arcano", ["armas:armas-wpn-o01", "magias:magias-onda-de-trovao", "magias:magias-escudo-arcano"], "magias:magias-onda-de-trovao", null],
  ],
  Clérigo: [
    ["clerigo-maca", ["armas:armas-wpn-o05", "equipamentos:equipamentos-arm-07", "magias:magias-curar-ferimentos"], "armas:armas-wpn-o05", "equipamentos:equipamentos-arm-07"],
    ["clerigo-bestia", ["armas:armas-bst-01", "equipamentos:equipamentos-arm-01", "magias:magias-curar-ferimentos"], "armas:armas-bst-01", "equipamentos:equipamentos-arm-01"],
    ["clerigo-azagaia", ["armas:armas-wpn-p04", "equipamentos:equipamentos-arm-09"], "armas:armas-wpn-p04", "equipamentos:equipamentos-arm-09"],
  ],
  Bárbaro: [
    ["barbaro-machado", ["armas:armas-wpn-o04", "equipamentos:equipamentos-arm-03"], "armas:armas-wpn-o04", "equipamentos:equipamentos-arm-03"],
    ["barbaro-gladius", ["armas:armas-wpn-s08", "equipamentos:equipamentos-arm-04"], "armas:armas-wpn-s08", "equipamentos:equipamentos-arm-04"],
    ["barbaro-maca", ["armas:armas-wpn-o05", "equipamentos:equipamentos-arm-01"], "armas:armas-wpn-o05", "equipamentos:equipamentos-arm-01"],
  ],
  Bardo: [
    ["bardo-rapieira", ["armas:armas-wpn-s05", "equipamentos:equipamentos-arm-01", "magias:magias-inspiracao-culinaria"], "armas:armas-wpn-s05", "equipamentos:equipamentos-arm-01"],
    ["bardo-adaga", ["armas:armas-wpn-o01", "equipamentos:equipamentos-arm-02", "magias:magias-sussurro-de-masmorra"], "armas:armas-wpn-o01", "equipamentos:equipamentos-arm-02"],
    ["bardo-arco", ["armas:armas-arc-c01", "magias:magias-ilusao-menor"], "armas:armas-arc-c01", null],
  ],
  Druida: [
    ["druida-cimitarra", ["armas:armas-wpn-s07", "equipamentos:equipamentos-arm-03", "magias:magias-crescimento-acelerado"], "armas:armas-wpn-s07", "equipamentos:equipamentos-arm-03"],
    ["druida-organica", ["armas:armas-wpn-p04", "equipamentos:equipamentos-arm-14", "magias:magias-purificar-veneno"], "armas:armas-wpn-p04", "equipamentos:equipamentos-arm-14"],
    ["druida-adaga", ["armas:armas-wpn-o01", "equipamentos:equipamentos-arm-15", "magias:magias-estabilizar"], "armas:armas-wpn-o01", "equipamentos:equipamentos-arm-15"],
  ],
  Feiticeiro: [
    ["feiticeiro-centelha", ["armas:armas-wpn-o01", "magias:magias-lamina-de-espirito"], "magias:magias-lamina-de-espirito", null],
    ["feiticeiro-trovao", ["armas:armas-bst-01", "magias:magias-onda-de-trovao"], "magias:magias-onda-de-trovao", null],
    ["feiticeiro-chama", ["armas:armas-wpn-o05", "magias:magias-chama-de-vinha"], "magias:magias-chama-de-vinha", null],
  ],
  Espiritualista: [
    ["espiritualista-punhos", ["habilidades:chi-golpe-de-chi"], "habilidades:chi-golpe-de-chi", null],
    ["espiritualista-bastao", ["armas:armas-wpn-p01", "habilidades:chi-passo-do-vacuo"], "habilidades:chi-passo-do-vacuo", null],
    ["espiritualista-lamina", ["armas:armas-wpn-s01", "habilidades:chi-ferida-aberta"], "habilidades:chi-ferida-aberta", null],
  ],
  Paladino: [
    ["paladino-espada", ["armas:armas-wpn-s02", "equipamentos:equipamentos-arm-05", "magias:magias-curar-ferimentos", "magias:magias-raio-do-limiar"], "armas:armas-wpn-s02", "equipamentos:equipamentos-arm-05"],
    ["paladino-maca", ["armas:armas-wpn-o05", "equipamentos:equipamentos-arm-07", "magias:magias-curar-ferimentos", "magias:magias-escudo-arcano"], "armas:armas-wpn-o05", "equipamentos:equipamentos-arm-07"],
    ["paladino-gladius", ["armas:armas-wpn-s08", "equipamentos:equipamentos-arm-09", "magias:magias-purificar-veneno"], "armas:armas-wpn-s08", "equipamentos:equipamentos-arm-09"],
  ],
  Bruxo: [
    ["bruxo-adaga", ["armas:armas-wpn-o01", "equipamentos:equipamentos-arm-01", "magias:magias-raio-do-limiar", "magias:magias-sussurro-de-masmorra"], "armas:armas-wpn-o01", "equipamentos:equipamentos-arm-01"],
    ["bruxo-cajado", ["armas:armas-wpn-o03", "equipamentos:equipamentos-arm-02", "magias:magias-chama-de-fogareiro"], "armas:armas-wpn-o03", "equipamentos:equipamentos-arm-02"],
    ["bruxo-bestia", ["armas:armas-bst-01", "magias:magias-lamina-de-espirito", "magias:magias-ilusao-menor"], "armas:armas-bst-01", null],
  ],
};

const PACK_FILE = { armas: "armas", equipamentos: "equipamentos", magias: "magias", habilidades: "habilidades" };
const idsCache = {};
function compendiumIds(pack) {
  if (!idsCache[pack]) {
    const text = readFileSync(join(root, "data/compendiums", `${PACK_FILE[pack]}.json`), "utf8");
    idsCache[pack] = new Set([...text.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]));
  }
  return idsCache[pack];
}

const erros = [];
const kitRe = /id: "([^"]+)"/g;
const classeRe = /^ {2}([^\s:]+): \[$/gm;
const classes = [...block.matchAll(classeRe)].map((m) => ({ nome: m[1], pos: m.index }));
const kits = [...block.matchAll(kitRe)].map((m) => ({ id: m[1], pos: m.index }));

function classeDe(pos) {
  let atual = null;
  for (const c of classes) if (c.pos <= pos) atual = c.nome;
  return atual;
}

const encontrados = {};
kits.forEach((k, i) => {
  const fim = i + 1 < kits.length ? kits[i + 1].pos : block.length;
  const trecho = block.slice(k.pos, fim);
  const classe = classeDe(k.pos);
  const itensTxt = trecho.slice(trecho.indexOf("items:"), trecho.indexOf("combatLoadout:"));
  const itens = [...itensTxt.matchAll(/packId: "(\w+)", entryId: "([^"]+)"/g)].map((m) => `${m[1]}:${m[2]}`);
  const combat = /combatLoadout: \{ packId: "(\w+)", entryId: "([^"]+)" \}/.exec(trecho);
  const armorTxt = /armorLoadout: (\{ packId: "(\w+)", entryId: "([^"]+)" \}|null)/.exec(trecho);
  (encontrados[classe] ??= []).push({
    id: k.id,
    itens,
    combat: combat ? `${combat[1]}:${combat[2]}` : null,
    armor: armorTxt && armorTxt[2] ? `${armorTxt[2]}:${armorTxt[3]}` : null,
  });
  for (const item of itens) {
    const [pack, entry] = item.split(":");
    if (!compendiumIds(pack).has(entry)) erros.push(`${k.id}: entryId ${entry} nao existe em ${pack}`);
  }
});

const classesEsperadas = Object.keys(ESPERADO);
for (const classe of classesEsperadas) {
  const esperados = ESPERADO[classe];
  const reais = encontrados[classe] ?? [];
  if (reais.length !== 3) erros.push(`${classe}: esperados 3 kits, achados ${reais.length}`);
  esperados.forEach(([id, itens, combat, armor], i) => {
    const real = reais[i];
    if (!real) return;
    if (real.id !== id) erros.push(`${classe} kit ${i + 1}: id ${real.id} (esperado ${id})`);
    const a = [...real.itens].sort().join(" | ");
    const b = [...itens].sort().join(" | ");
    if (a !== b) erros.push(`${id}: itens [${a}] (livro: [${b}])`);
    if (real.combat !== combat) erros.push(`${id}: combatLoadout ${real.combat} (esperado ${combat})`);
    if (real.armor !== armor) erros.push(`${id}: armorLoadout ${real.armor} (esperado ${armor})`);
  });
}
for (const classe of Object.keys(encontrados)) {
  if (!classesEsperadas.includes(classe)) erros.push(`classe ${classe} sem esperado`);
}

// Parecer da Lupa: label e resumo so citam o que o kit entrega. Itens do livro que
// ainda nao existem no compendio (Brasa Espectral, Cajado, Bastao, Espada curta)
// nao podem aparecer no texto do kit.
const AUSENTES = ["Brasa Espectral", "Cajado", "cajado", "Bastão", "bastão", "Espada curta", "espada curta"];
for (const m of block.matchAll(/id: "([^"]+)",\s*label: "([^"]*)",\s*summary: "([^"]*)"/g)) {
  for (const nome of AUSENTES) {
    if (m[2].includes(nome) || m[3].includes(nome)) erros.push(`${m[1]}: texto cita '${nome}', que o kit nao entrega`);
  }
}

if (erros.length) {
  console.error(`FALHA: ${erros.length} divergencia(s) de kits com o livro:`);
  for (const e of erros) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`ok: ${kits.length} kits de ${classesEsperadas.length} classes batem com o livro`);
