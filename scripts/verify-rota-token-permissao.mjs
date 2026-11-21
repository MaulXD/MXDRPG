/**
 * ROTA-TOKEN: PATCH /api/room/[roomId]/tokens/[tokenId].
 *
 * Antes: sem sessão nada era conferido (qualquer um mudava vida, PA ou posição de
 * qualquer token); timedEffects sem conditions passava pela trava do mestre; e o
 * dono do token podia mandar qualquer campo (vida, PA). Agora: sem login 401;
 * condições e contadores só o mestre; o jogador só muda aparência do próprio token.
 * Conferido no site local: sem login 401, jogador em token alheio 403, jogador com
 * timedEffects 403, mestre com condições 200.
 *
 * node scripts/verify-rota-token-permissao.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "app", "api", "room", "[roomId]", "tokens", "[tokenId]", "route.ts"), "utf8");
const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const patch = src.slice(src.indexOf("export async function PATCH"), src.indexOf("export async function DELETE"));

let fail = 0;
function ok(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) fail++;
}

console.log("verify-rota-token-permissao: PATCH do token confere login e campos");
ok("sem sessão responde 401", /if \(!session\) \{\s*return NextResponse\.json\(\{ error: "Faça login" \}, \{ status: 401 \}\);/.test(patch));
ok("não há mais 'if (session)' deixando passar sem login", !/if \(session\) \{/.test(patch));
ok(
  "condições e contadores só com o mestre",
  /body\.conditions !== undefined \|\| body\.timedEffects !== undefined/.test(patch)
);
ok("jogador precisa controlar o token", /if \(!canMoveToken\(room, session\.user, token\)\)/.test(patch));
const keys = src.match(/PLAYER_TOKEN_PATCH_KEYS = new Set\(\[([^\]]*)\]\)/)?.[1] ?? "";
ok("jogador só muda aparência", keys.length > 0 && !/vida|pa\b|"pa"|axial|conditions|timedEffects/.test(keys));
ok("campos fora da lista são recusados", /filter\(\(k\) => !PLAYER_TOKEN_PATCH_KEYS\.has\(k\)\)/.test(patch));
ok("validação vem antes de gravar", patch.indexOf("PLAYER_TOKEN_PATCH_KEYS") < patch.indexOf("updateRoomToken("));
if (fail) process.exit(1);
