/**
 * Avanço: gastar Pontos de Perícia e de Aventura.
 *
 * Por que existe: `progression.ts` tinha **11 das 16 funções sem consumidor**.
 * Todo o preço de avanço estava pronto e desligado — o herói acumulava pontos e
 * não tinha como gastá-los pelo app. Mesma família da Sombra: motor testado,
 * caminho inexistente.
 *
 * Dois erros fáceis, e os dois estão travados aqui:
 *
 * - **duas moedas.** Perícia custa Pontos de **Perícia**; Proficiência de
 *   Combate, Valor e Sabedoria custam Pontos de **Aventura**. Trocar as duas
 *   passaria despercebido até alguém ficar sem pontos do lado errado;
 * - **o limite é por Fase de Companhia**, não por sessão nem por personagem.
 *
 * Fonte: livros/um-anel/07-fases-de-companhia-jornada.md
 */
import { readFileSync as rawReadFileSync, existsSync, readdirSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP7 = readFileSync(root("livros", "um-anel", "07-fases-de-companhia-jornada.md"), "utf8");
const PROG = readFileSync(root("lib", "combat", "um-anel", "progression.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-advance.ts"), "utf8");
const SESSION = readFileSync(root("lib", "combat", "um-anel", "session-state.ts"), "utf8");
const PANEL = readFileSync(root("components", "vtt", "TorAdvancePanel.tsx"), "utf8");
const FELLOW = readFileSync(root("components", "vtt", "TorFellowshipPanel.tsx"), "utf8");
const SYNC = readFileSync(root("hooks", "useRoomSync.ts"), "utf8");
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-advance", "route.ts");

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

console.log("verify-um-anel-avanco: o motor de progressão tem consumidor real");

/* ── 1. As funções deixaram de ser código morto ────────────────────────── */

const handlerCode = stripComments(HANDLER);
for (const fn of [
  "priceTorSkillRank",
  "priceTorProficiencyRank",
  "priceTorValourOrWisdomRank",
  "emptyTorPhasePurchases",
  "canBuyTorSkillThisPhase",
  "canBuyTorProficiencyThisPhase",
  "canBuyTorValourOrWisdomThisPhase",
  "torRankGrant",
]) {
  ok(`${fn} é chamada pelo handler`, new RegExp(`\\b${fn}\\(`).test(handlerCode), "seguia sem consumidor");
}

/* ── 2. Duas moedas, e cada uma na sua ─────────────────────────────────── */

ok(
  "livro: Perícia é comprada com Pontos de Perícia",
  /pontos de Perícia/i.test(CAP7)
);
ok(
  "livro: Proficiência/Valor/Sabedoria usam Pontos de Aventura",
  /Proficiência de Combate, em VALOR ou em SABEDORIA/.test(CAP7)
);
ok(
  "Perícia gasta skillPoints",
  /priceTorSkillRank\(sheet\.skills\[skillId\] \?\? 0, sheet\.skillPoints\)/.test(handlerCode),
  "trocar a moeda passaria despercebido até faltar ponto do lado errado"
);
ok(
  "Proficiência gasta adventurePoints",
  /priceTorProficiencyRank\([\s\S]{0,120}?sheet\.adventurePoints\s*\n?\s*\)/.test(handlerCode)
);
ok(
  "Valor/Sabedoria gastam adventurePoints",
  /priceTorValourOrWisdomRank\(atual, sheet\.adventurePoints\)/.test(handlerCode)
);
ok(
  "o desconto sai da moeda certa",
  /skillPoints: sheet\.skillPoints - price\.cost/.test(handlerCode) &&
    /adventurePoints: sheet\.adventurePoints - price\.cost/.test(handlerCode)
);

/* ── 3. O limite é por Fase de Companhia ───────────────────────────────── */

ok(
  "livro: no máximo um grau em cada Perícia por Fase",
  /Durante uma única Fase de Companhia, os jogadores podem comprar no máximo \*\*um grau em cada/.test(
    CAP7
  )
);
ok(
  "livro: Valor e Sabedoria não sobem ambos na mesma Fase",
  /Também podem comprar um grau em SABEDORIA ou em VALOR, mas não em\s*\n?>?\s*ambos/.test(CAP7)
);
ok(
  "handler recusa avanço fora de uma Fase de Companhia",
  /Avanço só acontece durante uma Fase de Companhia/.test(handlerCode)
);
/* As compras moram no estado da FASE, não na ficha: fechar a Fase constrói um
   estado novo, então o limite zera sozinho. Na ficha, alguém teria de lembrar
   de zerar — e esquecer trancaria o herói para sempre. */
ok("compras da Fase moram no estado da Fase", /purchases\?: Record<string, TorPhasePurchases>/.test(SESSION));
ok(
  "compras são recortadas na leitura",
  /function normalizePurchases/.test(SESSION),
  "estado da sala vem de JSONB e não é confiável"
);
ok(
  "grau por Perícia é limitado a 1 já na leitura",
  /Math\.min\(1, Math\.floor\(n\)\)/.test(stripComments(SESSION)),
  "guardar mais deixaria o limite passar na próxima leitura"
);
ok(
  "handler grava a compra na Fase",
  /purchases: \{ \.\.\.\(fellowship\.purchases \?\? \{\}\), \[sheet\.id\]: nextPurchases \}/.test(handlerCode)
);

/* ── 4. Permissão e validação ──────────────────────────────────────────── */

ok(
  "confere o dono da ficha quando não é o Mestre",
  /canonicalId !== sheet\.ownerId/.test(handlerCode)
);
ok("recusa mesa que não seja do Um Anel", /rpgSystemId !== "um-anel"/.test(handlerCode));
ok(
  "Perícia recebida é validada contra a lista",
  /SKILLS\.some\(\(s\) => s\.id === skillId\)/.test(handlerCode),
  "corpo da requisição não é confiável"
);
ok(
  "Proficiência recebida é validada contra a lista",
  /PROFICIENCY_IDS\.includes\(profId\)/.test(handlerCode)
);
ok(
  "rota não exige requireRoomManage",
  existsSync(ROUTE_PATH) && !/requireRoomManage/.test(stripComments(readFileSync(ROUTE_PATH, "utf8"))),
  "avançar é escolha de quem joga o herói"
);
ok(
  "rota usa apelido como autor",
  existsSync(ROUTE_PATH) &&
    /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(readFileSync(ROUTE_PATH, "utf8"))
);

/* Grava a ficha ANTES de anunciar: se a gravação falhar, a mesa não pode ter
   lido no chat que o herói avançou. Ancorado na CHAMADA, não no nome — o nome
   também aparece na linha de `import`. */
const gravaIdx = handlerCode.indexOf("saveTorCharacter(next)");
const chatIdx = handlerCode.indexOf("appendRoomChatMessage(room");
ok("só anuncia depois de gravar a ficha", gravaIdx >= 0 && chatIdx > gravaIdx);

/* ── 5. O prêmio do novo grau ──────────────────────────────────────────── */

/* Valor dá Recompensa, Sabedoria dá Virtude — e a Cultural só a partir de
   Sabedoria 2. A escolha é do jogador; a mesa só precisa saber que há uma. */
ok("mensagem avisa da Recompensa/Virtude pendente", /escolha uma Recompensa/.test(handlerCode));
ok("Virtude Cultural é anunciada a partir do grau 2", /grant\.culturalAllowed/.test(handlerCode));
ok(
  "torRankGrant libera Cultural só de Sabedoria 2",
  /culturalAllowed: newRank >= 2/.test(stripComments(PROG))
);

/* ── 6. UI ─────────────────────────────────────────────────────────────── */

ok("painel de avanço existe", PANEL.length > 0);
ok("painel entra na Fase de Companhia", /<TorAdvancePanel/.test(FELLOW));
ok(
  "o custo aparece antes do clique",
  /TOR_XP_COST_BY_LEVEL\[atual \+ 1\]/.test(PANEL),
  "sem ver o número, o jogador descobre o custo depois de gastar"
);
ok("painel mostra as duas moedas separadas", /Pontos de Perícia · \{s\.adventurePoints\} Pontos de Aventura/.test(PANEL));
ok("painel explica o limite da Fase", /Um grau por Perícia e por Proficiência em cada Fase/.test(PANEL));
ok("existe helper de cliente", /postRoomTorAdvance/.test(SYNC));
ok(
  "UI sem emoji",
  !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(PANEL),
  "convenção do projeto: ícones só em SVG"
);

/* ── 7. Dívida que continua ────────────────────────────────────────────── */

/* O que ainda não tem consumidor, listado para a asserção falhar quando alguém
   ligar — e obrigar a atualizar esta lista. */
const AINDA_SEM_CONSUMIDOR = ["appendTorChronicle", "torFellowshipLevel"];

/**
 * Varredura AMPLA, pelo mesmo motivo do teste da Sombra: a primeira versão
 * olhava uma lista fixa de arquivos e não acusou quando as funções foram
 * ligadas num handler novo. Dívida "registrada" depois de paga é pior que
 * dívida sem registro — dá a impressão de que ainda falta.
 */
function consumidoresDoProjeto() {
  const dirs = [root("lib", "room", "handlers"), root("components", "vtt"), root("lib", "combat", "um-anel")];
  const out = [];
  for (const dir of dirs) {
    for (const f of readdirSync(dir)) {
      if (!/\.(ts|tsx)$/.test(f)) continue;
      // progression.ts define as funções — não conta como consumidor.
      if (f === "progression.ts") continue;
      out.push(stripComments(readFileSync(join(dir, f), "utf8")));
    }
  }
  return out;
}
const CONSUMIDORES = consumidoresDoProjeto();

ok(
  "applyTorSpiritualRecovery tem consumidor real",
  CONSUMIDORES.some((src) => /\bapplyTorSpiritualRecovery\(/.test(src)),
  "saiu da lista de dívida mas ninguém chama"
);
for (const fn of AINDA_SEM_CONSUMIDOR) {
  ok(
    `${fn} segue sem consumidor (dívida registrada)`,
    !CONSUMIDORES.some((src) => new RegExp(`\\b${fn}\\(`).test(src)),
    "ligou? então atualize a lista deste teste"
  );
}

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
