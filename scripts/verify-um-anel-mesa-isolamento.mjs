/**
 * BV-036 e BV-038: a mesa do Um Anel mostrava ferramentas e regras do Eldarin no menu do mestre.
 *
 * Causa: GmToolsPanel nao recebia o sistema da mesa. Na aba Jogadores, GmSavingThrowPanel e
 * GmActorProgressPanel leem room.actors (fichas do Eldarin), por isso diziam "Nenhum personagem
 * de jogador na sala". Na aba Sala, RoomSettingsPanel mostrava PA, auto-passe e XP por monstro.
 * Criaturas (PA maximo dos monstros do Eldarin) e Combate (historico de PA) tambem sao do Eldarin.
 *
 * Decisao: isolamento de sistema. No Um Anel so a aba Sala fica; dentro dela, some a secao Combate
 * (PA, auto-passe e XP). No Eldarin nada muda.
 *
 * Este script le o codigo-fonte e falha se o isolamento sumir.
 * Uso: node scripts/verify-um-anel-mesa-isolamento.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n");

let failed = false;
function check(ok, msg) {
  if (!ok) {
    console.error(`FALHA (BV-036/BV-038): ${msg}`);
    failed = true;
  }
}

const gm = read("components/vtt/GmToolsPanel.tsx");
const room = read("components/vtt/RoomSettingsPanel.tsx");
const battle = read("components/vtt/Battlefield.tsx");

// 1) GmToolsPanel recebe o sistema e esconde as abas do Eldarin no Um Anel.
check(/rpgSystemId\?: RpgSystemId/.test(gm), "GmToolsPanel nao declara a prop rpgSystemId");
check(/rpgSystemId = "eldarin"/.test(gm), "GmToolsPanel sem padrao eldarin (muda a mesa do Eldarin)");
check(/isUmAnel\s*=\s*rpgSystemId === "um-anel"/.test(gm), "GmToolsPanel nao calcula isUmAnel");

const hidden = gm.match(/UM_ANEL_HIDDEN_TABS: ReadonlySet<GmTab> = new Set<GmTab>\(\[([^\]]*)\]\)/);
check(!!hidden, "GmToolsPanel nao tem o conjunto UM_ANEL_HIDDEN_TABS");
if (hidden) {
  for (const id of ["jogadores", "culinaria", "criaturas", "combate"]) {
    check(hidden[1].includes(`"${id}"`), `aba "${id}" nao esta escondida no Um Anel`);
  }
  check(!hidden[1].includes('"sala"'), "a aba Sala nao pode ser escondida no Um Anel");
}
check(/\{visibleTabs\.map\(/.test(gm), "a navegacao do GmToolsPanel nao usa visibleTabs");
check(
  /<RoomSettingsPanel[\s\S]*?rpgSystemId=\{rpgSystemId\}/.test(gm),
  "GmToolsPanel nao repassa rpgSystemId ao RoomSettingsPanel"
);

// 2) RoomSettingsPanel esconde a secao Combate (PA, auto-passe, XP) fora do Eldarin.
const open = room.indexOf('{rpgSystemId !== "um-anel" ? (');
const legend = room.indexOf('<legend className="vtt-eyebrow">Combate</legend>');
const close = legend >= 0 ? room.indexOf(") : null}", legend) : -1;
const tokens = room.indexOf('<legend className="vtt-eyebrow">Tokens no mapa</legend>');
check(
  open >= 0 && legend > open && close > legend && tokens > close,
  'a secao Combate do RoomSettingsPanel nao esta dentro do condicional rpgSystemId !== "um-anel"'
);
check(/rpgSystemId = "eldarin"/.test(room), "RoomSettingsPanel sem padrao eldarin (muda a tela de setup)");
check(
  /<legend className="vtt-eyebrow">Visibilidade para jogadores<\/legend>/.test(room),
  "a secao Visibilidade para jogadores sumiu; o resto da Sala deve ficar"
);

// 3) A tela de configuracao da aventura (MesaSetupClient) tambem mostra RoomSettingsPanel: passa o sistema.
const setupClient = read("components/campaign/MesaSetupClient.tsx");
const configurar = read("app/aventura/[adventureId]/configurar/page.tsx");
check(
  /rpgSystemId\?: RpgSystemId/.test(setupClient) &&
    /<RoomSettingsPanel[\s\S]*?rpgSystemId=\{rpgSystemId\}/.test(setupClient),
  "MesaSetupClient nao repassa rpgSystemId ao RoomSettingsPanel (Um Anel mostraria PA na configuracao)"
);
check(
  /rpgSystemId=\{room\.rpgSystemId\}/.test(configurar),
  "a pagina configurar nao passa room.rpgSystemId ao MesaSetupClient"
);

// 4) Salvar no Um Anel nao grava campos de combate do Eldarin (PA, auto-passe, XP).
const saveAt = room.indexOf("async function save()");
const guardAt = room.indexOf('rpgSystemId === "um-anel"', saveAt);
const patchAt = room.indexOf("patchRoomSettings(roomId", saveAt);
const saveBody = saveAt >= 0 && patchAt > saveAt ? room.slice(saveAt, room.indexOf("});", patchAt)) : "";
check(
  saveAt >= 0 && guardAt > saveAt && guardAt < patchAt,
  "save do RoomSettingsPanel grava campos do Eldarin no Um Anel"
);
check(
  /rpgSystemId === "um-anel"\s*\?\s*\{\}\s*:\s*\{\s*combatActive,\s*autoPassDelayMs,\s*xpFromMonstersEnabled:\s*xpFromMonsters\s*\}/.test(
    saveBody
  ),
  "combatFields do save nao esta vazio no Um Anel (combatActive, autoPassDelayMs, xpFromMonstersEnabled)"
);
check(/\.\.\.combatFields,/.test(saveBody), "o patch do save nao usa ...combatFields");
check(
  !/^\s+(combatActive|autoPassDelayMs|xpFromMonstersEnabled):/m.test(saveBody) &&
    !/^\s+combatActive,\s*$/m.test(saveBody),
  "o patch do save ainda envia campos de combate do Eldarin fora do condicional"
);

// 5) Battlefield passa o sistema ao painel do mestre.
const bf = battle.match(/<GmToolsPanel[\s\S]*?\/>/);
check(!!bf && /rpgSystemId=\{rpgSystemId\}/.test(bf[0]), "Battlefield nao passa rpgSystemId ao GmToolsPanel");

if (failed) process.exit(1);
console.log("OK: menu do mestre isolado por sistema no Um Anel (BV-036/BV-038)");
