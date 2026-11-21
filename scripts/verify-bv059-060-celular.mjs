/**
 * BV-059: no celular a tabela Equipamento de Guerra da ficha do Um Anel passava
 * 18px da folha e os botões de remover arma ficavam fora do papel.
 * BV-060: no celular a ficha aberta pelo painel Personagens jogáveis ficava atrás
 * do painel (folha que cobre a tela).
 * Conferido no site local em 390x844: tabela 55-325 numa janela de 369; ficha na frente.
 *
 * node scripts/verify-bv059-060-celular.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(root, ...p), "utf8").replace(/\r\n/g, "\n");
const VIEW = read("components", "character", "sheet", "TorCharacterSheetView.tsx");
const CSS = read("components", "character", "sheet", "tor-sheet.css");
const WS = read("components", "vtt", "MesaWorkspace.tsx");

let fail = 0;
const ok = (n, c) => {
  console.log(`  ${c ? "✓" : "✗"} ${n}`);
  if (!c) fail++;
};
console.log("verify-bv059-060-celular: ficha do Um Anel e painel no celular");
ok("BV-059: tabela de armas dentro de .tor-sheet__table-wrap", /<div className="tor-sheet__table-wrap">\s*<table className="tor-sheet__table">/.test(VIEW));
ok("BV-059: a caixa limita a largura e rola", /\.tor-sheet__table-wrap \{[^}]*max-width: 100%;[^}]*overflow-x: auto;/.test(CSS));
ok("BV-059: no celular a tabela encolhe (padding menor e quebra de palavra)", /@media \(max-width: 480px\)[\s\S]*overflow-wrap: anywhere;/.test(CSS));
ok("BV-060: fecha o painel lateral no celular (mesmo corte de 767px do CSS)", /matchMedia\("\(max-width: 767px\)"\)/.test(WS) && /windows\.closePanels\(FOUNDRY_DOCK_PANEL_IDS\.filter\(\(id\) => !windows\.isFloating\(id\)\)\)/.test(WS));
const sheetFns = WS.match(/const openSheet = useCallback\([\s\S]*?\n  \);\n/)?.[0] ?? "";
const torFns = WS.match(/const openTorSheet = useCallback\([\s\S]*?\n  \);\n/)?.[0] ?? "";
ok("BV-060: ficha do Eldarin e do Um Anel chamam closeDockOnPhone", /closeDockOnPhone\(\)/.test(sheetFns) && /closeDockOnPhone\(\)/.test(torFns));
if (fail) process.exit(1);
