/**
 * Gera as artes cruas dos ícones pela API do Gemini (imagem), uma por prompt.
 * Só a figura: a moldura vem depois, de scripts/icones/compor.mjs.
 *
 *   node --env-file-if-exists=.env.local scripts/icones/gerar-gemini.mjs magias --so MAG-bola-de-fogo,MAG-sono
 *   node --env-file-if-exists=.env.local scripts/icones/gerar-gemini.mjs magias --limite 10
 *   node --env-file-if-exists=.env.local scripts/icones/gerar-gemini.mjs magias          # todas que faltam
 *
 * Precisa de GEMINI_API_KEY no ambiente. Modelo: GEMINI_IMAGE_MODEL (padrão abaixo).
 * Pula o que já existe em assets-src/icones/<categoria>/ (apague o arquivo para refazer).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MODELO = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";
const CHAVE = process.env.GEMINI_API_KEY?.trim();

function args() {
  const [categoria = "magias", ...resto] = process.argv.slice(2);
  const opt = { categoria, so: null, limite: Infinity };
  for (let i = 0; i < resto.length; i++) {
    if (resto[i] === "--so") opt.so = new Set(resto[++i].split(",").map((s) => s.trim()));
    else if (resto[i] === "--limite") opt.limite = Number(resto[++i]);
  }
  return opt;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function gerarUma(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;
  const corpo = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
  };
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": CHAVE },
      body: JSON.stringify(corpo),
    });
    if (res.status === 429 || res.status >= 500) {
      await espera(5000 * tentativa);
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`${res.status}: ${json?.error?.message ?? "erro"}`);
    const parte = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!parte) throw new Error(`sem imagem na resposta (${json?.candidates?.[0]?.finishReason ?? "?"})`);
    return Buffer.from(parte.inlineData.data, "base64");
  }
  throw new Error("limite de tentativas (429/5xx)");
}

async function main() {
  if (!CHAVE) {
    console.error("Falta GEMINI_API_KEY no ambiente (.env.local).");
    process.exit(1);
  }
  const { categoria, so, limite } = args();
  const lote = JSON.parse(readFileSync(join(ROOT, "docs", "icones", `prompts-${categoria}.json`), "utf8"));
  const dir = join(ROOT, "assets-src", "icones", categoria);
  mkdirSync(dir, { recursive: true });

  let feitos = 0;
  const falhas = [];
  for (const item of lote) {
    if (feitos >= limite) break;
    if (so && !so.has(item.id)) continue;
    const destino = join(dir, `${item.id}.png`);
    if (existsSync(destino)) continue;
    try {
      writeFileSync(destino, await gerarUma(item.prompt));
      feitos++;
      console.log(`ok ${item.id}`);
    } catch (err) {
      falhas.push(item.id);
      console.log(`falhou ${item.id}: ${err.message}`);
    }
    await espera(1500);
  }
  console.log(`${feitos} geradas, ${falhas.length} falhas (modelo ${MODELO})`);
  if (falhas.length) process.exitCode = 1;
}

await main();
