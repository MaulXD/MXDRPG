/**
 * BV-029 e BV-044.
 *
 * BV-029: o Guerreiro recebia Bola de Fogo pelo "+ Compendio" da aba Magias da
 *   ficha. O livro (17.1, LIVRO-DO-JOGADOR.md:3482) diz que as classes conjuradoras
 *   são as classes da tabela 17.7 (LIVRO-DO-JOGADOR.md:3538-3550, Bruxo e Paladino
 *   incluídos); o Guerreiro não tem lista de magias (data/character/spell-lists.json,
 *   classAccess). Teste: a ficha recusa magia para classe sem classAccess, antes de
 *   qualquer ramo (solicitação ou add).
 * BV-044: a Revisão do Paladino listava "Curar Ferimentos" e "Raio do Limiar" na
 *   linha EQUIPAMENTO. A Revisão do wizard passa { omitSpells: true } e lista as
 *   magias no cartão "Magias e truques". Os demais chamadores (prévia, Resumo) não
 *   mudam. Teste: a opção existe, é usada só na Revisão e a linha não some sem ela.
 *
 * Checagem por leitura do código e dos dados, no mesmo estilo dos demais verify-*.mjs.
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

const sheetCode = readFileSync(root("components/character/CharacterSheet.tsx"), "utf8");
const kitsCode = readFileSync(root("lib/character/starter-kits.ts"), "utf8");
const spellListsData = JSON.parse(readFileSync(root("data/character/spell-lists.json"), "utf8"));

// BV-029: dados. Só classes com classAccess têm lista de magias.
const casters = Object.keys(spellListsData.classAccess).sort();
ok(
  "BV-029 dados: Guerreiro não tem classAccess (sem lista de magias)",
  !("Guerreiro" in spellListsData.classAccess),
  "Guerreiro aparece em classAccess"
);
const expectedCasters = ["Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Mago", "Paladino"];
ok(
  "BV-029 dados: classAccess tem as conjuradoras do livro (tabela 17.7) e o Paladino",
  JSON.stringify(casters) === JSON.stringify(expectedCasters),
  `encontrado: ${casters.join(", ")}`
);

// BV-029: ficha importa o helper e recusa magia para não conjurador antes dos ramos.
ok(
  "BV-029 ficha: importa compendiumEntryAllowedForClass de spell-prep",
  /import \{ compendiumEntryAllowedForClass \} from "@\/lib\/character\/spell-prep";/.test(sheetCode),
  "CharacterSheet.tsx sem o import"
);

const fnStart = sheetCode.indexOf("async function addFromCompendium(");
const fnBody = fnStart >= 0 ? sheetCode.slice(fnStart, fnStart + 1400) : "";
const guardIdx = fnBody.indexOf("!compendiumEntryAllowedForClass(identity.classe, entry.packId)");
const branchIdx = fnBody.indexOf("if (canRequestInventory)");
ok(
  "BV-029 ficha: addFromCompendium recusa magia quando a classe não é conjuradora",
  guardIdx >= 0 && branchIdx > guardIdx,
  "guarda ausente ou depois do ramo de solicitação"
);
ok(
  "BV-029 ficha: a recusa avisa a pessoa na mensagem do inventário",
  /setInventoryMsg\(`\$\{identity\.classe\} não tem lista de magias/.test(fnBody),
  "sem mensagem de recusa"
);

// BV-044: a linha EQUIPAMENTO não resolve magias.
const describeFn = kitsCode.slice(
  kitsCode.indexOf("export function describeStarterEquipment"),
  kitsCode.indexOf("export function describeStarterKit")
);
ok(
  "BV-044 EQUIPAMENTO: describeStarterEquipment aceita { omitSpells }",
  /opts\?: \{ omitSpells\?: boolean \}/.test(describeFn),
  "opção omitSpells ausente"
);
ok(
  "BV-044 EQUIPAMENTO: magias do kit só saem quando omitSpells é true",
  /if \(!opts\?\.omitSpells\) \{[\s\S]*getEntry\("magias", spellId\)/.test(describeFn),
  "laço de magias sem a guarda omitSpells"
);
ok(
  "BV-044 EQUIPAMENTO: combatLoadout continua na linha (magia de combate não se perde)",
  describeFn.includes("equipment.combatLoadout") && describeFn.includes("parts.push(entry?.name ?? \"Combate\")"),
  "combatLoadout removido"
);

// BV-044: só a Revisão do wizard pede omitSpells; prévia e Resumo mantêm as magias.
const wizardCode = readFileSync(root("components/character/wizard/CharacterCreationWizard.tsx"), "utf8");
const revisaoCalls = wizardCode.match(/describeStarterEquipment\(draft\.starterEquipment, \{ omitSpells: true \}\)/g) ?? [];
ok(
  "BV-044 Revisão: CharacterCreationWizard passa omitSpells na Revisão",
  revisaoCalls.length === 1,
  `chamadas com omitSpells: ${revisaoCalls.length}`
);
const previewCode = readFileSync(root("lib/character/wizard-preview.ts"), "utf8");
const equipStepCode = readFileSync(root("components/character/wizard/WizardEquipmentStep.tsx"), "utf8");
ok(
  "BV-044 prévia e Resumo: wizard-preview.ts e WizardEquipmentStep.tsx não pedem omitSpells",
  !/omitSpells/.test(previewCode) && !/omitSpells/.test(equipStepCode),
  "chamador indevido de omitSpells"
);
ok(
  "BV-044 Revisão: cartão 'Magias e truques' continua existindo",
  wizardCode.includes("<dt>Magias e truques</dt>"),
  "cartão sumiu; magias ficariam fora da Revisão"
);

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
