/**
 * Monta os ícones finais: arte crua (do Gemini, sem borda) + moldura fixa.
 *
 *   node scripts/icones/compor.mjs magias            # compõe todas as artes que existirem
 *   node scripts/icones/compor.mjs magias --amostra  # gera amostras com arte falsa, só para ver a moldura
 *
 * Entrada: assets-src/icones/<categoria>/<catalogId>.png (fora do git, ver .gitignore)
 * Saída:   public/icons/<categoria>/<catalogId>.webp (256x256)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { GEMA_ESCOLA, JANELA, TAM, svgFundo, svgMascara, svgSobreposicao } from "./moldura.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SAIDA_PX = 256;

const CATEGORIAS = {
  magias: {
    compendio: "data/compendiums/magias.json",
    gema: (e) => GEMA_ESCOLA[e.system?.spell?.escola] ?? null,
  },
  habilidades: {
    compendio: "data/compendiums/habilidades.json",
    // Chi ganha gema branco-azulada; as demais habilidades ficam só com a moldura.
    gema: (e) => (String(e.system?.catalogId ?? "").startsWith("CHI-") ? "#bfe3f2" : null),
  },
};

function svg(buf) {
  return Buffer.from(buf);
}

/** Recorta a arte em quadrado, encaixa na janela e esfuma as bordas. */
async function arteNaJanela(arteBuf) {
  const { x, y, lado } = JANELA;
  const arte = await sharp(arteBuf).resize(lado, lado, { fit: "cover" }).png().toBuffer();
  const tela = await sharp({
    create: { width: TAM, height: TAM, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: arte, left: x, top: y }])
    .png()
    .toBuffer();
  const mascara = await sharp(svg(svgMascara())).ensureAlpha().extractChannel(3).toBuffer();
  return sharp(tela).removeAlpha().joinChannel(mascara).png().toBuffer();
}

export async function comporIcone(arteBuf, gema) {
  const arte = await arteNaJanela(arteBuf);
  // sharp aplica resize antes do composite: compõe em 512 e só depois reduz.
  const cheio = await sharp(svg(svgFundo()))
    .composite([{ input: arte }, { input: svg(svgSobreposicao(gema)) }])
    .png()
    .toBuffer();
  return sharp(cheio)
    .resize(SAIDA_PX, SAIDA_PX)
    .webp({ quality: 90 })
    .toBuffer();
}

/** Arte falsa (círculo com brilho) só para conferir a moldura. */
function arteFalsa(cor) {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="#0e0d0b"/>
  <circle cx="256" cy="256" r="150" fill="${cor}" opacity="0.85"/>
  <circle cx="210" cy="205" r="45" fill="#fff" opacity="0.35"/>
</svg>`);
}

async function main() {
  const [categoria = "magias", flag] = process.argv.slice(2);
  const cfg = CATEGORIAS[categoria];
  if (!cfg) throw new Error(`categoria desconhecida: ${categoria}`);
  const entradas = JSON.parse(readFileSync(join(ROOT, cfg.compendio), "utf8"));
  const porId = new Map(entradas.map((e) => [e.system.catalogId, e]));

  if (flag === "--amostra") {
    const dir = join(ROOT, "assets-src", "icones", "_amostras");
    mkdirSync(dir, { recursive: true });
    const vistas = new Set();
    for (const e of entradas) {
      const gema = cfg.gema(e);
      if (vistas.has(gema)) continue;
      vistas.add(gema);
      const out = join(dir, `${categoria}-${e.system.spell?.escola ?? (gema ? "gema" : "sem")}.webp`);
      await sharp(await comporIcone(await sharp(arteFalsa(gema ?? "#8B7BB8")).png().toBuffer(), gema)).toFile(out);
      console.log("amostra", out);
    }
    return;
  }

  const entrada = join(ROOT, "assets-src", "icones", categoria);
  const saida = join(ROOT, "public", "icons", categoria);
  if (!existsSync(entrada)) {
    console.log(`sem artes em ${entrada}`);
    return;
  }
  mkdirSync(saida, { recursive: true });
  let feitos = 0;
  const desconhecidos = [];
  for (const arq of readdirSync(entrada)) {
    if (!/\.(png|jpe?g|webp)$/i.test(arq)) continue;
    const id = arq.replace(/\.[^.]+$/, "");
    const e = porId.get(id);
    if (!e) {
      desconhecidos.push(arq);
      continue;
    }
    const buf = await comporIcone(readFileSync(join(entrada, arq)), cfg.gema(e));
    await sharp(buf).toFile(join(saida, `${id}.webp`));
    feitos++;
  }
  console.log(`${feitos} de ${porId.size} ícones de ${categoria} compostos em public/icons/${categoria}`);
  if (desconhecidos.length) console.log("arquivos sem catalogId conhecido:", desconhecidos.join(", "));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
