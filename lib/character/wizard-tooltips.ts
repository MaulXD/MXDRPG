import { classLevelFeatures, getClass, type ClassId } from "@/lib/character/rules";

/** Descrições mecânicas para tooltips no wizard de criação (livro Cap. raças). */

const CLASS_SURVIVAL_EXTRA: Partial<Record<ClassId, string>> = {
  Paladino:
    "Juramento selado com comida consagrada. Imposição de Mãos e Golpe Sagrado (nv. 2) canalizam radiância; quebrar o voto cancela bônus até absolvição.",
  Bruxo:
    "Pacto com entidade faminta do Vazio — assinado com um prato ritual. Poucos slots de magia, recarga em descanso curto; patrono define o tipo do Raio do Pacto.",
};

export function classSurvivalPassiveTooltip(classId: string): string | undefined {
  const cls = getClass(classId);
  if (!cls) return undefined;
  const extra = CLASS_SURVIVAL_EXTRA[classId as ClassId];
  return extra ? `${cls.dietBonus} ${extra}` : cls.dietBonus;
}

/** Habilidades de classe relevantes já no nv. 1 (preview no wizard). */
export function classFeaturesAtLevelOne(classId: string): string[] {
  return classLevelFeatures(classId, 1);
}

export const RACIAL_TRAIT_DESCRIPTIONS: Record<string, string> = {
  Adaptabilidade:
    "Uma vez por descanso longo, ganha Vantagem em qualquer teste antes de rolar.",
  "Paladar Versátil":
    "Escolhe qual atributo culinário recebe o bônus de primeira vez com monstro novo.",
  "Resistência Mundana": "+2 permanente em Estômago de Ferro.",
  Determinação:
    "Uma vez por dia, ao chegar a 0 HP, fica com 1 HP em vez de cair inconsciente.",

  "Visão Arcana":
    "Visão no escuro 18 m. Detecta campos mágicos e armadilhas num raio de 5 m.",
  "Instinto de Harmonização": "+3 permanente em Harmonização culinária.",
  "Sono Élfico": "Descanso longo em 4 h de meditação (em vez de 8 h).",
  "Resistência a Encantamentos":
    "Vantagem em testes contra Charme e Medo.",

  "Resistência Anã":
    "Vantagem contra veneno e resistência a dano de veneno.",
  "Visão de Escuro": "Visão perfeita no escuro até 18 m.",
  "Mestria de Ferramentas":
    "Proficiência em ferramentas de Trinchar (incl. Especialista). +2 permanente em Trinchar.",
  "Instinto de Forja":
    "Ao criar Ferramentas Orgânicas de Boss, rola duas vezes e usa o melhor resultado.",

  "Sorte Inata":
    "Uma vez por descanso longo, ao rolar 1 natural pode rerrolar e usar o segundo resultado.",
  "Bravura Halfling":
    "Vantagem contra Medo. Não foge de combate por efeitos de medo involuntários.",
  "Furtividade Natural":
    "Pode se esconder mesmo coberto só por uma criatura Média ou maior.",
  "Paladar de Especialista":
    "Ao provar ingrediente cru, sabe se é seguro, tóxico leve, severo ou letal.",

  "Mente Alquímica": "+4 permanente em Harmonização para combinar ingredientes.",
  "Pocioneiro Nato":
    "Poções com ingredientes de monstro ficam uma categoria acima do normal.",
  "Identificação Instantânea":
    "Identifica substância, veneno ou poção com teste de Arcana CD 10.",
  "Resistência Mágica":
    "Vantagem em testes contra magias e efeitos mágicos.",

  "Herança Bestial":
    "1×/dia, ação bônus: instinto animal por 1 minuto (bônus da linhagem).",
  "Olfato Aguçado":
    "Detecta criaturas ocultas ou camufladas pelo cheiro em 9 m.",
  "Corpo Resistente":
    "Resistência a uma condição definida pela linhagem escolhida.",

  "Construto Vivo":
    "Não precisa respirar, comer ou dormir. Imune a veneno, doenças e Encantado.",
  "Núcleo de Alma":
    "Em 0 HP entra em modo de emergência 1d4 h; depois reinicia com 1 HP. Núcleo destruído = morte.",
  "Composição de Monstros":
    "Na criação escolhe 2 partes de monstro — cada uma concede bônus passivo único.",
  Manutenção:
    "Em vez de descanso longo: 1 h de manutenção por Artífice. Sem manutenção 48 h: −1 em testes (cumulativo).",

  // Linhagens — traços listados nas fichas
  "Aterrissagem Felina": "Imune a dano de queda até 18 m; sempre cai de pé.",
  "Visão Noturna": "Visão perfeita no escuro até 18 m.",
  "Reflexos de Predador": "+3 Iniciativa; nunca surpreendido em combate.",
  "Visão Térmica": "Enxerga criaturas de sangue quente através de obstáculos (9 m).",
  "Flexibilidade Óssea": "Passa por aberturas de 15 cm; imune a agarramento.",
  "Veneno Natural": "Mordida +1d4 veneno (CD 12 CON ou Envenenado 1 h).",
  "Força Bruta": "Vantagem em testes de FOR para empurrar, agarrar e derrubar.",
  "Agarrão Poderoso": "Vantagem para iniciar e manter agarrões.",
  "Pelagem Grossa": "Resistência a frio; +1 defesa natural.",
  "Salto Predatório": "Salto longo sem corrida; vantagem em emboscadas de salto.",
  "Camuflagem Listrada": "Vantagem em Furtividade em terreno com cobertura.",
  Rugido: "Ação: intimida inimigos próximos (teste de SAB).",
  "Visão de Caçador": "Vantagem em Percepção para localizar presas à distância.",
  "Voo Planado": "Queda lenta; planar distâncias curtas com queda controlada.",
  Garras: "Ataques desarmados ou garras com dano cortante extra.",
  "Caça em Matilha": "Vantagem em ataque se aliado adjacente atacou o mesmo alvo.",
  Faro: "Rastreia criaturas por cheiro em terreno natural.",
  Mordida: "Mordida desarmada com dano perfurante aprimorado.",
  "Frenesi Aquático": "Vantagem em combate e natação submersa.",
  "Sentido de Sangue": "Detecta criaturas feridas em 18 m pelo cheiro.",
  Memória: "Vantagem para lembrar pistas, mapas e encontros passados.",
  Voo: "Deslocamento aéreo limitado ou planar conforme a linhagem.",
  Augúrio: "1×/dia pressentimento sobre perigo iminente na próxima hora.",
};

export function racialTraitDescription(traitName: string): string | undefined {
  return RACIAL_TRAIT_DESCRIPTIONS[traitName.trim()];
}

/** Divide traços de linhagem ("A, B, C") e devolve pares nome → descrição. */
export function linhagemTraitLines(traitBlob: string): { name: string; description: string }[] {
  return traitBlob.split(",").map((raw) => {
    const name = raw.trim();
    return {
      name,
      description: racialTraitDescription(name) ?? "Traço permanente desta linhagem.",
    };
  });
}

export function antecedenteGainDescription(gain: string): string {
  const map: Record<string, string> = {
    "Percepção e Sobrevivência": "Proficiência nas perícias Percepção e Sobrevivência.",
    "Kit de explorador": "Equipamento de trilha, corda e suprimentos básicos de expedição.",
    "Um idioma extra": "Fala um idioma adicional à escolha.",
    "Arcanismo e História": "Proficiência em Arcanismo e História.",
    "Três idiomas": "Três idiomas extras além do comum da campanha.",
    "Equipamento de escriba": "Tinta, pergaminhos e ferramentas de registro.",
    "Persuasão e Intuição": "Proficiência em Persuasão e Intuição.",
    "Kit de mercador": "Balança, selos e amostras para negociação.",
    "Contatos em cidades": "Rede de comerciantes que facilitam informação e abrigo urbano.",
    "Atletismo e Intimidação": "Proficiência em Atletismo e Intimidação.",
    "Insígnia militar": "Símbolo de unidade que abre portas em guarnições.",
    "Respeito entre soldados": "Soldados reconhecem sua formação e tendem a cooperar.",
    "Medicina e Religião": "Proficiência em Medicina e Religião.",
    "Kit de herbalista": "Ervas, bandagens e preparo de remédios simples.",
    "Visão mística ocasional": "Flashes de insight em locais sagrados ou amaldiçoados.",
    "Furtividade e Enganação": "Proficiência em Furtividade e Enganação.",
    "Contato no submundo": "Informante em guildas de ladrões ou mercado negro.",
    "Ferramentas de ladrão": "Proficiência com ferramentas de ladrão.",
    "História e Persuasão": "Proficiência em História e Persuasão.",
    "Traje fino": "Vestimenta de corte para eventos sociais.",
    "Passagem em alta sociedade": "Acesso a salões e audiências nobres.",
    "Mapa rabiscado": "Mapa parcial de um andar conhecido da masmorra.",
    "Instinto contra emboscadas": "+5 em Percepção passiva contra emboscadas.",
    "Uma perícia à escolha": "Proficiência extra em qualquer perícia.",
    "Equipamento inicial flexível": "Substitui parte do kit padrão por itens equivalentes.",
    "Contato aventureiro": "Conhece um aventureiro que pode enviar missões ou rumores.",
  };
  return map[gain] ?? gain;
}
