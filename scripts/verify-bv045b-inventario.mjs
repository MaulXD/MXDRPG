/**
 * BV-045b: o dono (nao mestre, nao admin) de ficha de aventura nao adiciona item
 * ao inventario sem pedido aprovado do mestre. Remover, diminuir quantidade
 * (consumivel) e aplicar pedido aprovado continuam livres.
 *
 * Causa: a regra requiresInventoryGmApproval (lib/auth/room-access.ts) so era
 * aplicada na interface da mesa. A pagina /personagem/[id], PATCH
 * /api/characters/[id] e PATCH /api/room/[roomId]/actors/[actorId] aceitavam
 * inventario do dono direto.
 *
 * Correcao: lib/character/inventory-add-guard.ts decide se o inventario novo
 * adiciona algo (inventoryPatchAddsItems); ownerInventoryAdditionBlocked junta
 * essa decisao com a regra do mestre; as duas rotas respondem 403 e a pagina
 * /personagem usa o modo "request".
 *
 * Teste de comportamento: importa a funcao real (transpilada pelo hook de modulo).
 * Teste de ligacao: confere que rotas e pagina chamam a regra.
 *
 * node scripts/verify-bv045b-inventario.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readRepo = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

function arquivoExistente(base) {
  for (const c of [base, base + ".ts", base + ".tsx", base + ".json", join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    // "server-only" so lanca erro fora do Next; aqui nao faz nada.
    if (specifier === "server-only") {
      return { url: "data:text/javascript,", shortCircuit: true };
    }
    const parent = context.parentURL ?? "";
    let base = null;
    if (specifier.startsWith("@/")) {
      base = join(ROOT, specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      parent.startsWith("file:")
    ) {
      base = join(dirname(fileURLToPath(parent)), specifier);
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
        },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { inventoryPatchAddsItems } = await import(
  pathToFileURL(join(ROOT, "lib", "character", "inventory-add-guard.ts")).href
);
const { ownerInventoryAdditionBlocked } = await import(
  pathToFileURL(join(ROOT, "lib", "auth", "room-access.ts")).href
);

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

const item = (instanceId, quantity = 1, entryId = "espada-curta", packId = "armas") => ({
  instanceId,
  packId,
  entryId,
  quantity,
});

const atual = [item("i1", 3), item("i2", 1, "pocao", "consumiveis")];

console.log("BV-045b: decisao de adicionar item (inventoryPatchAddsItems)");

caso("entrada nova no inventario conta como adicionar", () => {
  assert.equal(inventoryPatchAddsItems(atual, [...atual, item("i9", 1, "machado")]), true);
});

caso("segunda instancia da mesma entrada conta como adicionar", () => {
  assert.equal(inventoryPatchAddsItems(atual, [...atual, item("i9", 1)]), true);
});

caso("aumentar quantidade de item existente conta como adicionar", () => {
  const next = [{ ...atual[0], quantity: 4 }, atual[1]];
  assert.equal(inventoryPatchAddsItems(atual, next), true);
});

caso("trocar um item para outra entrada conta como adicionar", () => {
  const next = [{ ...atual[0], entryId: "machado" }, atual[1]];
  assert.equal(inventoryPatchAddsItems(atual, next), true);
});

caso("juntar duas instancias numa so mantendo o total nao conta como adicionar", () => {
  const dup = [item("a1", 1, "pocao", "consumiveis"), item("a2", 1, "pocao", "consumiveis")];
  const next = [item("b1", 2, "pocao", "consumiveis")];
  assert.equal(inventoryPatchAddsItems(dup, next), false);
});

caso("remover item nao conta como adicionar", () => {
  assert.equal(inventoryPatchAddsItems(atual, [atual[0]]), false);
});

caso("remover todos os itens nao conta como adicionar", () => {
  assert.equal(inventoryPatchAddsItems(atual, []), false);
});

caso("diminuir quantidade (uso de consumivel) nao conta como adicionar", () => {
  const next = [{ ...atual[0], quantity: 2 }, atual[1]];
  assert.equal(inventoryPatchAddsItems(atual, next), false);
});

caso("inventario igual nao conta como adicionar", () => {
  assert.equal(inventoryPatchAddsItems(atual, atual.map((i) => ({ ...i }))), false);
});

caso("remover um item e diminuir outro nao conta como adicionar", () => {
  const next = [{ ...atual[0], quantity: 1 }];
  assert.equal(inventoryPatchAddsItems(atual, next), false);
});

caso("inventario vazio antes e vazio depois nao conta como adicionar", () => {
  assert.equal(inventoryPatchAddsItems([], []), false);
});

caso("item novo numa ficha vazia conta como adicionar", () => {
  assert.equal(inventoryPatchAddsItems([], [item("n1")]), true);
});

console.log("BV-045b: ownerInventoryAdditionBlocked por papel");

const sala = { roomId: "adv1", adventureId: "adv1", ownerId: "gm", memberIds: ["gm", "dono", "outro"] };
const ficha = { id: "pc1", ownerId: "dono", adventureId: "adv1", campaignRoomId: undefined };
const dono = { id: "dono", role: "member" };
const mestre = { id: "gm", role: "member" };
const admin = { id: "adm", role: "admin" };
const comItem = [item("i1", 3)];

caso("dono adiciona item novo: bloqueado", () => {
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, [], [item("n1")]), true);
});

caso("dono aumenta quantidade: bloqueado", () => {
  assert.equal(
    ownerInventoryAdditionBlocked(sala, ficha, dono, comItem, [item("i1", 4)]),
    true
  );
});

caso("dono remove item: livre", () => {
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, comItem, []), false);
});

caso("dono diminui quantidade (consumivel): livre", () => {
  assert.equal(
    ownerInventoryAdditionBlocked(sala, ficha, dono, comItem, [item("i1", 2)]),
    false
  );
});

caso("mestre adiciona item: livre", () => {
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, mestre, [], [item("n1")]), false);
});

caso("admin adiciona item: livre", () => {
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, admin, [], [item("n1")]), false);
});

caso("patch sem inventario (undefined): livre", () => {
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, comItem, undefined), false);
});

const { ensureLoadoutItemsInInventory } = await import(
  pathToFileURL(join(ROOT, "lib", "character", "inventory-loadout-sync.ts")).href
);

caso("loadout de arma fora do inventario: dono bloqueado (checagem sobre o inventario normalizado)", () => {
  const antes = [];
  const depois = ensureLoadoutItemsInInventory({
    inventory: antes,
    combatLoadout: { packId: "armas", entryId: "armas-arc-l01" },
  }).inventory;
  assert.equal(depois.length, 1, "normalizacao deveria criar o item do loadout");
  assert.equal(inventoryPatchAddsItems(antes, depois), true);
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, antes, depois), true);
});

caso("loadout de arma que ja esta no inventario: dono livre", () => {
  const antes = [{ instanceId: "a1", packId: "armas", entryId: "armas-arc-l01", quantity: 1 }];
  const depois = ensureLoadoutItemsInInventory({
    inventory: antes,
    combatLoadout: { packId: "armas", entryId: "armas-arc-l01" },
  }).inventory;
  assert.equal(depois.length, 1);
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, antes, depois), false);
});

caso("ficha legada com loadout sem item no inventario: patch de nome pelo dono passa", () => {
  const legado = { inventory: [], combatLoadout: { packId: "armas", entryId: "armas-arc-l01" } };
  // Cada normalizacao cria instanceId novo; a comparacao tem que ignorar isso.
  const atualNormalizado = ensureLoadoutItemsInInventory(legado).inventory;
  const proximoNormalizado = ensureLoadoutItemsInInventory({ ...legado, name: "Novo nome" }).inventory;
  assert.equal(atualNormalizado.length, 1);
  assert.notEqual(atualNormalizado[0].instanceId, proximoNormalizado[0].instanceId);
  assert.equal(inventoryPatchAddsItems(atualNormalizado, proximoNormalizado), false);
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, atualNormalizado, proximoNormalizado), false);
});

const { syncClassAbilitiesToInventory } = await import(
  pathToFileURL(join(ROOT, "lib", "character", "class-vtt.ts")).href
);

const { classResourceKeysFor } = await import(
  pathToFileURL(join(ROOT, "lib", "character", "class-resource-keys.ts")).href
);

const fichaPaladino = {
  identity: { classe: "Paladino", nivel: 1, subclasse: undefined },
  inventory: [],
};

caso("troca de classe pelo dono: habilidades sincronizadas pela classe passam", () => {
  const antes = [];
  const depois = syncClassAbilitiesToInventory(fichaPaladino).inventory;
  assert.ok(depois.length > 0, "classe sem habilidades no teste; trocar a classe do caso");
  const chaves = classResourceKeysFor(fichaPaladino);
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, antes, depois, chaves), false);
});

caso("dono adiciona habilidade que a classe nao sincronizou: bloqueado", () => {
  const antes = [];
  const depois = [{ instanceId: "h1", packId: "habilidades", entryId: "habilidade-escolhida-x", quantity: 1 }];
  const chaves = classResourceKeysFor(fichaPaladino);
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, antes, depois, chaves), true);
});

caso("dono adiciona arma com a lista de recursos de classe: continua bloqueado", () => {
  const chaves = classResourceKeysFor(fichaPaladino);
  assert.equal(ownerInventoryAdditionBlocked(sala, ficha, dono, [], [item("n1")], chaves), true);
});

console.log("BV-045b: ligacao com a regra do mestre e as rotas");

const MSG = "Peça o item ao mestre da aventura.";
const editSave = readRepo("app/api/characters/[id]/edit-save/route.ts");
const sheet = readRepo("components/character/CharacterSheet.tsx");

caso("edit-save: checa a adicao antes de salvar o ultimo nivel e responde 403", () => {
  const i = editSave.indexOf("finalizeLastLevelReedit(prepared");
  const j = editSave.indexOf("ownerInventoryAdditionBlocked(", i);
  const k = editSave.indexOf("saveCharacter(finalized)", i);
  assert.ok(i >= 0 && j > i && k > j, "ordem: finalize, checagem, save");
  assert.ok(editSave.includes(MSG), "mensagem ausente no edit-save");
  assert.match(editSave.slice(editSave.indexOf(MSG), editSave.indexOf(MSG) + 200), /status: 403/);
});

caso("rotas e edit-save passam as chaves de recurso de classe da ficha resultante", () => {
  assert.match(readRepo("app/api/characters/[id]/route.ts"), /classResourceKeysFor\(merged\)/);
  assert.match(readRepo("app/api/room/[roomId]/actors/[actorId]/route.ts"), /classResourceKeysFor\(withIdentity\)/);
  assert.match(editSave, /classResourceKeysFor\(finalized\)/);
});

caso("CharacterSheet: remover (Delete e botao) usa canRemoveInventory, livre no modo request", () => {
  assert.match(sheet, /const canRemoveInventory = inventoryEditMode !== "readonly";/);
  assert.match(sheet, /if \(!canRemoveInventory \|\| tab === "tesouro"/);
  assert.match(sheet, /canEdit=\{canRemoveInventory\}/);
  assert.doesNotMatch(sheet, /canEditInventory/);
});

caso("CharacterSheet: adicionar continua so em direct ou request (pedido)", () => {
  assert.match(sheet, /const canPickCompendium = inventoryEditMode === "direct" \|\| canRequestInventory;/);
});

const roomAccess = readRepo("lib/auth/room-access.ts");
const charRoute = readRepo("app/api/characters/[id]/route.ts");
const actorRoute = readRepo("app/api/room/[roomId]/actors/[actorId]/route.ts");
const page = readRepo("app/personagem/[id]/page.tsx");

caso("ownerInventoryAdditionBlocked usa requiresInventoryGmApproval e inventoryPatchAddsItems", () => {
  const start = roomAccess.indexOf("export function ownerInventoryAdditionBlocked(");
  assert.ok(start >= 0, "funcao ausente");
  const body = roomAccess.slice(start, start + 700);
  assert.match(body, /requiresInventoryGmApproval\(room, actor, user\)/);
  assert.match(body, /inventoryPatchAddsItems\(currentInventory, nextInventory, classResourceKeys\)/);
});

caso("rota /api/characters/[id] checa so quando o patch traz inventario e responde 403", () => {
  assert.match(charRoute, /ownerInventoryAdditionBlocked\(\s*approvalRoom,\s*existing,\s*session\.user,\s*normalizeCharacter\(existing\)\.inventory,\s*merged\.inventory/);
  assert.doesNotMatch(charRoute, /if \(\s*safe\.inventory !== undefined/, "guarda condicionada a chaves do patch");
  assert.match(charRoute, /ownerInventoryAdditionBlocked\(/);
  assert.ok(charRoute.includes(MSG), "mensagem ausente na rota de ficha");
  const i = charRoute.indexOf(MSG);
  assert.match(charRoute.slice(i, i + 200), /status: 403/);
  assert.ok(charRoute.indexOf("ownerInventoryAdditionBlocked(") < charRoute.indexOf("saveCharacter(merged)"),
    "checagem depois do salvamento");
});

caso("rota de ator da mesa checa so quando o patch traz inventario e responde 403", () => {
  assert.match(actorRoute, /mergeIdentityPatch\(/, "identityPatch nao entra na ficha resultante");
  assert.match(actorRoute, /normalizeCharacter\(withIdentity\)\.inventory/);
  assert.doesNotMatch(actorRoute, /if \(\s*"inventory" in body/, "guarda condicionada a chaves do patch");
  assert.match(actorRoute, /ownerInventoryAdditionBlocked\(/);
  assert.ok(actorRoute.includes(MSG), "mensagem ausente na rota de ator");
  const i = actorRoute.indexOf(MSG);
  assert.match(actorRoute.slice(i, i + 200), /status: 403/);
  assert.ok(actorRoute.indexOf("ownerInventoryAdditionBlocked(") < actorRoute.indexOf("updateRoomActor(roomId, actorId, body"),
    "checagem depois do salvamento");
});

caso("pagina /personagem usa o modo de pedido para o dono sem mestre/admin", () => {
  assert.match(page, /requiresInventoryGmApproval\(approvalRoom, character, session\.user\)/);
  assert.match(page, /inventoryNeedsApproval \? "request"/);
  assert.match(page, /inventoryEditMode=\{inventoryEditMode\}/);
});

caso("aplicacao de pedido aprovado nao passa pelas rotas (usa updateRoomActor direto)", () => {
  const store = readRepo("lib/character/inventory-item-request-store.ts");
  assert.match(store, /await updateRoomActor\(request\.roomId/);
  assert.doesNotMatch(store, /ownerInventoryAdditionBlocked/);
});

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
