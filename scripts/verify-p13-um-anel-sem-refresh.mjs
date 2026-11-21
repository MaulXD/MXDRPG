/**
 * P-13 (desempenho): as acoes do Um Anel e da ficha que gravam na sala param de
 * descartar o retorno do POST/PATCH e de refazer o GET da sala inteira.
 *
 * Quem devolve a sala: POST /api/room/[id]/chat (snapshot direto) e
 * PATCH /api/room/[id]/tor-session (snapshot dentro de { snapshot }, desembrulhado
 * por patchTorSession). Esses retornos agora sobem pela mesma cadeia de onUpdate:
 *
 *   TorCouncilPanel / TorFellowshipPanel / TorJourneyPanel -> onUpdate(snapshot)
 *     -> MesaFoundryDockRail / MesaFoundryFloatingWindows -> onRefresh(payload)
 *     -> MesaWorkspace.refreshOrApply -> applyRoomResponse (Mesa)
 *   SheetDdbSkillsPanel -> onRoll(snapshot) -> SheetFichaOverview / SheetPopupDdbView
 *     -> CharacterSheet.liveApplyOrRefresh -> liveApplySnapshot (ficha)
 *   postSheetSkillRoll -> onRolled(snapshot) -> useSheetPdfDeepLink -> MesaWorkspace /
 *     CharacterSheet (mesmos wrappers acima)
 *
 * Sem payload, cada wrapper cai no refresh antigo. Um evento de clique nunca tem
 * `revision` numerico, entao nao pode ser aplicado como sala por engano.
 *
 * Fora do escopo, de proposito: postRoomTorFatigue. A rota tor-fatigue devolve
 * { snapshot } e o cliente a tipa como RoomApiPayload; aplicar aquilo direto
 * gravaria o envelope como sala. Fica para corrigir o tipo antes.
 *
 * Teste: leitura de codigo nos pontos acima (React nao roda em node).
 *
 * node scripts/verify-p13-um-anel-sem-refresh.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

// 1. Paineis do Um Anel: o retorno do PATCH/POST vai para onUpdate.
const council = ler("components/vtt/TorCouncilPanel.tsx");
assert.match(council, /onUpdate: \(payload\?: RoomApiPayload\) => void/, "Conselho: onUpdate aceita payload");
assert.match(council, /const snapshot = await patchTorSession\(roomId, \{ council: next \}\);\s*onUpdate\(snapshot\);/, "Conselho: commit aplica o snapshot do patch");
assert.match(council, /const snapshot = await patchTorSession\(roomId, \{ council: null \}\);\s*onUpdate\(snapshot\);/, "Conselho: encerrar aplica o snapshot");
ok("Conselho aplica o snapshot do PATCH (commit e encerrar)");

const fellowship = ler("components/vtt/TorFellowshipPanel.tsx");
assert.match(fellowship, /onUpdate: \(payload\?: RoomApiPayload\) => void/, "Companhia: onUpdate aceita payload");
const patchesCompanhia = fellowship.match(/const snapshot = await patchTorSession\(roomId, \{/g) ?? [];
assert.equal(patchesCompanhia.length, 4, "Companhia: 4 gravacoes aplicam o snapshot (save, TN, avancar, commit)");
assert.equal(
  (fellowship.match(/onUpdate\(snapshot\);/g) ?? []).length,
  4,
  "Companhia: as 4 gravacoes chamam onUpdate(snapshot)"
);
ok("Companhia aplica o snapshot em todas as 4 gravacoes");

const journey = ler("components/vtt/TorJourneyPanel.tsx");
assert.match(journey, /onUpdate: \(payload\?: RoomApiPayload\) => void/, "Jornada: onUpdate aceita payload");
assert.match(journey, /const snapshot = await patchTorSession\(roomId, \{ journey: next \}\);\s*onUpdate\(snapshot\);/, "Jornada: commit aplica o snapshot");
assert.match(journey, /const snapshot = await patchTorSession\(roomId, \{ journey: null \}\);\s*onUpdate\(snapshot\);/, "Jornada: encerrar aplica o snapshot");
assert.match(journey, /const snapshot = await patchTorSession\(roomId, \{\s*journey: \{ \.\.\.progress, pending: \{ \.\.\.progress\.pending, terrain \} \},\s*\}\);\s*onUpdate\(snapshot\);/, "Jornada: terreno aplica o snapshot");
ok("Jornada aplica o snapshot do PATCH (commit, terreno, encerrar)");

// A fadiga fica como estava: a rota devolve { snapshot } e o cliente tipa como sala.
assert.match(journey, /await postRoomTorFatigue\(roomId, \{[\s\S]*?\}\);\s*onUpdate\(\);/, "Fadiga continua com refresh (fora do escopo)");
ok("Fadiga da jornada segue com refresh, como antes");

// Pedido da Lupa: nenhum onUpdate() sem argumento nem refresh() depois de PATCH.
// Conselho e Companhia: zero. Jornada: só as 2 chamadas da fadiga.
const semArg = (src) => (src.match(/onUpdate\(\)/g) ?? []).length;
assert.equal(semArg(council), 0, "Conselho: onUpdate() sem payload voltou");
assert.equal(semArg(fellowship), 0, "Companhia: onUpdate() sem payload voltou");
assert.equal(semArg(journey), 2, "Jornada: onUpdate() sem payload só pode existir nas 2 chamadas da fadiga");
for (const [nome, src] of [["Conselho", council], ["Companhia", fellowship], ["Jornada", journey]]) {
  assert.doesNotMatch(src, /\brefresh\(\)/, `${nome}: refresh() depois de gravar`);
}
ok("Sem onUpdate() vazio nem refresh() depois dos PATCH do Um Anel");

// 2. Ficha: chat de perícia devolve a sala e sobe por onRoll.
const ddbSkills = ler("components/character/SheetDdbSkillsPanel.tsx");
assert.match(ddbSkills, /const snapshot = await postRoomChat\(roomId, \{/, "Ficha: rolagem guarda o retorno do chat");
assert.match(ddbSkills, /onRoll\?\.\(snapshot\);/, "Ficha: rolagem sobe o snapshot por onRoll");
ok("Perícias da ficha sobem o snapshot do chat");

const pdfLink = ler("lib/character/sheet-pdf-deep-link.ts");
assert.match(pdfLink, /\): Promise<RoomSnapshot \| null> \{/, "Deep link: postSheetSkillRoll devolve o snapshot");
assert.match(pdfLink, /return postRoomChat\(roomId, \{/, "Deep link: devolve o retorno do chat");
assert.match(pdfLink, /const snapshot = await postSheetSkillRoll\(ctx\.roomId, actor, params\.skill\);\s*opts\.onRolled\?\.\(snapshot \?\? undefined\);/, "Deep link: onRolled recebe o snapshot");
ok("Deep link da ficha repassa o snapshot da rolagem");

// 3. Cadeia da Mesa e da ficha: wrappers que aplicam so com revisao numerica.
const mesa = ler("components/vtt/MesaWorkspace.tsx");
assert.match(mesa, /const refreshOrApply = useCallback\(/, "Mesa: existe refreshOrApply");
assert.match(mesa, /if \(typeof payload\?\.revision === "number"\) \{\s*applyRoomResponse\(payload\);\s*return;\s*\}\s*await refresh\(\);/, "Mesa: aplica payload com revision e cai no refresh sem ele");
assert.match(mesa, /onRolled: refreshOrApply,/, "Mesa: onRolled usa refreshOrApply");
assert.equal((mesa.match(/onRefresh=\{refreshOrApply\}/g) ?? []).length, 2, "Mesa: as duas docas recebem refreshOrApply");
ok("MesaWorkspace aplica a resposta por applyRoomResponse e cai no refresh sem payload");

for (const rel of [
  "components/vtt/mesa/MesaFoundryDockRail.tsx",
  "components/vtt/mesa/MesaFoundryFloatingWindows.tsx",
]) {
  const src = ler(rel);
  assert.match(src, /onRefresh: \(payload\?: RoomApiPayload\) => Promise<void>;/, `${rel}: onRefresh aceita payload`);
  assert.equal(
    (src.match(/onUpdate=\{\(payload\) => void onRefresh\(payload\)\}/g) ?? []).length,
    3,
    `${rel}: os 3 paineis Tor repassam o payload`
  );
}
ok("Docas da Mesa repassam o payload dos paineis Tor");

const ficha = ler("components/character/CharacterSheet.tsx");
assert.match(ficha, /const liveApplyOrRefresh = useCallback\(/, "Ficha: existe liveApplyOrRefresh");
assert.match(ficha, /if \(typeof payload\?\.revision === "number"\) \{\s*liveApplySnapshot\(payload, \{ immediate: true \}\);/, "Ficha: aplica snapshot com revision");
assert.match(ficha, /onRolled: liveApplyOrRefresh,/, "Ficha: onRolled usa o wrapper");
assert.match(ficha, /onRoll=\{liveApplyOrRefresh\}/, "Ficha: onRoll usa o wrapper");
ok("CharacterSheet aplica o snapshot da rolagem e cai no refresh sem payload");

console.log(`\nP-13: ${passos} verificacoes ok`);
