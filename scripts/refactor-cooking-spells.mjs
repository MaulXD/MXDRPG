/**
 * Remove magias de cozinha; refatora utilitários; rebalanceia PA.
 * Uso: node scripts/refactor-cooking-spells.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const magiasPath = path.join(root, "data/compendiums/magias.json");

const REMOVE_IDS = new Set([
  "magias-identificar-ingrediente",
  "magias-aprimoramento-biomagico",
  "magias-preservacao-perfeita",
  "magias-preservacao-anual",
]);

const PATCHES = {
  "magias-chama-de-fogareiro": {
    name: "Brasa Espectral",
    description:
      "<p>Luz fria em penumbra (6 célula). Toque opcional: 1d4 fogo. <strong>Não</strong> cozinha nem substitui kit de brasas — proibida em biomas de gás como chama aberta.</p><p><em>Evocação · Truque · Ação · Pessoal · Concentração até 1 h · 1 PA</em></p>",
    pa: 1,
    weapon: {
      dano: { formula: "1d4", tipo: "fogo" },
      ataque: { bonus: 0 },
    },
  },
  "magias-detectar-veneno": {
    name: "Sentir Toxina",
    description:
      "<p>Detecta veneno, doença ou toxina em criaturas e objetos num raio de 3 célula (aura avermelhada). Em combate: dura 1 rodada; fora: até 10 min.</p><p><em>Adivinhação · Truque · Ação · Pessoal · 1 PA</em></p>",
    pa: 1,
  },
  "magias-maos-firmes": {
    name: "Mãos Estáveis",
    description:
      "<p>Alvo ganha <strong>+2</strong> em testes de Destreza (inclui Extração) por 1 hora; ignora −2 por falta de treinamento em Extração.</p><p><em>Transmutação · Truque · Ação · Toque · 1 PA</em></p>",
    pa: 1,
  },
  "magias-extracao-amplificada": {
    name: "Marca da Caçada",
    description:
      "<p><strong>Ação bônus.</strong> Próxima criatura que você ou um aliado matar em 1 h (18 m): <strong>vantagem</strong> em Extração e <strong>+2</strong> no teste de rendimento. Não dobra loot.</p><p><em>Biomancia · nv 1 · 1 PA</em></p>",
    pa: 1,
    tempo: "1 ação bônus",
  },
  "magias-inspiracao-culinaria": {
    name: "Ímpeto Inspirador",
    description:
      "<p><strong>Ação bônus.</strong> Aliado a 6 célula ganha <strong>+1d6</strong> no próximo teste de atributo, ataque ou resistência em 1 h.</p><p><em>Encantamento · nv 2 · 1 PA</em></p>",
    pa: 1,
    tempo: "1 ação bônus",
  },
  "magias-gelo-de-conservacao": {
    name: "Couraça de Gelo",
    description:
      "<p>Toque: alvo ganha <strong>+2 CA temporária</strong> por 8 h (criomante: +3). Exclusiva de subclasse.</p><p><em>Abjuração · nv 2 · 1 PA</em></p>",
    pa: 1,
    escola: "Abjuração",
  },
  "magias-lamina-de-espirito": {
    name: "Lâmina de Espírito",
    description:
      "<p><strong>Ação bônus.</strong> Lâmina etérea 1d4 força por 1 min; +2 em Extração com ela.</p><p><em>Transmutação · Truque · 1 PA</em></p>",
    pa: 1,
  },
  "magias-injecao-biomagica": {
    pa: 2,
    description:
      "<p>Concede uma habilidade de assimilação do ingrediente por 12 h, sem refeição (ingrediente consumido).</p><p><em>Biomancia · nv 3 · 2 PA</em></p>",
  },
  "magias-mutacao-forcada": {
    pa: 2,
    description:
      "<p>Alvo: CON CD ou mutação negativa aleatória por 1 h (concentração).</p><p><em>Biomancia · nv 4 · 2 PA</em></p>",
  },
  "magias-envelhecer-materia": {
    description:
      "<p><strong>Só em descanso/ritual</strong> (10 min, sem PA em combate). Objeto orgânico inanimado envelhece visualmente até conjurar <em>Fermentação Acelerada</em>.</p><p><em>Transmutação · Truque · Toque · Mago Alquímico (exclusiva)</em></p>",
    pa: 1,
  },
  "magias-fermentacao-acelerada": {
    description:
      "<p><strong>Só em descanso/ritual</strong> (10 min). Ingrediente fermenta em 1 min; remove doenças leves não mágicas em quem consumir.</p><p><em>Transmutação · nv 2 · 2 PA fora de combate</em></p>",
    pa: 2,
  },
  "magias-transmutacao-de-carne": {
    description:
      "<p><strong>Só em descanso</strong> (1 h, 2 PA). Converte ingrediente em equivalente de mesma raridade (ex.: goblin → grifo).</p><p><em>Transmutação · nv 2 · 2 PA</em></p>",
    pa: 2,
  },
};

let magias = JSON.parse(fs.readFileSync(magiasPath, "utf8"));

magias = magias.filter((e) => !REMOVE_IDS.has(e.id));

for (const entry of magias) {
  const patch = PATCHES[entry.id];
  if (!patch) continue;
  if (patch.name) entry.name = patch.name;
  if (patch.description) entry.system.description = patch.description;
  if (patch.pa != null) entry.system.tactical.custoPontosAcao.value = patch.pa;
  if (patch.escola) entry.system.spell.escola = patch.escola;
  if (patch.tempo) entry.system.spell.tempo = patch.tempo;
  if (patch.weapon) entry.system.weapon = patch.weapon;
  else if (entry.id === "magias-chama-de-fogareiro" && patch.weapon === undefined) {
    // weapon added via patch
  }
}

fs.writeFileSync(magiasPath, JSON.stringify(magias, null, 2) + "\n", "utf8");
console.log("magias.json:", magias.length, "entradas");
