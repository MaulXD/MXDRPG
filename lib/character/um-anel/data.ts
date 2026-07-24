import type {
  TorAttributeKey,
  TorCallingId,
  TorCombatProficiencyId,
  TorCultureId,
  TorSkillId,
  TorStandardOfLivingId,
} from "./types";

/**
 * Dados mecânicos do Um Anel (2ª ed.) extraídos de livros/um-anel/03-aventureiros.md
 * e 04-caracteristicas.md (Core Rules p.27-76). Nomes em PT-BR são traduções
 * de trabalho — ver livros/um-anel/00-glossario-termos.md.
 */

export type TorSkillGroup = "forca" | "coracao" | "argucia";

export type TorSkillDef = {
  id: TorSkillId;
  label: string;
  group: TorSkillGroup;
};

export const SKILLS: TorSkillDef[] = [
  { id: "imponencia", label: "Imponência", group: "forca" },
  { id: "atletismo", label: "Atletismo", group: "forca" },
  { id: "percepcao", label: "Percepção", group: "forca" },
  { id: "caca", label: "Caça", group: "forca" },
  { id: "canto", label: "Canto", group: "forca" },
  { id: "oficio", label: "Ofício", group: "forca" },
  { id: "encorajar", label: "Encorajar", group: "coracao" },
  { id: "viajar", label: "Viajar", group: "coracao" },
  { id: "perspicacia", label: "Perspicácia", group: "coracao" },
  { id: "cura", label: "Cura", group: "coracao" },
  { id: "cortesia", label: "Cortesia", group: "coracao" },
  { id: "batalha", label: "Batalha", group: "coracao" },
  { id: "persuasao", label: "Persuasão", group: "argucia" },
  { id: "furtividade", label: "Furtividade", group: "argucia" },
  { id: "vasculhar", label: "Vasculhar", group: "argucia" },
  { id: "explorar", label: "Explorar", group: "argucia" },
  { id: "enigma", label: "Enigma", group: "argucia" },
  { id: "saber", label: "Saber", group: "argucia" },
];

export const SKILL_LABEL: Record<TorSkillId, string> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s.label])
) as Record<TorSkillId, string>;

export const ATTRIBUTE_LABEL: Record<TorAttributeKey, string> = {
  forca: "Força",
  coracao: "Coração",
  argucia: "Argúcia",
};

export const COMBAT_PROFICIENCY_LABEL: Record<TorCombatProficiencyId, string> = {
  machados: "Machados",
  arcos: "Arcos",
  lancas: "Lanças",
  espadas: "Espadas",
};

export type TorWeaponDef = {
  id: string;
  label: string;
  damage: number;
  /** Nulo pra armas que não causam Golpe Perfurante (ex.: desarmado). */
  injury: string | null;
  load: number;
  proficiency: TorCombatProficiencyId | "brawling";
  twoHanded?: boolean;
  twoHandedOptional?: boolean;
  ranged?: boolean;
  thrown?: boolean;
  notes?: string;
};

export const WEAPONS: TorWeaponDef[] = [
  { id: "desarmado", label: "Desarmado", damage: 1, injury: null, load: 0, proficiency: "brawling", notes: "Inclui arremesso de pedras. Não pode causar Golpe Perfurante." },
  { id: "adaga", label: "Adaga", damage: 2, injury: "14", load: 0, proficiency: "brawling" },
  { id: "cacete", label: "Cacete", damage: 3, injury: "12", load: 0, proficiency: "brawling" },
  { id: "porrete", label: "Porrete", damage: 4, injury: "14", load: 1, proficiency: "brawling" },
  { id: "espada-curta", label: "Espada Curta", damage: 3, injury: "16", load: 1, proficiency: "espadas" },
  { id: "espada", label: "Espada", damage: 4, injury: "16", load: 2, proficiency: "espadas" },
  { id: "espada-longa", label: "Espada Longa", damage: 5, injury: "16 (1m) / 18 (2m)", load: 3, proficiency: "espadas", twoHandedOptional: true },
  { id: "lanca-curta", label: "Lança Curta", damage: 3, injury: "14", load: 2, proficiency: "lancas", thrown: true },
  { id: "lanca", label: "Lança", damage: 4, injury: "14 (1m) / 16 (2m)", load: 3, proficiency: "lancas", twoHandedOptional: true, thrown: true },
  { id: "grande-lanca", label: "Grande Lança", damage: 5, injury: "16", load: 4, proficiency: "lancas", twoHanded: true },
  { id: "machado", label: "Machado", damage: 5, injury: "18", load: 2, proficiency: "machados" },
  { id: "machado-longo", label: "Machado de Cabo Longo", damage: 6, injury: "18 (1m) / 20 (2m)", load: 3, proficiency: "machados", twoHandedOptional: true },
  { id: "grande-machado", label: "Grande Machado", damage: 7, injury: "20", load: 4, proficiency: "machados", twoHanded: true },
  { id: "picareta", label: "Picareta", damage: 7, injury: "18", load: 3, proficiency: "machados", twoHanded: true },
  { id: "arco", label: "Arco", damage: 3, injury: "14", load: 2, proficiency: "arcos", ranged: true },
  { id: "grande-arco", label: "Grande Arco", damage: 4, injury: "16", load: 4, proficiency: "arcos", ranged: true },
];

export const WEAPON_BY_ID: Record<string, TorWeaponDef> = Object.fromEntries(
  WEAPONS.map((w) => [w.id, w])
);

export type TorArmourDef = {
  id: string;
  label: string;
  protection: string;
  load: number;
  type: "leather" | "mail" | "headgear";
  removable?: boolean;
};

export const ARMOURS: TorArmourDef[] = [
  { id: "camisa-de-couro", label: "Camisa de Couro", protection: "1d", load: 3, type: "leather" },
  { id: "couraca-de-couro", label: "Couraça de Couro", protection: "2d", load: 6, type: "leather" },
  { id: "cota-de-malha", label: "Cota de Malha", protection: "3d", load: 9, type: "mail" },
  { id: "sobretudo-de-malha", label: "Sobretudo de Malha", protection: "4d", load: 12, type: "mail" },
];

export const HELM: TorArmourDef = {
  id: "elmo",
  label: "Elmo",
  protection: "+1d",
  load: 4,
  type: "headgear",
  removable: true,
};

export const ARMOUR_BY_ID: Record<string, TorArmourDef> = Object.fromEntries(
  [...ARMOURS, HELM].map((a) => [a.id, a])
);

export type TorShieldDef = { id: string; label: string; parryModifier: number; load: number };

export const SHIELDS: TorShieldDef[] = [
  { id: "broquel", label: "Broquel", parryModifier: 1, load: 2 },
  { id: "escudo", label: "Escudo", parryModifier: 2, load: 4 },
  { id: "grande-escudo", label: "Grande Escudo", parryModifier: 3, load: 6 },
];

export const SHIELD_BY_ID: Record<string, TorShieldDef> = Object.fromEntries(
  SHIELDS.map((s) => [s.id, s])
);

export type TorStandardOfLivingDef = {
  id: TorStandardOfLivingId;
  label: string;
  startingTreasure: number;
  usefulItems: number;
};

export const STANDARDS_OF_LIVING: TorStandardOfLivingDef[] = [
  { id: "pobre", label: "Pobre", startingTreasure: 0, usefulItems: 0 },
  { id: "frugal", label: "Frugal", startingTreasure: 0, usefulItems: 1 },
  { id: "comum", label: "Comum", startingTreasure: 30, usefulItems: 2 },
  { id: "prospero", label: "Próspero", startingTreasure: 90, usefulItems: 3 },
  { id: "rico", label: "Rico", startingTreasure: 180, usefulItems: 4 },
  { id: "muito-rico", label: "Muito Rico", startingTreasure: 300, usefulItems: 4 },
];

export type TorDistinctiveFeatureDef = { id: string; label: string; description: string };

export const DISTINCTIVE_FEATURES: TorDistinctiveFeatureDef[] = [
  { id: "audacioso", label: "Audacioso", description: "Você confia tanto em suas capacidades que não se abala facilmente, colocando-se em perigo de bom grado." },
  { id: "astuto", label: "Astuto", description: "Sua mente é afiada, e você está pronto para usá-la a seu favor." },
  { id: "avido", label: "Ávido", description: "Você se enche de empolgação e impaciência quando um empreendimento desperta seu interesse." },
  { id: "fiel", label: "Fiel", description: "Você é firmemente devotado aos ideais ou indivíduos que escolheu seguir, e sua lealdade inabalável muitas vezes o sustenta em seus feitos." },
  { id: "belo", label: "Belo", description: "Você é considerado atraente pela maioria das pessoas, mesmo por aquelas que não pertencem ao seu povo." },
  { id: "bem-falante", label: "Bem-falante", description: "Sua fala e maneiras são naturalmente agradáveis e respeitosas, e suas palavras raramente causam ofensa." },
  { id: "feroz", label: "Feroz", description: "Quando provocado, ou quando julga necessário, você pode deixar emergir seu lado selvagem." },
  { id: "generoso", label: "Generoso", description: "Você dá com as mãos e o coração abertos, sempre atento às necessidades dos outros." },
  { id: "honrado", label: "Honrado", description: "Você acredita em agir com justiça e fazer o que é moralmente correto." },
  { id: "curioso", label: "Curioso", description: "Sua natureza curiosa é facilmente despertada, muitas vezes por aquilo que não é da sua conta. O lado positivo é que você não se deixa enganar facilmente pelas aparências." },
  { id: "olhos-de-lince", label: "Olhos de Lince", description: "A acuidade da sua visão supera a da maioria das pessoas." },
  { id: "nobre", label: "Nobre", description: "Seu porte digno desperta sentimentos de reverência e respeito em quem o observa." },
  { id: "jovial", label: "Jovial", description: "Seu espírito não se abate facilmente, e você consegue encontrar luz nas sombras mais escuras." },
  { id: "paciente", label: "Paciente", description: "Você demora a perder a paciência e consegue suportar tolos, atrasos ou até dificuldades sem reclamar." },
  { id: "orgulhoso", label: "Orgulhoso", description: "Você tem grande estima por seus feitos e conquistas, ou pelos do seu povo." },
  { id: "rustico", label: "Rústico", description: "Seus modos são simples, alguns diriam até rudes, mas você sabe que nem tudo que é ouro reluz." },
  { id: "reservado", label: "Reservado", description: "Você não compartilha seus pensamentos facilmente e prefere ocultar suas intenções dos olhos alheios, especialmente de estranhos ao seu povo." },
  { id: "severo", label: "Severo", description: "Você possui uma natureza rigorosa e a expressa em seu comportamento, linguagem corporal e fala." },
  { id: "sutil", label: "Sutil", description: "Você não é um Mago, mas muitas vezes os caminhos que escolhe para alcançar seus objetivos são engenhosos, quando não astutos." },
  { id: "veloz", label: "Veloz", description: "Você se move rapidamente e é ágil para agir." },
  { id: "alto", label: "Alto", description: "Você se destaca em altura entre a maioria do seu povo." },
  { id: "coracao-verdadeiro", label: "Coração Verdadeiro", description: "Você é sincero, e suas palavras e ações revelam suas intenções honestas." },
  { id: "cauteloso", label: "Cauteloso", description: "Você está sempre atento ao seu redor e observa a fala e o comportamento de estranhos." },
  { id: "obstinado", label: "Obstinado", description: "Você é firme em temperamento e convicção, e costuma basear suas ações apenas no próprio julgamento." },
  // Traços concedidos por Vocação (não escolhíveis livremente):
  { id: "lideranca", label: "Liderança", description: "Você possui a capacidade de dirigir outros à ação. Sob pressão, as pessoas naturalmente recorrem a você em busca de orientação." },
  { id: "conhecimento-do-inimigo", label: "Conhecimento do Inimigo", description: "Você conhece as características, hábitos, forças e fraquezas de um tipo de inimigo à sua escolha (Homens Maus, Orcs, Aranhas, Trolls, Wargs ou Mortos-Vivos)." },
  { id: "saber-popular", label: "Saber Popular", description: "Você possui algum conhecimento dos muitos costumes, crenças e histórias tradicionais das várias comunidades que compõem os Povos Livres." },
  { id: "versos-de-saber", label: "Versos de Saber", description: "Você conhece versos curtos criados por muitas Culturas para ajudar a lembrar fatos significativos da história antiga que de outra forma poderiam se perder." },
  { id: "arte-do-roubo", label: "Arte do Roubo", description: "Esse talento venerável inclui bater carteiras, arrombar fechaduras e, em geral, qualquer forma discreta de obter posses alheias ou acessar áreas protegidas." },
  { id: "conhecimento-da-sombra", label: "Conhecimento da Sombra", description: "Você reconheceu que existe um fio oculto que unifica a maior parte do que é malicioso, sombrio e terrível na Terra-média, e que esse fio se adensa a cada ano que passa." },
];

export const DISTINCTIVE_FEATURE_BY_ID: Record<string, TorDistinctiveFeatureDef> = Object.fromEntries(
  DISTINCTIVE_FEATURES.map((f) => [f.id, f])
);

export type TorShadowPathDef = { id: string; label: string; description: string };

export const SHADOW_PATHS: TorShadowPathDef[] = [
  { id: "fascinio-pelo-poder", label: "Fascínio pelo Poder", description: "Quando indivíduos recebem uma posição de autoridade, podem acabar confundindo seu próprio engrandecimento com o bem maior das pessoas que deveriam guiar ou proteger." },
  { id: "maldicao-da-vinganca", label: "Maldição da Vingança", description: "Quem vive pela espada é sempre tentado a desembainhá-la, literal ou figurativamente, quando sua vontade é contrariada ou sua honra ofendida." },
  { id: "loucura-errante", label: "Loucura Errante", description: "Viajar para longe pode ser o dever escolhido por um mensageiro, mas carrega o risco de nunca encontrar um lugar pelo qual lutar." },
  { id: "fascinio-pelos-segredos", label: "Fascínio pelos Segredos", description: "Curiosidade e inquisitividade são virtudes desejáveis, mas o conhecimento pode ser usado de forma maliciosa, e os segredos são perigosos." },
  { id: "mal-do-dragao", label: "Mal do Dragão", description: "Aventureiros que buscam riquezas perdidas correm o risco de contrair a antiga doença capaz de transformar uma pilha de ouro encantado em cinzas amargas." },
  { id: "caminho-do-desespero", label: "Caminho do Desespero", description: "A dúvida sobre si mesmo é muitas vezes o caminho que a Sombra escolhe para alcançar o coração de quem a ela se opõe." },
];

export const SHADOW_PATH_BY_ID: Record<string, TorShadowPathDef> = Object.fromEntries(
  SHADOW_PATHS.map((s) => [s.id, s])
);

export type TorRewardDef = { id: string; label: string; description: string };

export const STARTING_REWARDS: TorRewardDef[] = [
  { id: "ajustado", label: "Ajustado", description: "(armadura ou elmo) Some +2 ao resultado da sua rolagem de Proteção." },
  { id: "fabricacao-engenhosa", label: "Fabricação Engenhosa", description: "(armadura, elmo ou escudo) Reduza em 2 a Carga desse item." },
  { id: "cruel", label: "Cruel", description: "(arma) Aumente em 2 o valor de Ferimento da arma." },
  { id: "grave", label: "Grave", description: "(arma) Aumente em 1 o valor de Dano da arma." },
  { id: "afiado", label: "Afiado", description: "(arma) Rolagens de ataque causam Golpe Perfurante com 9+." },
  { id: "reforcado", label: "Reforçado", description: "(escudo) Aumente em +1 o bônus de Aparar do escudo." },
];

export const STARTING_VIRTUES: TorRewardDef[] = [
  { id: "confianca", label: "Confiança", description: "Aumente sua Esperança em 2." },
  { id: "mao-firme", label: "Mão Firme", description: "Some +1 ao dano infligido em um Golpe Pesado." },
  { id: "robustez", label: "Robustez", description: "Aumente sua Resistência em 2." },
  { id: "maestria", label: "Maestria", description: "Escolha duas Perícias e torne-as Favorecidas." },
  { id: "agilidade-de-aparar", label: "Agilidade", description: "Aumente seu valor de Aparar em 1." },
  { id: "proeza", label: "Proeza", description: "Reduza o NA de um Atributo em 1." },
];

export type TorCombatProficiencyChoice = {
  options: TorCombatProficiencyId[];
  rating: number;
};

export type TorCultureDef = {
  id: TorCultureId;
  name: string;
  quote?: string;
  blessingName: string;
  blessingText: string;
  extraTraitName?: string;
  extraTraitText?: string;
  standardOfLiving: TorStandardOfLivingId;
  attributeOptions: Array<{ forca: number; coracao: number; argucia: number }>;
  enduranceBonus: number;
  hopeBonus: number;
  parryBonus: number;
  skillBase: TorSkillRatingsPartial;
  favouredChoice: [TorSkillId, TorSkillId];
  combatProficiencyChoiceA: TorCombatProficiencyChoice;
  combatProficiencyChoiceB: TorCombatProficiencyChoice;
  distinctiveFeatureOptions: string[];
  restrictedWeaponIds?: string[];
  allowedWeaponIdsOnly?: string[];
};

type TorSkillRatingsPartial = Record<TorSkillId, number>;

export const CULTURES: TorCultureDef[] = [
  {
    id: "bardos",
    name: "Bardos",
    blessingName: "Coração Firme",
    blessingText: "Suas rolagens de VALOR são Favorecidas.",
    standardOfLiving: "prospero",
    attributeOptions: [
      { forca: 5, coracao: 7, argucia: 2 },
      { forca: 4, coracao: 7, argucia: 3 },
      { forca: 5, coracao: 6, argucia: 3 },
      { forca: 4, coracao: 6, argucia: 4 },
      { forca: 5, coracao: 5, argucia: 4 },
      { forca: 6, coracao: 6, argucia: 2 },
    ],
    enduranceBonus: 20,
    hopeBonus: 8,
    parryBonus: 12,
    skillBase: {
      imponencia: 1, encorajar: 2, persuasao: 3,
      atletismo: 1, viajar: 1, furtividade: 0,
      percepcao: 0, perspicacia: 2, vasculhar: 1,
      caca: 2, cura: 0, explorar: 1,
      canto: 1, cortesia: 2, enigma: 0,
      oficio: 1, batalha: 2, saber: 1,
    },
    favouredChoice: ["encorajar", "atletismo"],
    combatProficiencyChoiceA: { options: ["arcos", "espadas"], rating: 2 },
    combatProficiencyChoiceB: { options: ["machados", "arcos", "lancas", "espadas"], rating: 1 },
    distinctiveFeatureOptions: ["audacioso", "avido", "belo", "feroz", "generoso", "orgulhoso", "alto", "obstinado"],
  },
  {
    id: "anoes",
    name: "Anões do Povo de Durin",
    blessingName: "Inabalável",
    blessingText: "Você reduz pela metade (arredondando pra cima) a Carga de qualquer armadura que estiver usando, incluindo elmos (mas não escudos).",
    extraTraitName: "Naugrim",
    extraTraitText: "Aventureiros anões não podem usar as seguintes peças de equipamento de guerra: grande arco, grande lança e grande escudo.",
    standardOfLiving: "prospero",
    attributeOptions: [
      { forca: 7, coracao: 2, argucia: 5 },
      { forca: 7, coracao: 3, argucia: 4 },
      { forca: 6, coracao: 3, argucia: 5 },
      { forca: 6, coracao: 4, argucia: 4 },
      { forca: 5, coracao: 4, argucia: 5 },
      { forca: 6, coracao: 2, argucia: 6 },
    ],
    enduranceBonus: 22,
    hopeBonus: 8,
    parryBonus: 10,
    skillBase: {
      imponencia: 2, encorajar: 0, persuasao: 0,
      atletismo: 1, viajar: 3, furtividade: 0,
      percepcao: 0, perspicacia: 0, vasculhar: 3,
      caca: 0, cura: 0, explorar: 2,
      canto: 1, cortesia: 1, enigma: 2,
      oficio: 2, batalha: 1, saber: 1,
    },
    favouredChoice: ["viajar", "oficio"],
    combatProficiencyChoiceA: { options: ["machados", "espadas"], rating: 2 },
    combatProficiencyChoiceB: { options: ["machados", "arcos", "lancas", "espadas"], rating: 1 },
    distinctiveFeatureOptions: ["astuto", "feroz", "nobre", "orgulhoso", "reservado", "severo", "cauteloso", "obstinado"],
    restrictedWeaponIds: ["grande-arco", "grande-lanca", "grande-escudo"],
  },
  {
    id: "elfos",
    name: "Elfos de Lindon",
    blessingName: "Talento Élfico",
    blessingText: "Se você não estiver Deplorável, pode gastar 1 ponto de Esperança para obter um sucesso Mágico numa rolagem de perícia.",
    extraTraitName: "A Longa Derrota",
    extraTraitText: "Ao remover Sombra acumulada durante a Fase de Companhia, você só pode remover no máximo 1 ponto.",
    standardOfLiving: "frugal",
    attributeOptions: [
      { forca: 5, coracao: 2, argucia: 7 },
      { forca: 4, coracao: 3, argucia: 7 },
      { forca: 5, coracao: 3, argucia: 6 },
      { forca: 4, coracao: 4, argucia: 6 },
      { forca: 5, coracao: 4, argucia: 5 },
      { forca: 6, coracao: 2, argucia: 6 },
    ],
    enduranceBonus: 20,
    hopeBonus: 8,
    parryBonus: 12,
    skillBase: {
      imponencia: 2, encorajar: 1, persuasao: 0,
      atletismo: 2, viajar: 0, furtividade: 3,
      percepcao: 2, perspicacia: 0, vasculhar: 0,
      caca: 0, cura: 1, explorar: 0,
      canto: 2, cortesia: 0, enigma: 0,
      oficio: 2, batalha: 0, saber: 3,
    },
    favouredChoice: ["canto", "saber"],
    combatProficiencyChoiceA: { options: ["arcos", "lancas"], rating: 2 },
    combatProficiencyChoiceB: { options: ["machados", "arcos", "lancas", "espadas"], rating: 1 },
    distinctiveFeatureOptions: ["belo", "olhos-de-lince", "nobre", "jovial", "paciente", "sutil", "veloz", "cauteloso"],
  },
  {
    id: "hobbits",
    name: "Hobbits do Condado",
    blessingName: "Bom-senso Hobbit",
    blessingText: "Suas rolagens de SABEDORIA são Favorecidas, e você ganha (1d) em todos os Testes de Sombra feitos para resistir aos efeitos da Cobiça.",
    extraTraitName: "Meios-Homens",
    extraTraitText: "Por causa de seu tamanho reduzido, Hobbits não podem usar armas maiores com eficácia. As armas disponíveis são: machado, arco, porrete, cacete, adaga, espada curta, lança curta e lança. Além disso, Hobbits não podem usar um grande escudo.",
    standardOfLiving: "comum",
    attributeOptions: [
      { forca: 3, coracao: 6, argucia: 5 },
      { forca: 3, coracao: 7, argucia: 4 },
      { forca: 2, coracao: 7, argucia: 5 },
      { forca: 4, coracao: 6, argucia: 4 },
      { forca: 4, coracao: 5, argucia: 5 },
      { forca: 2, coracao: 6, argucia: 6 },
    ],
    enduranceBonus: 18,
    hopeBonus: 10,
    parryBonus: 12,
    skillBase: {
      imponencia: 0, encorajar: 0, persuasao: 2,
      atletismo: 0, viajar: 0, furtividade: 3,
      percepcao: 2, perspicacia: 2, vasculhar: 0,
      caca: 0, cura: 1, explorar: 0,
      canto: 2, cortesia: 2, enigma: 3,
      oficio: 1, batalha: 0, saber: 0,
    },
    favouredChoice: ["furtividade", "cortesia"],
    combatProficiencyChoiceA: { options: ["arcos", "espadas"], rating: 2 },
    combatProficiencyChoiceB: { options: ["machados", "arcos", "lancas", "espadas"], rating: 1 },
    distinctiveFeatureOptions: ["avido", "bem-falante", "fiel", "honrado", "curioso", "olhos-de-lince", "jovial", "rustico"],
    allowedWeaponIdsOnly: ["machado", "arco", "porrete", "cacete", "adaga", "espada-curta", "lanca-curta", "lanca"],
    restrictedWeaponIds: ["grande-escudo"],
  },
  {
    id: "homens-de-bri",
    name: "Homens de Bri",
    blessingName: "Sangue de Bri",
    blessingText: "Cada Homem de Bri na Companhia aumenta o Nível de Companhia em 1 ponto.",
    standardOfLiving: "comum",
    attributeOptions: [
      { forca: 2, coracao: 5, argucia: 7 },
      { forca: 3, coracao: 4, argucia: 7 },
      { forca: 3, coracao: 5, argucia: 6 },
      { forca: 4, coracao: 4, argucia: 6 },
      { forca: 4, coracao: 5, argucia: 5 },
      { forca: 2, coracao: 6, argucia: 6 },
    ],
    enduranceBonus: 20,
    hopeBonus: 10,
    parryBonus: 10,
    skillBase: {
      imponencia: 0, encorajar: 2, persuasao: 2,
      atletismo: 1, viajar: 1, furtividade: 1,
      percepcao: 1, perspicacia: 2, vasculhar: 1,
      caca: 1, cura: 0, explorar: 1,
      canto: 1, cortesia: 3, enigma: 2,
      oficio: 2, batalha: 0, saber: 0,
    },
    favouredChoice: ["perspicacia", "enigma"],
    combatProficiencyChoiceA: { options: ["machados", "lancas"], rating: 2 },
    combatProficiencyChoiceB: { options: ["machados", "arcos", "lancas", "espadas"], rating: 1 },
    distinctiveFeatureOptions: ["astuto", "bem-falante", "fiel", "generoso", "curioso", "paciente", "rustico", "coracao-verdadeiro"],
  },
  {
    id: "rangers",
    name: "Rangers do Norte",
    blessingName: "Reis dos Homens",
    blessingText: "Adicione 1 ponto a um Atributo à sua escolha.",
    extraTraitName: "Lealdade dos Dúnedain",
    extraTraitText: "Durante a Fase de Companhia você recupera no máximo um número de pontos de Esperança igual à metade do seu valor de CORAÇÃO (arredondando pra cima).",
    standardOfLiving: "frugal",
    attributeOptions: [
      { forca: 7, coracao: 5, argucia: 2 },
      { forca: 7, coracao: 4, argucia: 3 },
      { forca: 6, coracao: 5, argucia: 3 },
      { forca: 6, coracao: 4, argucia: 4 },
      { forca: 5, coracao: 5, argucia: 4 },
      { forca: 6, coracao: 6, argucia: 2 },
    ],
    enduranceBonus: 20,
    hopeBonus: 6,
    parryBonus: 14,
    skillBase: {
      imponencia: 1, encorajar: 0, persuasao: 0,
      atletismo: 2, viajar: 2, furtividade: 2,
      percepcao: 2, perspicacia: 0, vasculhar: 1,
      caca: 2, cura: 2, explorar: 2,
      canto: 0, cortesia: 0, enigma: 0,
      oficio: 0, batalha: 2, saber: 2,
    },
    favouredChoice: ["caca", "saber"],
    combatProficiencyChoiceA: { options: ["lancas", "espadas"], rating: 2 },
    combatProficiencyChoiceB: { options: ["machados", "arcos", "lancas", "espadas"], rating: 1 },
    distinctiveFeatureOptions: ["audacioso", "honrado", "reservado", "severo", "sutil", "veloz", "alto", "coracao-verdadeiro"],
  },
];

export const CULTURE_BY_ID: Record<TorCultureId, TorCultureDef> = Object.fromEntries(
  CULTURES.map((c) => [c.id, c])
) as Record<TorCultureId, TorCultureDef>;

export type TorCallingDef = {
  id: TorCallingId;
  name: string;
  favouredSkillOptions: [TorSkillId, TorSkillId, TorSkillId];
  traitId: string;
  shadowPathId: string;
  enemyLoreChoice?: boolean;
};

export const CALLINGS: TorCallingDef[] = [
  {
    id: "capitao",
    name: "Capitão",
    favouredSkillOptions: ["batalha", "encorajar", "persuasao"],
    traitId: "lideranca",
    shadowPathId: "fascinio-pelo-poder",
  },
  {
    id: "campeao",
    name: "Campeão",
    favouredSkillOptions: ["atletismo", "imponencia", "caca"],
    traitId: "conhecimento-do-inimigo",
    shadowPathId: "maldicao-da-vinganca",
    enemyLoreChoice: true,
  },
  {
    id: "mensageiro",
    name: "Mensageiro",
    favouredSkillOptions: ["cortesia", "canto", "viajar"],
    traitId: "saber-popular",
    shadowPathId: "loucura-errante",
  },
  {
    id: "erudito",
    name: "Erudito",
    favouredSkillOptions: ["oficio", "saber", "enigma"],
    traitId: "versos-de-saber",
    shadowPathId: "fascinio-pelos-segredos",
  },
  {
    id: "cacador-de-tesouros",
    name: "Caçador de Tesouros",
    favouredSkillOptions: ["explorar", "vasculhar", "furtividade"],
    traitId: "arte-do-roubo",
    shadowPathId: "mal-do-dragao",
  },
  {
    id: "guardiao",
    name: "Guardião",
    favouredSkillOptions: ["percepcao", "cura", "perspicacia"],
    traitId: "conhecimento-da-sombra",
    shadowPathId: "caminho-do-desespero",
  },
];

export const CALLING_BY_ID: Record<TorCallingId, TorCallingDef> = Object.fromEntries(
  CALLINGS.map((c) => [c.id, c])
) as Record<TorCallingId, TorCallingDef>;

export const ENEMY_LORE_OPTIONS = ["Homens Maus", "Orcs", "Aranhas", "Trolls", "Wargs", "Mortos-Vivos"];
