/** Panteão jogável — espelha Parte VI do Livro do Jogador + expansão Eldarin v4. */

export type ReligionTier = "major" | "minor" | "secular";

export type ReligionDef = {
  id: string;
  canonId: string;
  name: string;
  epithet: string;
  tier: ReligionTier;
  domain: string;
  symbol: string;
  alignment: string;
  clergy: string;
  summary: string;
  lore: string;
  cults: string[];
  bonuses: string[];
  penalties?: string[];
  favoredClasses?: string[];
  sacredPlaces?: string[];
};

export const RELIGION_LIST: ReligionDef[] = [
  {
    id: "valdrun",
    canonId: "DIV-valdrun",
    name: "Valdrun",
    epithet: "O Eterno Forjador",
    tier: "major",
    domain: "Criação, artesanato, transformação",
    symbol: "Bigorna partida com chama no centro",
    alignment: "Neutro Bom",
    clergy: "Mestres da Forja — avental de couro negro com símbolos gravados a fogo",
    summary: "Nada é refugo. Tudo pode virar ferramenta, remédio ou banquete.",
    lore:
      "Deus mais antigo do panteão, adorado pelos anões antes das masmorras existirem. Ensinou a trabalhar metal e pedra; quando cidades subterrâneas foram engolidas, seus fiéis continuaram construindo. Forjados de Osso são criaturas sagradas — a consciência nasce quando Valdrun sopra alma no Núcleo.",
    cults: ["Igreja da Forja Permanente", "Culto do Desperdício Zero"],
    bonuses: [
      "Artesão Abençoado: proficiência em Extração de todos os níveis",
      "Transformador: 1 rerrolagem/dia em Forrageio falho",
      "Núcleo Resiliente: Forjados +4 CD de destruição do Núcleo",
      "Bênção do Aproveitamento: +1 assimilação garantida em Banquete Lendário de Boss",
    ],
    favoredClasses: ["Artífice", "Guerreiro", "Clérigo"],
    sacredPlaces: ["Santuário da Mão Forjadora", "Ferromur", "Khaz-Durin"],
  },
  {
    id: "mira",
    canonId: "DIV-mira",
    name: "Mira",
    epithet: "A Mãe-Abismo",
    tier: "major",
    domain: "Submundo, adaptação, ciclo da vida",
    symbol: "Boca com dentes de estalagmite e broto verde",
    alignment: "Neutro",
    clergy: "Descentes — sem vestes fixas; cada um veste o que a masmorra ofereceu",
    summary: "A masmorra é organismo vivo. Comer monstro é ato sagrado de adaptação.",
    lore:
      "Personificação do submundo: cada Boca é orifício, cada corredor uma veia, cada monstro uma célula imune. Dogma secreto dos clérigos: o Chefe Final da Masmorra 11 é extensão do corpo de Mira — rito de passagem para quem quer compreender o abismo por inteiro.",
    cults: ["Culto dos Descentes", "Círculo das Onze Bocas"],
    bonuses: [
      "Filho da Masmorra: +2 em todos os saves dentro de masmorras",
      "Adaptação Acelerada: mutações duram 36h",
      "Digestão Sagrada: 1/descanso longo — comer ingrediente cru e rolar assimilação 1d8",
      "Ciclo da Vida: 25% de reviver com 1 HP se 3+ fiéis de Mira presentes ao morrer na masmorra",
    ],
    favoredClasses: ["Druida", "Patrulheiro", "Clérigo"],
    sacredPlaces: ["Poço de Mira (Alto Serath)", "Salmour", "Ninho Caído"],
  },
  {
    id: "sorn",
    canonId: "DIV-sorn",
    name: "Sorn",
    epithet: "O Senhor do Conhecimento Proibido",
    tier: "major",
    domain: "Conhecimento, anatomia, segredos das profundezas",
    symbol: "Olho aberto com pupila em forma de chave",
    alignment: "Neutro (deus) · seguidores variam",
    clergy: "Leitores — robes cinza com textos em tinta de monstro",
    summary: "O submundo é a maior biblioteca. Nenhum conhecimento deve ser destruído.",
    lore:
      "Adorado por saber, não por bondade. Cada monstro é capítulo, cada bioma um volume. Extremistas criam monstros e poluem ecossistemas em nome do conhecimento — a maioria dos Leitores impõe ética pessoal.",
    cults: ["Academia Cinzenta (Vesper)", "Convento do Olho Aberto (clandestino)"],
    bonuses: [
      "Leitor de Espécimes: +4 em Estudo de Anatomia",
      "Arquivo Mental: anatomia mapeada nunca é esquecida",
      "Revelação Proibida: 1/semana — pergunta ao Mestre sobre monstro derrotado",
      "Conhecimento e Carne: Prato Perfeito com espécie estudada = 2 assimilações garantidas",
    ],
    penalties: ["Extremistas perdem reputação em cidades puritanas"],
    favoredClasses: ["Mago", "Artífice", "Bardo"],
    sacredPlaces: ["Universidade de Vesper", "Arquivo Vivo", "Moinho de Pergaminho"],
  },
  {
    id: "thalor",
    canonId: "DIV-thalor",
    name: "Thalor",
    epithet: "O Navegante das Marés",
    tier: "major",
    domain: "Marés, correntes, fronteiras entre superfície e abismo",
    symbol: "Âncora entrelaçada com tentáculo e lua morta",
    alignment: "Caótico Neutro",
    clergy: "Mareantes — casacos encharcados, sinetas de concha",
    summary: "Quem desce pela Boca Azul jura por Thalor. Ele conhece cada corrente submersa.",
    lore:
      "Nasceu do primeiro naufrágio na costa oriental, quando pescadores viram a Boca Azul abrir-se sob a frota real. Thalor não é deus de tempestades — é de correntes invisíveis que ligam mar de superfície ao oceano fragmentado preso sob Eldarin. Salmour o adota como padroeiro; contrabandistas oferecem tinta abissal em seu nome.",
    cults: ["Irmandade da Maré Baixa", "Faróis de Salmour"],
    bonuses: [
      "Pé Firme no Convés: +2 em testes de equilíbrio e natação",
      "Maré Favorável: 1/dia ignora terreno difícil em hexes alagados ou costeiros",
      "Eco Abissal: vantagem em Percepção para ouvir movimento através de água",
      "Salvação do Naufrágio: 1/descanso longo — rerrolar save contra afogamento",
    ],
    favoredClasses: ["Patrulheiro", "Ladino", "Bardo"],
    sacredPlaces: ["Foz das Lágrimas", "Porto Lúgubre", "Boca Azul"],
  },
  {
    id: "vesna",
    canonId: "DIV-vesna",
    name: "Vesna",
    epithet: "A Purificadora",
    tier: "major",
    domain: "Luz, purificação, fronteira contra mortos-vivos",
    symbol: "Tocha invertida — chama para baixo, não consome a haste",
    alignment: "Leal Bom",
    clergy: "Purificadoras — capas brancas manchadas de cinza de osso queimado",
    summary: "A morte que recusa descanso é profanação. Vesna exige que o ciclo se feche.",
    lore:
      "Antiga sacerdotisa mortal que selou a primeira horda da Boca Negra e ascendeu como deusa regional. Grimwald é seu bastião: capelões patrulham a planície contra mortos que sobem pelo Obelisco. Tensão com Mira (ciclo) e com Sorn (estudo de cadáveres).",
    cults: ["Ordem da Purificação (Grimwald)", "Capelas do Obelisco"],
    bonuses: [
      "Toque Purificador: +1d4 radiante em ataques contra mortos-vivos",
      "Resistência à Podridão: vantagem em saves contra doença e veneno necromântico",
      "Ritual do Cinzas: 1/dia — estabilizar aliado a 0 HP sem kit médico",
      "Aura de Clarity: aliados adjacentes +1 em saves contra medo",
    ],
    penalties: ["Desconfiança em cidades devotionais a Sorn ou cultos sombrios"],
    favoredClasses: ["Clérigo", "Paladino", "Guerreiro"],
    sacredPlaces: ["Grimwald", "Torre do Obelisco", "Campo do Obelisco"],
  },
  {
    id: "korrath",
    canonId: "DIV-korrath",
    name: "Korrath",
    epithet: "O General de Cinzas",
    tier: "major",
    domain: "Guerra, disciplina, honra no combate",
    symbol: "Escudo rachado com espada vertical — sangue seco, não fresco",
    alignment: "Leal Neutro",
    clergy: "Legionários — insígnias de ferro sem ornamento",
    summary: "Vitória sem disciplina é carnificina. Korrath abençoa quem protege a retaguarda.",
    lore:
      "Deus patronal das Marches do Sul e das milícias de Kravenholm. Surgiu nas guerras contra draconídeos menores da Boca Vermelha. Não exige crueldade — exige ordem: desertores são pior que inimigos. Soldados de antecedente frequentemente juram por ele mesmo servindo outros deuses.",
    cults: ["Legião de Kraven", "Milícia de Ossenfurt"],
    bonuses: [
      "Formação de Ferro: +1 CA quando adjacente a aliado que também segue Korrath ou é soldado",
      "Ordem de Batalha: 1/dia adiciona +2 em iniciativa de todo o grupo no primeiro round",
      "Segundo Fôlego: 1/descanso curto — recuperar 1d6 HP ao cumprir ordem tática do grupo",
      "Inabalável: vantagem em saves contra medo em combate",
    ],
    favoredClasses: ["Guerreiro", "Paladino", "Monge"],
    sacredPlaces: ["Fortaleza Kraven", "Kravenholm", "Brasa-Pequena"],
  },
  {
    id: "luneth",
    canonId: "DIV-luneth",
    name: "Luneth",
    epithet: "A Tecelã do Véu",
    tier: "major",
    domain: "Lua, sonhos, anomalias, Boca Vazia",
    symbol: "Meia-lua atravessada por fio de prata que forma labirinto",
    alignment: "Caótico Neutro",
    clergy: "Sonhadores — véus que cobrem metade do rosto; nunca repetem o mesmo sonho duas vezes",
    summary: "O que aparece onde não deveria é mensagem. Luneth lê o padrão entre as Bocas.",
    lore:
      "Deusa jovem no panteão — culto cresceu com aparições da Boca Vazia. Roda-Lua e peregrinos do planalto creem que ela tece o mapa do continente em sonhos compartilhados. Magos de Vesper debatem se Luneth é face de Sorn ou entidade independente; clérigos dizem que a pergunta é o ponto.",
    cults: ["Círculo de Roda-Lua", "Vigias do Véu (Alto Serath)"],
    bonuses: [
      "Sonho Lúcido: 1/descanso longo — visionar pista sobre próxima masmorra (Mestre dá 1 detalhe)",
      "Passo Entre Hexes: 1/dia teletransporte de 1 hex após save de INT CD 12 (só em área com névoa ou anomalia)",
      "Leitura do Véu: +2 em Arcanismo e História sobre fenômenos planares",
      "Presença Etérea: vantagem em Furtividade à noite ou em névoa",
    ],
    favoredClasses: ["Mago", "Bardo", "Ladino"],
    sacredPlaces: ["Roda-Lua", "Boca Vazia (móvel)", "Alto Serath"],
  },
  {
    id: "brasa-reinante",
    canonId: "DIV-brasa-reinante",
    name: "Brasa-Reinante",
    epithet: "Senhor das Entranhas de Fogo",
    tier: "major",
    domain: "Fogo interior, forja viva, transmutação pelo calor",
    symbol: "Crisol humanoide com coração de brasa visível",
    alignment: "Neutro",
    clergy: "Abrasadores — pele marcada com cinzas ritualísticas; sem ferimentos por calor comum",
    summary: "O calor que não consome é revelação. A Boca Vermelha é seu altar natural.",
    lore:
      "Divindade regional do sul vulcânico, rival espiritual de Valdrun entre ferreiros de Kravenholm: Valdrun transforma com paciência; Brasa-Reinante exige passagem pelo fogo. Piromantes e alquimistas de fogo invocam seu nome antes de descer à Boca Vermelha. Alguns clérigos de Valdrun consideram sincretismo aceitável.",
    cults: ["Ordem do Crisol Aberto", "Guilda das Três Forjas"],
    bonuses: [
      "Sangue Quente: resistência a fogo (metade do dano)",
      "Toque do Crisol: armas corpo-a-corpo +1d4 fogo 1/descanso longo",
      "Fervura Interior: +2 em Coccão para pratos assados ou flambados",
      "Brasa Persistente: mutações de fogo/brasas duram +12h",
    ],
    favoredClasses: ["Mago", "Artífice", "Guerreiro"],
    sacredPlaces: ["Três Forjas", "Kravenholm", "Boca Vermelha"],
  },
  {
    id: "faca-sem-nome",
    canonId: "DIV-faca-sem-nome",
    name: "A Faca Sem Nome",
    epithet: "O Silêncio Vertical",
    tier: "minor",
    domain: "Sigilo, assassinato ritual, anonimato sagrado",
    symbol: "Faca vertical com lâmina virada para dentro",
    alignment: "Neutro",
    clergy: "Nenhum clero formal — apenas praticantes",
    summary: "Sem mito público. Apenas prática: nunca revelar o nome do alvo após o serviço.",
    lore:
      "Entidade adorada por assassinos e ladinos que cultivam silêncio como religião. Não há templos — há quartos sem espelhos em Mirraga e becos de Ossenfurt. Diz-se que quem pronuncia o nome verdadeiro da Faca perde a língua antes do amanhecer.",
    cults: ["Casa dos Espelhos Quebrados (Mirraga)"],
    bonuses: [
      "+2 em todos os ataques furtivos",
      "Imunidade a detecção mágica de presença",
      "1/dia apagar memória recente de testemunha ocular (save WIS CD 14)",
    ],
    favoredClasses: ["Ladino", "Patrulheiro"],
    sacredPlaces: ["Mirraga", "Becos de Ossenfurt"],
  },
  {
    id: "enxame",
    canonId: "DIV-enxame",
    name: "O Enxame",
    epithet: "A Soma das Pequenas Vidas",
    tier: "minor",
    domain: "Coletivo, enxame, criaturas pequenas do submundo",
    symbol: "Três pontos em triângulo que se multiplicam em espiral",
    alignment: "Neutro Bom",
    clergy: "Vozes — sempre em grupo de três ou mais ao rezar",
    summary: "Nenhum indivíduo importa; a colônia sim. Popular entre halflings e goblinoides.",
    lore:
      "Deidade sem forma única — é a soma de todas as criaturas pequenas do submundo. Tribos da Masmorra 3 e famílias halfling do Vale Podre oferecem fungos e migalhas em círculo. Valdrunistas acham vulgar; seguidores de Mira veem parentesco ecológico.",
    cults: ["Colônia do Vale Podre", "Tribos fúngicas (Masmorra 3)"],
    bonuses: [
      "Com 3+ aliados adjacentes: +1 CA",
      "+1 em ataques por aliado adicional acima de 2 (máx. +4)",
      "Vantagem em saves contra efeitos que isolam ou separam do grupo",
    ],
    favoredClasses: ["Ladino", "Druida", "Bardo"],
    sacredPlaces: ["Vale Podre", "Torre do Frasco Verde"],
  },
  {
    id: "primeiro-cozinheiro",
    canonId: "DIV-primeiro-cozinheiro",
    name: "O Primeiro Cozinheiro",
    epithet: "Mito da Primeira Refeição",
    tier: "minor",
    domain: "Culinária sagrada, primeira assimilação",
    symbol: "Caldeirão com três pernas e vapor em forma de rosto sorrindo",
    alignment: "Neutro Bom",
    clergy: "Mestres-cozinheiros da Academia de Culinária de Ossenfurt",
    summary: "Não é deus oficial do panteão — mas tem altar na Academia. Primeiro a cozinhar monstro e viver.",
    lore:
      "Figura mítica: teria preparado o primeiro prato de monstro e sobrevivido, inaugurando a culinária biomágica. A Academia de Ossenfurt mantém altar com provas diárias. Valdrunistas e seguidores do Primeiro Cozinheiro debatem se são o mesmo em aspectos diferentes.",
    cults: ["Academia de Culinária (Ossenfurt)", "Guilda dos Caldeirões"],
    bonuses: [
      "Primeira vez por espécie: Prato Perfeito recupera todos os espaços de magia gastos no preparo",
      "+1 em Harmonização permanente",
      "1/dia rerrolar teste de Coccão",
    ],
    favoredClasses: ["Bardo", "Druida", "Clérigo"],
    sacredPlaces: ["Ossenfurt", "Palácio das Medidas"],
  },
  {
    id: "sem-deus",
    canonId: "DIV-sem-deus",
    name: "Sem Deus",
    epithet: "O Caminho Terreno",
    tier: "secular",
    domain: "Autoconfiança, pragmatismo, orgulho secular",
    symbol: "Mão aberta sem marca — ou espaço vazio deliberado",
    alignment: "Sem alinhamento divino",
    clergy: "Nenhum",
    summary: "Sem devoção. Sem bênção divina — e sem filtro nas mutações do corpo.",
    lore:
      "Exploradores céticos, filósofos e sobreviventes que viram deuses demais para confiar em algum. Em Eldarin isso é escolha válida: há custo e recompensa. Cidades profundamente religiosas desconfiam; serviços de templo não atendem.",
    cults: [],
    bonuses: [
      "Autoconfiança: 1/descanso longo — +1d6 em qualquer teste antes de rolar",
      "Metabolismo Puro: mutações duram 48h (dobro)",
      "Imune a saves que exijam falta de fé como CD extra",
      "Orgulho Terreno: a 0 HP sem aliados — Dado de Vida extra como ação bônus",
    ],
    penalties: [
      "Sem serviços religiosos nem magias com apelo divino acima de nv 4",
      "Desconfiança em cidades devotionais (Vesna, Valdrun)",
    ],
    favoredClasses: ["Qualquer"],
    sacredPlaces: ["Nenhum — ou qualquer lugar que você conquistar"],
  },
];

export type ReligionId = (typeof RELIGION_LIST)[number]["id"];

export function getReligion(id: string | null | undefined): ReligionDef | undefined {
  if (!id) return undefined;
  const trimmed = id.trim().toLowerCase();
  return RELIGION_LIST.find(
    (r) => r.id === trimmed || r.name.toLowerCase() === trimmed || r.canonId.toLowerCase() === trimmed
  );
}

/** Garante ID canônico na ficha — desconhecido vira sem-deus. */
export function normalizeReligionId(id: string | null | undefined): string {
  if (!id?.trim()) return "sem-deus";
  return getReligion(id)?.id ?? "sem-deus";
}

export function religionDisplayName(id: string | null | undefined): string {
  const r = getReligion(id);
  if (!r) return id?.trim() || "—";
  return r.tier === "secular" ? r.name : `${r.name} — ${r.epithet}`;
}

export const MAJOR_RELIGIONS = RELIGION_LIST.filter((r) => r.tier === "major");
export const MINOR_RELIGIONS = RELIGION_LIST.filter((r) => r.tier === "minor");
export const SECULAR_RELIGIONS = RELIGION_LIST.filter((r) => r.tier === "secular");
