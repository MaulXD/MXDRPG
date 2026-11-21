/**
 * CUS-fix: custo em PA, dano e CD de salvaguarda das magias e habilidades
 * tem que bater com o livro.
 *
 * Fontes: livros/_parte_x_magias_v4_revisada.md (linhas 205, 230, 236, 287)
 * e livros/LIVRO-DO-JOGADOR.md (linhas 3116, 3132). Lista em
 * docs/fichario/propostas/custos-e-danos.md.
 *
 * Causa: scripts/generate-compendium.mjs tinha PA de 2 magias, CD ausente em
 * 3 magias (Visao do Ecossistema, Mutacao Forcada, Prisao de Gelo) e CD
 * errada/ausente em 2 habilidades (Puxao Abissal, Correntes Infernais).
 *
 * Dano de Ventania, Terremoto e Esporos Necroticos NAO e verificado aqui:
 * o livro nao traz dano para elas e a decisao de remover esta na pagina
 * "03 Precisa de decisão". Por isso o script so garante que o dano atual
 * continua no dado ate essa decisao.
 *
 * node scripts/verify-custos-livro.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const loadList = (p) =>
  JSON.parse(readFileSync(join(root, p), "utf8").replace(/^﻿/, ""));

const magias = loadList("data/compendiums/magias.json");
const habilidades = loadList("data/compendiums/habilidades.json");
const byId = (list, id) => list.find((x) => x.id === id);

let ok = 0;
let falha = 0;
const check = (label, fn) => {
  try {
    fn();
    ok++;
  } catch (err) {
    falha++;
    console.error(`FALHA: ${label}\n  ${err.message.split("\n")[0]}`);
  }
};

// 1. Custo em PA (livro: 2 PA no VTT, linhas 205 e 236).
for (const [id, nome] of [
  ["magias-injecao-biomagica", "Injeção Biomágica"],
  ["magias-mutacao-forcada", "Mutação Forçada"],
]) {
  check(`${nome}: custo em PA = 2`, () => {
    const e = byId(magias, id);
    assert.ok(e, `${id} nao existe`);
    assert.equal(e.system.tactical.custoPontosAcao.value, 2);
  });
}

// 2. CD de salvaguarda ausente (livro: SAB CD 15, linha 230; CON CD, linha 236;
// FOR CD, linha 287).
for (const [id, nome, attr] of [
  ["magias-visao-do-ecossistema", "Visão do Ecossistema", "sabedoria"],
  ["magias-mutacao-forcada", "Mutação Forçada", "constituicao"],
  ["magias-prisao-de-gelo", "Prisão de Gelo", "forca"],
]) {
  check(`${nome}: salvaguarda ${attr}`, () => {
    const e = byId(magias, id);
    assert.ok(e, `${id} nao existe`);
    assert.equal(e.system.spell.save?.attribute, attr);
  });
}

// 3. CD de habilidades (livro: DES CD 16 linha 3116; FOR CD 16 linha 3132).
check("Correntes Infernais: texto traz DES CD 16", () => {
  const e = byId(habilidades, "habilidades-correntes-infernais");
  assert.ok(e, "habilidades-correntes-infernais nao existe");
  assert.match(e.system.description, /DES CD 16/);
});
check("Puxão Abissal: texto traz FOR CD 16 e nao CD 15", () => {
  const e = byId(habilidades, "habilidades-puxao-abissal");
  assert.ok(e, "habilidades-puxao-abissal nao existe");
  assert.match(e.system.description, /FOR CD 16/);
  assert.doesNotMatch(e.system.description, /FOR CD 15/);
});

// 4. Dano que o livro tem e o dado nao tinha (Parede de Fogo, linha 239).
// O texto do livro (2d8 radiante a 3 m por turno) ja entra pela descricao.
check("Parede de Fogo: texto traz 2d8 radiante", () => {
  const e = byId(magias, "magias-parede-de-fogo");
  assert.ok(e, "magias-parede-de-fogo nao existe");
  assert.match(e.system.description, /2d8 radiante/);
});

// 5. Dano sem respaldo no livro: fica no dado ate a decisao da pagina 03.
for (const [id, nome, formula] of [
  ["magias-ventania", "Ventania", "2d6"],
  ["magias-terremoto", "Terremoto", "6d6"],
  ["magias-esporos-necroticos", "Esporos Necróticos", "1d6"],
]) {
  check(`${nome}: dano ${formula} mantido ate decisao`, () => {
    const e = byId(magias, id);
    assert.ok(e, `${id} nao existe`);
    assert.equal(e.system.weapon?.dano?.formula, formula);
  });
}

// 6. Texto da Terremoto no JSON: raio de 20 celulas = 30 m (nao "Area 30 celula").
check("Terremoto: descricao do JSON com raio 30 m", () => {
  const e = byId(magias, "magias-terremoto");
  assert.ok(e, "magias-terremoto nao existe");
  assert.match(e.system.description, /Raio 30 ?m/);
  assert.doesNotMatch(e.system.description, /Área 30 célula/);
});

console.log(`verify-custos-livro: ${ok} ok, ${falha} falha(s)`);
if (falha > 0) process.exit(1);
