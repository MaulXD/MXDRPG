// D-23 (BV-072): o criador de personagem dá os truques do nível 1 pela lista da classe.
// O livro dá N truques (cantripsKnown em data/character/spell-lists.json); só o Mago escolhe
// de verdade hoje (2 entre 4). Bruxo, Bardo e Feiticeiro têm exatamente as opções que ganham.
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let n = 0;
const ok = (m) => console.log(`ok ${++n}: ${m}`);

const achar = (b) => [b, b + ".ts", b + ".tsx"].find((c) => existsSync(c) && statSync(c).isFile());
registerHooks({
  resolve(spec, ctx, next) {
    const pai = ctx.parentURL ?? "";
    let base = null;
    if (spec.startsWith("@/")) base = join(root, spec.slice(2));
    else if (spec.startsWith(".") && pai.startsWith("file:") && /\.tsx?$/.test(pai)) base = resolve(dirname(fileURLToPath(pai)), spec);
    if (base) {
      const f = achar(base);
      if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
    }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (/icones-gerados\.json\?falso$/.test(url)) {
      return { format: "module", source: `export default ${JSON.stringify(manifestoFalso)};`, shortCircuit: true };
    }
    if (/\.json(\?.*)?$/.test(url) && !url.includes("/node_modules/")) {
      return { format: "module", source: `export default ${readFileSync(fileURLToPath(url.split("?")[0]), "utf8")};`, shortCircuit: true };
    }
    if (/\.tsx?(\?.*)?$/.test(url)) {
      const arquivo = fileURLToPath(url.split("?")[0]);
      const out = ts.transpileModule(readFileSync(arquivo, "utf8"), {
        fileName: arquivo,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return next(url, ctx);
  },
});

const kits = await import(pathToFileURL(join(root, "lib", "character", "starter-kits.ts")).href);
const listas = await import(pathToFileURL(join(root, "lib", "character", "spell-lists.ts")).href);
const dados = JSON.parse(readFileSync(join(root, "data", "character", "spell-lists.json"), "utf8"));

const truquesDe = (classe, ids) => {
  const opts = new Set(listas.cantripChoiceForClass(classe)?.options ?? []);
  return ids.filter((id) => opts.has(id));
};

// 1. Quem escolhe e quantos.
for (const [classe, acesso] of Object.entries(dados.classAccess)) {
  const escolha = listas.cantripChoiceForClass(classe);
  if (!acesso.cantripsKnown) {
    assert.equal(escolha, null, `${classe} não escolhe truque`);
    continue;
  }
  assert.ok(escolha, `${classe} deveria escolher truques`);
  assert.equal(escolha.count, Math.min(acesso.cantripsKnown, escolha.options.length), `${classe}: quantidade`);
}
assert.deepEqual(
  { n: listas.cantripChoiceForClass("Mago").count, de: listas.cantripChoiceForClass("Mago").options.length },
  { n: 2, de: 4 }
);
assert.equal(listas.cantripChoiceForClass("Bruxo").count, 2);
assert.equal(listas.cantripChoiceForClass("Guerreiro"), null);
ok("cantripChoiceForClass segue o cantripsKnown (Mago 2 de 4, Bruxo 2, Guerreiro nada)");

// 2. Todo kit de toda classe sai com o número certo de truques e passa na validação.
for (const classe of Object.keys(dados.classAccess).concat(["Guerreiro", "Ladino"])) {
  for (const kit of kits.getStarterOptionsForClass(classe)) {
    const draft = kits.loadoutDraftFromKit(kit);
    const escolha = listas.cantripChoiceForClass(classe);
    if (escolha) assert.equal(truquesDe(classe, draft.spellEntryIds).length, escolha.count, `${kit.id}: truques`);
    assert.equal(kits.validateStarterEquipment(classe, draft), null, `${kit.id} inválido`);
    assert.equal(kits.findMatchingStarterKitId(classe, draft), kit.id, `${kit.id} deveria continuar reconhecido como preset`);
  }
}
ok("todos os kits saem com os truques da classe, válidos e ainda reconhecidos como preset");

// 3. Mago troca um truque: com 1 de 2 a validação pede o segundo; com outro escolhido, passa.
const mago = kits.getDefaultStarterEquipment("Mago");
const [t1, t2] = truquesDe("Mago", mago.spellEntryIds);
const soUm = { ...mago, spellEntryIds: mago.spellEntryIds.filter((id) => id !== t2) };
assert.equal(kits.validateStarterEquipment("Mago", soUm), "Escolha 2 truques");
const outro = listas.cantripChoiceForClass("Mago").options.find((id) => id !== t1 && id !== t2);
const trocado = { ...soUm, spellEntryIds: [...soUm.spellEntryIds, outro] };
assert.equal(kits.validateStarterEquipment("Mago", trocado), null);
const tres = { ...mago, spellEntryIds: [...mago.spellEntryIds, outro] };
assert.equal(kits.validateStarterEquipment("Mago", tres), "Escolha 2 truques");
ok("Mago com 1 ou 3 truques não passa; trocando um por outro passa");

// 4. A escolha do jogador chega à ficha (sanitize não desfaz a troca) e entra no inventário.
const limpo = kits.sanitizeStarterEquipmentForClass("Mago", trocado);
assert.deepEqual(truquesDe("Mago", limpo.spellEntryIds).sort(), [t1, outro].sort());
const inv = kits.buildStarterInventory({ classe: "Mago", raca: "Humano", antecedente: "", starterKitId: "", equipment: limpo });
for (const id of [t1, outro]) assert.ok(inv.inventory.some((i) => i.entryId === id), `${id} fora do inventário`);
ok("a troca do Mago sobrevive ao sanitize e os dois truques vão para o inventário");

// 5. Sanitize completa o que falta (rascunho antigo sem truque) e corta o excesso.
const vazio = { ...mago, spellEntryIds: mago.spellEntryIds.filter((id) => !truquesDe("Mago", [id]).length) };
assert.equal(truquesDe("Mago", kits.sanitizeStarterEquipmentForClass("Mago", vazio).spellEntryIds).length, 2);
assert.equal(truquesDe("Mago", kits.sanitizeStarterEquipmentForClass("Mago", tres).spellEntryIds).length, 2);
ok("rascunho antigo sem truques ganha os da classe; excesso é cortado");

// 6. A tela mostra o bloco de truques separado das magias.
const tela = readFileSync(join(root, "components", "character", "wizard", "WizardEquipmentStep.tsx"), "utf8");
assert.match(tela, /cantripChoiceForClass\(classe\)/);
assert.match(tela, /Truques: escolha \$\{cantripChoice\.count\}/);
assert.match(tela, /grimoireSpellIds\.map/);
ok("passo de equipamento tem o bloco 'Truques: escolha N' separado do grimório");

console.log(`verify-truques-wizard: ${n} ok`);
