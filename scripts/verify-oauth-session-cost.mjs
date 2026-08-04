/**
 * Tranca a correção do login social que caía (sessão OAuth revalidando no banco
 * a cada requisição). Entra em `npm run test`.
 *
 * O bug: `resolveSessionUser` decidia materializar por
 * `oauthIdentityFromSession(user)`, que devolve identidade sempre que
 * `oauthProvider` + `oauthSubject` estão na sessão — SEMPRE, para um usuário
 * Google, mesmo já materializado com id `usr_`. Resultado: 2–3 queries +
 * possível UPDATE por requisição, com `strict: true`, enquanto sessão por senha
 * fazia 1 query. Qualquer latência do banco deslogava só quem entrou com Google.
 *
 * A correção: materializar só quando o id é efêmero (`google-…`/`discord-…`),
 * que é o único caso em que a linha realmente não existe.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SU = readFileSync(join(__dirname, "..", "lib", "auth", "session-user.ts"), "utf8");
const IDS = readFileSync(join(__dirname, "..", "lib", "auth", "oauth-session-id.ts"), "utf8");

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

/**
 * Remove comentários. Obrigatório antes de qualquer asserção NEGATIVA: este
 * arquivo documenta o bug antigo em comentário (de propósito — é o que impede
 * alguém de "restaurar" o comportamento), e um regex cru casaria com a
 * explicação em vez do código.
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function fnBody(src, name) {
  const start = src.search(new RegExp(`(export\\s+)?async function ${name}\\b`));
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.search(/\n(export\s+)?(async\s+)?function /);
  return end < 0 ? rest : rest.slice(0, end);
}

console.log("verify-oauth-session-cost: sessão OAuth não revalida no banco a cada requisição");

const resolve = fnBody(SU, "resolveSessionUser");
/** Só código, sem comentários — para as asserções negativas. */
const resolveCode = stripComments(resolve);
ok("resolveSessionUser encontrado", resolve.length > 0);

/* ── O gatilho da materialização ──────────────────────────────────── */

// Precisa ser o id efêmero, não a presença de identidade OAuth.
ok(
  "Materializa por id efêmero",
  /if\s*\(isOAuthEphemeralSessionId\(user\.id\)\)/.test(resolve)
);

// A REGRESSÃO que este teste existe para pegar: voltar a decidir por
// oauthIdentityFromSession faz todo usuário Google cair no caminho pesado.
ok(
  "NÃO decide por oauthIdentityFromSession",
  resolveCode.length > 0 && !/oauthIdentityFromSession\(user\)/.test(resolveCode),
  "o gatilho voltou a ser a identidade OAuth — todo login Google volta a revalidar por requisição"
);

/* ── O caminho barato ─────────────────────────────────────────────── */

// Um usuário Google já materializado tem id usr_ e precisa cair aqui.
ok("Caminho usr_ existe", /user\.id\.startsWith\("usr_"\)/.test(resolve));
ok("Caminho usr_ usa fetchUserByIdStrict", /fetchUserByIdStrict\(user\.id\)/.test(resolve));

// A ordem importa: o teste de id efêmero tem de vir ANTES do de usr_,
// senão um id `google-…` seria tratado como não-materializado sem materializar.
const ephemeralIdx = resolveCode.indexOf("isOAuthEphemeralSessionId(user.id)");
const usrIdx = resolveCode.indexOf('user.id.startsWith("usr_")');
ok(
  "Id efêmero é checado antes de usr_",
  ephemeralIdx >= 0 && usrIdx >= 0 && ephemeralIdx < usrIdx,
  `efemero@${ephemeralIdx} usr_@${usrIdx}`
);

/* ── ensureUserFromOAuth só no caminho de materialização ──────────── */

// O caminho barato não pode chamar ensureUserFromOAuth: é o custo que se
// queria eliminar (fetchUserByOAuthIdentity + fetchUserById + talvez UPDATE).
ok(
  "resolveSessionUser não chama ensureUserFromOAuth direto",
  resolveCode.length > 0 && !/ensureUserFromOAuth/.test(resolveCode)
);

const materialize = fnBody(SU, "materializeOAuthUser");
ok("materializeOAuthUser chama ensureUserFromOAuth", /ensureUserFromOAuth/.test(materialize));
ok("materializeOAuthUser é strict", /strict:\s*true/.test(materialize));

/* ── Os ids efêmeros são só de OAuth sem banco ────────────────────── */

ok(
  "Id efêmero é google-… ou discord-…",
  /\^\(google\|discord\)-/.test(IDS)
);
ok(
  "usr_ nunca é considerado efêmero",
  !/usr_/.test(IDS)
);

/* ── O backfill de apelido não deve reintroduzir custo por requisição ── */

const mat = fnBody(SU, "materializeSessionUser");
ok(
  "Backfill de apelido só quando o nickname está vazio",
  /resolved\.nickname\?\.trim\(\)\s*\|\|\s*!dbEnabled\(\)\)\s*return resolved/.test(mat)
);

console.log(`\nverify-oauth-session-cost: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
