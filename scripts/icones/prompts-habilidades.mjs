import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Gera docs/icones/prompts-habilidades.md (para ler) e docs/icones/prompts-habilidades.json (lote do Gemini).
 * Mesma regra das magias: o prompt pede SÓ a figura; a moldura vem de scripts/icones/compor.mjs.
 *   node scripts/icones/prompts-habilidades.mjs
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const habilidades = JSON.parse(readFileSync(join(ROOT, "data/compendiums/habilidades.json"), "utf8"));

const ESTILO =
  "fantasy RPG combat ability icon artwork, one single centered subject, painterly digital painting, " +
  "dramatic rim light, soft amethyst #8B7BB8 glow around the subject, " +
  "plain very dark background #0e0d0b, subject fills about 70% of the image with empty dark margin on all sides, " +
  "square 1:1, no border, no frame, no text, no letters, no watermark";

const MOTIVO = {
  "HAB-investida-em-linha": "a lone warrior dashing forward in a straight line, motion streaks trailing behind",
  "HAB-golpe-flanqueador": "two crossed blades closing in on a shadowy figure from both sides",
  "HAB-postura-defensiva": "a kite shield braced low with a planted boot behind it",
  "HAB-reflexos-de-masmorra": "a figure sidestepping an incoming spear thrust in a stone corridor, afterimage blur",
  "HAB-olhar-do-cacador": "a hawk-like eye with a crosshair rune reflected in the pupil",
  "HAB-investida-do-guerreiro": "an armored shoulder charging forward with a raised longsword and dust kicked up",
  "HAB-golpe-devastador": "a heavy greatsword striking down with a shockwave crack on the ground",
  "HAB-esquiva-tatica": "a cloaked silhouette rolling aside as an arrow passes through the cloak edge",
  "HAB-tiro-certeiro": "a single arrow flying dead center through a glowing ring target",
  "HAB-emboscada": "a dagger emerging from deep shadow behind a hooded figure's back",
  "HAB-finta": "a sword blade splitting into a false afterimage mid-swing",
  "HAB-passo-das-sombras": "a figure stepping out of one pool of shadow and into another",
  "HAB-raio-arcano": "a crackling violet arcane bolt shooting from an outstretched finger",
  "HAB-escudo-magico": "a hexagonal arcane barrier flaring in front of an open palm",
  "HAB-canalizar-energia": "a mace wreathed in holy golden radiance",
  "HAB-furia-controlada": "a clenched fist with red veins of rage held in check by an iron bracer",
  "HAB-investida-barbara": "a fur-clad barbarian charging with a two-handed axe, ground cracking under each step",
  "HAB-inspiracao-de-batalha": "a raised war horn with golden notes rising like sparks",
  "HAB-cancao-de-cura": "a lute whose strings release soft green healing light",
  "HAB-forma-selvagem": "a human hand turning into a wolf paw along a swirl of leaves and green bio-light",
  "HAB-raizes-prendentes": "thick roots bursting from the ground and coiling around a boot",
  "HAB-disparo-de-artilheiro": "a brass hand cannon firing a concentrated glowing shot",
  "HAB-barreira-de-cobre": "a copper-plated round barrier deflecting a spark of magic",
  "HAB-imposicao-de-maos": "two hands laid on a chest, warm golden light spreading from the palms",
  "HAB-golpe-sagrado": "a sword blade blazing with radiant white-gold light on impact",
  "HAB-raio-do-pacto": "an eldritch beam of dark violet energy with a patron sigil at its source",
  "HAB-raio-do-pacto-psiquico": "a pink-violet psychic beam with rippling mind waves pushing a target back",
  "HAB-raio-do-pacto-ardente": "an eldritch beam of infernal fire leaving a blood-red mark",
  "HAB-raio-do-pacto-salino": "an eldritch beam of icy sea-green frost with salt crystals",
  "HAB-luz-penitente": "a radiant flash bursting from a holy symbol, burning away skeletal shadows",
  "HAB-escudo-solar": "a sun-emblazoned shield catching a blow meant for an ally",
  "HAB-julgamento-ardente": "a burning sigil branded in the air above a marked foe",
  "HAB-coroa-de-fogo": "a crown of solar flames erupting outward in a ring",
  "HAB-lamina-dos-sepulcros": "a sword half radiant and half necrotic, glowing over a tombstone",
  "HAB-voto-de-caca": "a hunter's oath ribbon tied around a stake, a skull silhouette in the distance",
  "HAB-marca-do-limiar": "a glowing threshold rune painted on an ally's shoulder, dark tendrils recoiling from it",
  "HAB-processao-silenciosa": "a translucent spectral figure walking through a closed wooden door",
  "HAB-mordida-do-voto": "a bared beast fang glowing with a vow rune",
  "HAB-fera-interior": "a warrior's silhouette with the shadow of a roaring beast behind it",
  "HAB-carga-do-juramento": "a knight charging with a lowered lance, oath banner streaming behind",
  "HAB-pele-de-quimera": "a patchwork hide of lion fur, goat hair and serpent scales stitched together",
  "HAB-olhar-entre-dimensoes": "an eye opening inside a rift between two overlapping realities",
  "HAB-agarrao-do-pacto": "two dark tentacles rising from a portal and coiling around a target",
  "HAB-mente-partida": "a head silhouette cracked like glass with swirling confused thoughts",
  "HAB-sangue-do-patrono": "a drop of blood falling onto a glowing pact sigil",
  "HAB-pacto-de-ferro": "burning iron chains wrapping around a struggling figure",
  "HAB-correntes-infernais": "a blood seal circle on the ground with infernal chains rising from it",
  "HAB-corrente-mental": "a chain of glowing thought links echoing out from a head silhouette",
  "HAB-manto-de-bruma": "a hooded cloak dissolving into thick swirling mist",
  "HAB-puxao-abissal": "an icy abyssal hand pulling a figure forward from a dark rift",
  "CHI-golpe-de-chi": "an open-palm strike releasing a burst of white-blue chi force",
  "CHI-passo-do-vacuo": "a monk's bare foot stepping across an empty void, afterimage trail",
  "CHI-ferida-aberta": "two fingers pressing a vital pressure point with a glowing crack of light",
  "CHI-golpe-do-vacuo": "a fist wrapped in a vortex of void chi energy",
  "CHI-muro-de-chi": "a meditating monk surrounded by a dome of flowing chi light",
};

const tipo = (id) => (id.startsWith("CHI-") ? "Chi" : "Habilidade");

const linhas = [];
const faltando = [];
linhas.push("# Prompts dos ícones das habilidades");
linhas.push("");
linhas.push(
  `Feito em 21/11/2026 a partir de \`data/compendiums/habilidades.json\` (${habilidades.length} entradas, incluindo as de Chi). Mesmas regras de \`prompts-magias.md\`: só a figura central, a moldura vem de \`scripts/icones/compor.mjs\`. Gerado por \`scripts/icones/prompts-habilidades.mjs\`; não editar à mão.`
);
linhas.push("");
linhas.push("Arte crua: `assets-src/icones/habilidades/<catalogId>.png` (fora do git). Ícone final: `public/icons/habilidades/<catalogId>.webp`.");
linhas.push("");
linhas.push("| # | catalogId | Habilidade | Tipo | Prompt |");
linhas.push("|---|-----------|------------|------|--------|");
habilidades.forEach((h, i) => {
  const id = h.system.catalogId;
  const motivo = MOTIVO[id];
  if (!motivo) faltando.push(id);
  linhas.push(`| ${i + 1} | \`${id}\` | ${h.name} | ${tipo(id)} | ${motivo ?? "TODO"}, ${ESTILO} |`);
});
linhas.push("");

const extra = Object.keys(MOTIVO).filter((k) => !habilidades.some((h) => h.system.catalogId === k));
if (faltando.length || extra.length) {
  console.error("faltando:", faltando, "sobrando:", extra);
  process.exit(1);
}
mkdirSync(join(ROOT, "docs/icones"), { recursive: true });
writeFileSync(join(ROOT, "docs/icones/prompts-habilidades.md"), linhas.join("\n"), "utf8");
const lote = habilidades.map((h) => ({
  id: h.system.catalogId,
  nome: h.name,
  tipo: tipo(h.system.catalogId),
  prompt: `${MOTIVO[h.system.catalogId]}, ${ESTILO}`,
}));
writeFileSync(join(ROOT, "docs/icones/prompts-habilidades.json"), JSON.stringify(lote, null, 2) + "\n", "utf8");
console.log("ok", habilidades.length);
