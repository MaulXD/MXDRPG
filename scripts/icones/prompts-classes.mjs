import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Gera docs/icones/prompts-classes.md (para ler) e docs/icones/prompts-classes.json (lote do Gemini).
 * 12 classes + as subclasses de data/character/subclass-tracks.json. Mesma regra das magias:
 * o prompt pede SÓ a figura; a moldura vem de scripts/icones/compor.mjs, com a gema na cor da
 * classe (CLASS_ICON_COLOR de lib/character/wizard-icons.ts), igual para a classe e suas subclasses.
 *   node scripts/icones/prompts-classes.mjs
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { tracks } = JSON.parse(readFileSync(join(ROOT, "data/character/subclass-tracks.json"), "utf8"));
const iconesTs = readFileSync(join(ROOT, "lib/character/wizard-icons.ts"), "utf8");
const blocoCor = iconesTs.match(/CLASS_ICON_COLOR[^{]*\{([\s\S]*?)\};/)?.[1] ?? "";
const COR_CLASSE = Object.fromEntries([...blocoCor.matchAll(/(\S+?):\s*"(#[0-9a-fA-F]{6})"/g)].map((m) => [m[1], m[2]]));

const ESTILO =
  "fantasy RPG class emblem artwork, one single centered subject, painterly digital painting, " +
  "dramatic rim light, soft amethyst #8B7BB8 glow around the subject, " +
  "plain very dark background #0e0d0b, subject fills about 70% of the image with empty dark margin on all sides, " +
  "square 1:1, no border, no frame, no text, no letters, no watermark";

/** Sem acento no id: vira nome de arquivo e URL. O canonId do código (CLA-clérigo) fica no JSON. */
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const MOTIVO_CLASSE = {
  Guerreiro: "a battle-worn longsword crossed over a dented round shield",
  Patrulheiro: "a longbow and a hunting knife resting on a forest trail map",
  Ladino: "a curved dagger and a ring of lockpicks over a hooded mask",
  Mago: "an open spellbook with a violet arcane sigil floating above its pages",
  "Clérigo": "a radiant holy symbol held up in a gloved hand, golden light pouring from it",
  "Bárbaro": "a massive two-handed axe wrapped in fur and bone trophies",
  Bardo: "a carved lute with musical notes glowing in the air around it",
  Druida: "a gnarled wooden staff sprouting fresh leaves and mushrooms",
  Feiticeiro: "a hand with wild magic sparks bursting from glowing veins",
  Espiritualista: "a monk's wrapped fist with a calm swirl of chi energy around it",
  Paladino: "a sword held point down before a shining sunburst emblem",
  Bruxo: "a pact tome bound in chains with an eldritch eye on its cover",
};

const MOTIVO_SUB = {
  "cacador-de-feras": "a hunter's spear crossed with a great beast claw",
  "quebrador-de-carapacas": "a heavy war hammer cracking a giant insect carapace",
  "cavaleiro-draconico": "a knight's helm crested with dragon scales and small horns",
  "sentinela-das-profundezas": "a trident rising from dark water with a frog-like amphibian silhouette",
  "cacador-do-ceu": "a hawk diving beside a drawn longbow against the sky",
  "explorador-de-esporos": "a ranger's lantern lighting a cluster of glowing spore mushrooms",
  "rastreador-de-escamas": "a reptile footprint trail with a basilisk eye glaring above it",
  "mestre-de-enxame": "a swirl of glowing insects orbiting an open hand",
  "sombra-eterea": "a translucent ghostly rogue fading into wisps of ectoplasm",
  "forma-amorfa": "a dagger half-swallowed by a stretching translucent slime",
  "assassino-venenoso": "a dagger dripping green poison beside a coiled venomous snake",
  "corsario-de-cripta": "a skull wearing a pirate tricorn over crossed bone daggers",
  "piromante-das-brasas": "a wizard's hand cupping glowing embers that rise into flames",
  "criomante-do-gelo": "an ice crystal staff head radiating frost",
  "mago-alquimico": "a bubbling alchemical flask with a glowing catalyst rune",
  "alquimista-acido": "a cracked glass vial leaking corrosive green acid smoke",
  "mago-dos-encantos": "a hypnotic swirling violet eye inside a floating mirror",
  "sacerdote-purificador": "a holy censer releasing white smoke that burns away a dark curse",
  "clerigo-contemplativo": "a meditating cleric silhouette with a radiant halo of inner light",
  "clerigo-do-sustento": "a sacred bread loaf and wheat sheaf glowing with divine light",
  "pastor-de-quimeras": "a shepherd's crook with a small chimera of lion, goat and snake curled at its base",
  "clerigo-do-limiar": "a lantern held at a stone threshold, faint undead shapes beyond it",
  "devorador-de-essencia": "a barbarian's hand crushing a glowing monster heart",
  "mandibula-de-ferro": "an iron-reinforced jaw biting through a bone and chitin shard",
  "colosso-do-gelo": "a giant frost-covered fist with icicles hanging from the knuckles",
  "berserker-veloz": "a barbarian blur dashing forward with twin axes and speed streaks",
  "estratega-de-masmorra": "a dungeon map pinned with a dagger and small tactical markers",
  "bardo-fermentador": "a lute next to a foaming tankard of glowing brew",
  "dancarino-das-laminas": "two curved blades spinning with flowing feathers around them",
  "cantor-dos-venenos": "a pan flute wrapped in poisonous herbs with green notes rising",
  "circulo-da-podridao": "a circle of rotting fungi and dark spores around a stone",
  "circulo-do-predador": "a druid staff topped with a wolf skull and bared fangs",
  "circulo-da-simbiose": "a glowing magical seed sprouting thorned vines in a circle",
  "circulo-da-terra": "a stone circle rising from the ground with mineral crystals",
  "linhagem-bestial": "a sorcerer's eye with a beast-like slit pupil and claw marks around it",
  "sangue-selvagem": "a drop of blood mutating into wild swirling colors",
  "eco-abissal": "concentric dark sound waves echoing from a deep abyssal void",
  "chama-inata": "a heart-shaped flame burning inside a chest silhouette",
  "punho-do-limiar": "a precise fist strike landing on a pressure-point rune",
  "tecelao-do-vacuo": "hands weaving threads of empty void between two distant points",
  "asceta-da-dor": "a bleeding wrapped fist turning red drops into chi light",
  "guardiao-da-respiracao": "a calm monk exhaling a protective ring of breath-mist",
  "jurado-do-sol": "a radiant sun oath emblem on a paladin's shield",
  "cavaleiro-do-limiar": "a knight's sword held across a stone threshold, holy light against shadow",
  "guardiao-da-gorge": "a sacred chimera beast standing guard over a paladin's shield",
  "filho-da-voragem": "a swirling vortex with tentacles reaching from its center",
  "herdeiro-do-sangue": "a devil-horned sigil written in burning blood",
  "voz-das-profundezas": "an ancient sea creature's eye glowing in deep murky water",
};

const classes = Object.keys(MOTIVO_CLASSE);
const itens = [];
for (const c of classes) {
  const canon = `CLA-${c.toLowerCase()}`;
  itens.push({ id: `CLA-${semAcento(c)}`, canonId: canon, nome: c, tipo: "Classe", classe: c, gema: COR_CLASSE[c] ?? null, motivo: MOTIVO_CLASSE[c] });
  for (const t of tracks.filter((t) => t.classId === c)) {
    itens.push({ id: `SUB-${t.id}`, canonId: null, nome: t.subclass, tipo: "Subclasse", classe: c, gema: COR_CLASSE[c] ?? null, motivo: MOTIVO_SUB[t.id] });
  }
}

const problemas = [];
for (const c of classes) if (!COR_CLASSE[c]) problemas.push(`sem cor: ${c}`);
for (const t of tracks) if (!classes.includes(t.classId)) problemas.push(`classe desconhecida na trilha ${t.id}: ${t.classId}`);
for (const i of itens) if (!i.motivo) problemas.push(`sem motivo: ${i.id}`);
for (const k of Object.keys(MOTIVO_SUB)) if (!tracks.some((t) => t.id === k)) problemas.push(`motivo sobrando: ${k}`);
if (problemas.length) {
  console.error(problemas.join("\n"));
  process.exit(1);
}

const linhas = [
  "# Prompts dos ícones das classes e subclasses",
  "",
  `Feito em 21/11/2026: ${classes.length} classes (lib/character/rules.ts) e ${tracks.length} subclasses (\`data/character/subclass-tracks.json\`). Mesmas regras de \`prompts-magias.md\`: só a figura central, a moldura vem de \`scripts/icones/compor.mjs\`. A gema usa a cor da classe (\`CLASS_ICON_COLOR\`), igual na classe e nas subclasses dela. Gerado por \`scripts/icones/prompts-classes.mjs\`; não editar à mão.`,
  "",
  "Arte crua: `assets-src/icones/classes/<id>.png` (fora do git). Ícone final: `public/icons/classes/<id>.webp`. Classe: `CLA-<nome sem acento>` (o canonId do código, como `CLA-clérigo`, fica no JSON). Subclasse: `SUB-<id da trilha>`.",
  "",
  "| # | id | Nome | Tipo · classe | Prompt |",
  "|---|----|------|---------------|--------|",
  ...itens.map((i, n) => `| ${n + 1} | \`${i.id}\` | ${i.nome} | ${i.tipo} · ${i.classe} | ${i.motivo}, ${ESTILO} |`),
  "",
];
mkdirSync(join(ROOT, "docs/icones"), { recursive: true });
writeFileSync(join(ROOT, "docs/icones/prompts-classes.md"), linhas.join("\n"), "utf8");
const lote = itens.map(({ motivo, ...resto }) => ({ ...resto, prompt: `${motivo}, ${ESTILO}` }));
writeFileSync(join(ROOT, "docs/icones/prompts-classes.json"), JSON.stringify(lote, null, 2) + "\n", "utf8");
console.log("ok", classes.length, "classes,", tracks.length, "subclasses");
