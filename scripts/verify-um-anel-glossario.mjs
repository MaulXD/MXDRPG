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

/* E o capítulo que DESCREVE as tarefas tem de usar os mesmos nomes. O capítulo 6
   chamava a da Retaguarda de "Preparar Disparo" enquanto o glossário, o
   compêndio, stances.ts e a Virtude Arco Mortal diziam "Preparar Tiro" — quem
   lesse a Virtude não achava a tarefa no capítulo. */
const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");
for (const task of combatTasks) {
  ok(`capítulo 6 chama a tarefa de "${task}"`, CAP6.includes(task), "nome divergente do código");
}

/* ── Nenhum capítulo pode chamar a Perícia por outro nome ──────────────── */

/**
 * A divergência maior que este teste pegou: **10 das 18 Perícias** tinham, nos
 * capítulos, nome diferente do rótulo da ficha — VASCULHAR × Busca, IMPONÊNCIA ×
 * Fascínio, ENCORAJAR × Indução, PERCEPÇÃO × Vigilância, SABER × História,
 * CANTO × Música (e "Canção", numa terceira grafia), CAÇA × Caçada, VIAJAR ×
 * Viagem, EXPLORAR × Exploração, PERSPICÁCIA × Discernimento. Eram 221 + 197
 * ocorrências em 11 capítulos. O Mestre lia "role VASCULHAR" e a ficha do
 * jogador dizia "Busca".
 *
 * Os nomes antigos coincidem com os `id` internos (`vasculhar`, `imponencia`…),
 * que são chave estável e continuam em inglês/kebab — o que o teste proíbe é o
 * id vazar como NOME no texto que vai para a mesa.
 */
const ANTIGOS = {
  PERCEPÇÃO: "Vigilância",
  IMPONÊNCIA: "Fascínio",
  ENCORAJAR: "Indução",
  EXPLORAR: "Exploração",
  CAÇA: "Caçada",
  PERSPICÁCIA: "Discernimento",
  SABER: "História",
  VASCULHAR: "Busca",
  CANTO: "Música",
  VIAJAR: "Viagem",
};

for (const f of readdirSync(root("livros", "um-anel")).filter((x) => x.endsWith(".md"))) {
  const md = readFileSync(root("livros", "um-anel", f), "utf8");
  for (const [antigo, atual] of Object.entries(ANTIGOS)) {
    /* Caixa alta é como o livro chama a rolagem; com negrito ou sem.
       "VERSOS DE SABER" é Característica Distintiva (`versos-de-saber` em
       data.ts), não a Perícia — fica de fora. */
    const caps = [...md.matchAll(new RegExp(`(?<!VERSOS DE )\\b${antigo}\\b`, "g"))];
    ok(`${f}: não usa "${antigo}" (a Perícia é "${atual}")`, caps.length === 0, `${caps.length}×`);
  }
}

/* O compêndio é o texto que o jogador abre DENTRO do app — divergir ali é pior
   que no capítulo, porque está a um clique da ficha. */
for (const f of readdirSync(root("livros", "um-anel", "compendio"))) {
  const md = readFileSync(root("livros", "um-anel", "compendio", f), "utf8");
  for (const [antigo, atual] of Object.entries(ANTIGOS)) {
    const cap = antigo[0] + antigo.slice(1).toLowerCase();
    const achados = [...md.matchAll(new RegExp(`\\b(${antigo}|${cap})\\b`, "g"))];
    ok(`compendio/${f}: não usa "${cap}" (a Perícia é "${atual}")`, achados.length === 0);
  }
}

/* "Canção" só pode aparecer como nome de Empreitada/item ("Compor uma Canção",
   "Canção de Vitória"), nunca como a Perícia — para isso o nome é Música. */
for (const f of readdirSync(root("livros", "um-anel")).filter((x) => x.endsWith(".md"))) {
  const md = readFileSync(root("livros", "um-anel", f), "utf8");
  const comoPericia = md.match(/rolagem de Canção|rolagens de Canção|Perícia Canção|\| Canção \|/);
  ok(`${f}: "Canção" não é usada como Perícia`, !comoPericia, comoPericia?.[0] ?? "");
}

/* ── Habilidades Sinistras: um nome só ─────────────────────────────────── */

/* "Velocidade de Serpente" (código, cap. 6 e cap. 12) × "Velocidade Serpentina"
   (cap. 8, que é o capítulo dos adversários e a fonte dos blocos), e "Força
   Horrível" × "Força Horrenda". Vale o do capítulo 8. */
const ADV_TS = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");
for (const [errado, certo] of [
  ["Velocidade de Serpente", "Velocidade Serpentina"],
  ["Força Horrível", "Força Horrenda"],
]) {
  const fontes = [
    ["adversaries.ts", ADV_TS],
    ...readdirSync(root("livros", "um-anel"))
      .filter((x) => x.endsWith(".md"))
      .map((f) => [f, readFileSync(root("livros", "um-anel", f), "utf8")]),
  ];
  for (const [nome, txt] of fontes) {
    ok(`${nome}: não usa "${errado}" (é "${certo}")`, !txt.includes(errado));
  }
}

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
