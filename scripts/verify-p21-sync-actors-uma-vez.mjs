// P-21: o efeito que faz POST /api/room/[roomId]/sync-actors em
// components/vtt/MesaWorkspace.tsx nao pode ter snapshot ou snapshot?.revision
// nas dependencias; senao roda de novo a cada revisao da sala. A comparacao
// data.revision > revisao atual le a revisao por store ou ref, nao pelo closure.
// Verificacao por leitura do arquivo.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "components", "vtt", "MesaWorkspace.tsx"), "utf8");
const falhas = [];

function exige(condicao, descricao) {
  if (!condicao) falhas.push(descricao);
}

const iFetch = src.indexOf("/sync-actors");
exige(iFetch > 0, "chamada a /sync-actors nao encontrada");

// Efeito que contem o fetch: do useEffect( anterior ate o fechamento das deps.
const iEffect = src.lastIndexOf("useEffect(", iFetch);
const iDeps = src.indexOf("\n  }, [", iFetch);
exige(iEffect > 0 && iDeps > iFetch, "efeito do sync-actors nao encontrado");
const corpo = src.slice(iEffect, iDeps);
const depsLinha = src.slice(iDeps, src.indexOf("]);", iDeps) + 1);

// (1) dependencias sem snapshot nem snapshot?.revision.
exige(!/snapshot/.test(depsLinha), "dependencias do efeito sync-actors ainda citam snapshot: " + depsLinha.trim());
exige(!/revision/.test(depsLinha), "dependencias do efeito sync-actors ainda citam revision");

// (2) a comparacao da revisao nao usa snapshot do closure.
const iCmp = corpo.indexOf("data.revision >");
exige(iCmp > 0, "comparacao data.revision > ... nao encontrada no efeito");
const linhaCmp = corpo.slice(iCmp, corpo.indexOf("\n", iCmp));
exige(!/snapshot/.test(linhaCmp), "comparacao data.revision usa snapshot do closure");
exige(
  /getMesaRoomStore\(roomId\)\.getRevision\(\)|revisaoAtualRef\.current|\.current\b/.test(linhaCmp),
  "comparacao data.revision nao le revisao por store ou ref"
);

// (3) continua rodando ao montar/trocar sala, em idle, com refresh quando a revisao sobe.
exige(corpo.includes("requestIdleCallback(runSync"), "requestIdleCallback(runSync) sumiu");
exige(corpo.includes("setTimeout(runSync, 6000)"), "fallback setTimeout(runSync, 6000) sumiu");
exige(corpo.includes("void refresh();"), "refresh quando a revisao do sync e maior sumiu");
exige(/\[roomId, inviteCode, watchOnly, session\?\.id, refresh\]/.test(depsLinha), "deps de roomId/inviteCode/sessao/refresh mudaram");

if (falhas.length > 0) {
  console.error("verify-p21-sync-actors-uma-vez: FALHOU");
  for (const f of falhas) console.error(" - " + f);
  process.exit(1);
}
console.log("verify-p21-sync-actors-uma-vez: OK");
