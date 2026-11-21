/**
 * ALC-fix: alcances de magias e habilidades e areas tem que bater com o livro.
 *
 * Regra: 1 celula = 1,5 m, arredonda para baixo (floor(metros / 1,5)).
 * Fonte dos metros: livros/_parte_x_magias_v4_revisada.md (magias) e
 * livros/LIVRO-DO-JOGADOR.md (habilidades). Lista em docs/fichario/propostas/alcances.md, secao 6.
 * Areas: secao 7 (Onda de Trovao cubo 4,5 m = 3 celulas; Terremoto raio 30 m = 20 celulas).
 *
 * Causa: scripts/generate-compendium.mjs tinha 21 alcances e 2 areas fora do livro.
 *
 * node scripts/verify-alcances-livro.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const loadList = (p) =>
  JSON.parse(readFileSync(join(root, p), "utf8").replace(/^\uFEFF/, ""));

const magias = loadList("data/compendiums/magias.json");
const habilidades = loadList("data/compendiums/habilidades.json");
const byId = (list, id) => list.find((x) => x.id === id);

// [id, nome, metros no livro, celulas esperadas, lista]
const ALCANCES = [
  ["magias-maos-gelidas", "Mãos Gelidas", 4.5, 3, magias],
  ["magias-raios-de-enfraquecimento", "Raios de Enfraquecimento", 18, 12, magias],
  ["magias-esfera-acida-de-monstro", "Esfera Ácida de Monstro", 18, 12, magias],
  ["magias-ilusao-menor", "Ilusão Menor", 18, 12, magias],
  ["magias-animacao-de-mortos", "Animação de Mortos", 3, 2, magias],
  ["magias-bola-de-fogo", "Bola de Fogo", 45, 30, magias],
  ["magias-ler-mentes", "Ler Mentes", 9, 6, magias],
  ["magias-relampago", "Relâmpago", 36, 24, magias],
  ["magias-sono", "Sono", 18, 12, magias],
  ["magias-murcha", "Murcha", 4.5, 3, magias],
  ["magias-mutacao-forcada", "Mutação Forçada", 18, 12, magias],
  ["magias-parede-de-fogo", "Parede de Fogo", 36, 24, magias],
  ["magias-cura-em-massa", "Cura em Massa", 18, 12, magias],
  ["magias-salto-dimensional", "Salto Dimensional", 18, 12, magias],
  ["magias-causar-praga", "Causar Praga", 18, 12, magias],
  ["magias-cadeia-de-relampago", "Cadeia de Relâmpago", 45, 30, magias],
  ["magias-prisao-de-gelo", "Prisão de Gelo", 18, 12, magias],
  ["magias-terremoto", "Terremoto", 150, 100, magias],
  ["habilidades-voto-de-caca", "Voto de Caça", 18, 12, habilidades],
  ["habilidades-pacto-de-ferro", "Pacto de Ferro", 9, 6, habilidades],
  ["habilidades-corrente-mental", "Corrente Mental", 18, 12, habilidades],
];

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
  } catch (e) {
    fail++;
    console.log(`FAIL ${name}\n     ${e.message.split("\n")[0]}`);
  }
}

check("regra 1 celula = 1,5 m, arredonda para baixo, bate com a tabela", () => {
  for (const [id, , metros, cells] of ALCANCES) {
    assert.equal(Math.floor(metros / 1.5), cells, id);
  }
});

for (const [id, nome, metros, cells, list] of ALCANCES) {
  check(`${nome}: ${metros} m = ${cells} celulas no JSON`, () => {
    const item = byId(list, id);
    assert.ok(item, `falta ${id}`);
    assert.equal(item.system.tactical.alcanceCells.value, cells, id);
  });
}

check("Onda de Trovao: cubo 4,5 m = raio 3 celulas", () => {
  assert.equal(byId(magias, "magias-onda-de-trovao").system.spell.area.radiusCells, 3);
});

check("Terremoto: raio 30 m = raio 20 celulas", () => {
  assert.equal(byId(magias, "magias-terremoto").system.spell.area.radiusCells, 20);
});

console.log(`\n${pass} ok, ${fail} falha${fail === 1 ? "" : "s"}`);
if (fail > 0) process.exit(1);
