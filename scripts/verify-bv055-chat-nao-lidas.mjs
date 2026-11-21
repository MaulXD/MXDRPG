/**
 * BV-055: o botao Chat da mesa (barra lateral e barra mobile) precisa mostrar
 * quantas mensagens de outros usuarios chegaram enquanto o chat estava fechado.
 *
 * Causa: os botoes Chat nao tinham contador de mensagens nao lidas.
 * Correcao: lib/room/chat-nao-lidas.ts (funcao pura), hooks/vtt/useMesaChatNaoLidas.ts,
 * ligados em MesaWorkspace -> MesaFoundryDockRail -> MesaFoundrySidebar -> MesaIconBar
 * (desktop) e MesaWorkspace -> MesaMobileBar (mobile).
 *
 * Teste: a funcao pura roda com casos de contagem; o restante confere a ligacao
 * entre os componentes (o hook depende do React, por isso e verificado por leitura).
 *
 * node scripts/verify-bv055-chat-nao-lidas.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");

// 1. Funcao pura: carrega o TypeScript transpilado (o arquivo so tem import de tipo).
const fonte = ler("lib/room/chat-nao-lidas.ts");
const js = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { contarMensagensNaoLidas, instanteMaisRecente } = await import(
  "data:text/javascript," + encodeURIComponent(js)
);

const msg = (at, authorId) => ({
  id: String(at),
  at,
  authorId,
  authorName: authorId,
  authorRole: "jogador",
  kind: "chat",
  text: "oi",
});
const lista = [msg(100, "a"), msg(200, "b"), msg(300, "eu"), msg(400, "b")];

assert.equal(contarMensagensNaoLidas(lista, 0, "eu"), 3, "sem visto: conta tudo menos a propria");
assert.equal(contarMensagensNaoLidas(lista, 200, "eu"), 1, "so a mensagem depois de 200");
assert.equal(contarMensagensNaoLidas(lista, 400, "eu"), 0, "tudo visto");
assert.equal(contarMensagensNaoLidas(lista, 200, null), 2, "sem usuario: conta as de 300 e 400");
assert.equal(contarMensagensNaoLidas([], 0, "eu"), 0, "lista vazia");
// Lupa: XP por monstro ("xp") e aviso de abertura ("system") nao contam.
assert.equal(
  contarMensagensNaoLidas([msg(500, "xp"), msg(600, "system"), msg(700, "b")], 0, "eu"),
  1,
  "autores automaticos nao contam"
);
assert.equal(instanteMaisRecente(lista), 400, "maior at");
assert.equal(instanteMaisRecente([]), 0, "maior at de lista vazia");

// 2. Ligacoes entre os arquivos.
function contem(rel, trecho) {
  assert.ok(ler(rel).includes(trecho), `${rel} deveria conter: ${trecho}`);
}
function conta(rel, trecho, esperado) {
  const n = ler(rel).split(trecho).length - 1;
  assert.equal(n, esperado, `${rel} deveria conter ${esperado}x: ${trecho} (achou ${n})`);
}

contem("hooks/vtt/useMesaChatNaoLidas.ts", "contarMensagensNaoLidas(messages, vistoAteRef.current, selfId)");
contem("hooks/vtt/useMesaChatNaoLidas.ts", "if (chatAberto) {");
// Lupa: relogio do servidor, nao do cliente; e so redesenha quando o numero muda.
assert.ok(!ler("hooks/vtt/useMesaChatNaoLidas.ts").replace(/\/\*[\s\S]*?\*\//g, "").includes("Date.now("), "hook nao usa Date.now()");
contem("hooks/vtt/useMesaChatNaoLidas.ts", 'store.subscribe("chat", cb)');
contem("hooks/vtt/useMesaChatNaoLidas.ts", "useSyncExternalStore(");

contem("components/vtt/MesaWorkspace.tsx", "useMesaChatNaoLidas(");
contem("components/vtt/MesaWorkspace.tsx", "chatLayout.open && !chatLayout.minimized");
conta("components/vtt/MesaWorkspace.tsx", "chatNaoLidas={chatNaoLidas}", 2);

contem("components/vtt/mesa/MesaFoundryDockRail.tsx", "chatNaoLidas={chatNaoLidas}");
contem("components/vtt/foundry/MesaFoundrySidebar.tsx", "chatNaoLidas={chatNaoLidas}");

contem("components/vtt/foundry/MesaIconBar.tsx", 'naoLidas={icon.id === "chat" ? chatNaoLidas : 0}');
contem("components/vtt/foundry/MesaIconBar.tsx", "mesa-chat-nao-lidas__badge");
contem("components/vtt/foundry/MesaIconBar.tsx", "mensagens novas");

contem("components/vtt/MesaMobileBar.tsx", "chatNaoLidas > 0");
contem("components/vtt/MesaMobileBar.tsx", "mesa-chat-nao-lidas__badge");

contem("components/vtt/foundry/foundry.css", ".mesa-chat-nao-lidas__badge {");
contem("components/vtt/foundry/foundry.css", ".mesa-mobile-bar__icon--badge {");

// 3. Sem title nativo no badge nem no botao (regra do site: data-site-tip).
for (const rel of ["components/vtt/foundry/MesaIconBar.tsx", "components/vtt/MesaMobileBar.tsx"]) {
  assert.ok(!/title=\{?["`]/.test(ler(rel)), `${rel} nao deve usar title nativo`);
}

console.log("verify-bv055-chat-nao-lidas: OK");
