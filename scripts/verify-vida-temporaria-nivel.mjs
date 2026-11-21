/**
 * D-07: a vida temporária (resources.vida.temp) é efeito de combate, não da ficha.
 * Subir de nível não pode apagá-la.
 *
 * Causa: três lugares remontam resources.vida só com max e value e descartam temp:
 *   - lib/character/identity.ts (applyIdentityPatch)
 *   - lib/character/level-up.ts (applyLevelUp)
 *   - lib/room/handlers/gm-actor-progress.ts (applySetLevel, agora exportada)
 *
 * Teste de comportamento: chama as funções reais. Mesmo carregador de
 * verify-vida-temporaria.mjs (resolve "@/..." e extensão omitida, transpila .ts).
 *
 * node scripts/verify-vida-temporaria-nivel.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function arquivoExistente(base) {
  for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    // server-only só barra import no cliente; aqui não há cliente.
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    let base = null;
    if (specifier.startsWith("@/")) {
      base = join(ROOT, specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:") &&
      /\.tsx?$/.test(context.parentURL)
    ) {
      base = resolve(dirname(fileURLToPath(context.parentURL)), specifier);
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

const modulo = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { normalizeCharacter } = await modulo("lib/character/normalize.ts");
const { applyIdentityPatch } = await modulo("lib/character/identity.ts");
const { applyLevelUp } = await modulo("lib/character/level-up.ts");
const { applySetLevel } = await modulo("lib/room/handlers/gm-actor-progress.ts");
const { xpTotalForLevel } = await modulo("lib/character/xp.ts");
const { getClass } = await modulo("lib/character/rules.ts");
const { prepareCharacterForLastLevelReedit } = await modulo(
  "lib/character/rebuild-from-wizard.ts"
);
const { rooms } = await modulo("lib/room/internal/registry.ts");
const { executeGmCombatAction } = await modulo("lib/room/handlers/combat-gm.ts");
const { executeGmActorProgress } = await modulo("lib/room/handlers/gm-actor-progress.ts");

let pass = 0;
let fail = 0;

function caso(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    console.error(`  ✗ ${name} — ${err.message.split("\n")[0]}`);
  }
}

/** Ficha com vida temporária 4; normalizeCharacter completa o resto com padrões. */
function fichaComVidaTemp(nivel) {
  const base = normalizeCharacter({
    id: "p1",
    name: "Teste",
    attributes: {},
    inventory: [],
    resources: {
      vida: { value: 10, max: 12, temp: 4 },
      pontosAcao: { value: 5, max: 5 },
    },
  });
  // Nível 2 exige subclasse; a ficha de teste já tem uma, para o level-up não parar nela.
  const subclasse = getClass(base.identity.classe)?.subclasses?.[0] ?? base.identity.subclasse;
  return {
    ...base,
    identity: {
      ...base.identity,
      nivel,
      subclasse,
      xpTotal: xpTotalForLevel(nivel + 1),
    },
    resources: { ...base.resources, vida: { value: 10, max: 12, temp: 4 } },
  };
}

console.log("verify-vida-temporaria-nivel: D-07 — subir de nível mantém a vida temporária");

caso("applyLevelUp mantém temp 4 ao subir de nível", () => {
  const antes = fichaComVidaTemp(1);
  const out = applyLevelUp(antes);
  assert.equal(out.identity.nivel, 2, "o nível deveria ter subido");
  assert.equal(out.resources.vida.temp, 4);
});

caso("applyLevelUp: vida value vem do max novo e temp continua 4", () => {
  const out = applyLevelUp(fichaComVidaTemp(1));
  assert.equal(out.resources.vida.value, out.resources.vida.max, "subir de nível cura a vida");
  assert.equal(out.resources.vida.temp, 4);
});

caso("applyIdentityPatch mantém temp 4", () => {
  const out = applyIdentityPatch(fichaComVidaTemp(1), {});
  assert.equal(out.resources.vida.temp, 4);
  assert.equal(out.resources.vida.value, Math.min(10, out.resources.vida.max));
});

caso("applySetLevel (mestre ajusta nível) mantém temp 4", () => {
  const out = applySetLevel(fichaComVidaTemp(1), 3);
  assert.equal(out.identity.nivel, 3, "o nível deveria ter sido ajustado");
  assert.equal(out.resources.vida.temp, 4);
});

caso("ficha sem vida temporária continua sem vida temporária ao subir", () => {
  const sem = fichaComVidaTemp(1);
  sem.resources.vida = { value: 10, max: 12 };
  const out = applyLevelUp(sem);
  assert.equal(out.identity.nivel, 2);
  assert.equal(out.resources.vida.temp, undefined);
});

caso("refazer o último nível (rebuild-from-wizard) mantém temp 4", () => {
  const out = prepareCharacterForLastLevelReedit(fichaComVidaTemp(2));
  assert.equal(out.identity.nivel, 1, "o último nível deveria ter sido revertido");
  assert.equal(out.resources.vida.temp, 4);
});

/** Sala em memória (registry) com um mestre dono e uma ficha de jogador. */
const SALA = "sala-d07";
const MESTRE = { id: "mestre-d07", role: "user", nickname: "Mestre" };
function salaCom(actor) {
  const sala = {
    roomId: SALA,
    name: "Sala de teste D-07",
    ownerId: MESTRE.id,
    memberIds: [],
    actors: { p1: actor },
    scene: { tokens: [] },
    settings: {},
    chat: [],
    revision: 1,
  };
  rooms().set(SALA, sala);
  return sala;
}

async function casoAsync(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    console.error(`  ✗ ${name} — ${String(err.message).split("\n")[0]}`);
    console.error(String(err.stack).split("\n").slice(1, 3).join("\n"));
  }
}

await casoAsync("level-up-all do mestre mantém temp 4", async () => {
  const sala = salaCom(fichaComVidaTemp(1));
  const res = await executeGmCombatAction(
    SALA,
    { action: "level-up-all" },
    MESTRE,
    { room: sala }
  );
  assert.equal(res.ok, true, res.error);
  assert.equal(sala.actors.p1.identity.nivel, 2, "o nível deveria ter subido");
  assert.equal(sala.actors.p1.resources.vida.temp, 4);
});

await casoAsync("mestre ajusta a vida atual (set-hp) e mantém temp 4", async () => {
  const sala = salaCom(fichaComVidaTemp(1));
  const res = await executeGmActorProgress(
    SALA,
    { action: "set-hp", actorId: "p1", value: 7 },
    MESTRE
  );
  assert.equal(res.ok, true, res.error);
  assert.equal(sala.actors.p1.resources.vida.value, 7);
  assert.equal(sala.actors.p1.resources.vida.temp, 4);
});

rooms().delete(SALA);

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
