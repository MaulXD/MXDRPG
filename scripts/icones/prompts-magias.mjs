import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Gera docs/icones/prompts-magias.md (para ler) e docs/icones/prompts-magias.json (para o lote do Gemini).
 * O prompt pede SÓ a figura: a moldura dourada é posta depois por scripts/icones/compor.mjs.
 *   node scripts/icones/prompts-magias.mjs
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const magias = JSON.parse(readFileSync(join(ROOT, "data/compendiums/magias.json"), "utf8"));

const ESTILO =
  "fantasy RPG spell icon artwork, one single centered subject, painterly digital painting, " +
  "dramatic rim light, soft amethyst #8B7BB8 magical glow around the subject, " +
  "plain very dark background #0e0d0b, subject fills about 70% of the image with empty dark margin on all sides, " +
  "square 1:1, no border, no frame, no text, no letters, no watermark";

const MOTIVO = {
  "MAG-chama-de-fogareiro": "a small tame flame dancing above a cast-iron cooking pot",
  "MAG-lamina-de-espirito": "a translucent ghostly dagger of blue-white spirit energy hovering over a butcher's cutting board",
  "MAG-detectar-veneno": "a glowing eye above a small vial with a green skull-shaped wisp rising from it",
  "MAG-estabilizar": "an open hand pressed over a faint heartbeat line, soft white light holding the line steady",
  "MAG-maos-firmes": "two steady hands gripping a carving knife, faint runic bands around the wrists",
  "MAG-extracao-amplificada": "a glowing monster organ splitting into two identical copies, green bio-runes around it",
  "MAG-maos-gelidas": "two open palms releasing a cone of frost shards",
  "MAG-crescimento-acelerado": "a seed bursting into a full sapling inside a spiral of green time-light",
  "MAG-purificar-veneno": "a toxic green drop turning into clear water inside a small ward circle",
  "MAG-identificar-ingrediente": "a lens of light over a strange mushroom, revealing glowing runes inside it",
  "MAG-armadura-arcana": "a translucent breastplate made of hexagonal arcane light runes",
  "MAG-onda-de-trovao": "a cube-shaped thunder shockwave with rippling rings of air",
  "MAG-curar-ferimentos": "an open hand of warm golden light closing a wound",
  "MAG-chama-de-vinha": "a fiery projectile shaped like a burning grapevine tendril",
  "MAG-sussurro-de-masmorra": "two silhouetted heads linked by a whispering violet thread under a stone dungeon arch",
  "MAG-aprimoramento-biomagico": "a steaming bowl of stew with a glowing rune rising from the steam",
  "MAG-raios-de-enfraquecimento": "three thin sickly grey-green rays fanning out from a skeletal hand",
  "MAG-esfera-acida-de-monstro": "a bubbling sphere of acid wrapped in a monster gland membrane, dripping droplets",
  "MAG-transmutacao-de-carne": "a cut of meat morphing into a griffin feather along a spiral of light",
  "MAG-inspiracao-culinaria": "a chef's ladle with sparkling ribbons of flavor rising from it",
  "MAG-preservacao-perfeita": "an ingredient sealed inside a glowing crystal jar with a time sigil on the lid",
  "MAG-forma-menor": "a robed silhouette shrinking into a small fox along a transformation spiral",
  "MAG-escudo-arcano": "a round shield of shimmering violet light deflecting an incoming bolt",
  "MAG-ilusao-menor": "a floating mirage cube showing a translucent wavy image of a door",
  "MAG-muralha-de-energia": "a straight wall made of three luminous hexagonal panels",
  "MAG-animacao-de-mortos": "two skeletal hands rising from the earth wrapped in green necrotic wisps",
  "MAG-injecao-biomagica": "a glass syringe filled with glowing monster essence",
  "MAG-bola-de-fogo": "a roaring spherical fireball explosion",
  "MAG-nova-arcana": "a radial burst ring of violet and orange arcane fire",
  "MAG-contagio-necrotico": "dark spores spreading from a touching hand, sickly green veins",
  "MAG-ventania": "a swirling gust of wind blowing out a candle flame and scattering spores",
  "MAG-ler-mentes": "a head in profile with glowing thought lines and a third eye on the forehead",
  "MAG-relampago": "a single jagged lightning bolt striking downward",
  "MAG-sono": "a crescent moon with drifting closed eyes and soft mist",
  "MAG-raio-do-limiar": "a black-violet beam bursting out of a cracked stone doorway",
  "MAG-visao-do-ecossistema": "an eye whose iris is a small forest with a hawk silhouette flying across it",
  "MAG-murcha": "a flower withering to dust while its life drains as light into a hand",
  "MAG-mutacao-forcada": "a twisted arm sprouting random scales and extra eyes",
  "MAG-parede-de-fogo": "a tall wall of flames rising from cracked ground",
  "MAG-preservacao-anual": "an ingredient trapped in amber, encircled by a ring of twelve small moons",
  "MAG-cura-em-massa": "six small figures in a circle bathed by golden light from above",
  "MAG-ressurreicao-incompleta": "a pale figure rising from a grave with a single faint glowing heart",
  "MAG-grande-transmutacao-biomagica": "a huge monster heart on a stone altar radiating mutation runes",
  "MAG-cone-de-frio": "a wide cone of blizzard ice blasting from an outstretched hand",
  "MAG-despertar": "an old tree with a wise face opening its glowing eyes",
  "MAG-salto-dimensional": "a figure stepping between two linked violet portals",
  "MAG-restaurar-vigor": "a tired figure straightening up as dark chains of fatigue break apart",
  "MAG-causar-praga": "a cloud of green-black flies swirling around a skull",
  "MAG-desintegrar": "a thin green ray turning a stone figure into floating dust particles",
  "MAG-cadeia-de-relampago": "lightning arcing in a chain between four points",
  "MAG-forma-de-monstro": "a human silhouette transforming into a horned monster",
  "MAG-prisao-de-gelo": "a creature encased in a jagged block of ice",
  "MAG-regeneracao-biomagica": "flesh knitting together with green vines and pulsing light",
  "MAG-invisibilidade-maior": "a group of figures fading into translucent outlines",
  "MAG-terremoto": "cracked ground splitting apart with falling stones",
  "MAG-biomancia-suprema-transcendencia": "a dragon eye, a kraken tentacle and a horned skull merging into a glowing double helix",
  "MAG-desejo-de-morte": "an hourglass with a skull inside, sealed by a wax contract seal",
  "MAG-maos-ardentes": "two hands wreathed in fire reaching forward",
  "MAG-gelo-de-conservacao": "a fish inside a block of clear ice with a stasis clock rune",
  "MAG-fermentacao-acelerada": "a bubbling clay jar with a time spiral of rising bubbles",
  "MAG-purificacao-abencoada": "a holy sigil burning away a black curse mark",
  "MAG-esporos-necroticos": "a cloud of dark mushroom spores drifting outward",
  "MAG-grande-decomposicao": "a cube of organic matter dissolving into soil and small mushrooms",
  "MAG-doce-confuso": "a wrapped candy with a frightening swirling face emerging from it",
};

const linhas = [];
const faltando = [];
linhas.push("# Prompts dos ícones das magias");
linhas.push("");
linhas.push(
  "Refeito em 21/11/2026 a partir de `data/compendiums/magias.json` (64 magias). A lista antiga (artifact de 2026-07-09) não existe mais."
);
linhas.push("");
linhas.push("O prompt pede só a figura central, sem borda. A moldura (borda dourada `#c4a44a`, brilho ametista `#8B7BB8`, fundo `#0e0d0b`, gema com a cor da escola) é posta depois por `scripts/icones/compor.mjs`, igual em todos os ícones. Gerado por `scripts/icones/prompts-magias.mjs`; não editar à mão.");
linhas.push("");
linhas.push("Arte crua: `assets-src/icones/magias/<catalogId>.png` (fora do git). Ícone final: `public/icons/magias/<catalogId>.webp`. O `catalogId` liga a imagem à magia no código.");
linhas.push("");
linhas.push("| # | catalogId | Magia | Escola · nível | Prompt |");
linhas.push("|---|-----------|-------|----------------|--------|");
magias.forEach((m, i) => {
  const id = m.system.catalogId;
  const motivo = MOTIVO[id];
  if (!motivo) faltando.push(id);
  const sp = m.system.spell ?? {};
  const prompt = `${motivo ?? "TODO"}, ${ESTILO}`;
  linhas.push(`| ${i + 1} | \`${id}\` | ${m.name} | ${sp.escola ?? ""} · ${sp.nivel ?? ""} | ${prompt} |`);
});
linhas.push("");

const extra = Object.keys(MOTIVO).filter((k) => !magias.some((m) => m.system.catalogId === k));
if (faltando.length || extra.length) {
  console.error("faltando:", faltando, "sobrando:", extra);
  process.exit(1);
}
mkdirSync(join(ROOT, "docs/icones"), { recursive: true });
writeFileSync(join(ROOT, "docs/icones/prompts-magias.md"), linhas.join("\n"), "utf8");
const lote = magias.map((m) => ({
  id: m.system.catalogId,
  nome: m.name,
  escola: m.system.spell?.escola ?? null,
  prompt: `${MOTIVO[m.system.catalogId]}, ${ESTILO}`,
}));
writeFileSync(join(ROOT, "docs/icones/prompts-magias.json"), JSON.stringify(lote, null, 2) + "\n", "utf8");
console.log("ok", magias.length);
