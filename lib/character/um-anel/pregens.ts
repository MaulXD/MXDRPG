/**
 * Personagens pré-gerados do Starter Set — extraídos de
 * livros/um-anel/11-personagens-exemplo.md ("Pre-generated Characters",
 * fonte: TOR_Starter_Set_Pre-generated_Characters.pdf).
 *
 * O Starter Set não usa Vocação / Caminho da Sombra / Padrão de Vida (campos
 * só do Livro Básico) — por fidelidade ao material original, estes 8
 * pré-gerados são referência de mesa pronta (stats, equipamento, contexto),
 * não fichas plenamente jogáveis via o assistente de criação.
 *
 * Dois pontos onde estes números não batem com o padrão do sistema. Ver a
 * seção "Nota sobre Valor de Atributo × NA impresso" no markdown.
 *
 * 1. NA impresso — NÃO é erro. As fichas do PDF trazem NA = 18 − Atributo,
 *    que é a variante oficial de campanha curta / one-shot descrita no box
 *    "Tweaking the Target Numbers" do Livro Básico (02-resolucao-de-acoes.md);
 *    o Starter Set é exatamente esse tipo de produto. A VTT implementa o
 *    padrão (attributeTN, 20 − Atributo), então a ficha destes 8 aparece com
 *    NA 2 acima do PDF — correto pro padrão. A variante 18 fica como possível
 *    opção de campanha no futuro. Os VALORES de Atributo abaixo estão certos
 *    de qualquer forma: os 7 pré-gerados Hobbit usam exatamente os 6
 *    conjuntos oficiais da tabela de Hobbits do Condado.
 *
 * 2. Resistência dos Hobbits — divergência real. Os 7 valores abaixo estão +2
 *    da fórmula cultural (Hobbits: FORÇA + 18). Esperança (+10) e Bloqueio
 *    (+12) fecham exatos, e Balin — único Anão — fecha exato nas três com as
 *    bases do Povo de Durin, o que isola o desvio. A fonte não permite
 *    decidir se é erro de impressão ou base diferente no Starter Set, então
 *    os valores impressos ficam preservados. NÃO "corrija" recalculando:
 *    scripts/verify-um-anel-pregens.mjs fixa a relação.
 */
import type { TorCombatProficiencyId, TorCultureId, TorSkillId } from "./types";

export type TorPregenWarGearEntry = {
  name: string;
  damage: number;
  injury: number;
  load: number;
  notes?: string;
};

export type TorPregenArmour = { name: string; protection: string; load: number };
export type TorPregenShield = { name: string; parryBonus: number; load: number };
export type TorPregenVirtue = { name: string; text: string };

export type TorPregenCharacter = {
  id: string;
  name: string;
  culture: TorCultureId;
  age: number;
  /** Ids de lib/character/um-anel/data.ts::DISTINCTIVE_FEATURE_BY_ID */
  distinctiveFeatureIds: string[];
  attributes: { forca: number; coracao: number; argucia: number };
  endurance: number;
  hope: number;
  parry: number;
  skills: Record<TorSkillId, number>;
  favouredSkills: TorSkillId[];
  combatProficiencies: Record<TorCombatProficiencyId, number>;
  rewards: string[];
  valour: number;
  wisdom: number;
  virtues: TorPregenVirtue[];
  warGear: TorPregenWarGearEntry[];
  armour?: TorPregenArmour;
  shield?: TorPregenShield;
  travellingGear: string;
  quote: string;
  background: string;
};

export const TOR_PREGEN_CHARACTERS: TorPregenCharacter[] = [
  {
    id: "drogo-bolseiro",
    name: "Drogo Bolseiro",
    culture: "hobbits",
    age: 52,
    distinctiveFeatureIds: ["fiel", "honrado"],
    attributes: { forca: 3, coracao: 6, argucia: 5 },
    endurance: 23,
    hope: 18,
    parry: 17,
    skills: {
      imponencia: 0, atletismo: 0, percepcao: 2, caca: 0, canto: 2, oficio: 1,
      encorajar: 0, viajar: 1, perspicacia: 1, cura: 2, cortesia: 2, batalha: 0,
      persuasao: 2, furtividade: 2, vasculhar: 0, explorar: 0, enigma: 2, saber: 1,
    },
    favouredSkills: ["percepcao", "canto", "viajar", "cortesia"],
    combatProficiencies: { machados: 0, arcos: 2, lancas: 0, espadas: 1 },
    rewards: [],
    valour: 1,
    wisdom: 1,
    virtues: [{ name: "Confiança", text: "Aumenta sua Esperança máxima em 2 (já contado no total)." }],
    warGear: [],
    travellingGear: "Capa e Chapéu Finos (Imponência)",
    quote:
      "Eu me instalo direitinho em Buckland, prontinho pra casar com uma bela ala só minha da Casa Brandy, e o Primo Bilbo me chama pra Hobbiton! Não é lá muito apropriado, veja bem. Mas eu já fiz minha cota de coisas impróprias, suponho, como empacotar tudo pra morar do outro lado do Brandevin feito um Hobbit ribeirinho de botas. Primula diz que eu preciso criar coragem (um trocadilho brandybuckiano, esse) e superar meus medos se um dia eu quiser um lugar como deve ser na Casa Brandy. Então suponho que vamos ver que estranheza o Primo Bilbo andou aprontando, contanto que não tenha barco envolvido. Ainda sou um Hobbit do Setor-Oeste como manda o figurino, e não me sinto à vontade com essas geringonças pouco confiáveis.",
    background:
      "Drogo Bolseiro tem uns cinquenta anos na época dessas aventuras, e é bem um Hobbit como manda o figurino, ainda que um tanto cheio das carnes. Um dia vai se casar com sua adorável Primula, e o casal terá um filho, Frodo Bolseiro.",
  },
  {
    id: "esmeralda-took",
    name: "Esmeralda Took",
    culture: "hobbits",
    age: 24,
    distinctiveFeatureIds: ["avido", "jovial"],
    attributes: { forca: 2, coracao: 7, argucia: 5 },
    endurance: 22,
    hope: 17,
    parry: 17,
    skills: {
      imponencia: 1, atletismo: 1, percepcao: 0, caca: 0, canto: 2, oficio: 1,
      encorajar: 2, viajar: 0, perspicacia: 0, cura: 1, cortesia: 1, batalha: 0,
      persuasao: 1, furtividade: 2, vasculhar: 0, explorar: 0, enigma: 2, saber: 0,
    },
    favouredSkills: ["encorajar", "cortesia", "persuasao"],
    combatProficiencies: { machados: 1, arcos: 2, lancas: 0, espadas: 0 },
    rewards: [],
    valour: 1,
    wisdom: 1,
    virtues: [{ name: "Proeza", text: "Reduz em 1 o NA de Força (já contado no total)." }],
    warGear: [],
    travellingGear: "Bengala dos Took (Viajar)",
    quote:
      "Ah, isso vai ser um encanto! Uma verdadeira Aventura Bolseiro, armada pelo próprio Senhor de Bolsão! Sim, eu sei que tecnicamente estou aqui porque a Tia-avó Lalia queria que eu garantisse que 'aquele Bolseiro Doido não aprontasse nenhuma bobagem', e é bem mais provável que fosse só pra me tirar de Tuckborough por uns dias depois daquele auê no aniversário dela ano passado, mas a culpa não foi minha, e a bem da verdade, pretendo voltar com uma boa história ou duas no bolso. Aliás, não tenho dúvida de que vou ter mais causos pra contar do que a Vovó Rosa costuma guardar naquela cadeira de balanço rangente dela.",
    background:
      "Bisneta de Gerôncio, o Velho Took, ela ainda está em seus tweens. Tinha uns cinco anos quando Bilbo Bolseiro saiu de Bolsão pra reclamar o ouro de Smaug, o Dragão. Um dia vai se casar com Saradoc Brandybuck, e se tornar mãe de um certo Meriadoc Brandybuck.",
  },
  {
    id: "lobelia-bracegirdle",
    name: "Lobelia Bracegirdle",
    culture: "hobbits",
    age: 42,
    distinctiveFeatureIds: ["curioso", "olhos-de-lince"],
    attributes: { forca: 2, coracao: 6, argucia: 6 },
    endurance: 22,
    hope: 16,
    parry: 18,
    skills: {
      imponencia: 2, atletismo: 0, percepcao: 1, caca: 0, canto: 2, oficio: 1,
      encorajar: 0, viajar: 0, perspicacia: 2, cura: 1, cortesia: 2, batalha: 0,
      persuasao: 2, furtividade: 2, vasculhar: 2, explorar: 0, enigma: 2, saber: 1,
    },
    favouredSkills: ["imponencia", "perspicacia", "cortesia", "furtividade", "vasculhar"],
    combatProficiencies: { machados: 0, arcos: 1, lancas: 0, espadas: 2 },
    rewards: [],
    valour: 1,
    wisdom: 1,
    virtues: [
      { name: "Maestria", text: "Escolha duas Perícias adicionais e torne-as Favorecidas (já contado no total)." },
    ],
    warGear: [],
    travellingGear: "Guarda-chuva Requintado (Persuasão)",
    quote:
      "Vocês acreditam no descaramento daquele... daquele... Brandybuck! Ah, ele se diz um Bolseiro, mas nenhum Bolseiro direito e como deve ser sairia correndo com uma malta de Anões malucos e um mago meio biruta rumo ao desconhecido, quanto mais ter a audácia de aparecer de novo mais de um ano depois com um pônei cheio de ouro e fingir que está tudo nos trinques! Pois eu não vou aceitar isso, ouviram bem. E não vou aceitar que ele traga mais escândalo indevido pra gente decente do Condado. Ele está tramando alguma coisa, chamando Tooks e Brandybucks pra Bolsão por algum negócio nojento e problemático, sem dúvida.",
    background:
      "Filha de Blanco Bracegirdle e Primrose Boffin, Lobelia ainda não se casou com Otho Sackville-Baggins. Tem uns quarenta anos, e já viu sua ambição de entrar em Bolsão como dona de direito desmoronar uma vez, quando Bilbo voltou de sua aventura contra todas as probabilidades.",
  },
  {
    id: "paladin-took-ii",
    name: "Paladin Took II",
    culture: "hobbits",
    age: 27,
    distinctiveFeatureIds: ["avido", "rustico"],
    attributes: { forca: 3, coracao: 7, argucia: 4 },
    endurance: 23,
    hope: 17,
    parry: 17,
    skills: {
      imponencia: 0, atletismo: 1, percepcao: 0, caca: 1, canto: 1, oficio: 1,
      encorajar: 0, viajar: 0, perspicacia: 1, cura: 1, cortesia: 1, batalha: 0,
      persuasao: 1, furtividade: 2, vasculhar: 0, explorar: 1, enigma: 1, saber: 0,
    },
    favouredSkills: ["atletismo", "caca", "furtividade", "explorar"],
    combatProficiencies: { machados: 1, arcos: 0, lancas: 0, espadas: 2 },
    rewards: [],
    valour: 1,
    wisdom: 1,
    virtues: [{ name: "Agilidade", text: "Aumenta seu Bloqueio em 1 (já contado no total)." }],
    warGear: [],
    travellingGear: "Trouxa de Viajante dos Took (Explorar)",
    quote:
      "Cuidando da minha vida em Whitwell e quem vem subindo a estrada da minha fazenda toda arrastada senão a jovem Esmeralda! Indo visitar o Primo Bilbo, ela vai, e pensei com meus botões, que ideia das boas. Que mal tem um Took se divertir um pouco antes de se acomodar e virar um fazendeiro como deve ser? Ainda sou um tween eu mesmo, por que não deixar de lado a responsabilidade por mais uma estação ou duas e honrar meu bisavô com um toque de aventura? Parece bem apropriado.",
    background:
      "Irmão mais novo de Esmeralda Took, e futuro Thain — por ora sua única fama é ser o filho mais velho de Adalgrim Took, e um fazendeiro recém-estabelecido em Whitwell. Um dia terá um filho, e vai chamá-lo de Peregrin.",
  },
  {
    id: "primula-brandybuck",
    name: "Primula Brandybuck",
    culture: "hobbits",
    age: 40,
    distinctiveFeatureIds: ["bem-falante", "fiel"],
    attributes: { forca: 4, coracao: 6, argucia: 4 },
    endurance: 24,
    hope: 16,
    parry: 16,
    skills: {
      imponencia: 0, atletismo: 0, percepcao: 1, caca: 0, canto: 1, oficio: 0,
      encorajar: 0, viajar: 0, perspicacia: 1, cura: 1, cortesia: 1, batalha: 0,
      persuasao: 1, furtividade: 2, vasculhar: 0, explorar: 0, enigma: 2, saber: 1,
    },
    favouredSkills: ["cortesia", "enigma"],
    combatProficiencies: { machados: 0, arcos: 2, lancas: 1, espadas: 0 },
    rewards: [],
    valour: 1,
    wisdom: 1,
    virtues: [{ name: "Proeza", text: "Reduz em 1 o NA de Astúcia (já contado no total)." }],
    warGear: [],
    travellingGear: "Roupas Elegantes (Cortesia)",
    quote:
      "É bem apropriado que Drogo e eu voltemos pra Bolsão por uns tempos. Não vemos o Tio Bilbo dele desde que Drogo prometeu se casar comigo bem ali, na frente de todo mundo, debaixo da Árvore da Festa. O querido Drogo pode ser meio empertigado às vezes, mas tem um tanto do tio nele. Rory vem junto, arguto como sempre e convencido de que há alguma estranheza no ar. Esmeralda está convencida de que vamos encontrar um dragão ou coisa assim. Quanto à Lobelia, bem, quanto menos se disser, melhor. Alguém tem que manter a cabeça no lugar em todo esse caso, e parece que sou a única capaz pra essa tarefa.",
    background:
      "Prima de Bilbo Bolseiro (pelo lado materno), Primula é a filha mais nova de Gorbadoc Brandybuck, o Senhor de Buckland. Em breve vai se casar com Drogo Bolseiro, e o casal terá um filho, Frodo.",
  },
  {
    id: "rorimac-brandybuck",
    name: "Rorimac Brandybuck",
    culture: "hobbits",
    age: 58,
    distinctiveFeatureIds: ["olhos-de-lince", "rustico"],
    attributes: { forca: 4, coracao: 5, argucia: 5 },
    endurance: 26,
    hope: 15,
    parry: 17,
    skills: {
      imponencia: 0, atletismo: 0, percepcao: 1, caca: 1, canto: 1, oficio: 1,
      encorajar: 0, viajar: 0, perspicacia: 2, cura: 1, cortesia: 1, batalha: 0,
      persuasao: 1, furtividade: 2, vasculhar: 0, explorar: 0, enigma: 1, saber: 0,
    },
    favouredSkills: ["percepcao", "perspicacia", "furtividade"],
    combatProficiencies: { machados: 0, arcos: 0, lancas: 1, espadas: 2 },
    rewards: [],
    valour: 1,
    wisdom: 1,
    virtues: [{ name: "Robustez", text: "Aumenta sua Resistência máxima em 2 (já contado no total)." }],
    warGear: [],
    travellingGear: "Faca de Esfolar Coelhos (Caça)",
    quote:
      "Todas essas histórias de dragão e contos infantis não deixam de ter alguma verdade, eu digo. O Bolseiro Doido está tramando alguma coisa, e pretendo descobrir o quê. Direitinho e como manda o figurino ele era antes daquele mago arrastá-lo pro desconhecido, só pra jogá-lo de volta mais de um ano depois com uma sacola cheia de ouro e um brilho nos olhos. Não estou julgando, veja bem. Nós, de Buckland, já somos chamados de estranhos o bastante por esses Hobbits empertigados do Setor-Oeste, mas se o Bolseiro está tramando alguma novidade, pretendo testemunhar com os próprios olhos e ver o que está acontecendo.",
    background:
      "Irmão de Primula, Rorimac (chamado de \"Rory\") em breve herdará o título de Senhor de Buckland. Por ora, é um Hobbit robusto, desconfiado de qualquer coisa sobrenatural, e sempre pronto pra defender a irmã.",
  },
  {
    id: "balin-filho-de-fundin",
    name: "Balin, filho de Fundin",
    culture: "anoes",
    age: 197,
    distinctiveFeatureIds: ["avido", "curioso"],
    attributes: { forca: 5, coracao: 4, argucia: 5 },
    endurance: 27,
    hope: 12,
    parry: 15,
    skills: {
      imponencia: 2, atletismo: 1, percepcao: 0, caca: 0, canto: 2, oficio: 2,
      encorajar: 2, viajar: 2, perspicacia: 0, cura: 0, cortesia: 2, batalha: 2,
      persuasao: 2, furtividade: 0, vasculhar: 2, explorar: 1, enigma: 1, saber: 0,
    },
    favouredSkills: ["viajar", "vasculhar", "explorar"],
    combatProficiencies: { machados: 2, arcos: 0, lancas: 1, espadas: 1 },
    rewards: ["Machado de Balin (Cruel, Afiado)", "Cota de Malha de Prata (Ajustada, Fabricação Engenhosa)"],
    valour: 4,
    wisdom: 3,
    virtues: [
      {
        name: "Escuro pra Trabalho Escuro",
        text: "Quando está no escuro (à noite ou no subterrâneo), fica Inspirado em todas as suas rolagens.",
      },
      { name: "Mão Firme", text: "Soma +1 ao dano infligido em um Golpe Pesado." },
      { name: "Caminho de Durin", text: "Soma +2 ao Bloqueio lutando no subterrâneo." },
    ],
    warGear: [{ name: "Machado de Balin", damage: 6, injury: 18, load: 2 }],
    armour: { name: "Cota de Malha de Prata", protection: "4d+2", load: 10 },
    shield: { name: "Escudo", parryBonus: 2, load: 4 },
    travellingGear: "Viola de Fabricação Anã (Canto)",
    quote:
      "Ah, só passando pra um golinho de chá, e o que encontro senão uma nova horda de conspiradores reunidos de novo em torno da mesa do querido Bilbo Bolseiro, encarando à luz de vela algum mapa antigo. Pois que me arrebentem a barba se nossa alegre aventurinha não deixou sua marca! Velhos hábitos custam a morrer, como se costuma dizer, e parece que a companhia de Bilbo de aspirantes a 'caçadores de tesouro experientes' poderia se beneficiar de um toque de tino de quem entende dessas coisas.",
    background:
      "Balin é um viajante endurecido. Lutou em muitas batalhas, mas nunca perdeu o apetite pela aventura. Acompanhou Bilbo e Thorin na Busca por Erebor, e desenvolveu um forte apego ao velho Hobbit arrombador.",
  },
  {
    id: "bilbo-bolseiro-pregen",
    name: "Bilbo Bolseiro",
    culture: "hobbits",
    age: 70,
    distinctiveFeatureIds: ["bem-falante", "honrado"],
    attributes: { forca: 3, coracao: 6, argucia: 5 },
    endurance: 23,
    hope: 16,
    parry: 17,
    skills: {
      imponencia: 0, atletismo: 0, percepcao: 0, caca: 0, canto: 1, oficio: 1,
      encorajar: 0, viajar: 0, perspicacia: 2, cura: 1, cortesia: 2, batalha: 0,
      persuasao: 2, furtividade: 1, vasculhar: 1, explorar: 1, enigma: 1, saber: 1,
    },
    favouredSkills: ["cortesia", "vasculhar", "explorar", "enigma", "saber"],
    combatProficiencies: { machados: 0, arcos: 2, lancas: 0, espadas: 2 },
    rewards: ["Ferrão (espada curta Élfica, ver Equipamento de Guerra)"],
    valour: 2,
    wisdom: 3,
    virtues: [
      { name: "Maestria", text: "Escolha duas Perícias adicionais e torne-as Favorecidas (já contado no total)." },
      {
        name: "Bravo no Aperto",
        text: "Enquanto estiver Arrasado, Exausto ou Ferido, fica Inspirado em todas as suas rolagens.",
      },
      {
        name: "Certeiro no Alvo",
        text: "Todos os seus ataques à distância são Favorecidos. Ao atacar com pedra arremessada, o ataque causa Golpe Perfurante com um ícone de sucesso, Ferimento 12.",
      },
    ],
    warGear: [
      { name: "Ferrão", damage: 3, injury: 20, load: 1, notes: "Brilha quando Orcs estão por perto" },
      { name: "Pedras arremessadas", damage: 1, injury: 12, load: 0 },
    ],
    travellingGear: "Anel Mágico de Bilbo (gaste 1 Esperança pra ficar invisível); Cachimbo Bem-Talhado (Perspicácia)",
    quote:
      "Me chamam de biruta, esquisito, e até um pouco doido. Suponho que, pelos padrões do Condado, não estejam de todo errados. Mas, talvez eu esteja sendo um tanto tookiano demais aqui, eu digo: que mal há numa aventurinha de vez em quando? Ouso dizer que esses simplórios bobos e mexeriqueiros da moda bem que precisavam de mais emoção na vida. Eu certamente tive minha cota nesses anos — e uma bela porção de uma só vez, devo dizer! Com aquele negócio todo de Anões e magos e dragões. Pergunte a um Bolger ou Boffin, e vão dizer que nada de bom veio disso, mas eles não sabem o que estão perdendo!",
    background:
      "Amigo de ursos e hóspede de águias, Bilbo Bolseiro é o Ganha-Anel e Portador de Sorte, e até Cavaleiro-de-Barril! É ao mesmo tempo o maior aventureiro Hobbit de todos os tempos, e o mais pacífico. Mas por trás de suas maneiras alegres, esconde um segredo terrível…",
  },
];

export const TOR_PREGEN_CHARACTER_BY_ID: Record<string, TorPregenCharacter> = Object.fromEntries(
  TOR_PREGEN_CHARACTERS.map((p) => [p.id, p])
);
