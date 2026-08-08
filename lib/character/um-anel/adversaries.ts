import type { TorAdversaryStats } from "./adversary-types";

/**
 * Bestiário completo do Um Anel (2ª ed.) — extraído de
 * livros/um-anel/08-mestre-e-adversarios.md ("Evil Men" até "Werewolves").
 * Habilidades Sinistras são texto informativo pro Mestre no v1 (gasto de
 * Ódio/Resolução pra ativá-las não é mecanizado ainda — ver plano da Fase 4,
 * "Deferido pra v1.1").
 */
const TOR_ADVERSARIES_RAW: TorAdversaryStats[] = [
  // ——— Homens Maus ———
  {
    id: "invasor-do-sul",
    name: "Saqueador Sulista",
    traits: "Astuto, Endurecido",
    tier: "mob",
    attributeLevel: 4,
    endurance: 16,
    might: 1,
    hate: 4,
    hateKind: "resolve",
    parry: 1,
    armour: 2,
    description: "Depois de um inverno rigoroso, Homens do Sul podem reunir bandos de guerra em busca de alguma propriedade isolada pra saquear.",
    actions: [
      { id: "machado", label: "Machado", rating: 3, damage: 5, injury: 18 },
      { id: "lanca-curta", label: "Lança Curta", rating: 2, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Gente Feroz", text: "Gaste 1 Resolução pra ganhar (1d) e tornar a rolagem de ataque Favorecida." },
    ],
  },
  {
    id: "campeao-do-sul",
    name: "Campeão Sulista",
    traits: "Cruel, Resistente",
    tier: "elite",
    attributeLevel: 5,
    endurance: 20,
    might: 1,
    hate: 5,
    hateKind: "resolve",
    parry: 2,
    armour: 3,
    description: "Pode ser um cacique de Dunland, um senhor bandido capaz de unir guerreiros turbulentos numa pequena tropa, ou só um bandoleiro particularmente cruel.",
    actions: [
      { id: "lanca", label: "Lança", rating: 3, damage: 4, injury: 14, specialDamage: ["Perfurar"] },
      { id: "machado-longo", label: "Machado de Cabo Longo", rating: 3, damage: 6, injury: 18, specialDamage: ["Quebrar Escudo"] },
    ],
    fellAbilities: [
      { name: "Gente Feroz", text: "Gaste 1 Resolução pra ganhar (1d) num ataque e tornar a rolagem Favorecida." },
    ],
  },
  {
    id: "batedor-de-bolsos",
    name: "Salteador",
    traits: "Ágil, Cauteloso",
    tier: "mob",
    attributeLevel: 2,
    endurance: 8,
    might: 1,
    hate: 2,
    hateKind: "resolve",
    parry: 0,
    armour: 1,
    description: "Um bandido covarde, pronto pra roubar uma vítima indefesa, mas capaz de emboscar um companheiro solitário com ajuda de outros.",
    actions: [
      { id: "porrete", label: "Porrete", rating: 2, damage: 3, injury: 12 },
      { id: "arco", label: "Arco", rating: 2, damage: 3, injury: 14, specialDamage: ["Perfurar"], ranged: true },
    ],
    fellAbilities: [
      { name: "Covarde", text: "Quando afetado pela Tarefa de Combate Intimidar Inimigo, a criatura também perde 1 Resolução." },
    ],
  },
  {
    id: "chefe-arruaceiro",
    name: "Chefe dos Rufiões",
    traits: "Implacável, Reservado",
    tier: "mob",
    attributeLevel: 3,
    endurance: 12,
    might: 1,
    hate: 3,
    hateKind: "resolve",
    parry: 1,
    armour: 2,
    description: "Mais resistente ou simplesmente mais feroz, um chefe é um arruaceiro que chegou ao topo com a ajuda de uma mente ou lâmina mais afiada.",
    actions: [
      { id: "espada-curta", label: "Espada Curta", rating: 3, damage: 3, injury: 16 },
      { id: "arco", label: "Arco", rating: 2, damage: 3, injury: 14, specialDamage: ["Perfurar"], ranged: true },
    ],
    fellAbilities: [
      { name: "Grito de Triunfo", text: "Gaste 1 Resolução pra restaurar 1 Resolução a todos os outros Rufiões na luta." },
    ],
  },
  {
    id: "assaltante-de-estrada",
    name: "Ladrão de Estrada",
    traits: "Veloz, Vingativo",
    tier: "mob",
    attributeLevel: 4,
    endurance: 16,
    might: 1,
    hate: 4,
    hateKind: "resolve",
    parry: 0,
    armour: 2,
    description: "Mais perigoso que um bandido comum, um assaltante de estrada está acostumado à vida selvagem e sabe lidar com vítimas armadas.",
    actions: [
      { id: "lanca", label: "Lança", rating: 3, damage: 4, injury: 14, specialDamage: ["Perfurar"] },
      { id: "arco", label: "Arco", rating: 2, damage: 3, injury: 14, specialDamage: ["Perfurar"], ranged: true },
    ],
    fellAbilities: [
      { name: "Velocidade Serpentina", text: "Quando alvo de um ataque, gaste 1 Resolução pra tornar a rolagem de ataque Desfavorecida." },
    ],
  },

  // ——— Orcs (todos: Ódio ao Sol) ———
  {
    id: "soldado-orc",
    name: "Soldado Orc",
    traits: "Rebelde, Vingativo",
    tier: "mob",
    attributeLevel: 3,
    endurance: 12,
    might: 1,
    hate: 3,
    hateKind: "hate",
    parry: 1,
    armour: 2,
    description: "Armados com as clássicas espadas tortas, os Soldados Orc são barulhentos e indisciplinados.",
    actions: [
      { id: "cimitarra", label: "Cimitarra", rating: 3, damage: 3, injury: 16 },
      { id: "lanca", label: "Lança", rating: 2, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Covarde", text: "No início da rodada, foge do campo de batalha se estiver com 0 de Ódio e desengajado." },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
    ],
  },
  {
    id: "cacique-orc",
    name: "Cacique Orc",
    traits: "Cruel, Endurecido",
    tier: "elite",
    attributeLevel: 5,
    endurance: 20,
    might: 1,
    hate: 5,
    hateKind: "hate",
    parry: 3,
    armour: 3,
    description: "Só os Orcs mais cruéis vivem o bastante pra virar caciques e liderar seu bando à batalha.",
    actions: [
      { id: "cimitarra", label: "Cimitarra", rating: 3, damage: 3, injury: 16 },
      { id: "lanca", label: "Lança", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Grande Salto", text: "Gaste 1 Ódio pra atacar qualquer herói, em qualquer postura, incluindo Retaguarda." },
      { name: "Velocidade Serpentina", text: "Quando alvo de um ataque, gaste 1 Ódio pra tornar a rolagem de ataque Desfavorecida." },
      { name: "Grito de Triunfo", text: "Gaste 1 Ódio pra restaurar 1 Ódio a todos os outros Orcs na luta." },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
    ],
  },
  {
    id: "chefe-grande-orc",
    name: "Chefe Grande Orc",
    traits: "Audaz, Astuto",
    tier: "boss",
    attributeLevel: 7,
    endurance: 48,
    might: 2,
    hate: 7,
    hateKind: "hate",
    parry: 3,
    armour: 4,
    description: "Uma estirpe poderosa de Orc, os Grandes Orcs — como Azog e seu filho Bolg — são frequentemente encontrados como líderes de seus parentes de sangue mais fraco.",
    actions: [
      { id: "cimitarra-pesada", label: "Cimitarra Pesada", rating: 3, damage: 5, injury: 18, specialDamage: ["Quebrar Escudo"] },
      { id: "lanca-de-ponta-larga", label: "Lança de Ponta Larga", rating: 3, damage: 5, injury: 16, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Força Horrenda", text: "Se a criatura causou um Golpe Perfurante com ataque corpo a corpo, gaste 1 Ódio pra tornar a rolagem de Proteção do alvo Desfavorecida." },
      { name: "Velocidade Serpentina", text: "Quando alvo de um ataque, gaste 1 Ódio pra tornar a rolagem de ataque Desfavorecida." },
      { name: "Grito de Triunfo", text: "Gaste 1 Ódio pra restaurar 1 Ódio a todos os outros Orcs na luta." },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
    ],
  },
  {
    id: "guarda-costas-grande-orc",
    name: "Guarda-costas Grande Orc",
    traits: "Feroz, Cauteloso",
    tier: "elite",
    attributeLevel: 6,
    endurance: 24,
    might: 2,
    hate: 6,
    hateKind: "hate",
    parry: 2,
    armour: 3,
    description: "Menos astutos do que quem os lidera, essas criaturas sinistras protegem seus capitães ao custo da própria vida.",
    actions: [
      { id: "machado-orc", label: "Machado Orc", rating: 3, damage: 3, injury: 18, specialDamage: ["Quebrar Escudo"] },
      { id: "lanca-de-ponta-larga", label: "Lança de Ponta Larga", rating: 3, damage: 5, injury: 16, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Rijeza Hedionda", text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima." },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
    ],
  },
  {
    id: "arqueiro-goblin",
    name: "Arqueiro Goblin",
    traits: "Astuto, Olhos Aguçados",
    tier: "mob",
    attributeLevel: 2,
    endurance: 8,
    might: 1,
    hate: 2,
    hateKind: "hate",
    parry: 0,
    armour: 1,
    description: "Um Arqueiro Goblin é um Orc escolhido por sua visão aguçada. Sua capacidade de enxergar no escuro, aliada a mãos firmes, permite atirar flechas com precisão de dia ou de noite.",
    actions: [
      { id: "arco-de-chifre", label: "Arco de Chifre", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"], ranged: true },
      { id: "faca-serrilhada", label: "Faca Serrilhada", rating: 2, damage: 2, injury: 14 },
    ],
    fellAbilities: [
      { name: "Covarde", text: "Quando afetado pela Tarefa de Combate Intimidar Inimigo, a criatura também perde 1 Ódio." },
      { name: "Veneno de Orc", text: "Se um ataque resultar em Ferida, o alvo também é envenenado." },
    ],
  },
  {
    id: "guarda-orc",
    name: "Guarda Orc",
    traits: "Forte, Vigilante",
    tier: "mob",
    attributeLevel: 4,
    endurance: 16,
    might: 1,
    hate: 4,
    hateKind: "hate",
    parry: 2,
    armour: 3,
    description: "Os Orcs mais fortes e ousados são equipados com a armadura mais resistente que conseguem achar ou montar, e postos pra vigiar uma área com espada e escudo firme.",
    actions: [
      { id: "cimitarra", label: "Cimitarra", rating: 3, damage: 3, injury: 16 },
      { id: "lanca", label: "Lança", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
    ],
  },

  // ——— Trolls (todos: Rijeza Hedionda + Cabeça-dura, livro l.899-903) ———
  {
    id: "grande-troll-das-cavernas",
    // Troll: o livro usa Trolls como exemplo de criatura grande (POS-R03).
    large: true,
    name: "Grande Troll das Cavernas",
    traits: "Brutamontes, Perverso",
    tier: "boss",
    attributeLevel: 10,
    endurance: 80,
    might: 2,
    hate: 10,
    hateKind: "hate",
    parry: 0,
    armour: 3,
    description: "Enviado por Orcs pra esmagar as defesas e o moral dos inimigos que mais temem.",
    actions: [
      { id: "esmagar", label: "Esmagar", rating: 3, damage: 6, injury: 12, specialDamage: ["Agarrar"] },
      { id: "mordida", label: "Mordida", rating: 2, damage: 6, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      {
        name: "Rijeza Hedionda",
        text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima.",
      },
      {
        name: "Infundir Medo",
        text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 2 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica intimidado e não pode gastar Esperança pelo resto da luta.",
      },
      { name: "Couro Grosso", text: "Gaste 1 ponto de Ódio pra ganhar (2d) numa rolagem de Proteção." },
      {
        name: "Cabeça-dura",
        text: "Heróis em postura Avançada podem tentar uma Tarefa de Combate especial: rolagem de ENIGMA como ação principal da rodada — sucesso reduz o Ódio do Troll em 1, mais 1 por ícone de Sucesso.",
      },
    ],
  },
  {
    id: "cave-troll-furtivo",
    // Troll: o livro usa Trolls como exemplo de criatura grande (POS-R03).
    large: true,
    // Estava meio em inglês ("Cave-troll"); o vizinho já usava a forma PT-BR
    // "Grande Troll das Cavernas", então segue a mesma.
    name: "Troll das Cavernas Furtivo",
    traits: "Furtivo, Cauteloso",
    tier: "elite",
    attributeLevel: 6,
    endurance: 50,
    might: 2,
    hate: 6,
    hateKind: "hate",
    parry: 0,
    armour: 3,
    description: "Essa estirpe de Troll das Cavernas é menor que muitos de seus parentes, mas ainda maior que a maioria dos Orcs. Acostumado a viver nas profundezas da terra, um Troll das Cavernas Furtivo costuma caçar sozinho e no escuro, contando com seu olfato aguçado.",
    actions: [
      { id: "clava", label: "Clava", rating: 3, damage: 6, injury: 16, specialDamage: ["Quebrar Escudo"] },
      { id: "mordida", label: "Mordida", rating: 2, damage: 6, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Habitante das Trevas", text: "Todas as rolagens de ataque são Favorecidas na escuridão." },
      { name: "Medo do Fogo", text: "Perde 1 Ódio no início de cada rodada engajado em combate corpo a corpo com um adversário empunhando tocha ou item em chamas." },
      { name: "Couro Grosso", text: "Gaste 1 ponto de Ódio pra ganhar (2d) numa rolagem de Proteção." },
      { name: "Rijeza Hedionda", text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima." },
      { name: "Cabeça-dura", text: "Heróis em postura Avançada podem tentar uma Tarefa de Combate especial: rolagem de ENIGMA como ação principal — sucesso reduz o Ódio do Troll em 1, mais 1 por ícone de Sucesso." },
    ],
  },
  {
    id: "ladrao-troll-de-pedra",
    // Troll: o livro usa Trolls como exemplo de criatura grande (POS-R03).
    large: true,
    name: "Ladrão Troll de Pedra",
    traits: "Faminto, Irritável",
    tier: "elite",
    attributeLevel: 8,
    endurance: 60,
    might: 2,
    hate: 8,
    hateKind: "hate",
    parry: 0,
    armour: 3,
    description: "A aparência de um Ladrão Troll de Pedra, embora sempre assustadora, é amenizada por sua tendência a vestir roupas simples, cozinhar comida e usar ferramentas como jarras e barris.",
    actions: [
      { id: "clava", label: "Clava", rating: 3, damage: 6, injury: 16, specialDamage: ["Quebrar Escudo"] },
      { id: "esmagar", label: "Esmagar", rating: 2, damage: 6, injury: 12, specialDamage: ["Agarrar"] },
    ],
    fellAbilities: [
      { name: "Ódio Mortal (Anões)", text: "Ao lutar contra Anões, todas as rolagens da criatura são Favorecidas." },
      { name: "Força Horrenda", text: "Se a criatura causou um Golpe Perfurante, gaste 1 Ódio pra tornar a rolagem de Proteção do alvo Desfavorecida." },
      { name: "Rijeza Hedionda", text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima." },
      { name: "Cabeça-dura", text: "Heróis em postura Avançada podem tentar uma Tarefa de Combate especial: rolagem de ENIGMA como ação principal — sucesso reduz o Ódio do Troll em 1, mais 1 por ícone de Sucesso." },
    ],
  },
  {
    id: "chefe-troll-de-pedra",
    // Troll: o livro usa Trolls como exemplo de criatura grande (POS-R03).
    large: true,
    name: "Chefe Troll de Pedra",
    traits: "Cruel, Desconfiado",
    tier: "boss",
    attributeLevel: 9,
    endurance: 70,
    might: 2,
    hate: 9,
    hateKind: "hate",
    parry: 0,
    armour: 3,
    description: "Pequenos grupos de Trolls de Pedra podem se unir ao redor de um membro mais forte de sua estirpe, pra atacar caravanas de mercadores ou fazendas isoladas.",
    actions: [
      { id: "clava", label: "Clava", rating: 3, damage: 6, injury: 16, specialDamage: ["Quebrar Escudo"] },
      { id: "esmagar", label: "Esmagar", rating: 2, damage: 6, injury: 12, specialDamage: ["Agarrar"] },
    ],
    fellAbilities: [
      { name: "Ódio Mortal (Anões)", text: "Ao lutar contra Anões, todas as rolagens da criatura são Favorecidas." },
      { name: "Força Horrenda", text: "Se a criatura causou um Golpe Perfurante, gaste 1 Ódio pra tornar a rolagem de Proteção do alvo Desfavorecida." },
      { name: "Grito de Triunfo", text: "Gaste 1 Ódio pra restaurar 1 Ódio a todos os outros Trolls na luta." },
      { name: "Rijeza Hedionda", text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima." },
      { name: "Cabeça-dura", text: "Heróis em postura Avançada podem tentar uma Tarefa de Combate especial: rolagem de ENIGMA como ação principal — sucesso reduz o Ódio do Troll em 1, mais 1 por ícone de Sucesso." },
    ],
  },

  // ——— Mortos-Vivos (todos: Sem Morte + Sem Coração + Infundir Medo, livro l.1002-1004) ———
  {
    id: "barrow-wight",
    // Nome de exibição em PT-BR (convenção do projeto). O `id` fica em inglês
    // de propósito — é chave estável, e renomear quebraria salas salvas.
    name: "Tumulário",
    traits: "Astuto, Vingativo",
    tier: "elite",
    attributeLevel: 6,
    endurance: 24,
    might: 1,
    hate: 6,
    hateKind: "hate",
    parry: 0,
    armour: 3,
    description: "Enviado às colinas de Tyrn Gorthad pelo Rei-Bruxo de Angmar pra atormentar seus inimigos nas guerras contra Arnor, um Barrow-wight aparece como uma figura alta e sombria, com olhos frios acesos por uma luz pálida.",
    actions: [
      { id: "espada-antiga", label: "Espada Antiga", rating: 3, damage: 5, injury: 16, specialDamage: ["Perfurar"] },
      { id: "toque-gelido", label: "Toque Gélido", rating: 2, damage: 6, injury: 12, specialDamage: ["Agarrar"] },
    ],
    fellAbilities: [
      { name: "Habitante das Trevas", text: "Todas as rolagens de ataque são Favorecidas na escuridão." },
      { name: "Feitiços Terríveis", text: "Gaste 1 Ódio pra fazer um herói ganhar 3 pontos de Sombra (Feitiçaria). Quem falhar no Teste de Sombra ou estiver Arrasado cai inconsciente e só acorda com uma rolagem de MÚSICA, ou depois de uma hora." },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
      { name: "Imorredouro", text: "Gaste 1 Ódio pra cancelar uma Ferida. Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, gaste 1 Ódio pra retornar à Resistência máxima. Ineficaz contra armas mágicas encantadas pra Perdição dos Mortos-Vivos." },
      { name: "Sem Coração", text: "A criatura não é afetada pela Tarefa de Combate Intimidar Inimigo, a menos que se obtenha um sucesso Mágico." },
      { name: "Infundir Medo", text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 3 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica intimidado e não pode gastar Esperança pelo resto da luta." },
    ],
  },
  {
    id: "espectro-funesto",
    name: "Espectro Funesto",
    traits: "Veloz, Cauteloso",
    tier: "mob",
    attributeLevel: 4,
    endurance: 16,
    might: 1,
    hate: 4,
    hateKind: "hate",
    parry: 1,
    armour: 2,
    description: "Espectros Funestos aparecem como andarilhos encurvados, vagando entre ruínas antigas, envoltos em capas que escondem seus traços espectrais. Sua carne é quase transparente, e seus olhos parecem brasas.",
    actions: [
      { id: "lamina-cravejada", label: "Lâmina Corroída", rating: 3, damage: 4, injury: 16 },
      { id: "lanca-cruel", label: "Lança Cruel", rating: 2, damage: 4, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Habitante das Trevas", text: "Todas as rolagens de ataque são Favorecidas na escuridão." },
      { name: "Medo do Fogo", text: "Perde 1 Ódio no início de cada rodada engajado em combate corpo a corpo com um adversário empunhando tocha ou item em chamas." },
      { name: "Imorredouro", text: "Gaste 1 Ódio pra cancelar uma Ferida. Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, gaste 1 Ódio pra retornar à Resistência máxima. Ineficaz contra armas mágicas encantadas pra Perdição dos Mortos-Vivos." },
      { name: "Sem Coração", text: "A criatura não é afetada pela Tarefa de Combate Intimidar Inimigo, a menos que se obtenha um sucesso Mágico." },
      { name: "Infundir Medo", text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 3 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica intimidado e não pode gastar Esperança pelo resto da luta." },
    ],
  },
  {
    id: "habitantes-do-pantano",
    name: "Habitantes do Pântano",
    traits: "Ferozes, Furtivos",
    tier: "mob",
    attributeLevel: 3,
    endurance: 12,
    might: 1,
    hate: 3,
    hateKind: "hate",
    parry: 0,
    armour: 1,
    description: "Os Habitantes do Pântano são criaturas humanoides trôpegas, de carne pálida e úmida, como a de um cadáver deixado pra apodrecer na água. Uma luz sinistra em seus olhos pequenos sugere uma vitalidade e intenção perversas.",
    actions: [
      { id: "mordida", label: "Mordida", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
      { id: "garras", label: "Garras", rating: 2, damage: 3, injury: 14, specialDamage: ["Agarrar"] },
    ],
    fellAbilities: [
      { name: "Medo do Fogo", text: "Perde 1 Ódio no início de cada rodada engajado em combate corpo a corpo com um adversário empunhando tocha ou item em chamas." },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
      { name: "Imorredouro", text: "Gaste 1 Ódio pra cancelar uma Ferida. Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, gaste 1 Ódio pra retornar à Resistência máxima. Ineficaz contra armas mágicas encantadas pra Perdição dos Mortos-Vivos." },
      { name: "Sem Coração", text: "A criatura não é afetada pela Tarefa de Combate Intimidar Inimigo, a menos que se obtenha um sucesso Mágico." },
      { name: "Infundir Medo", text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 3 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica intimidado e não pode gastar Esperança pelo resto da luta." },
    ],
  },

  // ——— Lobos Selvagens (todos: Grande Salto) ———
  {
    id: "warg",
    name: "Warg",
    traits: "Olhos Aguçados, Severo",
    tier: "mob",
    attributeLevel: 3,
    endurance: 12,
    might: 1,
    hate: 3,
    hateKind: "hate",
    parry: 0,
    armour: 1,
    description: "Lobos malignos de astúcia perversa e intenção maliciosa.",
    actions: [{ id: "presas", label: "Presas", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"] }],
    fellAbilities: [
      { name: "Grande Salto", text: "Gaste 1 Ódio pra atacar qualquer herói, em qualquer postura, incluindo Retaguarda." },
      {
        name: "Medo do Fogo",
        text: "Perde 1 Ódio no início de cada rodada engajado em combate corpo a corpo com um adversário empunhando tocha ou item em chamas.",
      },
      { name: "Velocidade Serpentina", text: "Quando alvo de um ataque, gaste 1 Ódio pra tornar a rolagem de ataque Desfavorecida." },
    ],
  },
  {
    id: "chefe-de-alcateia",
    name: "Chefe dos Lobos",
    traits: "Rápido, Cruel",
    tier: "elite",
    attributeLevel: 4,
    endurance: 16,
    might: 1,
    hate: 4,
    hateKind: "hate",
    parry: 0,
    armour: 1,
    description: "Maior em estatura, crueldade e astúcia que os Wargs comuns, um Chefe de Alcateia é convocado por seus parentes menores pra lidar com ameaças sérias. Nunca é encontrado sozinho, sempre cercado por uma alcateia de Wargs.",
    actions: [
      { id: "presas", label: "Presas", rating: 3, damage: 4, injury: 14, specialDamage: ["Perfurar"] },
      { id: "garras", label: "Garras", rating: 2, damage: 4, injury: 14, specialDamage: ["Agarrar"] },
    ],
    fellAbilities: [
      { name: "Grande Salto", text: "Gaste 1 Ódio pra atacar qualquer herói, em qualquer postura, incluindo Retaguarda." },
      { name: "Medo do Fogo", text: "Perde 1 Ódio no início de cada rodada engajado em combate corpo a corpo com um adversário empunhando tocha ou item em chamas." },
      { name: "Velocidade Serpentina", text: "Quando alvo de um ataque, gaste 1 Ódio pra tornar a rolagem de ataque Desfavorecida." },
      { name: "Uivo de Triunfo", text: "Gaste 1 Ódio pra restaurar 1 Ódio a todos os outros Wargs na luta." },
    ],
  },

  // ——— Lobisomens ———
  {
    id: "sabujo-de-sauron",
    name: "Cão de Sauron",
    traits: "Astuto, Feroz",
    tier: "boss",
    attributeLevel: 5,
    endurance: 20,
    might: 2,
    hate: 5,
    hateKind: "hate",
    parry: 1,
    armour: 2,
    description: "Escolhido por sua ferocidade e inteligência maliciosa, um Sabujo de Sauron é um servo do Senhor do Escuro, enviado numa missão precisa — reunir forças pra uma guerra vindoura, caçar um indivíduo específico, ou espionar uma área.",
    actions: [
      { id: "presas", label: "Presas", rating: 3, damage: 5, injury: 14, specialDamage: ["Perfurar"] },
      { id: "garras", label: "Garras", rating: 3, damage: 5, injury: 14, specialDamage: ["Agarrar"] },
    ],
    fellAbilities: [
      { name: "Ferida Mortal", text: "Alvos Feridos fazem uma rolagem Desfavorecida de Dado de Proeza para determinar a severidade do ferimento." },
      {
        name: "Rijeza Hedionda",
        text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima.",
      },
      {
        name: "Infundir Medo",
        text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 3 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica intimidado e não pode gastar Esperança pelo resto da luta.",
      },
      { name: "Grande Salto", text: "Gaste 1 Ódio pra atacar qualquer herói, em qualquer postura de combate, inclusive Retaguarda." },
    ],
  },

  // ——— Adversária única de Marco (livros/um-anel/13-apendice-patronos-e-ficha.md, "The Star of the Mist") ———
  {
    id: "elwen-a-espectra-funesta",
    name: "Elwen, a Espectra Funesta",
    traits: "Horrível, Pesarosa",
    tier: "boss",
    attributeLevel: 5,
    endurance: 24,
    might: 2,
    hate: 5,
    hateKind: "hate",
    parry: 2,
    armour: 2,
    description: "A nobre viúva do Senhor Hadirion, consumida pelo pesar após vê-lo torturado até a morte pelo Rei-Bruxo — ao longo dos anos, tornou-se a Espectra Funesta que assombra a Torre da Estrela na Bruma, no sopé sul das Montanhas Azuis.",
    actions: [
      { id: "lamina-corroida", label: "Lâmina Corroída", rating: 3, damage: 4, injury: 16, specialDamage: ["Perfurar"] },
      { id: "lanca", label: "Lança", rating: 2, damage: 4, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      { name: "Habitante das Trevas", text: "Rolagens de ataque são Favorecidas na escuridão." },
      { name: "Medo do Fogo", text: "Perde 1 Ódio no início de cada rodada engajada em combate corpo a corpo com um adversário empunhando tocha ou item em chamas." },
      {
        name: "Imorredouro",
        text: "Gaste 1 Ódio pra cancelar uma Ferida; quando um dano a levaria a 0 de Resistência, gaste 1 Ódio pra retornar à Resistência máxima. Ineficaz contra armas mágicas encantadas pra Perdição dos Mortos-Vivos. Imune à Tarefa de Combate Intimidar Inimigo, a menos que se obtenha um sucesso Mágico.",
      },
      {
        name: "Infundir Medo",
        text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 3 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra se perde na névoa e não pode se reunir ao grupo até a rodada seguinte.",
      },
    ],
  },

  // ——— Adversários nomeados de Eriador (livros/um-anel/12-o-mundo-eriador.md) ———
  {
    id: "barrow-king",
    name: "Rei-Tumulário",
    traits: "Astuto, Feroz, Vingativo",
    tier: "boss",
    attributeLevel: 9,
    endurance: 45,
    might: 2,
    hate: 9,
    hateKind: "hate",
    // O livro lista Bloqueio "–": sem escudo nem esquiva, o modificador é 0.
    parry: 0,
    armour: 4,
    description:
      "Chefe de todas as criaturas que assombram Tyrn Gorthad, no covil do Grande Túmulo. Dizem ser o último Rei de Cardolan — ou um capitão funesto que outrora serviu Angmar. Fala a Língua Comum e a Língua Negra de Mordor.",
    actions: [
      { id: "espada-antiga", label: "Espada Antiga", rating: 3, damage: 5, injury: 18, specialDamage: ["Perfurar"] },
      { id: "toque-gelido", label: "Toque Gélido", rating: 3, damage: 6, injury: 12, specialDamage: ["Quebrar Escudo"] },
    ],
    fellAbilities: [
      {
        name: "Mais Escuro que a Escuridão",
        text: "Gaste 1 Ódio pra invocar escuridão sobrenatural: heróis em combate corpo a corpo perdem (2d) no primeiro ataque contra a criatura, e ataques à distância perdem (2d) durante toda a luta.",
      },
      { name: "Habitante das Trevas", text: "Todas as rolagens de ataque são Favorecidas enquanto estiver no escuro." },
      {
        name: "Feitiços Terríveis",
        text: "Gaste 1 Ódio pra fazer um herói ganhar 3 pontos de Sombra (Feitiçaria). Alvos que falham no Teste de Sombra ou que estão Arrasados caem inconscientes, despertados apenas com uma rolagem de Canto; senão acordam depois de uma hora.",
      },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
      // Mortos-vivos: as três de família (livro l.1002-1004).
      {
        name: "Imorredouro",
        text: "Gaste 1 Ódio pra cancelar uma Ferida, ou dano que a levaria a 0 de Resistência. Ineficaz contra heróis empunhando arma mágica encantada para a Ruína dos Mortos-vivos.",
      },
      {
        name: "Sem Coração",
        text: "Imune à Tarefa de Combate Intimidar Inimigo, a menos que se obtenha um sucesso Mágico.",
      },
      {
        name: "Infundir Medo",
        text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 3 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica intimidado e não pode gastar Esperança pelo resto da luta.",
      },
    ],
  },
  {
    id: "burzgul",
    name: "Búrzgul",
    traits: "Cruel, Olhos Aguçados",
    tier: "elite",
    attributeLevel: 5,
    endurance: 22,
    might: 1,
    hate: 5,
    hateKind: "hate",
    parry: 3,
    armour: 3,
    description:
      "Cacique Orc do Portão dos Goblins, lidera um bando que uniu forças com os Lobos das Cavas Uivantes e constrói em segredo uma ameaça que os Rangers ainda não conhecem.",
    actions: [
      // "Sobrepujar" (Overbear no original) é listado à parte como Dano Especial
      // sempre disponível, mas seu efeito não está definido em nenhum ponto do
      // material extraído — ver a nota em 12-o-mundo-eriador.md. Fica registrado
      // como texto pro Mestre, não mecanizado por chute.
      { id: "cimitarra", label: "Cimitarra", rating: 3, damage: 3, injury: 16, specialDamage: ["Quebrar Escudo", "Sobrepujar"] },
      { id: "lanca", label: "Lança", rating: 2, damage: 3, injury: 14, specialDamage: ["Perfurar", "Sobrepujar"] },
    ],
    fellAbilities: [
      { name: "Veneno de Orc", text: "Se um ataque produzir ao menos 1 ícone de Sucesso, o alvo é envenenado." },
      { name: "Velocidade Serpentina", text: "Ao ser alvo de um ataque, gaste 1 Ódio pra tornar a rolagem de ataque Desfavorecida." },
      { name: "Grito de Triunfo", text: "Gaste 1 Ódio pra restaurar 1 Ódio a todos os outros Orcs da luta." },
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
    ],
  },
  {
    id: "ash-the-warg",
    name: "Ash",
    traits: "Astuto, Veloz",
    tier: "elite",
    attributeLevel: 4,
    endurance: 20,
    might: 1,
    hate: 4,
    hateKind: "hate",
    parry: 2,
    armour: 1,
    description: "O Warg companheiro de Búrzgul, tão astuto quanto o Orc que cavalga a seu lado.",
    actions: [
      { id: "presas", label: "Presas", rating: 3, damage: 4, injury: 14, specialDamage: ["Perfurar"] },
      { id: "garras", label: "Garras", rating: 2, damage: 5, injury: 14 },
    ],
    fellAbilities: [
      {
        name: "Medo do Fogo",
        text: "Desfavorecido em todas as rolagens em combate corpo a corpo com quem porta tocha ou item em chamas.",
      },
      {
        name: "Assalto Selvagem",
        text: "Gaste 1 Ódio depois de um ataque de Presas pra rolar imediatamente um ataque de Garras no mesmo alvo.",
      },
      // Lobos das Terras Selvagens: habilidade de família (livro l.1082).
      { name: "Grande Salto", text: "Gaste 1 Ódio pra atacar qualquer herói, em qualquer postura de combate, inclusive Retaguarda." },
    ],
  },

  // ——— Adversários das aventuras do Starter Set (14-aventuras-starter-set.md) ———
  //
  // Os blocos das aventuras são SIMPLIFICADOS: o livro não lista Vigor,
  // Ódio/Resolução nem Traços, campos que o formato completo do capítulo 8 exige.
  // Vigor ausente = 1 (é o que o motor assume por padrão, ver `might` em
  // lib/vtt/types.ts) e o Ódio foi derivado do Nível de Atributo, que é a
  // convenção do próprio livro nos blocos completos. Nada foi inventado além
  // disso — os campos que a aventura dá estão exatos.
  {
    id: "jack-the-stone-troll",
    // Troll: o livro usa Trolls como exemplo de criatura grande (POS-R03).
    large: true,
    name: "Jack, o Troll de Pedra",
    traits: "Brutamontes, Faminto",
    tier: "boss",
    attributeLevel: 8,
    endurance: 34,
    might: 1,
    hate: 8,
    hateKind: "hate",
    parry: 1,
    armour: 3,
    description:
      "O Troll de Pedra que ronda as ruínas antigas nas Charnecas do Norte, em *Caçadores de Tesouro Experientes*. Grande e poderoso, mas bastante estúpido: foge ao ficar Ferido ou perder metade da Resistência, e pode ser enganado até o amanhecer o transformar em pedra.",
    actions: [{ id: "esmagar", label: "Esmagar", rating: 2, damage: 6, injury: 12, specialDamage: ["Agarrar"] }],
    fellAbilities: [
      // Trolls: as duas de família (livro l.899-903).
      {
        name: "Rijeza Hedionda",
        text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima.",
      },
      {
        name: "Cabeça-dura",
        text: "Heróis em postura Avançada podem tentar uma Tarefa de Combate especial: rolagem de ENIGMA como ação principal da rodada — sucesso reduz o Ódio do Troll em 1, mais 1 por ícone de Sucesso.",
      },
    ],
  },
  {
    id: "orc-veteran",
    name: "Veterano Orc",
    traits: "Cruel, Endurecido",
    tier: "elite",
    attributeLevel: 4,
    endurance: 16,
    might: 1,
    hate: 4,
    hateKind: "hate",
    parry: 2,
    armour: 3,
    description:
      "Orc decrépito perdido há muito nas cavernas sob as Colinas de Scary, em *Fogos de Artifício Mais Excelentes*. Luta até ficar Ferido ou reduzido a metade ou menos da Resistência, e então foge para as passagens escuras da mina.",
    actions: [
      { id: "lanca-recortada", label: "Lança Recortada", rating: 3, damage: 3, injury: 14, specialDamage: ["Perfurar"] },
    ],
    fellAbilities: [
      // Orcs: habilidade de família (livro l.769-770).
      { name: "Odeia a Luz do Sol", text: "Perde 1 Ódio no início de cada rodada exposto à luz plena do sol." },
    ],
  },
  {
    id: "burnt-beast",
    name: "Fera Queimada",
    traits: "Feroz, Furtivo",
    tier: "elite",
    attributeLevel: 5,
    endurance: 20,
    might: 1,
    hate: 5,
    hateKind: "hate",
    parry: 2,
    armour: 3,
    description:
      "Cão de caça que outrora pertenceu a um senhor de Homens nas Colinas dos Túmulos, voltou como reflexo escuro do que foi. Em *Para Acalmar uma Fera Selvagem* aparecem em PAR. Não são inteiramente malignas e raramente tentam matar — morrer por arma comum não as detém de vez, mas receber um nome próprio de novo pode libertá-las.",
    actions: [{ id: "presas", label: "Presas", rating: 4, damage: 5, injury: 14, specialDamage: ["Perfurar"] }],
    fellAbilities: [
      { name: "Grande Salto", text: "Pode atacar qualquer herói, em qualquer postura de combate, inclusive Retaguarda." },
      { name: "Habitante das Trevas", text: "Todas as rolagens de ataque são Favorecidas enquanto estiver na escuridão." },
    ],
  },

  // ── Aranhas ────────────────────────────────────────────────────────────
  //
  // FECHA A LACUNA DO BLOCO DE ARANHA (CVR-030). Até aqui o corpus traduzido da
  // 2ª edição citava Aranhas como TIPO de inimigo (Característica Distintiva
  // "Conhecimento do Inimigo", armas de Perdição, "Veneno de Aranha" na tabela de
  // Fontes de Dano) sem nenhum bloco de estatísticas — e duas aventuras de
  // *Tales from Wilderland* pediam um. A fonte apareceu no apêndice "Personagens
  // e Criaturas" de *The Darkening of Mirkwood* (1ª edição, tradução de Mateus
  // Soares, páginas 133–136), convertido aqui pela régua CVR.
  //
  // Vigor: os blocos de 1ª edição não têm o campo (CVR-030, lacuna 1). Fica em 1,
  // que é o padrão do motor — NÃO é uma estimativa do valor real, e a asserção do
  // teste existe justamente pra impedir que vire outro número sem fonte.
  {
    id: "aranha-cacadora",
    name: "Aranha Caçadora",
    traits: "Agressiva, Furtiva",
    // Res 25 contra os 10 do Goblin da Floresta do mesmo apêndice: não é chusma.
    tier: "elite",
    attributeLevel: 4,
    endurance: 25,
    might: 1,
    hate: 3,
    hateKind: "hate",
    // 1ª ed. `Parry` = Bloqueio da 2ª, só o nome muda (CVR-005).
    parry: 6,
    armour: 3,
    description:
      "As Aranhas Caçadoras são as sementes de Tauler, o Caçador, e sua irmã Sarqin: grandes, peludas, mais rápidas e mais agressivas que o resto da parentela. **Não tecem teias** — espreitam nas sombras e sob pilhas de folhas mortas até a presa se aproximar. É o bloco que *Não Desvie da Trilha* e *Sobre Ervas e Hobbits Cozidos* pediam, e a segunda aventura o descreve exatamente assim: a aranha da caverna tem **Grande Salto** no lugar de Habitante das Trevas.",
    actions: [
      // 1ª ed.: Bicar — Dano 6, Gume ⊘, Trauma 15, Ataque Direcionado "Envenena".
      // O Gume é descartado (CVR-008: na 2ª edição o limiar é fixo em 10 ou ⊘).
      // "Envenena" não vira Dano Especial — a 2ª edição só tem Quebrar Escudo,
      // Golpe Pesado, Perfurar e Agarrar (cap. 8). O veneno virou Habilidade
      // Sinistra, no mesmo molde do "Veneno de Orc" que já existe neste bestiário.
      { id: "bicar", label: "Bicar", rating: 2, damage: 6, injury: 15 },
    ],
    fellAbilities: [
      { name: "Grande Salto", text: "Gaste 1 Ódio pra atacar qualquer herói, em qualquer postura de combate, inclusive Retaguarda." },
      {
        name: "Força Horrenda",
        text: "Se a criatura causou um Golpe Perfurante, gaste 1 Ódio pra tornar a rolagem de Proteção do alvo Desfavorecida.",
      },
      {
        // O nome da Fonte de Dano vem da própria 2ª edição: "Veneno de Aranha" é
        // o exemplo de nível GRAVÍSSIMO da linha Veneno (08-mestre-e-adversarios).
        name: "Veneno de Aranha",
        text: "Se um ataque produzir ao menos 1 ícone de Sucesso, o alvo é envenenado: Fonte de Dano Veneno, nível Gravíssimo, rolada ao fim de cada dia — a zero de Resistência o herói está Morrendo. Os efeitos passam depois de um dia inteiro.",
      },
    ],
  },
  {
    id: "tauler-o-cacador",
    // "Grande Tamanho" no bloco de 1ª edição — é o critério de criatura grande
    // para os limites de engajamento (POS-R03).
    large: true,
    name: "Selvagem Tauler",
    traits: "Paciente, Voraz",
    tier: "boss",
    attributeLevel: 7,
    endurance: 60,
    might: 1,
    hate: 8,
    hateKind: "hate",
    parry: 8,
    armour: 3,
    description:
      "Tauler, o Caçador, é uma das três Crias de Shelob — do tamanho de um elefante pequeno, mas ágil para o tamanho, e capaz de ficar emboscado por semanas esperando o momento. O bico é duro como aço e a pele suporta a ponta da mais dura das lâminas. **Não arrisca o couro:** se for ferido uma vez, ou se a Resistência cair a zero, interrompe a luta e foge.",
    actions: [
      // Tabela de armas das Crias de Shelob: Dano = Nível de Atributo nas duas.
      // "Derruba" (Ataque Direcionado de 1ª ed.) vira SOBREPUJAR: a Tabela 7 de
      // Formas de Ataque da 2ª edição dá, para "Esmagar (cascos, patas)",
      // exatamente Dano = Nível de Atributo, Ferimento 14 e Dano Especial
      // Sobrepujar — os mesmos números do Pisotear. Não é estimativa.
      { id: "pisotear", label: "Pisotear", rating: 3, damage: 7, injury: 14, specialDamage: ["Sobrepujar"] },
      { id: "bicar", label: "Bicar", rating: 5, damage: 7, injury: 18 },
    ],
    fellAbilities: [
      {
        name: "Força Horrenda",
        text: "Se a criatura causou um Golpe Perfurante, gaste 1 Ódio pra tornar a rolagem de Proteção do alvo Desfavorecida.",
      },
      {
        // 1ª ed. "Resiliência Terrível".
        name: "Rijeza Hedionda",
        text: "Quando um ataque causaria dano que reduziria a criatura a 0 de Resistência, causa um Golpe Perfurante em vez disso. Se a criatura ainda estiver viva, retorna à Resistência máxima.",
      },
      {
        // 1ª ed. "Amedrontar (NA 16)" — o NA fixo some (CVR-030, lacuna 2).
        name: "Infundir Medo",
        text: "Gaste 1 Ódio pra fazer todos os heróis à vista ganharem 3 pontos de Sombra (Pavor). Quem falhar no Teste de Sombra fica intimidado e não pode gastar Esperança pelo resto da luta.",
      },
      {
        name: "Veneno de Aranha",
        text: "Se um ataque de Bicar produzir ao menos 1 ícone de Sucesso, o alvo é envenenado: Fonte de Dano Veneno, nível Gravíssimo, rolada ao fim de cada dia — a zero de Resistência o herói está Morrendo.",
      },
    ],
  },
];

const TIER_DIFFICULTY_RANK: Record<TorAdversaryStats["tier"], number> = {
  mob: 0,
  elite: 1,
  boss: 2,
};

/** Bestiário ordenado por dificuldade — tier (Bando → Elite → Chefe) e, dentro de
 * cada tier, Nível de Atributo crescente (do mais fraco pro mais forte). Ordem de
 * extração do livro por categoria (Homens Maus, Orcs, Trolls...) fica só nos
 * comentários acima, em `TOR_ADVERSARIES_RAW`. */
export const TOR_ADVERSARIES: TorAdversaryStats[] = [...TOR_ADVERSARIES_RAW].sort(
  (a, b) =>
    TIER_DIFFICULTY_RANK[a.tier] - TIER_DIFFICULTY_RANK[b.tier] ||
    a.attributeLevel - b.attributeLevel
);

export const TOR_ADVERSARY_BY_ID: Record<string, TorAdversaryStats> = Object.fromEntries(
  TOR_ADVERSARIES.map((a) => [a.id, a])
);
