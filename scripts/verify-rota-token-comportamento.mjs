/**
 * ROTA-TOKEN-TESTE (teste de comportamento): executa o PATCH de
 * app/api/room/[roomId]/tokens/[tokenId]/route.ts com Request de verdade.
 *
 * Casos: (1) sem sessao -> 401; (2) jogador dono mandando vida -> 403 e sem gravar;
 * (3) jogador dono mandando nameplateMode -> 200 e grava; (4) jogador dono mandando
 * timedEffects -> 403; (5) mestre mandando conditions e timedEffects -> 200;
 * (6) corpo 'null' -> 400; (7) jogador de outra conta no token -> 403.
 *
 * Stubs (so os imports que tocam sessao ou banco): auth/session (getSession),
 * room/store (getRoom, updateRoomToken) e next/server (NextResponse.json vira Response).
 * O resto roda o codigo real: authorize-room, room-access e combat-turn-access.
 *
 * node scripts/verify-rota-token-comportamento.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Stubs dos imports que tocam sessao ou banco.
const STUBS = {
  "@/lib/auth/session": `
export async function getSession() { return globalThis.__sessao ?? null; }
`,
  "@/lib/room/store": `
export async function getRoom() { return globalThis.__sala ?? null; }
export async function updateRoomToken(roomId, tokenId, patch, opts) {
  (globalThis.__atualizacoes ??= []).push({ roomId, tokenId, patch });
  const atual = opts.room.scene.tokens.find((t) => t.id === tokenId);
  return { revision: 2, scene: { tokens: [{ ...atual, ...patch }] } };
}
export async function removeRoomToken() { return { ok: false, error: "nao usado no teste" }; }
`,
  "next/server": `
export const NextResponse = {
  json(data, init) {
    return new Response(JSON.stringify(data), {
      status: init?.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  },
};
`,
};

function arquivoExistente(base) {
  for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? "";
    if (specifier === "server-only") {
      return { url: "data:text/javascript,", shortCircuit: true };
    }
    if (Object.prototype.hasOwnProperty.call(STUBS, specifier)) {
      return { url: "data:text/javascript," + encodeURIComponent(STUBS[specifier]), shortCircuit: true };
    }
    let base = null;
    if (specifier.startsWith("@/")) {
      base = join(ROOT, specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      parent.startsWith("file:") &&
      /\.tsx?$/.test(parent)
    ) {
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
      const json = readFileSync(fileURLToPath(url), "utf8");
      return { format: "module", source: `export default ${json};`, shortCircuit: true };
    }
    if (/\.tsx?$/.test(url)) {
      const src = readFileSync(fileURLToPath(url), "utf8");
      const out = ts.transpileModule(src, {
        fileName: url,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { PATCH } = await import(
  pathToFileURL(join(ROOT, "app", "api", "room", "[roomId]", "tokens", "[tokenId]", "route.ts")).href
);

const ROOM_ID = "sala-1";
const TOKEN_ID = "tok-jogador";
const GM = { id: "gm-1", email: "mestre@teste.local", name: "Mestre", role: "user" };
const JOGADOR = { id: "jog-1", email: "jogador@teste.local", name: "Jogador", role: "user" };
const ESTRANHO = { id: "estranho-9", email: "estranho@teste.local", name: "Estranho", role: "user" };

function salaMinima() {
  return {
    roomId: ROOM_ID,
    ownerId: GM.id,
    memberIds: [JOGADOR.id],
    actors: {},
    scene: {
      tokens: [
        {
          id: TOKEN_ID,
          name: "Aragorn",
          x: 2,
          y: 2,
          vida: 10,
          delegatedToUserId: JOGADOR.id,
          conditions: [],
          timedEffects: [],
          nameplateMode: "name",
        },
      ],
    },
  };
}

/** Chama o PATCH real. corpo: objeto (vira JSON) ou string (vai crua, ex.: 'null'). */
async function chamarPatch(corpo, usuario) {
  globalThis.__sessao = usuario ? { user: usuario } : null;
  globalThis.__sala = salaMinima();
  globalThis.__atualizacoes = [];
  const req = new Request(`http://localhost/api/room/${ROOM_ID}/tokens/${TOKEN_ID}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
  const res = await PATCH(req, { params: Promise.resolve({ roomId: ROOM_ID, tokenId: TOKEN_ID }) });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, chamadas: globalThis.__atualizacoes };
}

let falhas = 0;
async function caso(nome, fn) {
  try {
    await fn();
    console.log(`  ✓ ${nome}`);
  } catch (err) {
    falhas++;
    console.log(`  ✗ ${nome}: ${err.message.split("\n")[0]}`);
  }
}

console.log("verify-rota-token-comportamento: PATCH do token executado de verdade");

await caso("(1) sem sessão responde 401 e não grava", async () => {
  const r = await chamarPatch({ vida: 1 }, null);
  assert.equal(r.status, 401);
  assert.equal(r.chamadas.length, 0);
});

await caso("(2) jogador dono mandando vida responde 403 e não grava", async () => {
  const r = await chamarPatch({ vida: 1 }, JOGADOR);
  assert.equal(r.status, 403);
  assert.equal(r.chamadas.length, 0);
});

await caso("(3) jogador dono mandando nameplateMode passa e grava", async () => {
  const r = await chamarPatch({ nameplateMode: "x" }, JOGADOR);
  assert.equal(r.status, 200);
  assert.equal(r.chamadas.length, 1);
  assert.equal(r.chamadas[0].patch.nameplateMode, "x");
});

await caso("(4) jogador dono mandando timedEffects responde 403 e não grava", async () => {
  const r = await chamarPatch({ timedEffects: [] }, JOGADOR);
  assert.equal(r.status, 403);
  assert.equal(r.chamadas.length, 0);
});

await caso("(5) mestre mandando conditions e timedEffects responde 200 e grava", async () => {
  const r = await chamarPatch({ conditions: [], timedEffects: [] }, GM);
  assert.equal(r.status, 200);
  assert.equal(r.chamadas.length, 1);
});

await caso("(6) corpo 'null' responde 400", async () => {
  const r = await chamarPatch("null", JOGADOR);
  assert.equal(r.status, 400);
  assert.equal(r.chamadas.length, 0);
});

await caso("(7) jogador de outra conta, sem ser dono, responde 403 e não grava", async () => {
  const r = await chamarPatch({ nameplateMode: "x" }, ESTRANHO);
  assert.equal(r.status, 403);
  assert.equal(r.chamadas.length, 0);
});

if (falhas) {
  console.log(`  ${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log("  todos os casos passaram");
