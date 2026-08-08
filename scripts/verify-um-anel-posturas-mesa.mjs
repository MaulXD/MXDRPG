/**
 * As Posturas de Combate chegam MESMO à mesa.
 *
 * Por que existe: `lib/combat/um-anel/stances.ts` estava pronto e testado desde
 * o D17 — e era código morto. A palavra `stance` não aparecia em nenhum lugar de
 * `lib/room/`: não havia campo no token, nem rota, nem UI. Todo ataque resolvia
 * como Aberta × Aberta, então Avançada, Defensiva e Retaguarda não existiam na
 * prática, e o motor passava nos testes o tempo todo.
 *
 * `verify-um-anel-stances.mjs` continua conferindo a TABELA (os números do
 * livro). Este confere o CAMINHO: token → rota → handler → motor. Um teste de
 * motor puro não pega desligamento de fiação, que é justamente o que aconteceu.
 *
 * Fonte: livros/um-anel/compendio/posturas.md e 06-fases-de-aventura-combate.md
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const STANCES = readFileSync(root("lib", "combat", "um-anel", "stances.ts"), "utf8");
const TYPES = readFileSync(root("lib", "vtt", "types.ts"), "utf8");
const TOKEN = readFileSync(root("lib", "vtt", "tor-player-token.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-stance.ts"), "utf8");
const ATTACK = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-stance", "route.ts");
const POPUP = readFileSync(root("components", "vtt", "TorAttackPopup.tsx"), "utf8");
const SYNC = readFileSync(root("hooks", "useRoomSync.ts"), "utf8");

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

console.log("verify-um-anel-posturas-mesa: postura sai do motor e chega ao mapa");

/* ── 1. O token carrega a postura ──────────────────────────────────────── */

ok("TorCombatTokenFields tem o campo stance", /stance\?:/.test(TYPES));
ok(
  "campo é opcional — token de sala antiga não precisa de migração",
  /stance\?:/.test(TYPES) && !/\n\s*stance: /.test(TYPES),
  "campo obrigatório quebraria toda sala já salva"
);
ok("token novo nasce em Aberta", /stance: TOR_DEFAULT_STANCE/.test(TOKEN));
ok("Aberta é a postura padrão", /TOR_DEFAULT_STANCE: TorStanceId = "aberta"/.test(STANCES));

/* Aberta precisa ser neutra em TODOS os modificadores: é ela que um token antigo
   (sem o campo) assume, e qualquer número diferente de zero mudaria em silêncio
   o resultado de salas gravadas antes deste campo existir. */
const aberta = STANCES.match(/aberta: \{[\s\S]*?\},/);
ok("bloco da postura Aberta existe", Boolean(aberta));
for (const campo of ["attackRankDelta", "incomingCloseRankDelta", "attackRankPerEngager"]) {
  ok(
    `Aberta é neutra em ${campo}`,
    new RegExp(`${campo}: 0`).test(aberta?.[0] ?? ""),
    "postura padrão precisa não alterar nada"
  );
}

/* ── 2. Handler de troca de postura ────────────────────────────────────── */

ok("existe handler de postura", HANDLER.length > 0);
const handlerCode = stripComments(HANDLER);
ok("valida a postura recebida", /isTorStance\(stance\)/.test(handlerCode), "corpo da API não é confiável");
ok(
  "recusa mesa que não seja do Um Anel",
  /rpgSystemId !== "um-anel"/.test(handlerCode),
  "isolamento de hub"
);
ok(
  "adversário não escolhe postura",
  /kind !== "hero"/.test(handlerCode),
  "o livro modela postura só do lado do herói"
);
ok(
  "confere o dono da ficha quando não é o Mestre",
  /canonicalId !== sheet\.ownerId/.test(handlerCode),
  "sem isso qualquer jogador troca a postura de qualquer herói"
);
ok(
  "Retaguarda passa pelo requisito do livro",
  /canAssumeRearward\(/.test(handlerCode),
  "sem a checagem, um herói sozinho recua e vira inalcançável"
);
ok(
  "override de Retaguarda é só do Mestre",
  /loremasterOverride: isGm && opts\.override === true/.test(handlerCode),
  "jogador burlaria o limite chamando a API direto"
);
/* As contagens excluem o próprio herói: ele está saindo da linha de frente, e
   contar-se a si mesmo faria o segundo recuado passar por um requisito que não
   cumpre. */
ok(
  "contagens de Retaguarda excluem o próprio herói",
  /others = heroes\.filter\(\(t\) => t\.id !== token\.id\)/.test(handlerCode)
);
ok("anuncia a troca no chat", /appendRoomChatMessage/.test(handlerCode));

/* Privacidade: o nome real da conta nunca vai pro chat — só apelido. O autor tem
   de vir pronto da rota, como nas outras rotas de mesa. */
ok(
  "handler não monta authorName sozinho",
  !/authorName:/.test(handlerCode),
  "nome real da conta vazaria pro chat dos outros jogadores"
);
ok(
  "rota usa apelido como autor",
  existsSync(ROUTE_PATH) &&
    /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(
      readFileSync(ROUTE_PATH, "utf8")
    )
);

/* ── 3. A rota existe e não exige ser Mestre ───────────────────────────── */

ok("rota /tor-stance existe", existsSync(ROUTE_PATH));
const routeCode = existsSync(ROUTE_PATH) ? stripComments(readFileSync(ROUTE_PATH, "utf8")) : "";
ok(
  "rota NÃO exige requireRoomManage",
  !/requireRoomManage/.test(routeCode),
  "postura é escolha do jogador — exigir Mestre tiraria a decisão de quem joga"
);
ok("rota recusa sessão ausente", /if \(!session\)/.test(routeCode));

/* ── 4. O ataque usa a postura ─────────────────────────────────────────── */

const attackCode = stripComments(ATTACK);
ok("ataque lê a postura do atacante", /attackerStance:/.test(attackCode));
ok("ataque lê a postura do defensor", /defenderStance:/.test(attackCode));
ok("ataque informa se é à distância", /\battackIsRanged,/.test(attackCode));
ok(
  "arma à distância vem do próprio item, não do nome",
  /attackIsRanged = Boolean\(weapon\.ranged\)/.test(attackCode)
);
ok(
  "adversário com Arco também ataca à distância",
  /attackIsRanged = Boolean\(action\.ranged\)/.test(attackCode),
  "sem isso o Arqueiro Goblin não alcança quem está na Retaguarda — justamente seu alvo"
);
ok(
  "ação sem marca conta como corpo a corpo",
  /let attackIsRanged = false/.test(attackCode),
  "o padrão precisa ser o lado seguro"
);

/* As quatro ações de Arco do bestiário precisam estar marcadas: a marca é o que
   liga o alcance do adversário à postura do herói. */
const ADV = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");
const arcos = [...ADV.matchAll(/\{ id: "(arco|arco-de-chifre)"[^}]*\}/g)].map((m) => m[0]);
ok("bestiário tem 4 ações de Arco", arcos.length === 4, `achou ${arcos.length}`);
for (const acao of arcos) {
  ok(`ação de Arco marcada como ranged`, /ranged: true/.test(acao), acao.slice(0, 60));
}
/* E nenhuma arma de corpo a corpo pode ter ganhado a marca por tabela. */
const corpoACorpo = [...ADV.matchAll(/\{ id: "(?!arco)[a-z-]+"[^}]*ranged: true[^}]*\}/g)];
ok(
  "nenhuma ação corpo a corpo virou à distância",
  corpoACorpo.length === 0,
  corpoACorpo.map((m) => m[0].slice(0, 50)).join(" · ")
);
ok(
  "Defensiva conta quem engaja o herói",
  /attackerEngagedByCount:[\s\S]{0,120}countEngagingFoes\(/.test(attackCode),
  "sem contagem, Defensiva não teria custo e seria melhor que Aberta em tudo"
);
ok(
  "engajado = célula adjacente",
  /axialDistance\(t\.axial, hero\.axial\) === 1/.test(attackCode)
);
ok(
  "eliminado não engaja",
  /!t\.torCombat\.eliminated &&[\s\S]{0,80}axialDistance/.test(attackCode)
);

/* ── 5. A UI deixa escolher ────────────────────────────────────────────── */

ok("popup do Um Anel tem seletor de postura", /Postura de Combate/.test(POPUP));
ok("seletor lista as 4 posturas", /TOR_STANCES\.map/.test(POPUP));
ok(
  "postura vem do token, não de estado local",
  /isTorStance\(combat\?\.stance\)/.test(POPUP),
  "estado local ficaria dessincronizado quando o Mestre trocasse a postura"
);
ok(
  "erro da Retaguarda aparece pro jogador",
  /setErr\(e instanceof Error \? e\.message : "Falha ao trocar a postura"\)/.test(POPUP),
  "requisito recusado não pode falhar em silêncio"
);
ok("seletor só aparece para herói", /isHero \? \(/.test(POPUP));
ok("existe helper de cliente", /postRoomTorStance/.test(SYNC));

/* A postura muda quem alcança quem: quem só olha o status do token precisa ver,
   senão descobre que o alvo estava em Retaguarda só quando o ataque é barrado. */
const STATUS = readFileSync(root("components", "vtt", "TokenStatusBody.tsx"), "utf8");
ok("status do token mostra a postura", /Postura \{torStanceLabel\(/.test(STATUS));
ok(
  "status cai em Aberta pra token sem o campo",
  /isTorStance\(token\.torCombat\.stance\) \? token\.torCombat\.stance : TOR_DEFAULT_STANCE/.test(
    STATUS
  )
);

/* Sem emoji na UI — convenção do projeto (só SVG). */
ok(
  "seletor de postura não usa emoji",
  !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(POPUP),
  "convenção do projeto: ícones só em SVG"
);

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);

/* ══════════════════════════════════════════════════════════════════════
   Limites de engajamento (POS-R03)
   ══════════════════════════════════════════════════════════════════════

   `TOR_ENGAGEMENT_LIMITS` existia sem consumidor NENHUM: os quatro tetos do
   livro estavam escritos e ninguém conferia. Dez heróis podiam cercar um Orc.

   O app AVISA, não barra: quem engaja quem é decisão do Mestre, e a leitura por
   célula adjacente é aproximação — barrar puniria uma arrumação de tokens que
   pode estar certa na cabeça da mesa. Mas calar deixa a regra invisível. */

const ATTACK_ENG = stripComments(
  readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8")
);
const ADV_TYPES = readFileSync(root("lib", "character", "um-anel", "adversary-types.ts"), "utf8");
const ADV_LIST = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");
const POSTURAS_MD = readFileSync(root("livros", "um-anel", "compendio", "posturas.md"), "utf8");

ok("livro: até 3 heróis por inimigo humano", /\*\*Heróis por inimigo humano:\*\* até 3/.test(POSTURAS_MD));
ok("livro: até 6 heróis por inimigo grande", /\*\*Heróis por inimigo grande:\*\* até 6/.test(POSTURAS_MD));
ok("livro: até 3 inimigos humanos por herói", /\*\*Inimigos humanos por herói:\*\* até 3/.test(POSTURAS_MD));
ok("livro: até 2 inimigos grandes por herói", /\*\*Inimigos grandes por herói:\*\* até 2/.test(POSTURAS_MD));

ok(
  "os limites têm consumidor real",
  /TOR_ENGAGEMENT_LIMITS\.heroesPerLargeFoe/.test(ATTACK_ENG) &&
    /TOR_ENGAGEMENT_LIMITS\.humanFoesPerHero/.test(ATTACK_ENG),
  "os quatro tetos estavam escritos e ninguém conferia"
);
ok(
  "o teto de cercadores depende do TAMANHO do inimigo",
  /foe\.torCombat\?\.large\s*\n?\s*\? TOR_ENGAGEMENT_LIMITS\.heroesPerLargeFoe/.test(ATTACK_ENG),
  "um grande aceita o dobro de cercadores"
);
ok(
  "grandes e humanos são contados separadamente sobre o herói",
  /const grandes = inimigosNoHeroi\.filter\(\(t\) => t\.torCombat\?\.large\)\.length/.test(ATTACK_ENG),
  "3 humanos OU 2 grandes — misturar os dois usaria o teto errado"
);
/* Avisa, não barra: nenhum `return { ok: false }` por causa de limite. */
ok(
  "estourar o limite não barra o ataque",
  !/engagementWarnings[\s\S]{0,200}?return \{ ok: false/.test(ATTACK_ENG),
  "quem engaja quem é decisão do Mestre"
);

/* `large` só onde o livro diz. O texto dá "criaturas grandes (**como Trolls**)",
   e Trolls são EXEMPLO, não a lista inteira: um bloco de fonte que diga "Grande
   Tamanho" também qualifica. Vigor 2 NÃO serve de atalho, porque mede
   Ferimentos para abater e não tamanho.

   Esta checagem já foi por lista fixa de contagem ("são 5 Trolls") e por regex
   de JANELA FIXA DE LINHAS (`id:` + 1 linha + `large:`). As duas quebraram
   quando Tauler entrou: a contagem virou 6, e a janela de linhas simplesmente
   NÃO VIU o `large: true` de Tauler porque havia duas linhas de comentário no
   meio — a asserção passou dizendo "só Trolls" com um não-Troll marcado.
   Agora o recorte é por BLOCO, não por deslocamento de linhas. */
ok("bloco de adversário tem o campo `large`", /large\?: boolean/.test(ADV_TYPES));

/** Cada bloco de adversário, do `id:` até o `id:` seguinte. */
const BLOCOS = ADV_LIST.split(/\n {2}\{\n/)
  .map((b) => {
    const m = b.match(/^ {4}id: "([a-z0-9-]+)",/m);
    return m ? { id: m[1], corpo: b } : null;
  })
  .filter(Boolean);

const grandes = BLOCOS.filter((b) => /^ {4}large: true,$/m.test(b.corpo)).map((b) => b.id);

/* Os que NÃO são Troll precisam trazer, no próprio bloco, a citação da fonte que
   os qualifica. "Grande Tamanho" é o rótulo do bloco de 1ª edição. */
const semJustificativa = grandes.filter((id) => {
  if (id.includes("troll")) return false;
  const bloco = BLOCOS.find((b) => b.id === id);
  return !/Grande Tamanho/.test(bloco.corpo);
});
ok(
  "todo bloco grande que não é Troll cita a fonte que o qualifica",
  semJustificativa.length === 0,
  `marcados sem base no livro: ${semJustificativa.join(", ")}`
);

/* E a lista é fechada: um bloco novo marcado como grande sem passar por aqui
   quebra o teste, mesmo trazendo a citação certa. */
const GRANDES_ESPERADOS = [
  "grande-troll-das-cavernas",
  "cave-troll-furtivo",
  "ladrao-troll-de-pedra",
  "chefe-troll-de-pedra",
  "jack-the-stone-troll",
  // Cria de Shelob, "Grande Tamanho" no apêndice de The Darkening of Mirkwood.
  "tauler-o-cacador",
];
ok(
  `os blocos grandes são exatamente ${GRANDES_ESPERADOS.length}`,
  grandes.length === GRANDES_ESPERADOS.length &&
    GRANDES_ESPERADOS.every((id) => grandes.includes(id)),
  `esperado [${GRANDES_ESPERADOS.join(", ")}], achei [${grandes.join(", ")}]`
);
ok("token carrega o tamanho", /large: stats\.large/.test(readFileSync(root("lib", "character", "um-anel", "adversary-token.ts"), "utf8")));

console.log(`\nverify-um-anel-posturas-mesa (engajamento): ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
