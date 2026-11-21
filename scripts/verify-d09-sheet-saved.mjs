/**
 * D-09: updateRoomActor precisa avisar quando a sala grava mas a ficha nao grava.
 *
 * Causa: lib/room/handlers/actors.ts, updateRoomActor, captura o erro de
 * persistActorToAdventureSheet so com console.error e responde sucesso. A imagem
 * fica na sala e volta da ficha na proxima sincronizacao.
 *
 * Correcao: updateRoomActor devolve sheetSaved: false quando a ficha falha; a rota
 * PATCH repassa esse sinal; o editor de retrato mostra o aviso ao jogador.
 *
 * Teste de comportamento: chama a funcao real updateRoomActor com
 * persistActorToAdventureSheet falhando (stub injetado pelo hook de modulo, so
 * para o import de handlers/actors.ts) e com a gravacao funcionando.
 *
 * node scripts/verify-d09-sheet-saved.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Stubs para os imports de handlers/actors.ts que tocam banco. So o que o teste usa.
const STUB_ADVENTURE_ACTORS = `
export async function persistActorToAdventureSheet(actor) {
  if (globalThis.__d09SheetFail) throw new Error("falha simulada na gravacao da ficha");
}
`;
const STUB_IMAGE_NORMALIZE = `
export async function normalizeImageDataUrl(dataUrl) { return dataUrl; }
`;
const STUB_REGISTRY = `
export function toSnapshot(room) {
  return { actors: room.actors, scene: room.scene, revision: room.revision ?? 0 };
}
export async function persistRoom(roomId, room) { return room; }
export async function getRoom() { return null; }
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
    // "server-only" so lanca erro fora do Next; no teste nao faz nada.
    if (specifier === "server-only") {
      return { url: "data:text/javascript,", shortCircuit: true };
    }
    // sharp (binario nativo) nao e necessario: o teste nao envia imagem.
    if (specifier === "@/lib/media/image-normalize") {
      return { url: "data:text/javascript," + encodeURIComponent(STUB_IMAGE_NORMALIZE), shortCircuit: true };
    }
    if (parent.endsWith("/handlers/actors.ts")) {
      if (specifier === "../adventure-actors") {
        return { url: "data:text/javascript," + encodeURIComponent(STUB_ADVENTURE_ACTORS), shortCircuit: true };
      }
      if (specifier === "../internal/registry") {
        return { url: "data:text/javascript," + encodeURIComponent(STUB_REGISTRY), shortCircuit: true };
      }
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
    if (/\.json$/.test(url)) {
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

const { updateRoomActor } = await import(
  pathToFileURL(join(ROOT, "lib", "room", "handlers", "actors.ts")).href
);
const { assertRoomPortraitSheetSaved, SHEET_NOT_SAVED_MESSAGE, SHEET_NOT_CLEARED_MESSAGE } = await import(
  pathToFileURL(join(ROOT, "lib", "character", "portrait-sheet-saved.ts")).href
);

let pass = 0;
let fail = 0;

async function caso(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    console.error(`  ✗ ${name} — ${err.message.split("\n")[0]}`);
  }
}

function salaComAtor() {
  const actor = {
    id: "a1",
    ownerId: "u1",
    name: "Teste",
    revision: 0,
    attributes: {},
    inventory: [],
    biography: "antiga",
    resources: {
      vida: { max: 10, value: 10 },
      pontosAcao: { value: 5, max: 5 },
    },
  };
  return { id: "r1", revision: 0, actors: { a1: actor }, scene: { tokens: [] } };
}

console.log("D-09 updateRoomActor / sheetSaved");

await caso("ficha falha: sheetSaved false e a sala continua gravada", async () => {
  globalThis.__d09SheetFail = true;
  try {
    const room = salaComAtor();
    const snap = await updateRoomActor("r1", "a1", { biography: "nova" }, { room });
    assert.ok(snap, "deve devolver snapshot");
    assert.equal(snap.sheetSaved, false);
    assert.equal(snap.actors.a1.biography, "nova", "a sala deve manter a mudanca");
  } finally {
    globalThis.__d09SheetFail = false;
  }
});

await caso("ficha grava: sheetSaved true", async () => {
  const room = salaComAtor();
  const snap = await updateRoomActor("r1", "a1", { biography: "nova" }, { room });
  assert.equal(snap.sheetSaved, true);
  assert.equal(snap.actors.a1.biography, "nova");
});

await caso("patch vazio nao grava ficha e segue com sheetSaved true", async () => {
  const room = salaComAtor();
  const snap = await updateRoomActor("r1", "a1", {}, { room });
  assert.equal(snap.sheetSaved, true);
});

await caso("ator inexistente continua devolvendo null", async () => {
  const room = salaComAtor();
  const snap = await updateRoomActor("r1", "nao-existe", { biography: "x" }, { room });
  assert.equal(snap, null);
});

await caso("cliente: assert lanca a mensagem para o jogador quando sheetSaved false", () => {
  assert.throws(
    () => assertRoomPortraitSheetSaved({ sheetSaved: false }),
    (err) => err.message === SHEET_NOT_SAVED_MESSAGE
  );
  assert.equal(
    SHEET_NOT_SAVED_MESSAGE,
    "A imagem foi aplicada na mesa, mas não foi salva na ficha. Tente de novo."
  );
});

await caso("cliente: remocao usa mensagem propria, sem falar em 'aplicada'", () => {
  assert.throws(
    () => assertRoomPortraitSheetSaved({ sheetSaved: false }, SHEET_NOT_CLEARED_MESSAGE),
    (err) => err.message === SHEET_NOT_CLEARED_MESSAGE
  );
  assert.ok(!SHEET_NOT_CLEARED_MESSAGE.includes("aplicada"));
});

await caso("cliente: assert nao lanca com sheetSaved true, ausente ou resposta nula", () => {
  assertRoomPortraitSheetSaved({ sheetSaved: true });
  assertRoomPortraitSheetSaved({});
  assertRoomPortraitSheetSaved(null);
});

await caso("rota PATCH repassa sheetSaved no JSON", () => {
  const src = readFileSync(
    join(ROOT, "app", "api", "room", "[roomId]", "actors", "[actorId]", "route.ts"),
    "utf8"
  );
  assert.match(src, /sheetSaved: snapshot\.sheetSaved/);
});

// Teste de UI por texto do codigo: nao renderiza o componente. Confere so que a
// chamada existe em cada caminho (salvar e remover) depois de aplicar o resultado.
await caso("editor de retrato (salvar) chama o assert depois de aplicar o resultado", () => {
  for (const rel of [
    ["components", "character", "PortraitEditorFields.tsx"],
    ["components", "character", "SheetPopupPortrait.tsx"],
  ]) {
    const src = readFileSync(join(ROOT, ...rel), "utf8");
    assert.match(src, /assertRoomPortraitSheetSaved\(result\);/, rel.join("/"));
  }
});

await caso("editor de retrato (remover) usa a mensagem de remocao", () => {
  const src = readFileSync(
    join(ROOT, "components", "character", "PortraitEditorFields.tsx"),
    "utf8"
  );
  assert.match(src, /assertRoomPortraitSheetSaved\(result, SHEET_NOT_CLEARED_MESSAGE\)/);
});

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
