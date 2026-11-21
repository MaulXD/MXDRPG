/**
 * BV-041, BV-042, BV-043: tela de Revisão do wizard Eldarin.
 *
 * BV-042: "Lâmina de Espírito" aparecia duas vezes em EQUIPAMENTO do Mago. A magia
 *   de combate entra como combatLoadout e também em spellEntryIds (sync); a
 *   origem (refsFromEquipmentDraft) somava as duas, e a exibição repetia o nome.
 * BV-041: a Revisão listava os 4-5 Caminhos de Assimilação do nível 2 como se
 *   fossem opções. O livro (Cap. 4) diz que a escolha é no nível 2, não na criação.
 * BV-043: a Revisão não mostrava magias nem truques escolhidos.
 *
 * Checagem por texto do código-fonte, no mesmo estilo dos demais verify-*.mjs.
 */
import { readFileSync as rawReadFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

let pass = 0;
let fail = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

console.log("verify-bv041-043-revisao-wizard: revisão do wizard (Mago e Ladino)");

const starterSrc = readFileSync(root("lib", "character", "starter-kits.ts"), "utf8");
const starterCode = stripComments(starterSrc);
const previewCode = stripComments(readFileSync(root("lib", "character", "wizard-preview.ts"), "utf8"));
const spellListsCode = stripComments(readFileSync(root("lib", "character", "spell-lists.ts"), "utf8"));
const wizardCode = stripComments(
  readFileSync(root("components", "character", "wizard", "CharacterCreationWizard.tsx"), "utf8")
);

// BV-042: origem não soma a magia de combate duas vezes.
const refsFn = starterCode.slice(
  starterCode.indexOf("function refsFromEquipmentDraft"),
  starterCode.indexOf("export function buildStarterInventory")
);
ok(
  "BV-042 origem: refs de magia pulam a magia já usada como combatLoadout",
  /combat\?\.packId === "magias"\s*&&\s*combat\.entryId === entryId\)\s*continue/.test(refsFn),
  "refsFromEquipmentDraft sem o pulo"
);

const describeFn = starterCode.slice(
  starterCode.indexOf("export function describeStarterEquipment"),
  starterCode.indexOf("export function describeStarterKit")
);
ok(
  "BV-042 exibição: EQUIPAMENTO não repete a magia de combate",
  /equipment\.combatLoadout\?\.packId === "magias"\s*&&\s*equipment\.combatLoadout\.entryId === spellId\)\s*continue/.test(
    describeFn
  ),
  "describeStarterEquipment sem o pulo"
);

// BV-041: Revisão não lista os caminhos como opções.
ok(
  "BV-041 resumo: nível 2 aparece como 'Escolhido no nível 2'",
  previewCode.includes('"Escolhido no nível 2"'),
  "wizard-preview.ts sem o texto"
);
ok(
  "BV-041 resumo: não junta os nomes dos caminhos na linha de subclasse",
  !/tracks\.map\(\(t\) => t\.subclass\)\.join/.test(previewCode),
  "wizard-preview.ts ainda lista os caminhos"
);
ok(
  "BV-041 Revisão: sem o cartão 'Caminhos (nv 2)' com lista de opções",
  !wizardCode.includes("Caminhos (nv 2)"),
  "CharacterCreationWizard.tsx ainda tem o cartão"
);

// BV-043: Revisão mostra truques e magias.
ok(
  "BV-043 helper: cantripIdsForClass exportado em spell-lists",
  /export function cantripIdsForClass\(/.test(spellListsCode),
  "spell-lists.ts sem cantripIdsForClass"
);
ok(
  "BV-043 Revisão: cartão 'Magias e truques' existe",
  wizardCode.includes("<dt>Magias e truques</dt>"),
  "CharacterCreationWizard.tsx sem o cartão"
);
ok(
  "BV-043 Revisão: separa Truques e Magias usando cantripIdsForClass",
  /cantripIdsForClass\(draft\.classe\)/.test(wizardCode) && wizardCode.includes("Truques:") && wizardCode.includes("Magias:"),
  "faltam os rótulos ou o filtro de truques"
);

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
