/**
 * Cruza as tabelas de Equipamento de Guerra e Armadura do LIVRO com `data.ts`.
 *
 * Por que existe: os capítulos foram traduzidos por agentes diferentes, e dois
 * deles escolheram palavras portuguesas diferentes para a MESMA arma. O caso que
 * motivou este teste: "Porrete" significava Dano 3 no capítulo 6 e Dano 4 no
 * capítulo 3 e no código. Mesmo nome, arma diferente — um Mestre cruzando os
 * capítulos aplicaria o dano errado, e nenhum outro gate percebia.
 *
 * O teste é bidirecional:
 *  - todo item de `data.ts` que aparece num capítulo tem de aparecer com os
 *    MESMOS números;
 *  - dois capítulos não podem usar o mesmo nome para itens com números diferentes.
 *
 * Fonte: livros/um-anel/03-aventureiros.md e 06-fases-de-aventura-combate.md
 */
import { readFileSync as rawReadFileSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");

const CAPITULOS = {
  "03-aventureiros": readFileSync(root("livros", "um-anel", "03-aventureiros.md"), "utf8"),
  "06-fases-de-aventura-combate": readFileSync(
    root("livros", "um-anel", "06-fases-de-aventura-combate.md"),
    "utf8"
  ),
};

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

console.log("verify-um-anel-equipamento: tabelas do livro × data.ts");

/* ── Armas de data.ts ──────────────────────────────────────────────────── */

const armasCodigo = [
  ...DATA.matchAll(
    /\{ id: "([a-z-]+)", label: "([^"]+)", damage: (\d+), injury: (null|"[^"]*"), load: (\d+)/g
  ),
].map((m) => ({
  id: m[1],
  label: m[2],
  damage: Number(m[3]),
  injury: m[4] === "null" ? null : m[4].slice(1, -1),
  load: Number(m[5]),
}));

ok("data.ts tem a tabela de armas", armasCodigo.length >= 14, `achou ${armasCodigo.length}`);

/** Linhas de tabela `| Nome | Dano | Ferimento | Carga | ... |` de um capítulo. */
function armasDoCapitulo(md) {
  return [
    ...md.matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(—|\d+[^|]*?)\s*\|\s*(\d+)\s*\|/gm),
  ]
    .map((m) => ({
      label: m[1].trim().replace(/\*+$/, ""),
      damage: Number(m[2]),
      injury: m[3].trim() === "—" ? null : m[3].trim(),
      load: Number(m[4]),
    }))
    // O rótulo precisa ter letra: as tabelas de Atributos das Culturas são
    // `| 1 | 3 | 6 | 5 |` e casariam como se "1" fosse nome de arma.
    .filter((l) => /[A-Za-zÀ-ÿ]/.test(l.label));
}

for (const [cap, md] of Object.entries(CAPITULOS)) {
  const doLivro = armasDoCapitulo(md);
  ok(`${cap}: achou linhas de arma`, doLivro.length >= 10, `achou ${doLivro.length}`);

  for (const arma of armasCodigo) {
    const linha = doLivro.find((l) => l.label === arma.label);
    if (!linha) continue; // capítulo pode não listar aquele item
    ok(
      `${cap}: ${arma.label} — Dano ${arma.damage}`,
      linha.damage === arma.damage,
      `livro=${linha.damage} código=${arma.damage}`
    );
    ok(
      `${cap}: ${arma.label} — Carga ${arma.load}`,
      linha.load === arma.load,
      `livro=${linha.load} código=${arma.load}`
    );
    // Ferimento pode ter forma "16 (1m) / 18 (2m)"; compara o texto normalizado.
    // Normaliza espaco em volta da barra: o livro escreve "16 (1m)/18 (2m)" e o
    // codigo "16 (1m) / 18 (2m)". A diferenca e cosmetica — resolveWeaponInjury
    // tolera as duas —, entao o teste nao deve acusar por causa dela.
    const norm = (x) =>
      x == null ? "—" : String(x).replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim();
    ok(
      `${cap}: ${arma.label} — Ferimento ${norm(arma.injury)}`,
      norm(linha.injury) === norm(arma.injury),
      `livro="${norm(linha.injury)}" código="${norm(arma.injury)}"`
    );
  }
}

/* ── Nomes usados em mais de um capítulo têm de significar o mesmo ─────── */

const porNome = new Map();
for (const [cap, md] of Object.entries(CAPITULOS)) {
  for (const l of armasDoCapitulo(md)) {
    if (!porNome.has(l.label)) porNome.set(l.label, []);
    porNome.get(l.label).push({ cap, ...l });
  }
}

let colisoes = 0;
for (const [label, usos] of porNome) {
  if (usos.length < 2) continue;
  const primeiro = usos[0];
  const divergente = usos.find(
    (u) => u.damage !== primeiro.damage || u.load !== primeiro.load
  );
  if (divergente) {
    colisoes++;
    console.error(
      `  ✗ "${label}" significa coisas diferentes: ` +
        usos.map((u) => `${u.cap} = ${u.damage}/${u.load}`).join(" · ")
    );
  }
}
ok("nenhum nome de arma significa duas coisas entre capítulos", colisoes === 0, `${colisoes} colisão(ões)`);

/* ── Armaduras ─────────────────────────────────────────────────────────── */

const armadurasCodigo = [
  ...DATA.matchAll(/\{ id: "([a-z-]+)", label: "([^"]+)", protection: "([^"]+)", load: (\d+)/g),
].map((m) => ({ id: m[1], label: m[2], protection: m[3], load: Number(m[4]) }));

ok("data.ts tem a tabela de armaduras", armadurasCodigo.length >= 4, `achou ${armadurasCodigo.length}`);

function armadurasDoCapitulo(md) {
  return [...md.matchAll(/^\|\s*([^|]+?)\s*\|\s*(\+?\d+d(?:\+\d+)?)\s*\|\s*(\d+)\s*\|/gm)].map((m) => ({
    label: m[1].trim().replace(/\*+$/, ""),
    protection: m[2].trim(),
    load: Number(m[3]),
  }));
}

for (const [cap, md] of Object.entries(CAPITULOS)) {
  const doLivro = armadurasDoCapitulo(md);
  ok(`${cap}: achou linhas de armadura`, doLivro.length >= 4, `achou ${doLivro.length}`);
  for (const a of armadurasCodigo) {
    const linha = doLivro.find((l) => l.label === a.label);
    if (!linha) continue;
    ok(
      `${cap}: ${a.label} — Proteção ${a.protection}`,
      linha.protection === a.protection,
      `livro=${linha.protection} código=${a.protection}`
    );
    ok(
      `${cap}: ${a.label} — Carga ${a.load}`,
      linha.load === a.load,
      `livro=${linha.load} código=${a.load}`
    );
  }
}

const armaduraPorNome = new Map();
for (const [cap, md] of Object.entries(CAPITULOS)) {
  for (const l of armadurasDoCapitulo(md)) {
    if (!armaduraPorNome.has(l.label)) armaduraPorNome.set(l.label, []);
    armaduraPorNome.get(l.label).push({ cap, ...l });
  }
}

let colisoesArmadura = 0;
for (const [label, usos] of armaduraPorNome) {
  if (usos.length < 2) continue;
  const primeiro = usos[0];
  if (usos.find((u) => u.protection !== primeiro.protection || u.load !== primeiro.load)) {
    colisoesArmadura++;
    console.error(
      `  ✗ "${label}" significa coisas diferentes: ` +
        usos.map((u) => `${u.cap} = ${u.protection}/${u.load}`).join(" · ")
    );
  }
}
ok(
  "nenhum nome de armadura significa duas coisas entre capítulos",
  colisoesArmadura === 0,
  `${colisoesArmadura} colisão(ões)`
);

/* ── Nome divergente para o MESMO item ─────────────────────────────────────
   O furo que faltava: um item que existe em data.ts mas aparece no capítulo com
   OUTRO nome era pulado em silêncio pelas checagens acima (o `find` por label não
   achava nada e seguia). Era o caso do couro — "Túnica de Couro" no capítulo 6
   contra "Camisa de Couro" no código e no capítulo 3, mesmos 1d/3.

   Detecta pelos NÚMEROS: se uma linha do capítulo casa exatamente um item de
   data.ts pelos números e o nome difere, é divergência de nomenclatura. Só acusa
   quando o casamento é único, pra não confundir itens que compartilham números. */

let nomesDivergentes = 0;

function acusaNomeDivergente(cap, linhas, itens, chaves, descreve) {
  for (const linha of linhas) {
    const iguais = itens.filter((i) => chaves.every((k) => String(i[k]) === String(linha[k])));
    if (iguais.length !== 1) continue;
    const item = iguais[0];
    if (item.label === linha.label) continue;
    nomesDivergentes++;
    console.error(
      `  ✗ ${cap}: "${linha.label}" (${descreve(linha)}) é o "${item.label}" de data.ts — mesmo item, nome diferente`
    );
  }
}

for (const [cap, md] of Object.entries(CAPITULOS)) {
  acusaNomeDivergente(
    cap,
    armasDoCapitulo(md),
    armasCodigo,
    ["damage", "load"],
    (l) => `Dano ${l.damage}, Carga ${l.load}`
  );
  acusaNomeDivergente(
    cap,
    armadurasDoCapitulo(md),
    armadurasCodigo,
    ["protection", "load"],
    (l) => `${l.protection}, Carga ${l.load}`
  );
}

ok(
  "nenhum item do livro tem nome diferente do de data.ts",
  nomesDivergentes === 0,
  `${nomesDivergentes} divergência(s)`
);

console.log(`\nverify-um-anel-equipamento: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
