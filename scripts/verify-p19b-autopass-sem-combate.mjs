/**
 * P-19b: o tick do passe automático (chamado pelo SSE a cada 5 s por sala) não busca a
 * sala no banco quando a sala na memória não tem combate. Executa o tickRoomAutoPass
 * real com o registry stubado contando os getRoom.
 *
 * node scripts/verify-p19b-autopass-sem-combate.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = join(ROOT, "lib", "room", "internal", "registry.ts");
const STUB_REGISTRY = `
const mapa = (globalThis.__p19Rooms ??= new Map());
export function rooms() { return mapa; }
export async function getRoom(id) { globalThis.__p19GetRoom = (globalThis.__p19GetRoom ?? 0) + 1; return globalThis.__p19Fria ?? mapa.get(id) ?? null; }
export async function persistRoom(id, s) { return s; }
export function toSnapshot(s) { return s; }
`;

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
      if (f && resolve(f) === resolve(REGISTRY)) {
        return { url: "data:text/javascript," + encodeURIComponent(STUB_REGISTRY), shortCircuit: true };
      }
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

const { tickRoomAutoPass } = await import(pathToFileURL(join(ROOT, "lib", "room", "handlers", "combat-turn.ts")).href);
let passos = 0;
const ok = (n) => console.log(`ok ${++passos}: ${n}`);
const mapa = globalThis.__p19Rooms;

// 1. Sala na memória sem combate: 0 getRoom.
mapa.set("s1", { roomId: "s1", combat: { round: 1, activeIndex: 0, order: [] }, settings: {} });
globalThis.__p19GetRoom = 0;
for (let i = 0; i < 5; i++) assert.equal(await tickRoomAutoPass("s1"), false);
assert.equal(globalThis.__p19GetRoom, 0, "buscou a sala sem combate");
ok("sala sem combate na memória: 5 ticks, nenhuma busca da sala");

// 2. Sala na memória COM combate: busca (o passe automático pode estar vencido).
mapa.set("s2", { roomId: "s2", combat: { round: 1, activeIndex: 0, order: [] }, settings: {} });
mapa.get("s2").combat.order = ["t1"];
globalThis.__p19GetRoom = 0;
await tickRoomAutoPass("s2").catch(() => false);
assert.equal(globalThis.__p19GetRoom, 1, "com combate deve buscar a sala");
ok("sala com combate: busca a sala para conferir o passe");

// 3. Sala fria (fora da memória): segue o caminho normal (busca).
globalThis.__p19GetRoom = 0;
await tickRoomAutoPass("s-fria").catch(() => false);
assert.equal(globalThis.__p19GetRoom, 1, "sala fria deve buscar");
ok("sala fora da memória: busca normalmente");

console.log(`P-19b: ${passos} verificacoes ok.`);
