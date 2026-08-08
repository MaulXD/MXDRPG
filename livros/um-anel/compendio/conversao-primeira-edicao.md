# Conversão da 1ª edição — O Um Anel

> **Fonte da 2ª edição:** `livros/um-anel/08-mestre-e-adversarios.md`,
> `livros/um-anel/06-fases-de-aventura-combate.md`, `livros/um-anel/02-resolucao-de-acoes.md`
> e `livros/um-anel/03-aventureiros.md`.
> **Material de 1ª edição:** *Tales from Wilderland* e *The Darkening of Mirkwood*
> (tradução de Mateus Soares, em `the one ring/`).
> **PT-BR curado para o compêndio.** Fonte da verdade (D15). Editar aqui e rodar `npm run sync:data`.

Esta tabela existe para que **cada aventura convertida não invente a própria conversão**. Toda
equivalência abaixo aponta para o trecho da 2ª edição que a sustenta. Onde a 2ª edição **não**
traz o número ou a regra, a entrada fica registrada como **lacuna** — não é preenchida por
estimativa.

Uma aventura de 1ª edição não é traduzida: é **convertida**. O texto de cena continua valendo
quase inteiro; o que muda é a camada de regras.

---

# Bloco de adversário

## CVR-001 — Nível de Atributo

- **1ª edição:** `Attribute Level`
- **2ª edição:** Nível de Atributo
- **Muda?:** não

> Descrição: Mesmo nome e mesma função nas duas edições — um valor único no lugar dos três
> Atributos do herói. Na 2ª edição ele passa a ser somado em mecânicas concretas: "essa
> classificação numérica é aplicada como modificador a várias mecânicas, como por exemplo
> diversas oportunidades de Dano Especial e Habilidades Sinistras". O Golpe Pesado, por exemplo,
> causa perda de Resistência igual ao Nível de Atributo do atacante. Copiar o número da 1ª edição
> é seguro; ignorá-lo não é.

---

## CVR-002 — Resistência

- **1ª edição:** `Endurance`
- **2ª edição:** Resistência
- **Muda?:** não

> Descrição: Mesmo papel. Nas duas edições o adversário é retirado do combate ao chegar a zero.

---

## CVR-003 — Vigor

- **1ª edição:** não existe no bloco
- **2ª edição:** Vigor (obrigatório)
- **Muda?:** sim — precisa ser atribuído

> Descrição: A 2ª edição exige Vigor de todo adversário: "o Vigor indica o número de Ferimentos
> necessários para abater um inimigo de vez, e o número de ataques que ele pode fazer durante uma
> rodada de combate". Os blocos de 1ª edição não trazem esse valor, e **a 2ª edição não dá regra
> de conversão**. O caminho seguro é reaproveitar o Vigor do bloco equivalente do bestiário 2ª ed
> (`lib/character/um-anel/adversaries.ts`) em vez de estimar. No bestiário traduzido, **todo
> adversário de escalão comum tem Vigor 1**; elites e chefes variam entre 1 e 2, e há chefe com
> Vigor 1 — Jack, o Troll de Pedra. O Vigor mede Ferimentos para abater, **não** porte nem
> importância na cena. Isso é observação do dado existente, não fórmula do livro. Sem bloco
> equivalente, ver CVR-030.

---

## CVR-004 — Ódio e Resolução

- **1ª edição:** `Hate` (para todos)
- **2ª edição:** Ódio **ou** Resolução, conforme a criatura
- **Muda?:** sim — a escolha passa a ter consequência

> Descrição: A 1ª edição dá Ódio a todo adversário. A 2ª edição separa: "Adversários com uma
> classificação de pontos de Ódio devem ser considerados lacaios ou servos do Inimigo"; já
> "Homens Maus e outros adversários não monstruosos muitas vezes têm uma classificação de
> Resolução". A separação não é cosmética: **atacar ou matar um adversário com Resolução deve
> sempre ser avaliado pelo Mestre como possível Malfeitoria**. Bandidos, rufiões e Homens Maus
> das aventuras de 1ª edição viram Resolução; Orcs, Trolls, Aranhas e mortos-vivos ficam com Ódio.

---

## CVR-005 — Bloqueio

- **1ª edição:** `Parry`
- **2ª edição:** Bloqueio
- **Muda?:** só o nome

> Descrição: "O Bloqueio de um adversário é um modificador numérico que é somado ao NA de FORÇA
> de qualquer herói-jogador que tente acertá-lo em combate." O termo **Parada** não existe na 2ª
> edição traduzida — em todo o corpus é **Bloqueio**.

---

## CVR-006 — Armadura

- **1ª edição:** `Armour 1d`, `2d`…
- **2ª edição:** Armadura, em número de Dados de Proteção
- **Muda?:** só a notação

> Descrição: "A Armadura de um adversário funciona do mesmo modo que a de um herói — é usada
> pelo Mestre para fazer um teste de Proteção quando o adversário é atingido por um Golpe
> Perfurante." `1d` vira `1`, `2d` vira `2`, e assim por diante.

---

## CVR-007 — Proficiências de Combate

- **1ª edição:** `Weapon Skills` — uma perícia por arma
- **2ª edição:** Proficiência de Combate primária e secundária
- **Muda?:** sim — a lista encolhe

> Descrição: "Cada adversário apresenta uma Proficiência de Combate primária e uma secundária,
> representando seus principais meios de ataque. Cada forma de ataque listada é seguida primeiro
> por sua classificação, depois por seus valores de Dano/Ferimento e, finalmente, pelas
> oportunidades de Dano Especial." As perícias de arma soltas da 1ª edição viram duas ações no
> bloco. Do lado do herói, as quatro Proficiências da 2ª edição são Machados, Arcos, Lanças e
> Espadas — mais a Briga, que não é Proficiência própria.

---

## CVR-008 — Fio da Lâmina

- **1ª edição:** `Edge` — o número que aciona um Golpe Perfurante
- **2ª edição:** **não existe**
- **Muda?:** sim — some do bloco

> Descrição: Na 2ª edição o limiar é fixo e igual para todas as armas: "uma rolagem de ataque
> produz um Golpe Perfurante com um resultado de **10 ou [Rune]** no Dado de Proeza". O campo
> `Edge` do bloco de 1ª edição é simplesmente **descartado** — mantê-lo criaria um segundo limiar
> que a 2ª edição não usa.

---

## CVR-009 — Ferimento

- **1ª edição:** `Injury`
- **2ª edição:** Ferimento
- **Muda?:** não

> Descrição: Nas duas edições é o NA do teste de Proteção que o alvo de um Golpe Perfurante
> precisa fazer. Não confundir com o limiar do golpe (CVR-008) nem com o Dano Especial Perfurar
> (CVR-011).

---

## CVR-010 — Tiro Certeiro

- **1ª edição:** `Called Shot` — um efeito por arma (Desarmar, Atordoar…)
- **2ª edição:** Dano Especial
- **Muda?:** sim — vira outra lista

> Descrição: A 2ª edição substitui o Tiro Certeiro por **opções de Dano Especial**, gastas com
> ícones de Sucesso: "se uma rolagem de ataque bem-sucedida feita por um adversário produzir um ou
> mais ícones de Sucesso (ᛥ), o Mestre pode gastá-los para acionar resultados especiais. Todos os
> resultados especiais listados aqui exigem 1 ícone de Sucesso". As listas de herói (capítulo 6) e
> de adversário (capítulo 8) são **diferentes** — usar a errada troca as opções disponíveis.
> Todo adversário pode sempre acionar Golpe Pesado.

---

## CVR-011 — Perfurar (Dano Especial) ≠ Golpe Perfurante

- **1ª edição:** —
- **2ª edição:** duas coisas distintas com nomes parecidos
- **Muda?:** atenção ao converter

> Descrição: **Perfurar** é opção de Dano Especial: gasta ícone de Sucesso e soma +2 ao resultado
> do Dado de Proeza do ataque, possivelmente *provocando* um Golpe Perfurante. **Golpe Perfurante**
> é o resultado 10 ou Runa que obriga o alvo a um teste de Proteção. Texto de 1ª edição que fale em
> "acertar um ponto vital" costuma virar o primeiro, não o segundo.

---

## CVR-012 — Habilidades Especiais

- **1ª edição:** `Special Abilities` — nome solto, sem custo
- **2ª edição:** Habilidades Sinistras, com custo em Ódio/Resolução
- **Muda?:** sim — ganham preço

> Descrição: Na 2ª edição quase toda Habilidade Sinistra é um **gasto opcional** ("Gaste 1 ponto
> de Ódio pra…"), decisão do Mestre na hora. Ao converter, procurar primeiro a Habilidade Sinistra
> equivalente no bestiário 2ª ed (`lib/character/um-anel/adversaries.ts`) — por exemplo, o
> "Poltrão" da 1ª edição corresponde a **Covarde**. Habilidade sem equivalente vira lacuna
> (CVR-030), não uma habilidade nova.

---

# Perícias

## CVR-013 — Perícias que mudaram de nome

- **1ª edição:** Assombro · Atenção · Cantigas · Intuição · Investigação · Conhecimento
- **2ª edição:** Fascínio · Vigilância · Música · Discernimento · Busca · História
- **Muda?:** só o nome

> Descrição: Mesma perícia, rótulo diferente na tradução da 2ª edição. Também aparecem no plural
> na 1ª edição e no singular na 2ª: **Enigmas → Enigma**, **Caça → Caçada**. O texto de cena das
> aventuras cita perícias pelo nome o tempo todo, então esta é a substituição mais frequente de
> toda a conversão.

---

## CVR-014 — Perícias que não mudaram

- **1ª edição:** Atletismo · Persuasão · Cortesia · Furtividade · Exploração · Viagem · Cura · Batalha · Ofício
- **2ª edição:** as mesmas
- **Muda?:** não

> Descrição: Passam direto. O grupo de Atributo a que pertencem pode diferir da memória de quem
> jogou a 1ª edição — conferir em `lib/character/um-anel/data.ts` antes de escrever "teste de
> FORÇA".

---

## CVR-015 — Grupos de perícia do bloco de adversário

- **1ª edição:** Personality · Movement · Perception · Survival · Custom · Vocation
- **2ª edição:** **não existem**
- **Muda?:** sim — somem

> Descrição: Blocos de adversário da 2ª edição não listam perícias: trazem Nível de Atributo,
> Resistência, Vigor, Ódio/Resolução, Bloqueio, Armadura e as Proficiências de Combate. Quando a
> aventura pedir uma rolagem *do adversário* fora do combate, usar o Nível de Atributo. Os seis
> grupos são **descartados**, não convertidos em perícias de herói.

---

# Rolagens e dificuldade

## CVR-016 — Número-Alvo

- **1ª edição:** NA fixo por teste (NA 12, 14, 16, 18…)
- **2ª edição:** NA do Atributo do herói
- **Muda?:** sim — a dificuldade muda de lugar

> Descrição: Na 2ª edição "cada um rola contra o NA do Atributo relevante", e o NA sai da ficha
> (20 menos o valor do Atributo, ou 18 menos, na variante de campanha curta). A dificuldade da
> cena **não** é expressa mudando o NA: é expressa em **Complicações e Vantagens** (CVR-017). Os
> NAs fixos escritos nas aventuras de 1ª edição são descartados. A 2ª edição **não** fornece
> tabela numérica de conversão de NA fixo para modificador — ver CVR-030.

---

## CVR-017 — Complicações e Vantagens

- **1ª edição:** NA mais alto ou mais baixo
- **2ª edição:** *perde (1d)* / *perde (2d)* / *ganha (1d)* / *ganha (2d)*
- **Muda?:** sim

> Descrição: A 2ª edição expressa dificuldade em Dados de Sucesso: moderadamente prejudicado
> *perde (1d)*, severamente prejudicado *perde (2d)*; vantagem moderada *ganha (1d)*, vantagem
> maior *ganha (2d)*. São cumulativos e têm piso em zero dados — diferente de
> Favorecida/Desfavorecida, que rolam dois Dados de Proeza e **se cancelam**. Um herói pode gastar
> a ação principal numa rolagem de **BATALHA** para remover uma complicação ou obter uma vantagem.

---

## CVR-018 — Graus de sucesso

- **1ª edição:** sucesso normal · sucesso maior · sucesso extraordinário
- **2ª edição:** sucesso · grande sucesso · sucesso extraordinário
- **Muda?:** só o nome do meio

> Descrição: "Um ícone de Sucesso — a conquista do herói-jogador foi fora do comum (**um grande
> sucesso**). Dois ou mais ícones de Sucesso — o resultado foi absolutamente excepcional e
> memorável (**um sucesso extraordinário**)." Gastar um ícone em Dano Especial **não** rebaixa o
> grau.

---

## CVR-019 — Ação prolongada

- **1ª edição:** "teste de ação prolongada" — N sucessos acumulados
- **2ª edição:** Empreitada de Perícia
- **Muda?:** sim — vira estrutura com Resistência e limite de tempo

> Descrição: A 2ª edição estrutura isso como Empreitada de Perícia: o Mestre julga se é Simples
> (Resistência 3), Laboriosa (Resistência 6) ou Assustadora (Resistência 9), e o limite de tempo é
> igual à Resistência, +1 ou +2 conforme a Companhia tenha pouco tempo, tempo suficiente ou tempo
> de sobra. "Três testes de Atletismo de ação prolongada" vira uma Empreitada de Resistência 3.

---

# Encontros sociais

## CVR-020 — Tolerância

- **1ª edição:** Tolerância, com Introduções e Interação
- **2ª edição:** Conselho — Resistência 3/6/9 e atitude da audiência
- **Muda?:** sim — a estrutura inteira

> Descrição: A 2ª edição substitui a Tolerância pelo **Conselho**: a Resistência mede a dificuldade
> do pedido (razoável 3, ousado 6, ultrajante 9), a Introdução define o limite de tentativas, e a
> **atitude da audiência** — Relutante *perde (1d)*, Aberta neutra, Amigável *ganha (1d)* —
> modifica todas as rolagens. Os ajustes de Tolerância da 1ª edição ("aumente a tolerância em 1 se
> houver um elfo no grupo") viram atitude ou Resistência, conforme falem de **simpatia** ou de
> **dificuldade do pedido**. A 2ª edição **não** dá tabela numérica de Tolerância para Resistência
> — ver CVR-030.

---

# Jornada e Fadiga

## CVR-021 — Testes de fadiga da viagem

- **1ª edição:** N "testes de fadiga" por estação, com NA fixo
- **2ª edição:** Testes de Marcha e Eventos de Jornada
- **Muda?:** sim — a Fadiga passa a vir dos Eventos

> Descrição: Na 2ª edição a Fadiga não vem de testes próprios: vem da **coluna de Fadiga da Tabela
> de Eventos de Jornada** ("todos os eventos adicionalmente fazem com que todos na Companhia
> ganhem uma quantidade de pontos de Fadiga") e da **marcha forçada** (1 ponto por dia). O número
> de testes por estação da 1ª edição vira número de Eventos de Jornada; a duração em dias vira
> trechos e terreno difícil.

---

## CVR-022 — Fadiga

- **1ª edição:** Fadiga
- **2ª edição:** Fadiga
- **Muda?:** não

> Descrição: Mesmo papel — soma à Carga total e leva a Exausto. Sai a 1 ponto por Descanso
> Prolongado em refúgio abrigado, e no fim da jornada pelo Vigor da montaria e por uma rolagem de
> VIAGEM.

---

## CVR-023 — Perigos da viagem

- **1ª edição:** "sugestões de perigo" por papel (Guia, Batedor, Vigia, Caçador)
- **2ª edição:** Eventos de Jornada com alvo por papel
- **Muda?:** sim — passam a sair de tabela

> Descrição: A 2ª edição sorteia o evento no Dado de Proeza e o alvo num Dado de Sucesso, e o papel
> define a perícia. Os perigos escritos na aventura viram **descrição** do evento sorteado, não
> encontros com NA próprio: o livro pede exatamente isso ao Mestre ("esteja pronto para improvisar
> uma cena curta descrevendo o que está acontecendo com a Companhia, com base na informação que o
> sistema de resolução de eventos forneceu").

---

# Sombra

## CVR-024 — Teste de corrupção

- **1ª edição:** teste de corrupção
- **2ª edição:** Teste de Sombra
- **Muda?:** só o nome, e a fonte passa a importar

> Descrição: Ganhos de Sombra da 2ª edição têm **fonte** — Pavor, Ganância, Malfeito, Feitiçaria —
> e a fonte decide se o Teste de Sombra usa VALOR ou SABEDORIA, e se pode reduzir o ganho:
> **Malfeito não pode ser reduzido nem cancelado**. Ao converter, escolher a fonte pelo que a cena
> descreve.

---

## CVR-025 — Pontos de Sombra

- **1ª edição:** pontos de Sombra
- **2ª edição:** pontos de Sombra e Cicatrizes de Sombra
- **Muda?:** ganha uma segunda moeda

> Descrição: A 2ª edição acrescenta a **Cicatriz de Sombra**, permanente, que conta como ponto
> normal para todos os efeitos e só sai na Empreitada Curar Cicatrizes, numa Fase de Yule. Ganhos
> de Sombra escritos nas aventuras de 1ª edição são pontos comuns, salvo quando o texto disser que
> a marca é permanente.

---

# Recursos

## CVR-026 — Pontos de Tesouro

- **1ª edição:** pontos de tesouro
- **2ª edição:** Tesouro
- **Muda?:** só o nome

> Descrição: Recompensas escritas como "dois pontos de Tesouro cada" passam direto.

---

## CVR-027 — Padrão de Vida

- **1ª edição:** `Standard of Living`
- **2ª edição:** Padrão de Vida
- **Muda?:** não

> Descrição: Seis níveis — Pobre, Frugal, Comum, Próspero, Rico e Muito Rico.

---

## CVR-028 — Fontes de Dano fora do combate

- **1ª edição:** perdas de Resistência escritas em número fixo ("custando 4 pontos de Resistência")
- **2ª edição:** Fontes de Dano com nível moderado/severo/gravíssimo
- **Muda?:** sim — vira rolagem

> Descrição: A 2ª edição resolve queda, fogo, frio, asfixia e veneno com um Dado de Proeza lido na
> tabela de Perda de Resistência, e o **nível** decide se a rolagem é Favorecida (moderado),
> simples (severo) ou Desfavorecida (gravíssimo). Atenção: nessa tabela o dado é lido **ao
> contrário** do resto do jogo — a Runa é *Ileso* e o Olho **reduz a zero** —, então Favorecida é
> o lado bom **para o herói**. Perdas fixas da 1ª edição viram o nível correspondente, não um
> número subtraído.

---

## CVR-029 — Olho de Mordor

- **1ª edição:** —
- **2ª edição:** Atenção do Olho e limiar da Caçada (regra **opcional**)
- **Muda?:** acréscimo

> Descrição: A 2ª edição traz um subsistema que a 1ª não tem, e o próprio livro chama de opcional:
> "as regras relativas ao Olho de Mordor são particularmente adequadas para serem introduzidas
> mais tarde no jogo". Campanhas longas convertidas da 1ª edição — como *The Darkening of Mirkwood*
> — são justamente o caso em que ele foi pensado para entrar, mas **ligar é decisão da mesa**.

---

# Lacunas de fonte registradas

## CVR-030 — O que a fonte não converte

- **1ª edição:** vários
- **2ª edição:** sem regra de conversão
- **Muda?:** registrar, não inventar

> Descrição: A 2ª edição não fornece regra de conversão para: (1) **Vigor** de adversários de 1ª
> edição, que não têm o campo; (2) **NA fixo** de 1ª edição para Complicação/Vantagem da 2ª;
> (3) **Tolerância** de 1ª edição para Resistência de Conselho da 2ª; (4) **Prestígio**, que não
> aparece no corpus traduzido da 2ª edição. Além disso, o bestiário traduzido da 2ª edição **não
> traz bloco de Aranha** — Aranhas são citadas como tipo de inimigo (Conhecimento do Inimigo,
> armas de Perdição, "Veneno de Aranha" nas Fontes de Dano), mas nenhum bloco de estatísticas
> existe no corpus. Aventuras com Aranhas ficam com o bloco pendente até a fonte aparecer; nada
> disso é preenchido por estimativa.

---
