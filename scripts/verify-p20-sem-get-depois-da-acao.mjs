// P-20: depois de uma mutacao de sala (POST/PATCH), o SSE avisa a revisao nova
// antes da resposta do POST. O refresh disparado pelo SSE nao deve fazer GET
// extra quando a resposta da mutacao ja trouxe essa revisao, e deve esperar a
// mutacao em voo (teto de ~2 s). Verificacao por leitura do hooks/useRoomSync.ts.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "hooks", "useRoomSync.ts"), "utf8");
const falhas = [];

function exige(condicao, descricao) {
  if (!condicao) falhas.push(descricao);
}

// (1) contador de mutacoes em voo no modulo, incrementado antes do fetch e
// decrementado no finally de roomFetch.
exige(/let mutacoesRoomEmVoo = 0;/.test(src), "contador mutacoesRoomEmVoo nao declarado no modulo");
const iRoomFetch = src.indexOf("async function roomFetch(");
exige(iRoomFetch > 0, "roomFetch nao encontrado");
const corpoRoomFetch = src.slice(iRoomFetch, src.indexOf("\n}\n", iRoomFetch));
const iIncremento = corpoRoomFetch.indexOf("mutacoesRoomEmVoo += 1;");
const iTry = corpoRoomFetch.indexOf("try {");
exige(iIncremento >= 0 && iIncremento < iTry, "roomFetch nao incrementa o contador antes do try/fetch");
// P-20b: o contador cai em liberar(), chamado ao terminar de ler o corpo (res.json),
// no erro e pela segurança de 2 s; o comportamento está no item (6).
exige(
  /const liberar = \(\) => \{[\s\S]*?mutacoesRoomEmVoo -= 1;/.test(corpoRoomFetch) &&
    /setTimeout\(liberar, REFRESH_ESPERA_MUTACAO_MAX_MS\)/.test(corpoRoomFetch),
  "roomFetch nao libera o contador por liberar() com seguranca de 2 s"
);

// (2) scheduleRefresh recebe a revisao alvo, pula o GET quando ela ja chegou,
// e reagenda enquanto houver mutacao em voo, com teto.
exige(
  /const scheduleRefresh = useCallback\(\(revisaoAlvo: number\)/.test(src),
  "scheduleRefresh nao recebe revisaoAlvo: number"
);
const iSchedule = src.indexOf("const scheduleRefresh = useCallback(");
const corpoSchedule = src.slice(iSchedule, src.indexOf("}, [refresh]);", iSchedule));
exige(
  /revisionRef\.current\s*>=\s*refreshAlvoRef\.current/.test(corpoSchedule),
  "scheduleRefresh nao pula o GET quando revisionRef ja alcancou o alvo"
);
const iPulo = corpoSchedule.search(/revisionRef\.current\s*>=\s*refreshAlvoRef\.current/);
const iGet = corpoSchedule.indexOf("void refreshImplRef.current?.();");
exige(iGet > iPulo && iPulo >= 0, "verificacao de revisao nao acontece antes do GET");
exige(
  /mutacoesRoomEmVoo\s*>\s*0/.test(corpoSchedule) &&
    /REFRESH_ESPERA_MUTACAO_MAX_MS/.test(corpoSchedule) &&
    /REFRESH_ESPERA_MUTACAO_MS\b/.test(corpoSchedule),
  "scheduleRefresh nao espera mutacao em voo com reagendamento e teto"
);
exige(
  /const REFRESH_ESPERA_MUTACAO_MS = 100;/.test(src) &&
    /const REFRESH_ESPERA_MUTACAO_MAX_MS = 2000;/.test(src),
  "constantes de espera (100 ms / 2000 ms) nao conferem"
);

// (3) handler do SSE passa a revisao; nenhuma chamada sem argumento sobrou.
const chamadas = src.match(/scheduleRefresh\([^)]*\)/g) ?? [];
const chamadasSemRevisao = chamadas.filter((c) => c === "scheduleRefresh()");
exige(chamadasSemRevisao.length === 0, "ainda ha scheduleRefresh() sem a revisao alvo");
exige(
  src.includes("scheduleRefresh(data.revision);"),
  "handler do SSE nao passa data.revision para scheduleRefresh"
);

// (4) fallback poll, refresh manual e reconexao continuam chamando refresh.
exige(
  (src.match(/void refreshImplRef\.current\?\.\(\);/g) ?? []).length >= 4,
  "fallback poll / sync retry / refresh enfileirado mudaram de forma"
);

// (5) Lupa (P-20): o delta da minha mutação traz só o que ela mudou. Se outro jogador
// gravou a rev 5 e eu a 6, aplicar meu delta subiria o cliente para 6 sem a 5. Comportamento
// real de lib/room/room-delta.ts (transpilado) + leitura do applyRoomResponse.
{
  const ts = (await import("typescript")).default;
  const { registerHooks } = await import("node:module");
  const { existsSync, statSync } = await import("node:fs");
  const { resolve, dirname: dn } = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const achar = (b) => [b, b + ".ts", b + ".tsx"].find((c) => existsSync(c) && statSync(c).isFile());
  registerHooks({
    resolve(spec, ctx, next) {
      const pai = ctx.parentURL ?? "";
      let base = null;
      if (spec.startsWith("@/")) base = join(root, spec.slice(2));
      else if (spec.startsWith(".") && pai.startsWith("file:") && /\.tsx?$/.test(pai)) base = resolve(dn(fileURLToPath(pai)), spec);
      if (base) {
        const f = achar(base);
        if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
      }
      return next(spec, ctx);
    },
    load(url, ctx, next) {
      if (/\.json$/.test(url) && !url.includes("/node_modules/")) {
        return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
      }
      if (/\.tsx?$/.test(url)) {
        const out = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          fileName: url,
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText;
        return { format: "module", source: out, shortCircuit: true };
      }
      return next(url, ctx);
    },
  });
  const rd = await import(pathToFileURL(join(root, "lib", "room", "room-delta.ts")).href);
  const deltaMeu = { kind: "delta", roomId: "s1", revision: 6, chatAppend: [{ id: "m6", text: "minha" }] };
  exige(rd.deltaPulaRevisao(4, deltaMeu) === true, "delta 4 -> 6 (outra gravação no meio) não foi visto como salto");
  exige(rd.deltaPulaRevisao(5, deltaMeu) === false, "delta 5 -> 6 (sem buraco) foi visto como salto");
  exige(rd.deltaPulaRevisao(4, { roomId: "s1", revision: 9, chat: [] }) === false, "sala completa não tem buraco");
  // Comportamento da decisão (a mesma função que o hook usa).
  const base = { roomId: "s1", revision: 4, chat: [], scene: { tokens: [] }, actors: {}, combat: { order: [] }, settings: {}, pings: [] };
  const mut = rd.decidirAplicacao(base, 4, deltaMeu, "mutacao");
  exige(mut.buscarDeNovo === true, "mutação 4 -> 6 tem de pedir GET");
  exige(mut.snapshot.revision === 4, "mutação 4 -> 6 tem de segurar a revisão em 4");
  exige(mut.snapshot.chat.some((m) => m.id === "m6"), "a mudança da própria mutação tem de aparecer já");
  const get = rd.decidirAplicacao(base, 4, { ...deltaMeu, chatAppend: [{ id: "m5" }, { id: "m6" }] }, "get");
  exige(get.buscarDeNovo === false, "GET since=4 com delta rev 6 NÃO pode pedir outro GET (laço)");
  exige(get.snapshot.revision === 6, "GET since=4 com delta rev 6 tem de subir a revisão para 6");
  const contigua = rd.decidirAplicacao(base, 4, { ...deltaMeu, revision: 5 }, "mutacao");
  exige(contigua.buscarDeNovo === false && contigua.snapshot.revision === 5, "mutação contígua 4 -> 5 entra inteira, sem GET");
  // Leitura: o hook usa a decisão e o GET marca a origem.
  exige(/decidirAplicacao\(\s*snapshotRef\.current,\s*revisionRef\.current,\s*payload,\s*opts\?\.doGet \? "get" : "mutacao"\s*\)/.test(src), "applyRoomResponse não usa decidirAplicacao");
  exige(/applyRoomResponse\(data, \{ doGet: true \}\);/.test(src), "o refresh (GET) não marca doGet: true");
  exige(/if \(buscarDeNovo\) void refreshImplRef\.current\?\.\(\);/.test(src), "o salto não pede GET");
}

// (6) P-20b (Lupa): a mutação só sai de "em voo" depois que o corpo da resposta foi LIDO
// (o chat devolve a sala inteira; ler o JSON demora). Comportamento real do roomFetch,
// via postRoomChat transpilado, com fetch stubado cujo corpo chega devagar.
{
  const { createRequire } = await import("node:module");
  const requireCjs = createRequire(import.meta.url);
  const tsCjs = requireCjs("typescript");
  const stub = new Proxy(function () {}, {
    get: (_t, k) => (k === "__esModule" ? true : stub),
    apply: () => stub,
    construct: () => stub,
  });
  const js = tsCjs.transpileModule(src, {
    compilerOptions: { module: tsCjs.ModuleKind.CommonJS, target: tsCjs.ScriptTarget.ES2020, jsx: tsCjs.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const req = (n) => (n.startsWith(".") || n.startsWith("@/") || n === "react" ? stub : requireCjs(n));
  new Function("require", "module", "exports", js)(req, mod, mod.exports);
  const api = mod.exports;

  let soltarCorpo;
  const corpoPronto = new Promise((r) => (soltarCorpo = r));
  globalThis.fetch = async () => {
    const res = new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    res.json = async () => {
      await corpoPronto;
      return { roomId: "s1", revision: 7, chat: [] };
    };
    return res;
  };
  const envio = api.postRoomChat("s1", { kind: "chat", text: "oi" });
  await new Promise((r) => setTimeout(r, 20)); // headers chegaram; corpo ainda não
  exige(api.mutacoesRoomEmVooAgora() === 1, "com o corpo ainda chegando, a mutação já saiu de 'em voo' (o GET volta)");
  soltarCorpo();
  const sala = await envio;
  exige(sala?.revision === 7, "postRoomChat não devolveu a sala");
  exige(api.mutacoesRoomEmVooAgora() === 0, "depois de ler o corpo, a mutação continua 'em voo'");

  // Erro HTTP também libera.
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "x" }), { status: 400, headers: { "content-type": "application/json" } });
  await api.postRoomChat("s1", { kind: "chat", text: "oi" }).catch(() => null);
  exige(api.mutacoesRoomEmVooAgora() === 0, "erro na mutação não liberou o contador");
}

if (falhas.length > 0) {
  console.error("verify-p20-sem-get-depois-da-acao: FALHOU");
  for (const f of falhas) console.error(" - " + f);
  process.exit(1);
}
console.log("verify-p20-sem-get-depois-da-acao: OK");
