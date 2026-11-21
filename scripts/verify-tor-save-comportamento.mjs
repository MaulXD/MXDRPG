/**
 * TOR-SAVE (teste de comportamento): executeRoomTorAttack e executeRoomTorHazard
 * precisam devolver sheetSaved: false quando a gravacao da ficha falha, e
 * sheetSaved: true quando ela funciona.
 *
 * Causa coberta: lib/room/handlers/tor-combat-attack.ts e tor-hazard.ts aplicam o
 * resultado na mesa e, se patchTorCharacterResources falha, so chamam console.error.
 * Correcao: as duas funcoes devolvem sheetSaved: false no catch.
 *
 * Teste de comportamento: chama as funcoes reais com a sala minima que cada uma
 * precisa. Stubs (so para os imports que tocam banco ou sessao): room-access,
 * character/um-anel/characters (resolveTorCharacter e patchTorCharacterResources),
 * bestiary/record e internal/registry (getRoom, persistRoom, toSnapshot).
 *
 * Ataque: o atacante e um adversario (sem ficha) e o defensor e um heroi com ficha.
 * Math.random fica em 0.99 durante o ataque, para o dado dar acerto; o caso confere
 * que a ficha foi tentada (so acerto tenta gravar).
 *
 * node scripts/verify-tor-save-comportamento.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Stubs dos imports que tocam banco ou sessao. So o que as duas funcoes usam.
const STUBS = {
  "@/lib/auth/room-access": `
export function canManageRoom() { return true; }
`,
  "@/lib/character/um-anel/characters": `
export async function resolveTorCharacter(id) {
  return id === "ficha-h1" ? globalThis.__torSheet ?? null : null;
}
export async function patchTorCharacterResources(id, patch, authorId) {
  (globalThis.__torPatches ??= []).push({ id, patch, authorId });
  if (globalThis.__torSaveFail) throw new Error("falha simulada na gravacao da ficha");
}
`,
  "@/lib/bestiary/record": `
export async function recordPlayerBestiaryFromCombat() {}
`,
  // sharp (binario nativo) nao e necessario: o teste nao envia imagem.
  sharp: `
export default function sharp() { throw new Error("sharp nao disponivel no teste"); }
`,
  "../internal/registry": `
export function toSnapshot(room) {
  return { actors: room.actors, scene: room.scene, revision: room.revision ?? 0 };
}
export async function persistRoom(roomId, room) { return room; }
export async function getRoom() { return null; }
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
    // "server-only" so lanca erro fora do Next; no teste nao faz nada.
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
    // package.json de node_modules e lido via require (CJS): nao vira modulo ESM.
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

const { executeRoomTorAttack } = await import(
  pathToFileURL(join(ROOT, "lib", "room", "handlers", "tor-combat-attack.ts")).href
);
const { executeRoomTorHazard } = await import(
  pathToFileURL(join(ROOT, "lib", "room", "handlers", "tor-hazard.ts")).href
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

const AUTOR = { authorId: "u1", authorName: "Mestre", authorRole: "gm" };
const USUARIO = { id: "u1", name: "Mestre", role: "gm" };

function fichaHeroi() {
  return {
    id: "ficha-h1",
    warGear: [],
    combatProficiencies: {},
    attributes: { forca: 3 },
    conditions: { weary: false, miserable: false },
    shadow: {},
    shadowScars: [],
    hope: { value: 0, max: 3 },
    virtues: [],
    rewards: [],
    armour: { armourId: null, helm: false, shieldId: null },
  };
}

function salaAtaque() {
  const atacante = {
    id: "adv1",
    name: "Orc",
    axial: { q: 0, r: 0 },
    vida: 8,
    vidaMax: 8,
    torCombat: {
      kind: "adversary",
      eliminated: false,
      might: 3,
      hate: 1,
      hateKind: "hate",
      protectionDice: 0,
      actions: [{ id: "golpe", label: "Golpe", rating: 3, damage: 3, injury: null, ranged: false }],
    },
  };
  const defensor = {
    id: "h1",
    name: "Heroi",
    axial: { q: 1, r: 0 },
    vida: 10,
    vidaMax: 10,
    torCombat: {
      kind: "hero",
      eliminated: false,
      torCharacterId: "ficha-h1",
      protectionDice: 0,
      hate: 0,
      wounded: false,
    },
  };
  return { id: "r1", rpgSystemId: "um-anel", revision: 0, actors: {}, scene: { tokens: [atacante, defensor] } };
}

function salaHazard() {
  const heroi = {
    id: "h1",
    name: "Heroi",
    axial: { q: 1, r: 0 },
    vida: 10,
    vidaMax: 10,
    torCombat: {
      kind: "hero",
      eliminated: false,
      torCharacterId: "ficha-h1",
      wounded: false,
    },
  };
  return { id: "r1", rpgSystemId: "um-anel", revision: 0, actors: {}, scene: { tokens: [heroi] } };
}

// Os handlers dao console.error no caminho de falha; o teste so quer o retorno.
async function semLogDeErro(fn) {
  const real = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = real;
  }
}

function prepara({ falhaFicha }) {
  globalThis.__torSheet = fichaHeroi();
  globalThis.__torPatches = [];
  globalThis.__torSaveFail = falhaFicha;
}

async function ataque(falhaFicha) {
  prepara({ falhaFicha });
  const realRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const res = await semLogDeErro(() =>
      executeRoomTorAttack("r1", "adv1", "h1", AUTOR, { room: salaAtaque() })
    );
    // So acerto grava a ficha do defensor: sem essa tentativa o caso nao prova nada.
    assert.equal(globalThis.__torPatches.length, 1, "o ataque precisa acertar para tentar gravar a ficha");
    return res;
  } finally {
    Math.random = realRandom;
    globalThis.__torSaveFail = false;
  }
}

async function fontePerigo(falhaFicha) {
  prepara({ falhaFicha });
  const res = await semLogDeErro(() =>
    executeRoomTorHazard(
      "r1",
      "h1",
      { kind: "apply", source: "fogo", level: "moderado" },
      USUARIO,
      AUTOR,
      { room: salaHazard() }
    )
  );
  assert.equal(globalThis.__torPatches.length, 1, "a Fonte de Dano devia tentar gravar a ficha");
  return res;
}

console.log("TOR-SAVE: executeRoomTorAttack e executeRoomTorHazard quando a ficha falha");

await caso("ataque com gravacao da ficha falhando: ok true e sheetSaved false", async () => {
  const res = await ataque(true);
  assert.equal(res.ok, true);
  assert.equal(res.sheetSaved, false);
});

await caso("ataque com gravacao da ficha funcionando: sheetSaved true", async () => {
  const res = await ataque(false);
  assert.equal(res.ok, true);
  assert.equal(res.sheetSaved, true);
});

await caso("Fonte de Dano com gravacao da ficha falhando: ok true e sheetSaved false", async () => {
  const res = await fontePerigo(true);
  assert.equal(res.ok, true);
  assert.equal(res.sheetSaved, false);
});

await caso("Fonte de Dano com gravacao da ficha funcionando: sheetSaved true", async () => {
  const res = await fontePerigo(false);
  assert.equal(res.ok, true);
  assert.equal(res.sheetSaved, true);
});

console.log(`\n${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
