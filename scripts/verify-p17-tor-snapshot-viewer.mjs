/**
 * P-17: as rotas do Um Anel devolvem a sala filtrada para quem pediu.
 *
 * Antes, tor-advance, tor-recovery, tor-fatigue, tor-eye, tor-hazard, tor-helm,
 * tor-push, tor-shadow, tor-stance e tor-task respondiam { snapshot } cru: o jogador
 * recebia desfazer do combate, log e PA/HP de monstro que só o mestre vê. Desde o
 * P-13/P-15 a tela aplica essa resposta, então o vazamento ia para a tela.
 *
 * (1) leitura: toda rota de app/api/room/[roomId] que responde { snapshot } passa
 *     por viewerSnapshotResponse, menos tor-session (só o mestre alcança: requireRoomManage);
 * (2) comportamento: viewerSnapshotResponse tira combatUndo/combatLog do jogador e
 *     mantém para o mestre.
 *
 * node scripts/verify-p17-tor-snapshot-viewer.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let passos = 0;
const ok = (nome) => console.log(`ok ${++passos}: ${nome}`);

// 1. Leitura de TODAS as rotas da sala (recursivo): todo NextResponse.json(...) que leva
// a sala, a cena ou o retorno do Olho passa por um filtro de visão.
const salaDir = join(ROOT, "app", "api", "room", "[roomId]");
function rotasEm(dir) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...rotasEm(p));
    else if (nome === "route.ts") out.push(p);
  }
  return out;
}
/** Argumento inteiro de cada NextResponse.json( ... ), contando parênteses. */
function respostasDe(src) {
  const out = [];
  let i = src.indexOf("NextResponse.json(");
  while (i >= 0) {
    let j = i + "NextResponse.json(".length;
    let nivel = 1;
    while (j < src.length && nivel > 0) {
      if (src[j] === "(") nivel++;
      else if (src[j] === ")") nivel--;
      j++;
    }
    out.push(src.slice(i, j));
    i = src.indexOf("NextResponse.json(", j);
  }
  return out;
}
const FILTRO = /snapshotForViewer\(|viewerSnapshotResponse\(|DeltaResponse\(|resolveRoomSync|sync\.(snapshot|delta)|visto\./;
const cruas = [];
for (const arq of rotasEm(salaDir)) {
  const src = readFileSync(arq, "utf8");
  // Rota que só o mestre alcança (tor-session, settings) pode devolver a sala inteira.
  if (/const auth = await requireRoomManage\(/.test(src)) continue;
  for (const r of respostasDe(src)) {
    // Campos soltos que não carregam a sala: revisão, sheetSaved.
    const semCampos = r.replace(/\b(snapshot|synced|result)\??\.(revision|sheetSaved)\b/g, "");
    if (!/\b(snapshot|comOlho|scene|payload|after|next)\b/.test(semCampos)) continue;
    if (FILTRO.test(r)) continue;
    // tokens/[tokenId] e /delegate devolvem só o token que o próprio pedinte acabou de
    // editar (jogador só edita token que pode mover; o resto é do mestre).
    if (/^NextResponse\.json\(\{\s*token: snapshot\.scene\.tokens\.find\(\(t\) => t\.id === tokenId\),\s*revision: snapshot\.revision,?\s*\}\)$/.test(r)) continue;
    // payload do ataque/combate vem de safeMutationDeltaResponse mais acima.
    if (/\bpayload\b/.test(semCampos) && /payload = (safeMutationDeltaResponse|mutationDeltaResponse)\(/.test(src)) continue;
    cruas.push(`${arq.slice(salaDir.length)}: ${r.replace(/\s+/g, " ").slice(0, 120)}`);
  }
}
assert.deepEqual(cruas, [], `rotas devolvendo a sala sem filtro:\n${cruas.join("\n")}`);
for (const d of ["chat", join("actors", "[actorId]"), join("actors", "[actorId]", "level-up")]) {
  const src = readFileSync(join(salaDir, d, "route.ts"), "utf8");
  assert.match(src, /viewerSnapshotResponse\(/, `${d} sem filtro`);
}
for (const d of ["tor-advance", "tor-recovery", "tor-fatigue", "tor-eye", "tor-task"]) {
  const src = readFileSync(join(salaDir, d, "route.ts"), "utf8");
  assert.match(src, /viewerSnapshotResponse\(result\.snapshot, room, session\.user\)/, `${d} sem filtro`);
}
ok("todas as rotas da sala respondem a sala filtrada (tor-session e settings são só do mestre)");

// 2. Comportamento do filtro.
function arquivoExistente(base) {
  for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? "";
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    let base = null;
    if (specifier.startsWith("@/")) base = join(ROOT, specifier.slice(2));
    else if ((specifier.startsWith("./") || specifier.startsWith("../")) && parent.startsWith("file:") && /\.tsx?$/.test(parent)) {
      base = resolve(dirname(fileURLToPath(parent)), specifier);
    }
    if (base) {
      const f = arquivoExistente(base);
      if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.json$/.test(url) && !url.includes("/node_modules/")) {
      return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
    }
    if (/\.tsx?$/.test(url)) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        fileName: url,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { viewerSnapshotResponse } = await import(pathToFileURL(join(ROOT, "lib", "room", "mutation-response.ts")).href);

const GM = { id: "gm-1", email: "m@t.local", name: "Mestre", role: "user" };
const JOGADOR = { id: "jog-1", email: "j@t.local", name: "Jogador", role: "user" };
const room = { roomId: "s1", ownerId: GM.id, memberIds: [JOGADOR.id], settings: undefined };
const snapshot = {
  roomId: "s1",
  revision: 7,
  settings: undefined,
  scene: { id: "s1", name: "", cellSize: 70, gridRadius: 24, tokens: [] },
  actors: {},
  combat: { round: 1, activeIndex: 0, order: [] },
  chat: [],
  pings: [],
  combatUndo: [{ segredo: true }],
  combatLog: [{ segredo: true }],
};

const paraJogador = viewerSnapshotResponse(snapshot, room, JOGADOR);
assert.equal(paraJogador.combatUndo, undefined, "jogador recebeu o desfazer do combate");
assert.equal(paraJogador.combatLog, undefined, "jogador recebeu o log do combate");
assert.equal(paraJogador.revision, 7);
ok("jogador não recebe desfazer nem log do combate");

const paraMestre = viewerSnapshotResponse(snapshot, room, GM);
assert.deepEqual(paraMestre.combatUndo, [{ segredo: true }]);
assert.deepEqual(paraMestre.combatLog, [{ segredo: true }]);
ok("mestre continua recebendo tudo");

// Monstro com vida, e a mesa que ACABOU de desligar "mostrar vida de monstro":
// a sala carregada antes da mutação ainda diz true; vale o que a mutação gravou.
{
  const goblin = { id: "g1", name: "Goblin", x: 1, y: 1, vida: 30, vidaMax: 30, monsterEntryId: "monstros-goblin" };
  const salaAntes = { ...room, settings: { showMonsterHpToPlayers: true } };
  const depois = {
    ...snapshot,
    settings: { showMonsterHpToPlayers: false },
    scene: { ...snapshot.scene, tokens: [goblin] },
  };
  const visto = viewerSnapshotResponse(depois, salaAntes, JOGADOR);
  const tokenVisto = visto.scene.tokens.find((t) => t.id === "g1");
  assert.ok(!tokenVisto || tokenVisto.vida === undefined, "jogador viu a vida do monstro");
  assert.ok(!tokenVisto || tokenVisto.vidaMax === undefined, "jogador viu a vida máxima do monstro");
  const doMestre = viewerSnapshotResponse(depois, salaAntes, GM).scene.tokens.find((t) => t.id === "g1");
  assert.equal(doMestre.vida, 30, "mestre perdeu a vida do monstro");
  ok("vida de monstro some para o jogador com as configurações gravadas pela mutação");
}

console.log(`P-17: ${passos} verificacoes ok.`);
