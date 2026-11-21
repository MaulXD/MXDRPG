/**
 * P-08 (desempenho): a presenca da mesa repetia trabalho por pedido.
 *   - app/api/room/[roomId]/presence/route.ts: requireRoomView e canTrackRoomPresence rodavam 2x
 *     (no GET/POST e de novo dentro de presenceResponse).
 *   - lib/room/presence-enrich.ts: isPresenceGmUser chamava fetchClerkIdForUser 2x por membro.
 *   - hooks/useRoomPresence.ts: GET a cada 10 s mesmo com a aba escondida.
 *
 * Correcao: presenceResponse recebe o acesso ja validado; fetchClerkIdsByUserId faz um lote por pedido
 * (com o mesmo cache de 60 s); o hook pausa com visibilityState hidden e le ao voltar.
 *
 * Teste: (1) leitura de codigo (contagens de chamadas no fonte e o hook);
 * (2) comportamento com stubs: route e presence-enrich sao transpilados e os imports viram stubs
 * que contam chamadas. Com 2 e com 5 membros: requireRoomView 1x, canTrack 1x, lookup de clerk 1x.
 *
 * node scripts/verify-p08-presenca.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");
const conta = (texto, trecho) => texto.split(trecho).length - 1;

const ROTA = "app/api/room/[roomId]/presence/route.ts";
const ENRIQ = "lib/room/presence-enrich.ts";
const HOOK = "hooks/useRoomPresence.ts";

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

// 1. Leitura do codigo.
const rota = ler(ROTA);
assert.equal(conta(rota, "requireRoomView("), 2, "GET e POST chamam requireRoomView uma vez cada");
assert.equal(conta(rota, "canTrackRoomPresence("), 2, "canTrackRoomPresence so no GET e no POST");
assert.match(rota, /async function presenceResponse\(\s*roomId: string,\s*auth: RoomViewOk/, "presenceResponse recebe o acesso pronto");
ok("route: requireRoomView e canTrackRoomPresence 1x por GET/POST; presenceResponse recebe auth");

const enrich = ler(ENRIQ);
assert.equal(conta(enrich, "fetchClerkIdForUser("), 0, "presence-enrich nao chama fetchClerkIdForUser por membro");
assert.match(enrich, /async function fetchClerkIdsByUserId\(/, "falta o lote fetchClerkIdsByUserId");
assert.match(enrich, /"id, clerk_id"/, "o lote precisa ler id e clerk_id de uma vez");
assert.match(enrich, /const clerkOf = await fetchClerkIdsByUserId\(/, "buildEnrichedRoomPresence precisa usar o lote");
ok("presence-enrich: clerk ids num lote so por pedido");

const hook = ler(HOOK);
assert.match(hook, /const PRESENCE_POLL_MS = 10_000;/, "intervalo do hook nao pode mudar");
assert.match(hook, /addEventListener\("visibilitychange", onVisibilityChange\)/, "hook precisa ouvir visibilitychange");
assert.match(hook, /removeEventListener\("visibilitychange", onVisibilityChange\)/, "hook precisa remover o ouvinte");
assert.match(hook, /document\.visibilityState !== "hidden"/, "hook precisa checar a aba escondida");
ok("hook: pausa com aba escondida, le ao voltar, intervalo e heartbeat intactos");

// 2. Comportamento com stubs.
let contador = 0;
const modulo = (src) => "data:text/javascript," + encodeURIComponent(src);

function transpila(rel, mapa) {
  const js = ts.transpileModule(ler(rel), {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  contador += 1;
  const trocado = js.replace(/(from\s+|import\s+)"([^"]+)"/g, (todo, pre, spec) =>
    spec in mapa ? `${pre}"${mapa[spec]}"` : todo
  );
  // Sufixo unico: cada cenario carrega modulos novos (cache do enrich zerado).
  return modulo(`${trocado}\n//${contador}`);
}

const STUBS_ENRICH = {
  "server-only": modulo(""),
  "@/lib/auth/roles": modulo(
    `export function normalizeUserRole(r) { return r === "admin" ? "admin" : "user"; }`
  ),
  "@/lib/db/ensure-migrations": modulo(`export async function ensureDbMigrations() {}`),
  "@/lib/db/user-avatar": modulo(
    `export function parseAvatarFocus(x) { return x ?? null; }
     export function resolveUserAvatarUrl() { return null; }`
  ),
  "@/lib/db/client": modulo(`export function getSql() { return globalThis.__p08.sql; }`),
  "@/lib/db/enabled": modulo(`export function dbEnabled() { return true; }`),
  "@/lib/db/sql-helpers": modulo(
    `export async function queryRowsByIds(sql, table, select, ids) {
       globalThis.__p08.chamadas.push({ alvo: "rows", select });
       return globalThis.__p08.linhas(select, ids);
     }`
  ),
  "@/lib/db/users": modulo(
    `export async function fetchClerkIdForUser(id) {
       globalThis.__p08.chamadas.push({ alvo: "clerkUnitario", id });
       return globalThis.__p08.clerk[id] ?? null;
     }
     export async function fetchUserByClerkId() { return null; }
     export async function fetchUserById() { return null; }`
  ),
  "@/lib/room/presence-identity": modulo(
    `export async function dedupePresenceByUser(x) { return x; }`
  ),
  "@/lib/room/portrait-sync": modulo(`export function resolveActorTokenImageUrl() { return null; }`),
  "@/lib/room/presence": modulo(
    `export async function listRoomPresence() { return globalThis.__p08.presenca; }
     export async function touchRoomPresence(roomId, userId) {
       globalThis.__p08.chamadas.push({ alvo: "touch", userId });
     }`
  ),
};

const STUBS_ROTA = {
  "next/server": modulo(
    `export const NextResponse = { json(body, init) { return { body, status: init?.status ?? 200 }; } };`
  ),
  "@/lib/auth/presence-access": modulo(
    `export async function canTrackRoomPresence() {
       globalThis.__p08.chamadas.push({ alvo: "canTrack" });
       return true;
     }`
  ),
  "@/lib/auth/authorize-room-view": modulo(
    `export async function requireRoomView() {
       globalThis.__p08.chamadas.push({ alvo: "requireRoomView" });
       return globalThis.__p08.acesso;
     }`
  ),
  "@/lib/room/presence": STUBS_ENRICH["@/lib/room/presence"],
};

function cenario(n) {
  const ownerId = "usr_dono";
  const ids = [ownerId, ...Array.from({ length: n - 1 }, (_, i) => `usr_j${i + 1}`)];
  const clerk = { usr_dono: "k-dono" };
  for (const id of ids.slice(1)) clerk[id] = id === "usr_j1" ? "k-dono" : `k-${id}`;
  const perfil = (id) => ({
    id,
    nickname: `Nome ${id}`,
    name: id,
    role: null,
    avatar_url: null,
    oauth_avatar_url: null,
    avatar_source: null,
    avatar_focus: null,
  });
  return {
    ids,
    presenca: ids.map((userId) => ({ userId, displayName: userId })),
    clerk,
    linhas: (select, pedidos) =>
      select.includes("clerk_id")
        ? pedidos.filter((id) => id in clerk).map((id) => ({ id, clerk_id: clerk[id] }))
        : pedidos.map(perfil),
    room: { roomId: "r1", ownerId, memberIds: [], actors: {}, scene: { tokens: [] } },
  };
}

async function executa(n, metodo) {
  const c = cenario(n);
  globalThis.__p08 = {
    chamadas: [],
    sql: {},
    presenca: c.presenca,
    clerk: c.clerk,
    linhas: c.linhas,
    acesso: {
      room: c.room,
      user: { id: "usr_j2", nickname: "Ana", role: "player" },
      inviteCode: null,
    },
  };
  const enrichUrl = transpila(ENRIQ, STUBS_ENRICH);
  const rotaMod = await import(transpila(ROTA, { ...STUBS_ROTA, "@/lib/room/presence-enrich": enrichUrl }));
  const res = await rotaMod[metodo](new Request("http://x/api/room/r1/presence"), {
    params: Promise.resolve({ roomId: "r1" }),
  });
  const chamadas = globalThis.__p08.chamadas;
  return {
    res,
    requireRoomView: chamadas.filter((x) => x.alvo === "requireRoomView").length,
    canTrack: chamadas.filter((x) => x.alvo === "canTrack").length,
    touch: chamadas.filter((x) => x.alvo === "touch").length,
    clerkLookups: chamadas.filter(
      (x) => x.alvo === "clerkUnitario" || (x.alvo === "rows" && x.select.includes("clerk_id"))
    ).length,
  };
}

for (const metodo of ["GET", "POST"]) {
  for (const n of [2, 5]) {
    const r = await executa(n, metodo);
    assert.equal(r.res.status, 200, `${metodo} com ${n} membros deveria responder 200`);
    assert.equal(r.requireRoomView, 1, `${metodo} com ${n} membros: requireRoomView deveria rodar 1x`);
    assert.equal(r.canTrack, 1, `${metodo} com ${n} membros: canTrackRoomPresence deveria rodar 1x`);
    assert.equal(r.clerkLookups, 1, `${metodo} com ${n} membros: lookup de clerk deveria ser 1 lote`);
    assert.equal(r.touch, 1, `${metodo} com ${n} membros: touch 1x`);
    const online = r.res.body.online;
    assert.equal(online.length, n, `${metodo} com ${n} membros: lista com ${n} itens`);
    const papeis = Object.fromEntries(online.map((m) => [m.userId, m.role]));
    assert.equal(papeis.usr_dono, "gm", "o dono e GM");
    assert.equal(papeis.usr_j1, "gm", "membro com o mesmo clerk do dono e GM");
    for (const m of online.slice(2)) assert.equal(m.role, "player", `${m.userId} e jogador`);
    ok(`${metodo} com ${n} membros: requireRoomView 1x, canTrack 1x, clerk 1 lote, papeis iguais`);
  }
}

console.log(`\nP-08 presenca: ${passos} verificacoes ok`);
