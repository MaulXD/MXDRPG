/**
 * BV-005 (D27): os tres botoes Passar (barra inferior, HUD do token e celular)
 * precisam passar pelo mesmo modal EndTurnConfirmDialog antes de passTurn.
 * Teste estatico do codigo-fonte, sem navegador.
 * node scripts/verify-end-turn-confirm.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const hook = read("hooks/vtt/useEndTurnConfirm.ts");
assert.match(hook, /export function useEndTurnConfirm/, "hook useEndTurnConfirm deve existir");
assert.match(hook, /const onCancel = useCallback\(\(\) => setOpenForTokenId\(null\), \[\]\)/, "onCancel precisa de useCallback estavel");
assert.match(hook, /paTurnRulesForActor\(actor\)/, "paRules deve usar a regra da ficha (como o servidor)");
assert.match(hook, /paTurnRulesForMonster\(token\.monsterTier\)/, "paRules de monstro deve usar a regra de monstro");
assert.match(hook, /\.catch\(\(\) => undefined\)[\s\S]*?\.finally\(\(\) => setOpenForTokenId\(null\)\)/, "confirmar deve fechar o modal depois do passTurn");
assert.match(hook, /openForTokenId === activeTokenId/, "modal fecha sozinho se o turno ativo mudar (confirmar nao pode passar o turno do proximo)");

const paths = [
  {
    file: "components/vtt/EndTurnBar.tsx",
    trigger: /onClick=\{requestEndTurn\}/,
  },
  {
    file: "components/vtt/CharacterCombatHud.tsx",
    trigger: /function handleEndTurn\(\) \{[\s\S]*?requestEndTurn\(\);[\s\S]*?\}/,
    button: /hud-btn--pass[\s\S]*?onClick=\{\(\) => void handleEndTurn\(\)\}/,
  },
  {
    file: "components/vtt/MesaWorkspace.tsx",
    trigger: /const handleMobileEndTurn = useCallback\(\(\) => \{\s*requestMobileEndTurn\(\);/,
    button: /<MesaMobileBar[\s\S]*?onEndTurn=\{\(\) => void handleMobileEndTurn\(\)\}/,
  },
];

for (const p of paths) {
  const src = read(p.file);
  assert.match(src, /import \{ useEndTurnConfirm \} from "@\/hooks\/vtt\/useEndTurnConfirm"/, `${p.file}: importar o hook`);
  assert.match(src, /import \{ EndTurnConfirmDialog \} from "@\/components\/vtt\/EndTurnConfirmDialog"/, `${p.file}: importar o modal`);
  assert.match(src, /useEndTurnConfirm\(\{/, `${p.file}: usar o hook`);
  assert.match(src, /<EndTurnConfirmDialog \{\.\.\.(dialog|mobileEndTurnDialog)\} \/>/, `${p.file}: renderizar o modal`);
  assert.match(src, p.trigger, `${p.file}: o clique Passar deve abrir o modal, nao passar direto`);
  if (p.button) assert.match(src, p.button, `${p.file}: botao Passar ligado ao handler de confirmacao`);
  assert.doesNotMatch(src, /passTurn\(\)|passMobileTurn\(\)/, `${p.file}: nao chamar passTurn direto no componente`);
}

const bar = read("components/vtt/EndTurnBar.tsx");
assert.match(bar, /onClick=\{requestEndTurn\}/, "EndTurnBar: botao Passar abre o modal");

console.log("verify-end-turn-confirm: ok (barra, HUD e celular)");
