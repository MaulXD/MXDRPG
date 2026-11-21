/**
 * P-04 (desempenho): o compendio manda um pack por vez, nao todos.
 *
 * Antes: /api/compendium devolvia os dados de TODOS os packs visiveis e a pagina
 * /compendios serializava todos no HTML (~500 KB).
 * Depois: ?pack=<id> devolve so aquele pack (403 se nao visivel); sem ?pack devolve
 * a lista de packs e os dados so do primeiro. A pagina manda so o pack inicial e o
 * navegador busca os outros ao trocar de aba.
 *
 * Teste por comportamento: o GET real de app/api/compendium/route.ts roda com stubs
 * de sessao, sala e next/server. O registro de compendio e o real (le os JSON).
 *
 * node scripts/verify-p04-compendio-por-pack.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const urlDe = (rel) => pathToFileURL(join(ROOT, rel)).href;
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");

// Stubs da borda (sessao, sala, next/server). O resto e codigo real.
const STUBS = {
  "server-only": "",
  "next/server":
    "export const NextResponse = { json(body, init) { return { body, status: init?.status ?? 200 }; } };",
  "@/lib/auth/session": "export async function getSession() { return globalThis.__p04.sessao; }",
  "@/lib/room/store":
    "export async function getRoom(id) { return globalThis.__p04.salas[id] ?? null; }",
  "@/lib/auth/room-access":
    "export function canManageRoom(room, user) { return Boolean(user) && room.gmUserId === user.id; }",
};

function arquivoExistente(base) {
  for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(STUBS, specifier)) {
      return { url: "data:text/javascript," + encodeURIComponent(STUBS[specifier]), shortCircuit: true };
    }
    const parent = context.parentURL ?? "";
    let base = null;
    if (specifier.startsWith("@/")) {
      base = join(ROOT, specifier.slice(2));
    } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && parent.startsWith("file:")) {
      base = join(dirname(fileURLToPath(parent)), specifier);
    }
    if (base) {
      const f = arquivoExistente(base);
      if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.tsx?$/.test(url)) {
      const src = readFileSync(new URL(url), "utf8");
      const out = ts.transpileModule(src, {
        fileName: url,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    if (/\.json$/.test(url)) {
      const src = readFileSync(new URL(url), "utf8");
      return { format: "module", source: `export default ${src};`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { GET } = await import(urlDe("app/api/compendium/route.ts"));
const registro = await import(urlDe("lib/compendium/registry.ts"));

const JOGADOR = { id: "jog1", role: "user" };
const MESTRE_DA_SALA = { id: "gm1", role: "user" };
const ADMIN = { id: "adm1", role: "admin" };

function sessao(user) {
  return user ? { user } : null;
}

async function chamar(query, user) {
  globalThis.__p04 = {
    sessao: sessao(user),
    salas: { sala1: { id: "sala1", gmUserId: "gm1" } },
  };
  const qs = query ? `?${query}` : "";
  return GET(new Request(`http://localhost/api/compendium${qs}`));
}

const nomesDePacks = (body) => body.packs.map((p) => p.id);
const chavesDeDados = (body) => Object.keys(body.data);

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

console.log("verify-p04-compendio-por-pack");

// 1. Sem ?pack: lista de packs e dados so do primeiro visivel.
{
  const r = await chamar("", JOGADOR);
  assert.equal(r.status, 200, "sem ?pack deve responder 200");
  const primeiro = r.body.packs[0].id;
  assert.deepEqual(chavesDeDados(r.body), [primeiro], "sem ?pack so pode trazer os dados do primeiro pack");
  assert.ok(r.body.data[primeiro].length > 0, "o primeiro pack precisa ter entradas");
  ok(`sem ?pack: packs completos, dados so de "${primeiro}"`);
}

// 2. Jogador: monstros nunca chegam, nem sem ?pack nem com ?pack=monstros.
{
  const semPack = await chamar("", JOGADOR);
  assert.ok(!nomesDePacks(semPack.body).includes("monstros"), "jogador nao ve o pack monstros na lista");
  assert.ok(!chavesDeDados(semPack.body).includes("monstros"), "jogador nao recebe monstros sem ?pack");

  const monstros = await chamar("pack=monstros", JOGADOR);
  assert.equal(monstros.status, 403, "jogador pedindo monstros deve receber 403");
  assert.equal(monstros.body.data, undefined, "resposta 403 nao pode trazer dados");
  assert.ok(!JSON.stringify(monstros.body).includes('"packId":"monstros"'), "nenhuma entrada de monstros no 403");
  ok("jogador: monstros nao chegam (403 com ?pack=monstros)");
}

// 3. ?pack=armas so traz armas e bate com o registro.
{
  const r = await chamar("pack=armas", JOGADOR);
  assert.equal(r.status, 200);
  assert.deepEqual(chavesDeDados(r.body), ["armas"], "?pack=armas so pode trazer armas");
  const esperado = registro.getPackEntries("armas", { role: "user" });
  assert.equal(r.body.data.armas.length, esperado.length, "quantidade de armas diferente do registro");
  assert.deepEqual(
    r.body.data.armas.map((e) => e.id),
    esperado.map((e) => e.id),
    "ordem/conteudo de armas diferente do registro"
  );
  ok(`?pack=armas: so armas (${esperado.length} entradas), igual ao registro`);
}

// 4. Pack inexistente ou fora da lista: 403, sem dados.
{
  const r = await chamar("pack=nao-existe", JOGADOR);
  assert.equal(r.status, 403, "pack desconhecido deve dar 403");
  assert.equal(r.body.data, undefined);
  ok("?pack desconhecido: 403");
}

// 5. Mestre da sala recebe monstros, e so os monstros do pedido.
{
  const r = await chamar("pack=monstros&roomId=sala1", MESTRE_DA_SALA);
  assert.equal(r.status, 200, "mestre da sala deve receber monstros");
  assert.deepEqual(chavesDeDados(r.body), ["monstros"]);
  const esperado = registro.getPackEntries("monstros", { role: "user", isRoomGm: true });
  assert.ok(esperado.length > 0, "registro precisa ter monstros");
  assert.equal(r.body.data.monstros.length, esperado.length, "quantidade de monstros diferente do registro");
  ok(`mestre da sala: monstros liberados (${esperado.length} entradas)`);
}

// 6. Mestre sem sala (sem roomId) nao recebe monstros.
{
  const r = await chamar("pack=monstros", MESTRE_DA_SALA);
  assert.equal(r.status, 403, "sem roomId o mestre de sala nao tem acesso a monstros");
  ok("sem roomId: mestre nao ve monstros");
}

// 7. Admin ve monstros na lista e pode pedir o pack.
{
  const lista = await chamar("", ADMIN);
  assert.ok(nomesDePacks(lista.body).includes("monstros"), "admin ve monstros na lista");
  const r = await chamar("pack=monstros", ADMIN);
  assert.equal(r.status, 200);
  assert.deepEqual(chavesDeDados(r.body), ["monstros"]);
  ok("admin: lista com monstros e ?pack=monstros");
}

// 8. Visitante (sem sessao): so os packs publicos, um por vez.
{
  const r = await chamar("pack=magias", null);
  assert.equal(r.status, 200, "pack publico deve responder a visitante");
  assert.deepEqual(chavesDeDados(r.body), ["magias"]);
  const m = await chamar("pack=monstros", null);
  assert.equal(m.status, 403, "visitante nao ve monstros");
  ok("visitante: pack publico ok, monstros 403");
}

// 9. Leitura do codigo: a pagina e o navegador nao serializam todos os packs.
{
  const pagina = ler("components/compendium/CompendiumPage.tsx");
  assert.ok(
    !/packs\.map\(\(p\)\s*=>\s*\[p\.id,\s*getPackEntries/.test(pagina),
    "CompendiumPage ainda serializa todos os packs"
  );
  assert.match(pagina, /getPackEntries\(packInicial,/, "CompendiumPage deve buscar so o pack inicial");
  ok("CompendiumPage: so o pack inicial vai no HTML");

  const browser = ler("components/compendium/CompendiumBrowser.tsx");
  assert.match(browser, /\/api\/compendium\?\$\{qs\}/, "navegador deve buscar /api/compendium?pack=");
  assert.match(browser, /pack=\$\{encodeURIComponent\(alvo\)\}/, "navegador deve pedir por pack");
  assert.match(browser, /setBuscados\(/, "navegador deve guardar o pack buscado no estado");
  assert.match(browser, /Carregando/, "navegador deve mostrar Carregando");
  assert.match(browser, /roomId\?: string/, "navegador deve aceitar roomId");
  ok("CompendiumBrowser: busca por pack, guarda em cache e mostra Carregando");

  const painel = ler("components/vtt/MesaEldarinCompendiumPanel.tsx");
  assert.match(painel, /roomId=\{roomId\}/, "painel da mesa deve passar roomId ao navegador");
  ok("painel da mesa: passa roomId para buscar por pack");
}
