/**
 * A-18 (r2): robots.txt e sitemap.xml do Next.js.
 * - sitemap lista exatamente as tres paginas abertas sem sessao (/, /compendios, /privacidade);
 *   /rpg/eldarin e /rpg/um-anel redirecionam para login e nao entram.
 * - robots libera "/" e fecha a area logada e a API.
 * Verificacao por leitura do codigo (nao sobe o servidor).
 * Uso: node scripts/verify-robots-sitemap.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import assert from "node:assert/strict";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(raiz, p), "utf8").replace(/\r\n/g, "\n");

const DOMINIO = "https://www.mxdrpg.com.br";
const PUBLICAS = ["/", "/compendios", "/privacidade"];
const PROIBIDAS_NO_SITEMAP = ["/rpg/eldarin", "/rpg/um-anel"];
const FORA_DO_INDICE = ["/api/", "/admin", "/mesa/", "/conta", "/aventura/", "/painel", "/personagem/"];

const robots = ler("app/robots.ts");
const sitemap = ler("app/sitemap.ts");

// Lista de strings de uma constante, na ordem em que aparece.
function literaisDe(src, nome) {
  const m = src.match(new RegExp(`const ${nome} = (\\[[^\\]]*\\])`));
  assert.ok(m, `${nome} encontrado`);
  return [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
}

assert.ok(robots.includes(`const SITE = "${DOMINIO}"`), "robots.ts usa o dominio https://www.mxdrpg.com.br");
assert.ok(sitemap.includes(`const SITE = "${DOMINIO}"`), "sitemap.ts usa o dominio https://www.mxdrpg.com.br");
assert.ok(/allow:\s*"\/"/.test(robots), "robots.ts libera indexacao (allow: \"/\")");
assert.ok(robots.includes("${SITE}/sitemap.xml"), "robots.ts aponta para /sitemap.xml");

assert.deepEqual(literaisDe(sitemap, "PAGINAS_PUBLICAS"), PUBLICAS, "sitemap lista exatamente as tres paginas publicas");
for (const proibida of PROIBIDAS_NO_SITEMAP) {
  assert.ok(!sitemap.includes(`"${proibida}"`), `sitemap nao lista ${proibida} (redireciona para login)`);
}

assert.deepEqual(literaisDe(robots, "FORA_DO_INDICE"), FORA_DO_INDICE, "robots fecha API e area logada");

console.log("verify-robots-sitemap: OK");
