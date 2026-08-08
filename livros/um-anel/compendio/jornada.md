# Jornada — O Um Anel 2ª ed.

> **Fonte:** `livros/um-anel/06-fases-de-aventura-combate.md` §"Journey" (Core Rules p.111–116).
> **PT-BR curado para o compêndio.** Fonte da verdade (D15). Editar aqui e rodar `npm run sync:data`.
>
> **Adaptação registrada (D22 — sem hexágonos):** o livro conta a jornada em *hexes* do mapa.
> Aqui a unidade é o **trecho** (1 trecho = 1 hex do livro). A matemática é idêntica — as regras
> só contam unidades ao longo da rota —, então nada muda mecanicamente. O projeto usa grid
> quadrado em todo lugar (`scripts/purge-hex-all.mjs`, `docs/GRID-MIGRATION.md`).

---

# Papéis da Jornada

Uma Companhia em viagem precisa cobrir os quatro papéis. Com mais de quatro membros, mais de um
herói pode ter o mesmo papel — exceto o Guia, que é sempre um só. Com menos de quatro, alguém
acumula funções (ainda assim, só um Guia).

## JOR-P01 — Guia

- **Perícia:** Viagem
- **Único:** sim
- **Ordem:** 1

> Descrição: Responsável por todas as decisões de rota, descanso e suprimentos. É o Guia quem
> faz os Testes de Marcha que determinam onde os eventos acontecem.

---

## JOR-P02 — Batedor

- **Perícia:** Exploração
- **Único:** não
- **Ordem:** 2

> Descrição: Responsável por armar o acampamento e abrir novas trilhas.

---

## JOR-P03 — Olheiro

- **Perícia:** Vigilância
- **Único:** não
- **Ordem:** 3

> Descrição: Responsável por manter a vigilância.

---

## JOR-P04 — Caçador

- **Perícia:** Caçada
- **Único:** não
- **Ordem:** 4

> Descrição: Responsável por encontrar comida na natureza.

---

# Sequência da Jornada

## JOR-S01 — 1. Definir a Rota

> Descrição: A Companhia mostra ao Mestre o caminho que pretende seguir, ligando o local de
> partida ao destino. A rota raramente é uma linha reta: cadeias de montanhas e rios caudalosos
> só se atravessam por passagens, pontes ou vaus. O Mestre então traça o itinerário como um
> percurso de N trechos (não contando o trecho de partida). Vale anotar marcos notáveis pelo
> caminho (ruínas, vaus, pontes) e marcar os trechos de terreno difícil.

---

## JOR-S02 — 2. Testes de Marcha

- **Quem rola:** Guia
- **Perícia:** Viagem
- **Falha (Verão/Primavera):** evento a 2 trechos
- **Falha (Inverno/Outono):** evento a 1 trecho
- **Sucesso:** evento a 3 trechos, +1 por cada ícone de Sucesso

> Descrição: Assim que a Companhia parte, o Guia faz o primeiro Teste de Marcha e conta os
> trechos ao longo da rota conforme o resultado. O último trecho alcançado na contagem é onde o
> evento acontece. Resolvido o evento, o Guia faz um novo Teste de Marcha para ver se outro
> acontece mais adiante.

---

## JOR-S03 — 3. Encerrar a Jornada

> Descrição: A jornada continua até o resultado do Teste de Marcha do Guia igualar ou passar o
> número de trechos que faltam entre a posição atual e o destino — aí a Companhia chegou. Também
> termina quando a Companhia chega ao destino e entra numa cena nova, ou quando um imprevisto a
> envolve em outra atividade por tempo significativo (o Mestre decide se isso encerra ou não).
> Jornadas de mais de 20 trechos devem ser divididas em pernas, tratadas como jornadas separadas.

---

# Eventos

## JOR-A01 — Alvo do evento: Batedores

- **Rolagem (Dado de Sucesso):** 1–2
- **Perícia testada:** Exploração

> Descrição: O Mestre rola um Dado de Sucesso para escolher quem enfrenta o evento, entre os
> heróis que cobrem os papéis de Batedor, Olheiro e Caçador.

---

## JOR-A02 — Alvo do evento: Olheiros

- **Rolagem (Dado de Sucesso):** 3–4
- **Perícia testada:** Vigilância

---

## JOR-A03 — Alvo do evento: Caçadores

- **Rolagem (Dado de Sucesso):** 5–6
- **Perícia testada:** Caçada

---

# Tipo de Região

## JOR-R01 — Terras Fronteiriças

- **Rolagem:** Dado de Proeza Favorecido

> Descrição: Região mais segura — o Mestre rola o Dado de Proeza com vantagem, então eventos
> ruins são mais raros.

---

## JOR-R02 — Terras Selvagens

- **Rolagem:** Dado de Proeza simples

> Descrição: Região neutra — uma única rolagem de Dado de Proeza.

---

## JOR-R03 — Terras Sombrias

- **Rolagem:** Dado de Proeza Desfavorecido

> Descrição: Região corrompida — o Mestre rola com desvantagem, então eventos ruins são mais
> frequentes.

---

# Tabela de Eventos de Jornada

## JOR-E01 — Terrível Infortúnio

- **Dado de Proeza:** Olho de Sauron
- **Consequência:** Se a rolagem falhar, o alvo fica Ferido
- **Fadiga:** 3
- **Ordem:** 1

> Descrição: Algo deu tão errado que a Companhia segue se arrastando de exaustão e o alvo do
> evento corre risco de dano sério. Exemplos: os Caçadores se feriram porque a presa era perigosa
> demais; os Batedores sofreram com o frio extremo.

---

## JOR-E02 — Desespero

- **Dado de Proeza:** 1
- **Consequência:** Se a rolagem falhar, todos na Companhia ganham 1 ponto de Sombra (Pavor)
- **Fadiga:** 2
- **Ordem:** 2

---

## JOR-E03 — Más Escolhas

- **Dado de Proeza:** 2–3
- **Consequência:** Se a rolagem falhar, o alvo ganha 1 ponto de Sombra (Pavor)
- **Fadiga:** 2
- **Ordem:** 3

---

## JOR-E04 — Contratempo

- **Dado de Proeza:** 4–7
- **Consequência:** Se a rolagem falhar, soma 1 dia à jornada e o alvo ganha 1 Fadiga adicional
- **Fadiga:** 2
- **Ordem:** 4

---

## JOR-E05 — Atalho

- **Dado de Proeza:** 8–9
- **Consequência:** Se a rolagem tiver sucesso, reduz a jornada em 1 dia
- **Fadiga:** 1
- **Ordem:** 5

---

## JOR-E06 — Encontro Fortuito

- **Dado de Proeza:** 10
- **Consequência:** Se a rolagem tiver sucesso, nenhuma Fadiga é ganha e o Mestre improvisa um encontro favorável à Companhia
- **Fadiga:** 1
- **Ordem:** 6

---

## JOR-E07 — Visão Alegre

- **Dado de Proeza:** Runa de Gandalf
- **Consequência:** Se a rolagem tiver sucesso, todos na Companhia recuperam 1 Esperança
- **Fadiga:** —
- **Ordem:** 7

---

# Modificadores e regras

## JOR-M01 — Estradas e terreno difícil

- **Terreno difícil:** a rolagem perde (1d)
- **Estrada:** a rolagem ganha (1d)

> Descrição: Se o evento acontece num trecho de terreno difícil, o herói que rola perde (1d).
> Se acontece ao longo de uma estrada, ganha (1d).

---

## JOR-M02 — Fadiga de Viagem

- **Redução por montaria:** primeiro reduz a Fadiga total pelo Vigor da montaria
- **Redução por Viagem:** sucesso reduz 1, +1 por cada ícone de Sucesso
- **Resto:** 1 ponto por cada Descanso Prolongado em refúgio abrigado e seguro

> Descrição: Fadiga é o cansaço profundo acumulado durante a viagem, que se manifesta por
> completo quando a jornada termina. Baixa a capacidade de carga e a eficácia do herói. **Não pode
> ser removida enquanto a jornada durar.** No fim da jornada, heróis com montaria reduzem primeiro
> pelo Vigor dela; depois todos podem reduzir mais com uma rolagem de Viagem. O que sobrar vai
> para a ficha e sai a 1 ponto por Descanso Prolongado — em refúgio seguro, não "na estrada".

---

## JOR-M03 — Duração da Jornada

- **Base:** 1 dia por trecho
- **Terreno difícil:** +1 dia por trecho (colinas, bosques, pântanos…)
- **A cavalo:** metade do total, arredondando para cima

> Descrição: Para saber quanto tempo a viagem durou, conte os trechos da rota somando 1 dia por
> cada trecho de terreno difícil. Se a Companhia toda viaja a cavalo, divida por dois arredondando
> para cima — cavalgar normalmente só é possível por estradas e bons caminhos; regiões de mata
> fechada não permitem avançar montado.

---

## JOR-M04 — Marcha Forçada

- **Dias:** 1 dia por cada 2 trechos
- **Custo:** +1 ponto de Fadiga por cada dia de marcha forçada

> Descrição: A Companhia pode se pressionar e marchar mais horas por dia do que ousaria
> normalmente.

---

## JOR-M05 — Áreas Perigosas

- **Classificação:** valor de Perigo (numérico)

> Descrição: Certas áreas do mapa são difíceis ou perigosas de atravessar (mata fechada,
> passagens escarpadas, pântanos traiçoeiros). Cada uma tem um valor de Perigo. Quando um Teste
> de Marcha levaria a Companhia para dentro ou através dela: (1) a Companhia para assim que
> entra; (2) antes de sair, enfrenta um número de Eventos igual ao valor de Perigo; (3) resolvidos
> todos, a jornada segue normalmente, retomando os Testes de Marcha do primeiro trecho fora da
> área.

---

## JOR-M06 — Apoio na rolagem

> Descrição: Um herói que cobre o mesmo papel do alvo pode escolher apoiar a rolagem (regra de
> Apoio, Core Rules p.20). A consequência que fala do "alvo" atinge quem rolou, e eventualmente
> quem deu apoio.
