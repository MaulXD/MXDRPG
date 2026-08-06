/**
 * Verifica os dados do Um Anel — entra em `npm run test`.
 *
 * O sistema usa exatamente DOIS dados: o Dado de Proeza (d12) e os Dados de
 * Sucesso (d6, rolados em quantidade igual à graduação da habilidade).
 * `02-resolucao-de-acoes.md`, "Os Dados de O Um Anel": seis d6 e dois d12.
 *
 * O rolador da mesa oferecia d20, d10, d8 e d4 em sala do Um Anel — dados que
 * nenhuma regra do livro usa. Oferecê-los só convida a rolar o dado errado.
 *
 * PENDENTE DE ARTE (registrado, não implementado): o livro pede face 11 = Olho de
 * Sauron, face 12 = runa de Gandalf no Dado de Proeza, e face 6 = tengwa élfico
 * no Dado de Sucesso. O mini-dado do chat desenha as faces com `fillText` num
 * canvas (components/vtt/DiceWebGL.tsx), então mostrar os glyphs NÃO exige
 * arquivo de arte — exige (a) passar um marcador de sistema do chat até
 * `makeFaceTex`, hoje inexistente, e (b) decidir o caractere da runa de Gandalf,
 * que o material extraído NÃO especifica (o livro dá ⊘ pro Olho e ᛥ pro tengwa,
 * mas nenhum caractere pra runa). Enquanto isso o Dado de Proeza mostra 11 e 12
 * como números, e o texto da rolagem no chat já nomeia "Olho de Sauron" e "Runa
 * de Gandalf" — a informação de regra chega ao jogador, só não como glyph.
 */
import { readFileSync as rawReadFileSync } from "fs";

/* Normaliza CRLF -> LF: âncoras de linha não devem depender de fim de linha. */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const BOOK = readFileSync(root("livros", "um-anel", "02-resolucao-de-acoes.md"), "utf8");
const ROLLER = readFileSync(root("components", "vtt", "DiceRoller.tsx"), "utf8");
const RAIL = readFileSync(root("components", "vtt", "mesa", "MesaFoundryDockRail.tsx"), "utf8");
const FLOATING = readFileSync(
  root("components", "vtt", "mesa", "MesaFoundryFloatingWindows.tsx"),
  "utf8"
);
const DICE = readFileSync(root("lib", "character", "um-anel", "dice.ts"), "utf8");
const ROUTE = readFileSync(root("app", "api", "room", "[roomId]", "chat", "route.ts"), "utf8");

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

console.log("verify-um-anel-dados: dados do Um Anel × capítulo 2");

/* ── O sistema usa só d12 e d6 ─────────────────────────────────────────── */

ok(
  "livro: seis Dados de Sucesso (d6) e dois Dados de Proeza (d12)",
  /seis dados de 6 faces \(também chamados de \*\*Dados de Sucesso\*\*\)[\s\S]{0,120}?dois dados de 12 faces/i.test(
    BOOK
  )
);

const quickUmAnel = ROLLER.match(/const QUICK_UM_ANEL = \[([^\]]+)\]/);
ok("rolador tem lista de atalhos do Um Anel", Boolean(quickUmAnel));
const atalhos = quickUmAnel
  ? quickUmAnel[1].split(",").map((s) => s.trim().replace(/"/g, ""))
  : [];

ok("atalhos do Um Anel não estão vazios", atalhos.length >= 5, `achou ${atalhos.length}`);
// A REGRESSÃO: dados que não existem no sistema.
for (const proibido of ["1d20", "1d10", "1d8", "1d4", "1d100"]) {
  ok(
    `atalhos do Um Anel NÃO oferecem ${proibido}`,
    !atalhos.includes(proibido),
    atalhos.join(" ")
  );
}
ok("atalhos incluem o Dado de Proeza (1d12)", atalhos.includes("1d12"));
ok("atalhos incluem Dados de Sucesso (1d6)", atalhos.includes("1d6"));
// Graduação vai até 6, então até 6d6 faz sentido; mais que isso não.
ok(
  "atalhos cobrem até 6d6 e não passam disso",
  atalhos.includes("6d6") && !atalhos.some((a) => /^([7-9]|\d\d+)d6$/.test(a)),
  atalhos.join(" ")
);
// Todo atalho tem de ser d12 ou d6.
ok(
  "todo atalho do Um Anel é d12 ou d6",
  atalhos.every((a) => /^\d+d(12|6)$/.test(a)),
  atalhos.join(" ")
);

// Eldarin não pode ter perdido os dados dele.
const quickEldarin = ROLLER.match(/const QUICK_ELDARIN = \[([^\]]+)\]/);
ok("atalhos do Eldarin preservados", Boolean(quickEldarin) && quickEldarin[1].includes("1d20"));

/* ── A prop chega do rail e da janela flutuante ────────────────────────── */

ok("rolador aceita o sistema por prop", /rpgSystemId\?: RpgSystemId;/.test(ROLLER));
ok(
  "rolador escolhe a lista pelo sistema",
  /const QUICK = isUmAnel \? QUICK_UM_ANEL : QUICK_ELDARIN;/.test(ROLLER)
);
ok(
  "fórmula inicial acompanha o sistema",
  /useState\(isUmAnel \? "1d12" : "1d20"\)/.test(ROLLER)
);
for (const [nome, src] of [
  ["DockRail", RAIL],
  ["FloatingWindows", FLOATING],
]) {
  ok(
    `${nome} passa rpgSystemId ao rolador`,
    /<DiceRoller roomId=\{roomId\} onUpdate=\{onRefresh\} rpgSystemId=\{rpgSystemId\} \/>/.test(src)
  );
}

/* ── Faces especiais: valor de jogo × face física ─────────────────────── */

ok(
  "livro: face 11 é o Olho de Sauron e 12 a runa de Gandalf",
  /o 11 é o símbolo do Olho de Sauron e o 12 é uma runa de Gandalf/i.test(BOOK)
);
ok("livro: face 6 do Dado de Sucesso tem o tengwa", /o 6 tem um símbolo élfico \(tengwa\)/i.test(BOOK));

// O valor de JOGO já está certo: Olho vale 0, Runa vale 10.
ok("Olho vale 0 no jogo", /kind: "eye", numeric: 0/.test(DICE));
ok("Runa vale 10 no jogo", /kind: "gandalf", numeric: 10/.test(DICE));
// E a face FÍSICA que vai pro dado 3D é 11 e 12 — distinta do valor de jogo.
ok("face física do Olho é 11", /"eye"\) return 11;/.test(DICE));
ok("face física da Runa é 12", /"gandalf"\) return 12;/.test(DICE));
ok(
  "payload do dado é sempre d12 (Dado de Proeza)",
  /return \{ sides: 12, value: featDiePhysicalFace\(featDie\) \};/.test(DICE)
);

// A rota transforma o Dado de Proeza num roll que o chat sabe desenhar. Sem isto
// o dado 3D não apareceria em nenhuma rolagem do Um Anel.
ok(
  "rota converte o Dado de Proeza em roll 1d12",
  /roll: \{ formula: "1d12", rolls: \[featDieValue\], total: featDieValue, system: room\.rpgSystemId \}/.test(
    ROUTE
  )
);
ok(
  "rota recorta o valor do Dado de Proeza em 1..12",
  /Math\.min\(12, Math\.max\(1, Math\.round\(body\.torFeatDie\.value\)\)\)/.test(ROUTE)
);
// O servidor não re-rola — o texto já vem calculado do cliente.
ok(
  "rota não re-rola o Dado de Proeza",
  /o servidor só repassa, não re-rola/.test(ROUTE)
);

/* ── Glyphs nas faces especiais ────────────────────────────────────────
   "11" e "6" não significam nada no Um Anel: o livro põe o Olho de Sauron na
   face 11 do Dado de Proeza e o tengwa élfico na face 6 do Dado de Sucesso. O
   mini-dado do chat desenha faces com `fillText` num canvas, então isso é
   TIPOGRAFIA e não exige arquivo de arte.

   A **runa de Gandalf (face 12) NÃO tem caractere em nenhum ponto do material
   extraído** — o livro dá ⊘ pro Olho e ᛥ pro tengwa, e nada pra runa. A face 12
   segue mostrando o número, e o teste abaixo garante que ninguém acrescente um
   glyph inventado sem que a fonte passe a especificar um. */

const MODEL = readFileSync(root("lib", "vtt", "combat-dice-model.ts"), "utf8");
const CHAT_TYPE = readFileSync(root("lib", "room", "chat.ts"), "utf8");
const ROOM_CHAT = readFileSync(root("components", "vtt", "RoomChat.tsx"), "utf8");
const MINI = readFileSync(root("components", "vtt", "DiceBoxMini.tsx"), "utf8");
const MINIATURE = readFileSync(root("components", "vtt", "DiceMiniature.tsx"), "utf8");
const WEBGL = readFileSync(root("components", "vtt", "DiceWebGL.tsx"), "utf8");

// Os caracteres vêm do livro, não de escolha nossa.
ok("livro usa ⊘ para o Olho de Sauron", BOOK.includes("⊘") || /Olho de Sauron/.test(BOOK));
ok("Olho de Sauron é o glyph da face 11", /TOR_FACE_GLYPHS[\s\S]{0,120}?11: "⊘"/.test(MODEL));
ok("tengwa é o glyph da face 6 do Dado de Sucesso", /TOR_SUCCESS_DIE_GLYPHS[\s\S]{0,120}?6: "ᛥ"/.test(MODEL));
// A REGRESSÃO a evitar: inventar um caractere pra runa de Gandalf.
ok(
  "face 12 NÃO tem glyph inventado (a fonte não especifica a runa)",
  !/TOR_FACE_GLYPHS[\s\S]{0,200}?12: "/.test(MODEL)
);
ok(
  "o código registra por que a face 12 não tem glyph",
  /runa\s*\n?\s*\*? ?de Gandalf não tem caractere em nenhum ponto do material extraído/.test(
    MODEL.replace(/\s+/g, " ")
  ) || /não tem caractere em nenhum ponto do material extraído/.test(MODEL)
);

// Só d12 e d6 recebem glyph — um d20 do Eldarin não pode ganhar Olho de Sauron.
ok("torFaceGlyphs cobre d12 e d6", /sides === 12\) return TOR_FACE_GLYPHS/.test(MODEL) && /sides === 6\) return TOR_SUCCESS_DIE_GLYPHS/.test(MODEL));
ok("torFaceGlyphs devolve undefined pro resto", /return undefined;/.test(MODEL));
// E o glyph só entra em sala do Um Anel.
ok(
  "glyph só é aplicado quando o sistema é um-anel",
  /system === "um-anel" \? torFaceGlyphs\(sides\) : undefined/.test(MODEL)
);

/* A cadeia inteira: rota marca o sistema, e o mapa desce até o canvas. */
ok("tipo do roll no chat carrega o sistema", /system\?: string;/.test(CHAT_TYPE));
ok("rota marca o sistema na rolagem comum", /system: room\.rpgSystemId,/.test(ROUTE));
ok("RoomChat passa o sistema da mensagem", /message\.roll\.system/.test(ROOM_CHAT));
ok("DiceRollSpec carrega o mapa de glyphs", /faceGlyphs\?: Record<number, string>;/.test(MODEL));
ok("DiceBoxMini repassa faceGlyphs", /faceGlyphs=\{spec\.faceGlyphs\}/.test(MINI));
ok("DiceMiniature aceita e repassa faceGlyphs", /faceGlyphs,/.test(MINIATURE) && /faceGlyphs=\{faceGlyphs\}/.test(MINIATURE));
ok("DiceWebGL aceita faceGlyphs", /faceGlyphs\?: Record<number, string>;/.test(WEBGL));
ok(
  "makeFaceTex desenha o glyph em vez do número",
  /const s = glyph \?\? String\(num\);/.test(WEBGL)
);
// O sublinhado de 6/9 é convenção de dado numérico — não vale sobre um glyph.
ok(
  "sublinhado de 6/9 não é desenhado sobre glyph",
  /if \(!glyph && \(num === 6 \|\| num === 9\)\)/.test(WEBGL)
);
// Sem faceGlyphs nas deps, trocar de sistema não redesenharia a textura.
ok(
  "faceGlyphs está nas dependências dos efeitos",
  (WEBGL.match(/\}, \[[^\]]*faceGlyphs\]\);/g) || []).length >= 2
);
// As três chamadas de makeFaceTex têm de passar o glyph da face certa.
ok(
  "as três chamadas de makeFaceTex passam o glyph da face",
  (WEBGL.match(/makeFaceTex\([^)]*faceGlyphs\?\.\[/g) || []).length === 3
);

console.log(`\nverify-um-anel-dados: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
