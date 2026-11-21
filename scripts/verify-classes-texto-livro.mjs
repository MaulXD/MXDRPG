// Confere que o nome do Bonus Passivo de Sobrevivencia (Nivel 1) de cada classe
// em lib/character/rules.ts (CLASS_LIST.dietBonus, texto antes do travessao)
// e igual ao do livros/LIVRO-DO-JOGADOR.md. Ignora acentos e caixa.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(join(root, "lib/character/rules.ts"), "utf8");
const livro = readFileSync(join(root, "livros/LIVRO-DO-JOGADOR.md"), "utf8");

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const nomeDoPassivo = (texto) => norm(texto.split(/\s+—\s+/)[0]);

// Codigo: id e dietBonus de cada classe em CLASS_LIST.
const inicio = rules.indexOf("export const CLASS_LIST");
const fim = rules.indexOf("export const RACE_LIST");
if (inicio < 0 || fim < 0) {
  console.error("FALHA: nao achei CLASS_LIST/RACE_LIST em lib/character/rules.ts");
  process.exit(1);
}
const trechoClasses = rules.slice(inicio, fim);
const codigo = new Map();
for (const parte of trechoClasses.split('    id: "').slice(1)) {
  const id = parte.match(/^([^"]+)"/)?.[1];
  const dieta = parte.match(/dietBonus:\s*"([^"]+)"/)?.[1];
  if (id && dieta) codigo.set(norm(id), { id, dieta });
}

// Livro: secao "### CLASSE" e a linha depois de "Bonus Passivo de Sobrevivencia (Nivel 1)".
const linhas = livro.split(/\r?\n/);
const livroPassivos = new Map();
for (let i = 0; i < linhas.length; i++) {
  const cab = linhas[i].match(/^### ([A-Z][A-Z ]+)$/);
  if (!cab) continue;
  const chave = norm(cab[1]);
  for (let j = i + 1; j < linhas.length && !linhas[j].startsWith("### "); j++) {
    if (norm(linhas[j]).startsWith("bonus passivo de sobrevivencia (nivel 1)")) {
      let k = j + 1;
      while (k < linhas.length && linhas[k].trim() === "") k++;
      livroPassivos.set(chave, linhas[k].trim());
      break;
    }
  }
}

const erros = [];
if (codigo.size !== 12) erros.push(`CLASS_LIST tem ${codigo.size} classes, esperado 12`);
if (livroPassivos.size !== 12) erros.push(`livro tem ${livroPassivos.size} passivos, esperado 12`);

for (const [chave, { id, dieta }] of codigo) {
  const textoLivro = livroPassivos.get(chave);
  if (!textoLivro) {
    erros.push(`${id}: secao da classe nao achada no livro`);
    continue;
  }
  const nomeCodigo = nomeDoPassivo(dieta);
  const nomeLivro = nomeDoPassivo(textoLivro);
  if (nomeCodigo !== nomeLivro) {
    erros.push(
      `${id}: passivo no codigo "${dieta.split(/\s+—\s+/)[0]}" != livro "${textoLivro.split(/\s+—\s+/)[0]}"`,
    );
  }
}

if (erros.length > 0) {
  console.error("FALHA verify-classes-texto-livro:");
  for (const e of erros) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`OK verify-classes-texto-livro: ${codigo.size} passivos conferem com o livro.`);
