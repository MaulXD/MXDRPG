/**
 * P-07 (desempenho): N+1 nas consultas de amigos.
 *
 * Antes: listFriendRequests fazia 2 fetchUserById por pedido; listReceivedMesaInvites fazia
 * fetchUserById + getAdventure por convite; getFriendsPulse listava todos os convites so para contar.
 * Depois: um lote de usuarios (fetchUsersByIds), uma leitura de aventura por id distinto e
 * o pulso conta pela lista de convites (lote), para nao contar aventura apagada.
 *
 * Teste por comportamento: o banco e a aventura sao stubs (globalThis.__P07), o resto do codigo
 * real roda. Conta as consultas feitas com 5 e 10 itens (tem de ser igual) e compara o resultado
 * com a formatacao antiga, reproduzida aqui com fetchUserById e resolveUserAvatarUrl reais.
 *
 * node scripts/verify-p07-amigos-n1.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const urlDe = (rel) => pathToFileURL(join(ROOT, rel)).href;

// Stubs da borda (banco, aventura, mensagens e URL de convite). O resto e codigo real.
const STUBS = {
  "server-only": "",
  "@/lib/db/client": "export const dbEnabled = () => true;\nexport const getSql = () => globalThis.__P07.sql;",
  "@/lib/db/enabled": "export const dbEnabled = () => true;",
  "@/lib/db/ensure-migrations": "export async function ensureDbMigrations() {}",
  "@/lib/adventure/store":
    "export async function getAdventure(id) { globalThis.__P07.advCalls.push(id); return globalThis.__P07.adventures[id] ?? null; }",
  "@/lib/db/friend-messages": "export async function countUnreadFriendMessages() { return 3; }",
  "@/lib/media/image-normalize": "export async function normalizeImageDataUrl(x) { return x; }",
  "@/lib/auth/room-access":
    "export function roomInviteUrl(roomId, code) { return '/mesa/' + roomId + '?convite=' + code; }",
};

function arquivoExistente(base) {
  for (const c of [base, base + ".ts", base + ".tsx", base + ".json", join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(STUBS, specifier)) {
      return {
        url: "data:text/javascript," + encodeURIComponent(STUBS[specifier]),
        shortCircuit: true,
      };
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
    return nextLoad(url, context);
  },
});

const { fetchUserById } = await import(urlDe("lib/db/users.ts"));
const { resolveUserAvatarUrl } = await import(urlDe("lib/db/user-avatar.ts"));
const { listFriendRequests, listReceivedMesaInvites } = await import(urlDe("lib/friends/store.ts"));
const { getFriendsPulse } = await import(urlDe("lib/friends/pulse.ts"));

globalThis.__P07 = { sql: null, adventures: {}, advCalls: [] };

// ---------- banco falso ----------

function criarBanco() {
  return { usuarios: [], convites: [], pedidos: [], adventures: {}, desconhecidas: [] };
}

function usuario(id, nickname) {
  return {
    id,
    clerk_id: null,
    oauth_provider: null,
    oauth_subject: null,
    email: `${id}@teste.invalid`,
    nickname,
    name: `Nome ${id}`,
    password_hash: null,
    cpf_prefix_hash: null,
    birth_date: null,
    role: "player",
    avatar_url: null,
    oauth_avatar_url: null,
    avatar_source: null,
    avatar_focus: null,
    created_at: 1,
  };
}

// n convites recebidos pelo viewer u0 e n pedidos de amizade (recebidos e enviados).
// Convite 2 vem de um usuario que nao existe. Com comApagada, o convite 4 aponta para aventura apagada.
function bancoDeAmigos(n, { comApagada = true } = {}) {
  const db = criarBanco();
  db.usuarios.push(usuario("u0", "visualizador"));
  db.adventures = {
    "adv-A": { adventureId: "adv-A", primaryRoomId: "room-A", inviteCode: "CODE-A", name: "Mesa A", deletedAt: null },
    "adv-B": { adventureId: "adv-B", primaryRoomId: "room-B", inviteCode: "CODE-B", name: "Mesa B", deletedAt: null },
    "adv-X": { adventureId: "adv-X", primaryRoomId: "room-X", inviteCode: "CODE-X", name: "Mesa X", deletedAt: 999 },
  };
  const aventuras = comApagada ? ["adv-A", "adv-B", "adv-A", "adv-X", "adv-B"] : ["adv-A", "adv-B"];
  for (let i = 1; i <= n; i += 1) {
    db.usuarios.push(usuario(`u${i}`, i % 2 ? `apelido${i}` : null));
    db.usuarios.push(usuario(`v${i}`, `dest${i}`));
    db.convites.push({
      id: `c${i}`,
      from_user_id: i === 2 ? "u-fantasma" : `u${i}`,
      to_user_id: "u0",
      room_id: "room-x",
      adventure_id: aventuras[(i - 1) % aventuras.length],
      invite_code: "x",
      room_name: "x",
      message: i % 2 ? `msg ${i}` : null,
      created_at: 3000 + i,
      dismissed_at: null,
    });
    db.pedidos.push({
      id: `in${i}`,
      from_user_id: `u${i}`,
      to_user_id: "u0",
      status: "pending",
      created_at: 1000 + i,
      responded_at: null,
    });
    db.pedidos.push({
      id: `out${i}`,
      from_user_id: "u0",
      to_user_id: `v${i}`,
      status: "pending",
      created_at: 2000 + i,
      responded_at: null,
    });
  }
  return db;
}

// Interpreta as consultas que friends/db/users usam. Consulta fora da lista e registrada e falha o teste.
function rotear(texto, params, db) {
  const t = texto.replace(/\s+/g, " ");
  if (/COUNT\(/.test(t) && /eldarin_mesa_invites/.test(t)) {
    const n = db.convites.filter((c) => c.to_user_id === params[0] && c.dismissed_at == null).slice(0, 50).length;
    return [{ count: String(n) }];
  }
  if (/COUNT\(/.test(t) && /eldarin_friend_requests/.test(t)) {
    const n = db.pedidos.filter((p) => p.to_user_id === params[0] && p.status === "pending").length;
    return [{ count: String(n) }];
  }
  if (/FROM eldarin_mesa_invites/.test(t)) {
    return db.convites.filter((c) => c.to_user_id === params[0] && c.dismissed_at == null).slice(0, 50);
  }
  if (/FROM eldarin_friend_requests/.test(t)) {
    const coluna = /to_user_id = \?/.test(t) ? "to_user_id" : "from_user_id";
    return db.pedidos.filter((p) => p[coluna] === params[0] && p.status === "pending").slice(0, 50);
  }
  if (/FROM eldarin_users WHERE id IN/.test(t)) {
    return db.usuarios.filter((u) => params.includes(u.id));
  }
  if (/FROM eldarin_users WHERE id = \?/.test(t)) {
    return db.usuarios.filter((u) => u.id === params[0]).slice(0, 1);
  }
  db.desconhecidas.push(t);
  return [];
}

function criarSql(db, log) {
  const executa = (texto, params) => {
    log.push(texto);
    return rotear(texto, params, db);
  };
  const tag = (partes, ...valores) => executa(partes.join("?"), valores);
  tag.unsafe = (texto, params = []) => executa(texto, params);
  return tag;
}

// Roda fn com o banco e conta as consultas SQL e as leituras de aventura feitas.
async function medir(db, fn) {
  const log = [];
  globalThis.__P07.sql = criarSql(db, log);
  globalThis.__P07.adventures = db.adventures;
  globalThis.__P07.advCalls.length = 0;
  const resultado = await fn();
  return {
    resultado,
    consultas: log.length,
    aventuras: globalThis.__P07.advCalls.length,
    desconhecidas: db.desconhecidas.slice(),
  };
}

// ---------- formatacao antiga, reproduzida para comparar ----------

const nomeExibido = (u) => u.nickname?.trim() || "Jogador";

async function refPedido(row, viewerId) {
  const fromUser = await fetchUserById(row.from_user_id);
  const toUser = await fetchUserById(row.to_user_id);
  if (!fromUser || !toUser) return null;
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    fromDisplayName: nomeExibido(fromUser),
    fromNickname: fromUser.nickname ?? null,
    fromAvatarUrl: resolveUserAvatarUrl(fromUser),
    toDisplayName: nomeExibido(toUser),
    toNickname: toUser.nickname ?? null,
    toAvatarUrl: resolveUserAvatarUrl(toUser),
    createdAt: Number(row.created_at),
    direction: row.to_user_id === viewerId ? "incoming" : "outgoing",
  };
}

async function refPedidos(db, viewerId) {
  const recebidos = db.pedidos.filter((p) => p.to_user_id === viewerId && p.status === "pending").slice(0, 50);
  const enviados = db.pedidos.filter((p) => p.from_user_id === viewerId && p.status === "pending").slice(0, 50);
  const incoming = [];
  for (const row of recebidos) {
    const item = await refPedido(row, viewerId);
    if (item) incoming.push(item);
  }
  const outgoing = [];
  for (const row of enviados) {
    const item = await refPedido(row, viewerId);
    if (item) outgoing.push(item);
  }
  return { incoming, outgoing };
}

async function refConvites(db, userId) {
  const linhas = db.convites.filter((c) => c.to_user_id === userId && c.dismissed_at == null).slice(0, 50);
  const out = [];
  for (const row of linhas) {
    const fromUser = await fetchUserById(row.from_user_id);
    const adv = db.adventures[row.adventure_id] ?? null;
    if (!adv || adv.deletedAt) continue;
    out.push({
      id: row.id,
      fromUserId: row.from_user_id,
      fromDisplayName: fromUser ? nomeExibido(fromUser) : "Jogador",
      fromAvatarUrl: fromUser ? resolveUserAvatarUrl(fromUser) : null,
      roomId: adv.primaryRoomId,
      adventureId: adv.adventureId,
      inviteCode: adv.inviteCode,
      roomName: adv.name,
      message: row.message,
      inviteUrl: `/mesa/${adv.primaryRoomId}?convite=${adv.inviteCode}`,
      createdAt: Number(row.created_at),
    });
  }
  return out;
}

// ---------- casos ----------

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};
const igualAoFormatoAntigo = (novo, antigo) => {
  assert.equal(JSON.stringify(novo), JSON.stringify(antigo));
};

// 1. Pedidos de amizade: consultas constantes e mesmo resultado do formato antigo.
{
  const pequeno = await medir(bancoDeAmigos(5), () => listFriendRequests("u0"));
  const grande = await medir(bancoDeAmigos(10), () => listFriendRequests("u0"));
  assert.deepEqual(pequeno.desconhecidas, []);
  assert.deepEqual(grande.desconhecidas, []);
  assert.equal(pequeno.consultas, grande.consultas, "consultas de pedidos crescem com o numero de linhas");
  assert.ok(pequeno.consultas <= 3, `pedidos: esperado <= 3 consultas, veio ${pequeno.consultas}`);

  const dbRef = bancoDeAmigos(5);
  const antigo = await medir(dbRef, () => refPedidos(dbRef, "u0"));
  igualAoFormatoAntigo(pequeno.resultado, antigo.resultado);
  assert.equal(pequeno.resultado.incoming.length, 5);
  assert.equal(pequeno.resultado.outgoing.length, 5);
  assert.deepEqual(Object.keys(pequeno.resultado.incoming[0]), [
    "id", "fromUserId", "toUserId", "fromDisplayName", "fromNickname", "fromAvatarUrl",
    "toDisplayName", "toNickname", "toAvatarUrl", "createdAt", "direction",
  ]);
  ok(`pedidos: ${pequeno.consultas} consultas com 5 e com 10 linhas (formato antigo: ${antigo.consultas} consultas so de usuario para 10 pedidos)`);
  ok("pedidos: resultado igual ao formato antigo (mesma ordem, mesmas chaves)");
}

// 2. Convites recebidos: uma leitura de aventura por id distinto, usuarios em lote, convite sem aventura some.
{
  const db5 = bancoDeAmigos(5);
  const novo5 = await medir(db5, () => listReceivedMesaInvites("u0"));
  const novo10 = await medir(bancoDeAmigos(10), () => listReceivedMesaInvites("u0"));
  assert.deepEqual(novo5.desconhecidas, []);
  assert.equal(novo5.consultas, novo10.consultas, "consultas de convites crescem com o numero de convites");
  assert.equal(novo5.consultas, 2, `convites: esperado 2 consultas (lista + usuarios), veio ${novo5.consultas}`);
  assert.equal(novo5.aventuras, 3, "convites: aventura deve ser lida uma vez por id distinto");
  assert.equal(novo10.aventuras, 3, "convites: aventura deve ser lida uma vez por id distinto (10 convites)");

  const dbRefConvites = bancoDeAmigos(5);
  const antigo = await medir(dbRefConvites, () => refConvites(dbRefConvites, "u0"));
  igualAoFormatoAntigo(novo5.resultado, antigo.resultado);
  assert.equal(novo5.resultado.length, 4, "o convite da aventura apagada deve sumir");
  assert.equal(novo5.resultado[1].fromDisplayName, "Jogador", "remetente inexistente cai em Jogador");
  assert.equal(novo5.resultado[1].fromAvatarUrl, null);
  assert.deepEqual(Object.keys(novo5.resultado[0]), [
    "id", "fromUserId", "fromDisplayName", "fromAvatarUrl", "roomId", "adventureId",
    "inviteCode", "roomName", "message", "inviteUrl", "createdAt",
  ]);
  ok(`convites: ${novo5.consultas} consultas e ${novo5.aventuras} leituras de aventura com 5 e com 10 convites`);
  ok("convites: resultado igual ao formato antigo (mesma ordem, mesmas chaves, convite sem aventura removido)");
}

// 3. Pulso: contadores em consultas constantes e iguais aos contadores antigos (sem aventura apagada).
{
  const pequeno = await medir(bancoDeAmigos(5, { comApagada: false }), () => getFriendsPulse("u0"));
  const grande = await medir(bancoDeAmigos(10, { comApagada: false }), () => getFriendsPulse("u0"));
  assert.deepEqual(pequeno.desconhecidas, []);
  assert.equal(pequeno.consultas, grande.consultas, "pulso cresce com o numero de convites");
  assert.ok(pequeno.consultas <= 3, `pulso: esperado ate 3 consultas (lista de convites + usuarios + COUNT pedidos), veio ${pequeno.consultas}`);
  assert.deepEqual(pequeno.resultado, { unread: 3, invites: 5, requestsCount: 5 });
  assert.deepEqual(grande.resultado, { unread: 3, invites: 10, requestsCount: 10 });
  ok(`pulso: ${pequeno.consultas} consultas com 5 e com 10 itens, contadores iguais aos de listagem`);
}

// 4. Consulta de contagem: mesmo WHERE da listagem, com teto de 50.
{
  const db = bancoDeAmigos(5, { comApagada: false });
  for (let i = 6; i <= 60; i += 1) {
    db.convites.push({ ...db.convites[0], id: `extra${i}`, created_at: 4000 + i });
  }
  const contado = await medir(db, () => getFriendsPulse("u0"));
  assert.equal(contado.resultado.invites, 50, "contagem de convites deve parar em 50, como a listagem");
  ok("pulso: contagem de convites respeita o teto de 50 da listagem");
}

// 5. Convite de aventura apagada nao entra no contador (o COUNT direto contaria).
{
  const comApagada = await medir(bancoDeAmigos(5, { comApagada: true }), () => getFriendsPulse("u0"));
  // 5 convites, o 4o aponta para adv-X (apagada): o contador tem de dar 4, nao 5.
  assert.equal(comApagada.resultado.invites, 4, "convite de aventura apagada entrou no contador");
  ok("pulso: convite de aventura apagada fica fora do contador, igual a lista");
}

console.log(`\nP-07: ${passos} verificacoes ok.`);
