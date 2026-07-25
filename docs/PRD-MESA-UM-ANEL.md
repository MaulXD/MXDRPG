# Product Requirements Document — Mesa do Um Anel (The One Ring 2e)

## Document Header

| Field | Value |
|-------|--------|
| **Product Name** | **Mesa do Um Anel** — VTT do sistema "O Um Anel" (2ª ed.) dentro do hub MXDRPG |
| **Status** | **Draft v1.0** — retrato do implementado + roadmap |
| **Author** | Raul + assistente IA |
| **Stakeholders** | Product (Raul), engenharia (Raul + IA) |
| **Date Created** | 2026-07-25 |
| **Last Updated** | 2026-07-25 |
| **Version** | **1.0** |
| **Hosting** | Contabo (Docker) — www.mxdrpg.com.br (mesmo host do Eldarin, hub multi-sistema) |
| **Idioma** | PT-BR (UI + PRD + livro manda) |
| **Documento irmão** | [PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md) — mesmo hub, sistema Eldarin. **Não misturar escopo.** |

### Princípio fundacional (não-negociável)

> **Isolamento de hub:** o MXDRPG hospeda 2+ sistemas de RPG (Eldarin, Um Anel) na mesma plataforma. A mesa do Um Anel **nunca** importa dado, mecânica ou componente de conteúdo do Eldarin (bestiário, magias, PA, classes) — e vice-versa. O único código genuinamente compartilhado é infraestrutura de UI sem conteúdo de jogo (`BattleToken` como container de mapa, `RoomState`, `OrnamentCard`, `FoundryWindow`, upload de retrato). Verificado repetidamente por `grep` ao longo da implementação — zero ocorrências de import cruzado fora desse núcleo genérico.

### Registro de decisões (discovery)

| # | Decisão |
|---|---------|
| D1 | Mesa do Um Anel **reaproveita** o mapa hex/grid, `RoomState` e sistema de janelas "Foundry" do Eldarin (`MesaFoundryDockRail`/`MesaFoundryFloatingWindows`) — mas **todo conteúdo de jogo é próprio** (`lib/character/um-anel/*`, `lib/combat/um-anel/*`) |
| D2 | **Sem economia de PA.** O Um Anel não usa Pontos de Ação — tokens do sistema recebem `pa`/`paMax` numa constante alta fixa (`TOR_TOKEN_PA`) só pra `checkCanSpendPa` (movimento genérico do Eldarin) não travar o token; **não é** uma mecânica visível ou jogável pro jogador |
| D3 | Resolução de ataque usa a matemática do livro: **Dado de Proeza (d12) + Dados de Sucesso (d6, N = graduação da Proficiência)** — motor próprio em `lib/character/um-anel/dice.ts`, nunca o `d20 vs CA` do Eldarin |
| D4 | Combate tático v1 é **"levemente posicional"**: qualquer token ataca qualquer outro dentro de alcance de arma, sem contagem formal de Engajamento (livro completo tem essa regra — deferida) |
| D5 | Iniciativa: **sem rolagem** — usa ordem de colocação no mapa (`applyMapPlacementCombatOrder`), já 100% agnóstica de sistema no motor de turnos existente. Botão "Rolar iniciativa" escondido pra mesas do Um Anel |
| D6 | `BattleToken` ganha campo opcional `torCombat?: TorCombatTokenFields` (bag leve: `kind`, `torCharacterId`, `parry`, `protectionDice`, `strength`/`attributeLevel`, `wounded`, `eliminated`) — **não** reaproveita `GmCreatureStats` (conceitualmente Eldarin) |
| D7 | Vitals (Resistência/Ferida) do token usam helper próprio (`lib/combat/um-anel/vitals.ts`) — **nunca** `patchTokenVitals`/`clampDeathTrackOnDamage` do Eldarin (injetariam a condição "inconsciente" e `deathTurns`, que não existem no livro) |
| D8 | Gate de segurança: `canOpenActionRing`/`onActionRingRequest` em `Battlefield.tsx` checam `token.torCombat` **antes** de abrir o anel de ação Eldarin — um token do Um Anel nunca aciona `resolveTokenAttack` (d20) por engano |
| D9 | Retrato/token: reaproveita o **mesmo componente** `SheetPopupPortrait` do Eldarin (via `onPersistBundle` customizado), batendo em `/api/tor-characters/[id]` — sem duplicar UI de upload |
| D10 | Compêndio e painel de personagens jogáveis na mesa são **despachados por `rpgSystemId`** dentro da **mesma janela/ícone** que o Eldarin usa (`"compendium"`, `"ficha"`) — nunca uma janela paralela não-exposta (erro cometido e corrigido nesta sessão, ver §Bugs) |
| D11 | Personagens Pré-Gerados do Starter Set (8, cap. 11) são **referência de compêndio**, não fichas geradas pelo assistente — o Starter Set não define Vocação/Caminho da Sombra/Padrão de Vida (campos obrigatórios da ficha completa), e inventar esses valores seria fabricar conteúdo que o livro não tem |
| D12 | Ícone de dado no chat: Um Anel anexa um **d12 (Dado de Proeza)** físico à mensagem `kind:"chat"` (mantendo o texto narrativo rico), em vez de adotar o `kind:"roll"` genérico do Eldarin (que descartaria o texto em troca de "fórmula → total") |

---

## Executive Summary

**One-liner:** A mesa do Um Anel é o segundo sistema jogável do hub MXDRPG — mesmo mapa/UI "Foundry" do Eldarin, motor de regras e conteúdo 100% próprios (Dado de Proeza + Sucesso, sem PA), com isolamento estrito entre sistemas.

**Overview:** Depois de fichas, wizard de criação e mesa **narrada** (sem mapa) já estarem completos e em produção (Fases 1-3), a Fase 4 trouxe combate tático real no mapa hex — tokens, ataque com a matemática do livro, Golpe Perfurante, Feridas. Nesta sessão o foco se ampliou pra: (a) extração **completa** do livro pro compêndio (bestiário, tesouro, virtudes culturais, patronos, Coisas Sem Nome, Marcos, 7ª Cultura, pré-gerados), (b) paridade visual do compêndio com o Eldarin (navegação lateral por categorias), (c) upload de retrato/token, e (d) uma bateria de bugs de integração encontrados e corrigidos — a maioria da mesma classe (um painel/CSS/rota escrito só pensando no Eldarin, nunca dispatchado por sistema).

**Posicionamento:** Não é um clone do Eldarin com skin trocada — é um sistema de regras genuinamente diferente (resolução, resource economy, sem classes/PA) rodando na mesma casca de produto.

**Quick Facts:**

| Item | Valor |
|------|--------|
| Público | Mesas de Um Anel 2e — jogadores que já usam o hub MXDRPG pro Eldarin, ou grupos novos atraídos pelo Starter Set |
| Problema | Livro tem economia de recursos e resolução diferentes do Eldarin; reaproveitar UI sem vazar mecânica/conteúdo errado é o risco central |
| North Star (qualitativo) | "A mesa do Um Anel parece feita pro Um Anel" — não uma reskin visível do Eldarin |
| Fase atual | Fase 4 (combate tático) completa; extração de conteúdo ~95% do livro-base + Starter Set |
| Prazo | Sem data fixa — gates por fase, como o Eldarin |

---

## Problem Statement

### The Problem

O hub MXDRPG já resolve bem o Eldarin. Adicionar um segundo sistema de regras genuinamente diferente (sem PA, resolução por Dado de Proeza + Sucesso, sem classes) **sobre a mesma casca de produto** (mapa, janelas, chat, upload de imagem) corre o risco constante de vazamento cruzado: um componente escrito só pensando em Eldarin acaba sendo reusado sem dispatch por sistema, e o Um Anel "herda" UI ou dado que não faz sentido pra ele (PA, CA, d20, bestiário errado).

### Current State

| Área | Situação |
|------|----------|
| Ficha (criação, wizard, visual) | **Completo** — Fases 1-3, em produção |
| Mesa narrada (sem mapa) | **Completo** — Fases 1-3, em produção |
| Combate tático no mapa | **Completo** — Fase 4 (tokens, ataque, Golpe Perfurante, Ferida/Severidade) |
| Compêndio (extração do livro) | **~95%** — bestiário, tesouro, virtudes, patronos, Marcos, Coisas Sem Nome, 7ª Cultura, pré-gerados |
| Compêndio (UX) | **Completo** nesta sessão — navegação lateral por categoria, paridade visual com Eldarin |
| Retrato/token | **Completo** nesta sessão |
| Painel "Personagens jogáveis" na mesa | **Corrigido** nesta sessão (mostrava o painel Eldarin, vazio, numa mesa de Um Anel) |
| Dado no chat | **Corrigido** nesta sessão (ícone de d12 nunca aparecia nas rolagens) |
| Posturas de combate, Dano Especial, Engajamento, Recuo | **Não implementado** (v1 "levemente posicional", deferido) |
| Jornada (hex-crawl, Journey Log) | **Não implementado** |
| Marcos como conteúdo de aventura jogável na mesa | **Só referência de compêndio** — não é um fluxo estruturado de sessão |

### Impact

**Usuário:** confusão quando a UI mostra conceito errado (PA, painel vazio, dado sumido) — quebra a promessa de "mesa feita pro sistema", não só uma casca genérica.

**Produto:** cada bug de vazamento cruzado encontrado até agora seguiu o **mesmo padrão raiz** (componente/rota sem dispatch por `rpgSystemId`) — sinal de que o hub precisa de uma varredura sistemática, não só correções pontuais reativas (ver §Riscos).

### Why Now

O Starter Set (pré-gerados, regras condensadas) torna o Um Anel o ponto de entrada mais fácil pra grupos novos no hub — vale terminar a paridade de polish com o Eldarin antes de divulgar.

---

## Goals & Objectives

### Business Goals

1. Segundo sistema jogável **de verdade** no hub — não uma demonstração.
2. **Zero vazamento cruzado** Eldarin ↔ Um Anel, verificável por grep a qualquer momento.
3. Fidelidade ao livro — livro manda, código corrige pra bater (mesmo princípio D4 do Eldarin).

### User Goals

| Persona | Meta |
|---------|------|
| Jogador (Um Anel) | Criar ficha, entrar na mesa, ver seu personagem no mapa com retrato/token próprio, atacar e ver o resultado (incl. dado) sem UI ou conceito do Eldarin aparecendo |
| Mestre (Um Anel) | Invocar adversários do bestiário completo, rodar combate tático, consultar Marcos/Coisas Sem Nome/Patronos direto na mesa |
| Jogador iniciante (Starter Set) | Consultar os 8 pré-gerados no compêndio como referência rápida pra começar a jogar |

### Non-Goals (v1)

- Jornada/hex-crawl completo (Journey Log, mapa de Eriador jogável).
- Fellowship Phase (Empreitadas) como fluxo de UI mecanizado — hoje é só referência de compêndio.
- Marcos como "módulo de aventura" carregável/jogável na mesa (hoje é texto de referência pro Mestre narrar).
- Posturas de Combate, Dano Especial, Recuo, Engajamento por contagem — ver Epic 8 (backlog).

---

## User Personas

Mesmas personas do Eldarin (ver [PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md)), com necessidades específicas do Um Anel:

### Jogador de Um Anel

- **Needs:** ficha sem PA/CA (Resistência, Esperança, Sombra, Fadiga, Bloqueio), retrato/token próprio, rolagens com Dado de Proeza visíveis no chat.
- **Pain:** qualquer aparição de conceito Eldarin (PA, painel vazio porque procurou personagem "Eldarin") quebra a confiança de que o sistema é levado a sério.

### Mestre de Um Anel

- **Needs:** bestiário completo pra invocar, Coisas Sem Nome pra criar adversário único, Marcos/Patronos como referência de mesa, controle de recursos dos jogadores (Resistência/Ferida) direto na ficha popup.
- **Pain:** ter que sair da mesa pra consultar o livro porque o compêndio in-mesa não tem o conteúdo.

---

## User Stories & Requirements

### Epic 1 — Ficha na mesa (popup + recursos)

**US-1.1** — Ficha popup (`TorCharacterSheetPopup`) mostra atributos, perícias, proficiências, recursos (Resistência/Esperança/Sombra/Fadiga) e permite rolar direto da mesa. ✅

**US-1.2** — Ajuste de recursos (esteppers) — dono da ficha ou mestre da aventura, permissão checada no servidor (`patchTorCharacterResources`). ✅

**US-1.3** — Upload de retrato + token, reaproveitando `SheetPopupPortrait` — disponível na ficha popup da mesa e na página avulsa `/personagem/[id]` (dono só). ✅

**US-1.4** — Traços Distintivos, Recompensas, Virtudes, Equipamento de Guerra/Armadura exibidos na ficha. ✅

---

### Epic 2 — Compêndio na mesa

**US-2.1** — Ícone "Compêndio" no rail, sempre visível (jogador e mestre), dockável ou flutuante — despachado por `rpgSystemId` na **mesma janela** que o Eldarin usa. ✅

**US-2.2** — Conteúdo extraído do livro: Culturas (7, incl. Altos-Elfos de Valfenda), Vocações, Perícias, Proficiências, Armas/Armaduras, Adversários (22, incl. Elwen), Coisas Sem Nome (gerador completo, 8 tabelas), Recompensas/Virtudes iniciais, Virtudes Culturais (6 Culturas), Tesouro/Bênçãos/Recompensas Encantadas/Itens Amaldiçoados, Empreitadas da Fase de Companhia, Patronos (7), PNJs Notáveis de Valfenda, Marcos (estrutura + "A Estrela na Bruma"), Personagens Pré-Gerados (8). ✅

**US-2.3** — Navegação lateral por categoria (Personagem / Equipamento / Adversários / Tesouro / Companhia & Mundo / Personagens Prontos), visualmente idêntica ao padrão do Eldarin (`OrnamentCard` + `comp-shell`/`comp-sidebar`). ✅

---

### Epic 3 — Combate tático (Fase 4, completa)

**US-3.1** — Colocar personagem/adversário no mapa como token, com `torCombat` preenchido (Bloqueio, Proteção, Resistência etc.). ✅

**US-3.2** — Atacar: `TorAttackPopup` resolve Dado de Proeza + Sucessos, aplica TN correto (herói: `20 − Força + Bloqueio do alvo`; adversário: Bloqueio puro do alvo). ✅

**US-3.3** — Golpe Perfurante (Proeza 10 ou Runa) dispara teste de Proteção; falha causa Ferida. ✅

**US-3.4** — Severidade da Ferida (1ª Ferida rola; 2ª Ferida é fatal sem rolar) e eliminação de adversário em Resistência 0. ✅

**US-3.5** — Sincronização de volta pra ficha do herói (Resistência, Ferida, Injury text) após o ataque. ✅

**US-3.6** — Fila de turno usa ordem de colocação no mapa (sem rolagem de iniciativa); token eliminado/herói a 0 pulado automaticamente. ✅

**US-3.7** — Gate de segurança: anel de ação Eldarin nunca abre num token com `torCombat`. ✅

---

### Epic 4 — Chat e dados

**US-4.1** — Rolagens de perícia/proficiência da ficha aparecem no chat com texto narrativo completo (`formatTorRollMessage`). ✅

**US-4.2** — Ícone de dado (d12, Dado de Proeza) aparece junto da mensagem, sem substituir o texto. ✅ (corrigido nesta sessão)

**US-4.3** — Mensagens de ataque tático (`formatTorAttackMessage`) também trazem o dado do ataque. ✅ (corrigido nesta sessão)

**US-4.4** — *(Backlog)* Visual dos Dados de Sucesso (d6, N conforme graduação) além do Dado de Proeza — hoje só o Dado de Proeza principal aparece; `DiceRollSpec` do dice-box só suporta 1 dado por ícone.

---

### Epic 5 — Personagens jogáveis e adversários na mesa

**US-5.1** — Painel lateral lista os personagens da aventura, com botão "Colocar no mapa". ✅

**US-5.2** — Painel de adversários (só mestre) lista `TOR_ADVERSARIES`, botão "Invocar" por preset. ✅

**US-5.3** — Painel despachado por `rpgSystemId` na mesma janela/ícone "ficha" que o Eldarin usa (dock **e** flutuante). ✅ (corrigido nesta sessão — antes mostrava o painel Eldarin vazio)

**US-5.4** — *(Backlog)* Miniatura de retrato nos cards do painel (hoje só texto — nome/cultura/vocação/recursos).

---

### Epic 6 — Conteúdo do livro (extração)

**US-6.1** — Bestiário: 22 adversários (Homens Maus, Orcs, Trolls, Mortos-Vivos, Lobos, Lobisomens + Elwen, a Espectra Funesta). ✅

**US-6.2** — Tesouro completo: Tesouros por nível, Recompensas Encantadas (20), Bênçãos (36 combinações), Itens Amaldiçoados (9). ✅

**US-6.3** — Virtudes Culturais (36+5), Empreitadas da Fase de Companhia (9), Patronos (7), Coisas Sem Nome (gerador completo — 8 tabelas), Marcos ("A Estrela na Bruma" + estrutura de 6 partes), 7ª Cultura jogável (Altos-Elfos de Valfenda), Personagens Pré-Gerados (8). ✅

**US-6.4** — *(Fora de escopo, decisão deliberada)* Journey Log / mapa hex-crawl de Eriador — mecânica de campanha separada, não catálogo de sistema.

---

### Epic 7 — Isolamento de hub (transversal, contínuo)

**US-7.1** — Toda estrutura de dados de jogo do Um Anel vive em `lib/character/um-anel/*` / `lib/combat/um-anel/*`, sem importar de `lib/vtt/monsters`, `monstros.json`, ou qualquer `lib/compendium/*` do Eldarin. ✅ (verificado por grep repetidamente)

**US-7.2** — Toda janela/painel de mesa compartilhado (compêndio, ficha jogável) despacha por `rpgSystemId` **dentro da mesma janela**, nunca cria uma janela paralela não-exposta em ícone. ⚠️ **Violado uma vez** (painel "ficha" + janela órfã `"torParty"`) — corrigido nesta sessão; ver §Bugs pra o padrão de verificação recomendado daqui pra frente.

**US-7.3** — CSS/UI genérica reusada (não específica de sistema) deve funcionar igualmente bem nos dois bundles — bug do BOM em `compendium.css` mostrou que "funciona hoje pro Eldarin" não garante "funciona no bundle do Um Anel" (ordem de concatenação de CSS difere por rota). Recomendação: rodar o mesmo teste visual (Puppeteer + Chrome local) nos dois sistemas sempre que uma tela reusada mudar.

---

### Epic 8 — Backlog (v1.1, deferido deliberadamente)

| # | Item | Nota |
|---|------|------|
| 8.1 | Posturas de Combate (Avançado/Aberto/Defensivo/Retaguarda) + Tarefas de Combate (Intimidar/Reanimar/Proteger/Preparar Tiro) | Livro completo tem essa camada tática; v1 ataca sem postura |
| 8.2 | Dano Especial completo (Golpe Pesado, Aparar, Perfurar, Investida de Escudo) | Hoje só Golpe Perfurante (automático por Proeza 10/Runa) está mecanizado |
| 8.3 | Recuo (Knockback) | Não implementado |
| 8.4 | Engajamento por contagem | v1 é "levemente posicional" — qualquer token ataca qualquer outro no alcance |
| 8.5 | Bestiário arrastável (drag-and-drop) tipo `MesaCompendiumPanel` do Eldarin | v1 usa painel de lista simples com botão "Invocar" |
| 8.6 | Visual de Dados de Sucesso (d6×N) no chat, além do Dado de Proeza | Limitação atual do `DiceRollSpec` (1 dado só) |
| 8.7 | Fellowship Phase (Empreitadas) como fluxo de UI mecanizado | Hoje só referência de compêndio — o Mestre aplica manualmente |
| 8.8 | Marcos como conteúdo de aventura carregável/jogável (não só texto de referência) | "A Estrela na Bruma" existe como dado estruturado (`lib/character/um-anel/landmarks.ts`) — falta UI de sessão pra guiar a exploração |
| 8.9 | Jornada / hex-crawl (Journey Log, mapa de Eriador) | Não iniciado — mecânica de campanha inteira separada |
| 8.10 | Miniatura de retrato nos cards de "Personagens jogáveis"/"Adversários" | Hoje só texto |

---

## Success Metrics

| Tipo | Critério |
|------|----------|
| Qualitativo | "A mesa do Um Anel parece feita pro Um Anel" — nenhum conceito Eldarin (PA, CA, d20, bestiário errado) visível numa mesa desse sistema |
| Fidelidade ao livro | Casos de teste de `resolveTorAttack`/`rollTorCheck` batendo com a matemática documentada (TN, Golpe Perfurante, Severidade) |
| Isolamento | `grep` por imports cruzados (`lib/vtt/monsters`, `monstros.json`, `lib/compendium/*` dentro de `lib/character/um-anel`/`lib/combat/um-anel`) → **zero** ocorrências, checado a cada sessão que toca a mesa |
| Bugs de dispatch por sistema | **Zero** painel/janela/rota que hardcode um sistema sem checar `rpgSystemId`, quando a mesma janela/ícone serve os dois sistemas |

---

## Scope

### Definition of "Fase 4 completa" (já atingido)

- [x] Adversários + `torCombat?` em `BattleToken`
- [x] Spawn de herói/adversário no mapa + gate de segurança do anel de ação
- [x] Motor de resolução (`resolveTorAttack`) puro e testável
- [x] Wiring servidor (`executeRoomTorAttack`, rota de ataque com branch por sistema)
- [x] UI de ataque completa (`TorAttackPopup`)
- [x] Fila de turno sem iniciativa rolada
- [x] Passe de regressão manual no Eldarin (Fase 4.7)

### Definition of "polish de paridade" (esta sessão)

- [x] Upload de retrato/token
- [x] Compêndio 100% extraído (bestiário, tesouro, virtudes, patronos, Marcos, Coisas Sem Nome, 7ª Cultura, pré-gerados)
- [x] Compêndio com navegação lateral (paridade visual com Eldarin)
- [x] Ícone de dado no chat
- [x] Painel "Personagens jogáveis" despachado corretamente por sistema

### Out of scope explícito (v1)

- Jornada/hex-crawl completo.
- Posturas de Combate, Dano Especial completo, Recuo, Engajamento por contagem (Epic 8).
- Marcos como módulo de aventura jogável estruturado (hoje é referência).
- Fellowship Phase mecanizada como fluxo de UI.

---

## Technical Considerations

### Stack (compartilhado com Eldarin)

Next.js 15, React 19, `RoomState`/`BattleToken` genéricos, sistema de janelas "Foundry" (`MesaFoundryDockRail`/`MesaFoundryFloatingWindows`).

### Camadas próprias do Um Anel

| Camada | Arquivos |
|--------|----------|
| Dados de personagem/regras | `lib/character/um-anel/{types,data,rules,dice,characters,normalize,build-from-wizard}.ts` |
| Conteúdo extraído do livro | `lib/character/um-anel/{adversaries,treasure,treasure-types,cultural-virtues,undertakings,patrons,notable-npcs,nameless-things,landmarks,pregens}.ts` |
| Combate tático (motor puro) | `lib/combat/um-anel/{resolve-attack,vitals}.ts` |
| Orquestração servidor | `lib/room/handlers/{tor-tokens,tor-combat-attack}.ts` |
| Adapters de spawn | `lib/vtt/tor-player-token.ts`, `lib/character/um-anel/adversary-token.ts` |
| UI de ficha | `components/character/sheet/TorCharacterSheetView.tsx`, `components/vtt/TorCharacterSheetPopup.tsx` |
| UI de mesa | `components/vtt/{TorPlayableCharactersPanel,TorAttackPopup}.tsx` |
| Compêndio | `components/compendium/TorCompendiumPage.tsx` |
| Wizard de criação | `components/character/wizard/TorCharacterCreationWizard.tsx` |

### Bugs encontrados e corrigidos (rastreio — todos da mesma família raiz: reuso sem dispatch por sistema)

| # | Bug | Causa raiz | Corrigido em |
|---|-----|------------|---------------|
| 1 | Painel de Convite visualmente quebrado | `aspect-ratio:1` + `justify-content:center` cortava conteúdo mais alto que o quadrado — bug de CSS pré-existente, não de dispatch | Sessão anterior |
| 2 | Compêndio inacessível de dentro da mesa | `MesaCompendiumPanel`/`MesaSideRail` órfãos desde redesign pro layout "Foundry" — afetava **os dois sistemas** | Sessão anterior |
| 3 | `compendium.css` com BOM (byte-order-mark) corrompendo `.comp-shell` | BOM no primeiro byte do arquivo vira parte do primeiro seletor CSS — inofensivo no bundle do Eldarin (outro CSS entra antes), fatal no bundle do Um Anel (esse arquivo virou o primeiro) | Esta sessão |
| 4 | Ícone de dado nunca aparecia nas rolagens do Um Anel | Chat sempre postava `kind:"chat"`; gate do `DiceBoxMini` exigia `kind==="roll"` — arquitetura de dado do Eldarin (`NdM`) não representa Dado de Proeza + Sucesso | Esta sessão |
| 5 | Painel "Personagens jogáveis" mostrava conteúdo Eldarin (vazio) numa mesa de Um Anel | `MesaFoundryDockRail`/`MesaFoundryFloatingWindows` renderizavam `PlayableCharactersPanel` sem checar `rpgSystemId`; existia uma janela `"torParty"` paralela e correta, mas sem ícone de acesso no rail | Esta sessão |

**Padrão recomendado daqui pra frente:** toda vez que uma janela/painel/rota é **compartilhada** entre os dois sistemas (mesmo ícone, mesmo id de janela), o dispatch por `rpgSystemId` tem que estar **dentro** dela — nunca como uma segunda janela/rota paralela que precisa de um ícone próprio (que historicamente não foi criado).

---

## Design & UX Requirements

| Item | Requisito |
|------|-----------|
| Referência visual | **Paridade com o Eldarin** onde a UI é genérica (compêndio, ficha popup, upload de retrato) — mesmos componentes/classes CSS, conteúdo despachado por sistema |
| Ficha | Estilo pergaminho/tinta vermelha (`tor-sheet.css`), distinto do visual "DDB" do Eldarin, mas reaproveitando `sheet-ddb.css` só pro widget de retrato |
| Compêndio na mesa | Igual ao rail do Eldarin — lista vertical, busca por categoria |
| Compêndio avulso (`/compendios`) | Navegação lateral por categoria (`comp-shell` 220px + conteúdo), igual ao Eldarin |
| Retrato/token | Molde reto (sem o brasão/clip-path em escudo do Eldarin) — `.tor-sheet__masthead-portrait` sobrescreve o clip-path herdado de `eldarin-v4.css` |

---

## Risks & Mitigation

| Risco | Mitigação |
|-------|-----------|
| Vazamento cruzado silencioso (componente sem dispatch) | Checklist de dispatch por `rpgSystemId` sempre que uma janela/painel for compartilhado; grep de imports cruzados a cada sessão |
| CSS genérico "funciona num sistema, quebra no outro" (bug do BOM) | Verificação visual (Puppeteer + Chrome local) nos dois sistemas quando uma tela reusada mudar, não só `tsc`/`build` |
| Discrepância do próprio material-fonte (ex.: NA = 18−Atributo nos pré-gerados vs. NA = 20−Atributo no motor) | Sempre priorizar a fórmula já implementada no motor (`attributeTN`) sobre valores impressos divergentes de fontes secundárias (Starter Set) |
| Escopo de conteúdo grande pra extrair sozinho | Extração incremental por capítulo, uma sessão de cada vez, documentado no `HISTORICO.md` |

---

## Dependencies & Assumptions

- Mesmo host/infra do Eldarin (Contabo/Docker, deploy por push em `main`).
- `BaseCharacterFields` (`lib/character/types.ts`) continua sendo o único tipo genuinamente compartilhado entre sistemas — por design, não por atalho.
- Banco de dados: fichas do Um Anel em `um_anel_characters` (blob JSON), separado da tabela de personagens Eldarin.

---

## Open Questions

| # | Questão |
|---|---------|
| 1 | Vale mecanizar Fellowship Phase (Empreitadas) como fluxo de UI, ou o Mestre aplicando manualmente (só referência de compêndio) é suficiente pro v1 público? |
| 2 | Marcos como "módulo de aventura carregável" — vale o esforço de estruturar mais Marcos (além de "A Estrela na Bruma"), ou isso vira conteúdo pago/supplement fora do escopo do hub? |
| 3 | Visual de Dados de Sucesso no chat (além do Dado de Proeza) — vale estender `DiceRollSpec` pra múltiplos dados, ou o v1 (só o Dado de Proeza) já resolve a queixa original do usuário? |

---

## Stakeholder Sign-Off

| Role | Status | Date |
|------|--------|------|
| Product (Raul) | Draft — pendente aprovação | 2026-07-25 |

---

## Appendix — Links

| Doc | Uso |
|-----|-----|
| [PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md) | PRD do sistema irmão (mesmo hub) |
| [HISTORICO.md](./HISTORICO.md) | Log detalhado sessão a sessão de toda a extração/implementação do Um Anel |
| [COMBATE-MESA.md](./COMBATE-MESA.md) | Guia técnico do combate **Eldarin** (PA) — não confundir escopo |
| `livros/um-anel/*.md` | Extração bruta (não traduzida) dos livros — fonte pra `lib/character/um-anel/*` (nunca commitado o PDF original) |

---

*PRD v1.0 — primeira versão, consolidando Fase 4 (combate tático) + polish de paridade desta sessão (retrato, compêndio reorganizado, dado no chat, painel de personagens corrigido).*
