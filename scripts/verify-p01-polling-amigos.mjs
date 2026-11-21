/**
 * P-01 (desempenho): o polling de amigos fazia 27 pedidos/min por jogador com a mesa parada
 * (unread a cada 4 s + invites e requests a cada 10 s), mesmo com a aba escondida.
 *
 * Correcao: app/api/friends/pulse (um pedido com os tres contadores), lib/friends/pulse.ts,
 * components/friends/FriendsChatProvider.tsx (15 s, pausa com a aba escondida, leitura ao voltar)
 * e components/friends/FriendsChat.tsx (4 s so com a conversa aberta e a aba visivel).
 *
 * Teste: leitura de codigo (intervalos, pausa, visibilitychange, rotas antigas fora do Provider)
 * e comportamento real quando o servidor de dev responde em BASE_URL (padrao http://localhost:3000):
 * /api/friends/pulse sem sessao tem de responder 401 com JSON de erro. Sem servidor, esse passo e pulado.
 *
 * node scripts/verify-p01-polling-amigos.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

// 1. Rota nova e helper existem.
assert.ok(existsSync(join(ROOT, "app/api/friends/pulse/route.ts")), "falta app/api/friends/pulse/route.ts");
assert.ok(existsSync(join(ROOT, "lib/friends/pulse.ts")), "falta lib/friends/pulse.ts");
const rota = ler("app/api/friends/pulse/route.ts");
assert.match(rota, /getSession\(\)/, "rota pulse precisa checar a sessao");
assert.match(rota, /status: 401/, "rota pulse precisa responder 401 sem sessao");
assert.match(rota, /getFriendsPulse\(session\.user\.id\)/, "rota pulse precisa usar o helper compartilhado");
ok("rota /api/friends/pulse existe, checa sessao e usa o helper");

const helper = ler("lib/friends/pulse.ts");
for (const chave of ["unread", "invites", "requestsCount"]) {
  assert.match(helper, new RegExp(`\\b${chave}\\b`), `helper pulse sem o campo ${chave}`);
}
assert.match(helper, /countUnreadFriendMessages\(/, "helper pulse sem a consulta de nao lidas");
assert.match(helper, /listReceivedMesaInvites\(/, "helper pulse sem a consulta de convites");
assert.match(helper, /countIncomingFriendRequests\(/, "helper pulse sem a consulta de pedidos");
ok("helper devolve { unread, invites, requestsCount } com as mesmas consultas das 3 rotas");

// 2. Provider so fala com o pulse; nao chama as rotas antigas.
const provider = ler("components/friends/FriendsChatProvider.tsx");
assert.match(provider, /\/api\/friends\/pulse/, "Provider deveria chamar /api/friends/pulse");
for (const antiga of ["/api/friends/messages/unread", "/api/friends/invites", "countOnly=1"]) {
  assert.ok(!provider.includes(antiga), `Provider ainda chama ${antiga} direto`);
}
ok("Provider nao chama mais unread, invites nem requests diretamente");

// 3. Intervalo do Provider >= 15 s e nenhum intervalo antigo sobrando.
const m = provider.match(/const PULSE_MS = ([\d_]+);/);
assert.ok(m, "Provider sem constante PULSE_MS");
const pulseMs = Number(m[1].replace(/_/g, ""));
assert.ok(pulseMs >= 15_000, `intervalo do Provider ${pulseMs} ms, precisa ser >= 15000`);
assert.ok(!/INVITE_POLL_MS|UNREAD_POLL_MS/.test(provider), "restou constante de polling antiga no Provider");
assert.ok(!/window\.setInterval\([^)]*4_000/.test(provider), "Provider ainda tem intervalo de 4 s");
ok(`Provider usa intervalo de ${pulseMs} ms, sem constantes antigas`);

// 4. Pausa com a aba escondida e leitura ao voltar/focar.
assert.match(provider, /visibilitychange/, "Provider sem listener visibilitychange");
assert.match(provider, /document\.visibilityState === "hidden"/, "Provider nao checa aba escondida");
assert.match(provider, /window\.addEventListener\("focus"/, "Provider sem listener de foco");
assert.match(provider, /window\.clearInterval\(timer\)/, "Provider nao para o timer ao esconder");
ok("Provider pausa com a aba escondida e tem visibilitychange e foco");

// 5. Polling rapido de 4 s so com conversa aberta e aba visivel.
const chat = ler("components/friends/FriendsChat.tsx");
assert.match(chat, /const POLL_MS = 4_000;/, "FriendsChat perdeu o POLL_MS");
assert.match(chat, /visibilitychange/, "FriendsChat sem visibilitychange");
assert.match(chat, /document\.visibilityState === "hidden"/, "FriendsChat nao pausa com a aba escondida");
assert.match(chat, /if \(!selectedId\) return;/, "FriendsChat deveria so pollar com conversa aberta");
const intervalos = chat.match(/window\.setInterval\(/g) ?? [];
assert.equal(intervalos.length, 1, "FriendsChat deveria ter um unico setInterval");
ok("FriendsChat polla a 4 s so com conversa aberta e aba visivel");

// 6. Comportamento real, se o servidor de dev estiver no ar.
try {
  const res = await fetch(`${BASE_URL}/api/friends/pulse`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });
  assert.equal(res.status, 401, `pulse sem sessao respondeu ${res.status}, esperado 401`);
  const corpo = await res.json();
  assert.ok(typeof corpo.error === "string", "401 do pulse sem JSON de erro");
  ok("GET /api/friends/pulse sem sessao responde 401 com JSON de erro");
} catch (erro) {
  if (erro instanceof assert.AssertionError) throw erro;
  console.log(`pulado: servidor em ${BASE_URL} nao respondeu (${erro.message}). Teste de comportamento nao rodou.`);
}

console.log(`\nP-01 ok: ${passos} verificacoes.`);
