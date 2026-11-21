/**
 * D-14: sem contas persistentes, POST /api/auth/register responde 503 com a mesma frase
 * que a tela /entrar mostra, e usa a mesma checagem (getAuthCapabilities().persistentAccounts).
 * Verificação por leitura do código (padrão dos verify-*.mjs de rota).
 * node scripts/verify-d14-cadastro-sem-banco.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ler = (rel) => readFileSync(join(__dirname, "..", rel), "utf8");

const FRASE = "Novos cadastros estão indisponíveis no momento.";

const CAP = ler("lib/auth/auth-capabilities.ts");
assert.ok(
  CAP.includes(`export const FRASE_CADASTRO_INDISPONIVEL = "${FRASE}";`),
  "auth-capabilities exporta a frase de cadastro indisponível"
);
assert.ok(
  CAP.includes("`E-mail e senha. ${FRASE_CADASTRO_INDISPONIVEL}`"),
  "authLoginLead usa a mesma constante na tela /entrar"
);

const ROTA = ler("app/api/auth/register/route.ts");
assert.ok(
  ROTA.includes("getAuthCapabilities().persistentAccounts"),
  "rota de cadastro usa a mesma checagem da tela (persistentAccounts)"
);
assert.ok(
  ROTA.includes("{ status: 503 }") && ROTA.includes("FRASE_CADASTRO_INDISPONIVEL"),
  "rota responde 503 com a frase de cadastro indisponível"
);
const posChecagem = ROTA.indexOf("persistentAccounts");
const posRegistro = ROTA.indexOf("registerUser(");
assert.ok(posChecagem > 0 && posRegistro > posChecagem, "checagem vem antes de registerUser (nada é criado sem banco)");

const ENTRAR = ler("app/entrar/page.tsx");
assert.ok(
  ENTRAR.includes("getAuthCapabilities()") && ENTRAR.includes("authLoginLead(auth)"),
  "tela /entrar usa getAuthCapabilities, a mesma fonte da rota"
);

console.log("verify-d14-cadastro-sem-banco: OK");
