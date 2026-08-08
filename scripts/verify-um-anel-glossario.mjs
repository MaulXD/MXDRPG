/**
 * O glossário é o contrato de terminologia — este teste o obriga a bater com o
 * que o app realmente mostra na tela.
 *
 * Por que existe: `00-glossario-termos.md` nunca era conferido contra o código, e
 * foi ficando para trás enquanto os capítulos e a UI evoluíam. Divergências reais
 * que ele carregava:
 *
 *  - `Might → Poder`, enquanto o capítulo 8, o bestiário, o token e a ficha usam
 *    **Vigor**. Um Mestre lendo "criaturas com Poder 2 ou mais" (Matador de
 *    Dragões) não tinha como saber que era o "Vigor 2" do bloco do adversário;
 *  - `Rally Comrades → Reanimar Companheiros`, nome que já tinha sido corrigido
 *    para **Reunir Companheiros** em stances.ts e no compêndio — o glossário
 *    ficou sendo a última fonte do nome errado;
 *  - posturas no masculino ("Avançado") contra o feminino da UI ("Avançada",
 *    que concorda com *Postura*).
 *
 * Fonte: livros/um-anel/00-glossario-termos.md × lib/character/um-anel/data.ts e
 * lib/combat/um-anel/stances.ts
 */
import { readFileSync as rawReadFileSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const GLOSS = readFileSync(root("livros", "um-anel", "00-glossario-termos.md"), "utf8");
const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
const STANCES = readFileSync(root("lib", "combat", "um-anel", "stances.ts"), "utf8");

let pass = 0;
let fail = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("verify-um-anel-glossario: glossário × termos que o app mostra");

/** `| Inglês | PT-BR |` → Map(inglês → PT-BR). */
const termo = new Map(
  [...GLOSS.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm)]
    .filter(([, en]) => en !== "Inglês" && !/^-+$/.test(en))
    .map((m) => [m[1], m[2]])
);

ok("glossário tem as tabelas de termos", termo.size >= 80, `achou ${termo.size}`);

/* ── Perícias: o glossário lista as 18 com o mesmo rótulo de data.ts ────── */

const skillLabels = [
  ...(DATA.match(/export const SKILLS: TorSkillDef\[\] = \[[\s\S]*?\n\];/) ?? [""])[0].matchAll(
    /label: "([^"]+)"/g
  ),
].map((m) => m[1]);

ok("data.ts tem as 18 Perícias", skillLabels.length === 18, `achou ${skillLabels.length}`);

const glossSkills = new Set([...termo.values()]);
for (const label of skillLabels) {
  ok(`Perícia "${label}" está no glossário`, glossSkills.has(label));
}

/* ── Atributos e Proficiências ─────────────────────────────────────────── */

for (const [en, pt] of [
  ["Strength", "Força"],
  ["Heart", "Coração"],
  ["Wits", "Astúcia"],
]) {
  ok(`${en} = ${pt}`, termo.get(en) === pt, `glossário diz "${termo.get(en)}"`);
}
ok("ATTRIBUTE_LABEL usa Astúcia para WITS", /argucia: "Astúcia"/.test(DATA));

/* ── Posturas: glossário concorda com TOR_STANCE_META ──────────────────── */

const stanceLabels = [...STANCES.matchAll(/label: "([^"]+)"/g)].map((m) => m[1]);
ok("stances.ts tem as 4 posturas", stanceLabels.length === 4, `achou ${stanceLabels.length}`);
for (const label of stanceLabels) {
  ok(`postura "${label}" está no glossário`, glossSkills.has(label), "gênero/nome divergente");
}

/* ── Tarefas de combate ────────────────────────────────────────────────── */

const combatTasks = [...STANCES.matchAll(/combatTask: "([^"]+)"/g)].map((m) => m[1]);
ok("stances.ts tem as 4 tarefas de combate", combatTasks.length === 4);
for (const task of combatTasks) {
  ok(`tarefa "${task}" está no glossário`, glossSkills.has(task), "nome divergente");
}
/* Regressão nomeada: "Reanimar Companheiros" não existe em nenhum outro lugar do
   app — quem lesse o glossário procuraria uma tarefa que não está lá. */
ok("glossário não ressuscita 'Reanimar Companheiros'", !GLOSS.includes("Reanimar Companheiros"));

/* ── Vigor (Might) ─────────────────────────────────────────────────────── */

ok("Might = Vigor no glossário", termo.get("Might") === "Vigor", `glossário diz "${termo.get("Might")}"`);

/* Nenhum capítulo pode chamar a estatística de "Poder". Ancorado no padrão em
   que ela aparece — "Poder" sozinho é palavra comum em português e casaria com
   qualquer "poder" verbo. */
const CAPS = readdirSync(root("livros", "um-anel")).filter((f) => f.endsWith(".md"));
for (const f of CAPS) {
  const md = readFileSync(root("livros", "um-anel", f), "utf8");
  const usoErrado = md.match(/Poder \(Might\)|com Poder \d|Poder de \d|\bPoder \d\b/);
  ok(`${f}: não chama a estatística de "Poder"`, !usoErrado, usoErrado ? usoErrado[0] : "");
}

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
