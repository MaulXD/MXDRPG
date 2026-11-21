// BV-085: o efeito que ressincroniza hpValue/hpMax com a vida salva do ator
// nao pode sobrescrever o que o mestre digitou. Regras:
// (1) onChange dos campos de vida marca a ref "editado" como true;
// (2) o efeito que reage a mudanca de vida salva so ressincroniza se !editado;
// (3) trocar de ator ressincroniza e zera "editado";
// (4) apos aplicar com sucesso, "editado" volta a false.
// Verificacao por leitura do arquivo.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "components", "vtt", "GmActorProgressPanel.tsx"), "utf8");
const falhas = [];

function exige(condicao, descricao) {
  if (!condicao) falhas.push(descricao);
}

// Bloco de cada useEffect: do "useEffect(" ate o "\n  }, [" que fecha as deps.
function blocosEffect() {
  const blocos = [];
  let i = src.indexOf("useEffect(");
  while (i >= 0) {
    const fim = src.indexOf("\n  }, [", i);
    const depsFim = fim >= 0 ? src.indexOf("]);", fim) + 3 : -1;
    if (fim < 0 || depsFim < 3) break;
    blocos.push({ corpo: src.slice(i, fim), deps: src.slice(fim, depsFim) });
    i = src.indexOf("useEffect(", depsFim);
  }
  return blocos;
}

exige(/useRef/.test(src.split("\n").find((l) => l.includes("from \"react\"")) ?? ""), "useRef nao importado de react");

const refMatch = src.match(/const\s+(\w+)\s*=\s*useRef\s*\(\s*false\s*\)/);
exige(!!refMatch, "ref de 'editado' (useRef(false)) nao encontrada");
const ref = refMatch ? refMatch[1] : "__sem_ref__";

// (1) onChange dos dois campos de vida marca editado.
for (const setter of ["setHpValue", "setHpMax"]) {
  const re = new RegExp(`onChange=\\{\\(e\\)\\s*=>\\s*\\{[^}]*${ref}\\.current\\s*=\\s*true[^}]*${setter}\\(e\\.target\\.value\\)[^}]*\\}\\}`);
  const reCurto = new RegExp(`onChange=\\{\\(e\\)\\s*=>\\s*\\{?\\s*${ref}\\.current\\s*=\\s*true[\\s;]*${setter}\\(e\\.target\\.value\\)`);
  exige(re.test(src) || reCurto.test(src), `onChange de ${setter} nao marca ${ref}.current = true`);
}

const blocos = blocosEffect();

// (2) efeito que depende da vida salva respeita editado.
const efeitoVida = blocos.find((b) => /vida\.value|vida\.max/.test(b.deps));
exige(!!efeitoVida, "efeito que reage a vida salva nao encontrado");
if (efeitoVida) {
  exige(
    new RegExp(`if\\s*\\(\\s*${ref}\\.current\\s*\\)\\s*return`).test(efeitoVida.corpo) ||
      new RegExp(`if\\s*\\(\\s*!\\s*${ref}\\.current\\s*\\)`).test(efeitoVida.corpo),
    "efeito de vida salva nao respeita a ref de editado"
  );
}

// (3) troca de ator ressincroniza e zera editado.
const efeitoAtor = blocos.find((b) => /selected\?\.id/.test(b.deps) && !/vida/.test(b.deps));
exige(!!efeitoAtor, "efeito de troca de ator (deps selected?.id) nao encontrado");
if (efeitoAtor) {
  exige(
    new RegExp(`${ref}\\.current\\s*=\\s*false`).test(efeitoAtor.corpo),
    "troca de ator nao zera a ref de editado"
  );
  exige(/setHpValue\(/.test(efeitoAtor.corpo) && /setHpMax\(/.test(efeitoAtor.corpo), "troca de ator nao ressincroniza hpValue/hpMax");
}

// (4) apos aplicar com sucesso, editado volta a false (dentro de run, no try).
const iRun = src.indexOf("async function run(");
const corpoRun = iRun >= 0 ? src.slice(iRun, src.indexOf("\n  if (!players.length)", iRun)) : "";
const iOk = corpoRun.indexOf("onUpdated(snapshot)");
exige(iOk > 0, "onUpdated(snapshot) nao encontrado em run");
const aposOk = iOk > 0 ? corpoRun.slice(iOk) : "";
exige(
  new RegExp(`${ref}\\.current\\s*=\\s*false`).test(aposOk),
  "apos aplicar com sucesso, a ref de editado nao volta a false"
);

// Nao mexer em XP nem nivel: o efeito de vida nao pode citar esses campos.
exige(!/xpTotal|targetLevel|setXpAmount|setTargetLevel/.test(efeitoVida?.corpo ?? ""), "efeito de vida mexe em XP ou nivel");

if (falhas.length) {
  console.error("verify-bv085-vida-campo-editado: FALHOU");
  for (const f of falhas) console.error(" - " + f);
  process.exit(1);
}
console.log("verify-bv085-vida-campo-editado: ok");
