# Product Requirements Document — Eldarin RPG

## Document Header

| Field | Value |
|-------|--------|
| **Product Name** | **Eldarin RPG** — VTT web proprietário |
| **Status** | **Approved v2.1** (discovery A–H + Seção I) |
| **Author** | Raul + assistente IA |
| **Stakeholders** | Product (Raul), engenharia (Raul + IA), beta ≥ 1 grupo |
| **Date Created** | 2026-06-02 |
| **Last Updated** | 2026-06-12 |
| **Version** | **2.3** |
| **Hosting** | Contabo (Docker) — www.mxdrpg.com.br |
| **Idioma** | PT-BR (UI + PRD + livro manda) |

### Registro de decisões (discovery)

| # | Decisão |
|---|---------|
| D1 | Produto **público e gratuito** para sempre (sem freemium definido) |
| D2 | Superar **Roll20 e Foundry** — melhor experiência para **Eldarin v4** |
| D3 | Foundry = **só referência** (paridade visual/UX, não runtime) |
| D4 | Regras: **livro manda**; código e VTT corrigem para bater com livro |
| D5 | Neon Postgres **do zero** em produção |
| D6 | Auth: **Google + e-mail + Discord**; login também por **nickname**; recuperar senha **sim** |
| D7 | Visitante pode **só visualizar** sala; demo gera **usuários padrão** |
| D8 | Convite: **código + link** |
| D9 | Reconexão: ficha fica; mestre pode pilotar PC offline; **delegação** de controle a outro usuário |
| D10 | Ficha: wizard **completo**, retrato com **recorte** para token |
| D11 | Até **10 fichas** por conta |
| D12 | v1 público: **combate fechado**, **todas classes**, **100% bestiário**, **mobile completo**, **todos navegadores** |
| D13 | Fase Eldarin (culinária, assimilação, loot, bioma, névoa): **fazer tudo** — priorizado após núcleo estável |
| D14 | ~~PA: base 5, acumular até 2 PA, teto 11 PA/turno~~ **REVOGADO** → ver [PRD-COMBATE-MESA-REFACTOR.md](./PRD-COMBATE-MESA-REFACTOR.md) **R1**: pool máx. **9**, +5/turno, sem teto de gasto no turno |
| D15 | Métricas formais: **não medir** no lançamento; bugs PA: **zero** tolerados |
| D16 | Equipe: **Raul + IA**, ~**30 h/semana**; medo #1: **regras erradas** e **mal funcionamento** |
| D17 | LGPD: rascunho em [PRIVACIDADE-LGPD.md](./PRIVACIDADE-LGPD.md) |
| D18 | UX referência: **Foundry**; ficha em **popup** no site; **FX** de combate legais |
| D19 | Analytics: **desejável** se viável (Vercel Analytics / Plausible) |
| D20 | **Auth: Clerk** (recomendação aceita §I11) + nickname em Postgres |
| D21 | Delegação de token: **dono da ficha ou mestre** da sala |
| D22 | Visitante: **só visualizar** — **sem chat** |
| D23 | **10 fichas por usuário** (não global) |
| D24 | **Modo combate estilo jogo** (§I12): alvo por clique, alcance da arma, preview vantagem/desvantagem no hover, rolagem automática no servidor |
| D25 | **PA visível** em movimento, habilidades e magias (`effectivePaCost`) antes de confirmar |
| D26 | **Áreas** padronizadas livro→JSON→`computeAreaCells` (burst/wall/cone/line/cube) + UX 2 passos no mapa — ver [VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md) |
| D27 | **Passar turno** visível (`EndTurnBar` + `TurnOrderPanel`) com **modal de confirmação**; aviso de PA guardados **só** se houve descarte de PA no fim do turno |
| D28 | **Medidor PA** na mesa: `atual/9 · base 5` (exceção talento Lobo Solitário: `/11`); ver PRD combate R1 |
| D33 | **Refatoração combate/mesa** aprovada — [PRD-COMBATE-MESA-REFACTOR.md](./PRD-COMBATE-MESA-REFACTOR.md) v1.0 |
| D34 | **Grid quadrado** (1 célula = 1,5 m); terminologia **célula**, não célula — Epic E10 renomeia código legado |
| D35 | **Estribilho** = magias nv.0 (ex-cantrip); máx. **2 iguais/turno** |
| D36 | **Sem slot ação bônus**; ações rápidas custam PA (geralmente 1) |
| D37 | **Sync fase 1:** poll **500 ms** em combate; WebSocket fase 2 (R29–R30) |
| D29 | **Magias canalizáveis:** conjunto inicial de **10 magias** no compêndio; jogador pode gastar **+1 ou +2 PA extras** no turno → **+1d6** de dano por PA extra (máx. +2 PA extras) |
| D30 | **Compêndio na mesa:** layout **rail** (lista vertical em painel ~380px), **não** o grid de página (`comp-shell` 220px + coluna) dentro do painel lateral |
| D31 | **Quem passa turno:** jogador com token ativo, **demo** sem login obrigatório na API, **mestre** sempre (`canAdvanceCombatTurn`) |
| D32 | **UX produto (v2.2):** site navegável (header sticky, CTAs claros), painéis laterais sem overflow horizontal, **grid célula legível**, contraste em tags/condições — ver [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md) |

---

## Executive Summary

**One-liner:** Eldarin RPG é o VTT gratuito no browser feito para jogar **Eldarin v4** com regras fiéis ao livro, mesa célula interativa e UX mais simples que Roll20/Foundry.

**Overview:** O produto parte de presencial como hábito do público e abre jornada **online-first** (2–8 jogadores). Já existe motor forte (PA, combate, compêndios, Postgres opcional). A visão v2 exige **lançamento público** com persistência Neon, sync confiável, auth social, criação de personagem completa, combate 100% do livro, bestiário integral e **mobile completo** — escopo ambicioso para um desenvolvedor solo; o roadmap abaixo **sequencia** entregas para reduzir risco de regras erradas e instabilidade.

**Posicionamento:** Não competir como VTT genérico — competir como **o melhor lugar para jogar Eldarin**, depois expandir reputação de qualidade de mesa.

**Quick Facts:**

| Item | Valor |
|------|--------|
| Público | Grupos que começam online; mesa 2–8 |
| Problema | Roll20/Foundry genéricos + planilha; dor: sync, PA, ficha, perda de sala |
| North Star (qualitativo) | Sessão “não trava, regras batem com livro” — sem % formal v2 |
| Beta | ≥ 1 grupo antes de divulgação ampla |
| Prazo v1 público | **Sem data fixa** — gates por fase |

---

## Problem Statement

### The Problem

Jogadores de Eldarin que migram do **presencial** para online não encontram ferramenta que una **grid em células, PA v4 (com acúmulo/teto), ficha viva, bestiário e chat de combate** sem configurar VTT genérico. Roll20 e Foundry são amplos mas pesados; manutenção de regras Eldarin fica manual.

### Current State (antes do produto maduro)

| Canal | Situação |
|-------|----------|
| Presencial | Referência principal do público |
| Eldarin RPG web | Demo técnica forte; Postgres não em prod; poll ~2s |
| Foundry (`vinite/`) | Referência UX/paridade — não produto |
| Planilha + Discord | Funciona, sem autoridade de regras na mesa |

### Impact

**Usuário:** perda de estado, PA divergente, ficha/token dessinc, frustração em mobile.

**Produto:** lançamento público só quando **zero** bugs P0 de regras e funcionamento estável (critério explícito do titular).

### Why Now

Experiência de RPG virtual **mais interativa, simples e eficaz** — capturar grupos que nascem online sem passar por VTT genérico mal adaptado.

---

## Goals & Objectives

### Business Goals

1. **Líder de categoria Eldarin digital** (não “mais um VTT”).
2. **Gratuito e acessível** — contas abertas, convite fácil.
3. **Confiança nas regras** — livro = fonte; VTT prova na mesa.

### User Goals

| Persona | Meta |
|---------|------|
| Jogador | Criar ficha completa, entrar por link/código, jogar no celular, delegar controle se ausente |
| Mestre | Sala persistente, spawn 100% bestiário, convite, pilotar PC desconectado temporariamente |
| Visitante | Ver mesa sem conta |
| Admin (Raul) | Conteúdo, usuários, plataforma |

### Non-Goals

- Substituir livro completo de lore na web.
- Suportar outros sistemas (fantasia tática, etc.) no curto prazo.
- App nativo iOS/Android (web mobile completo sim).

---

## User Personas

### Jogador online (primário)

- **Contexto:** começa RPG **online**; 2–8 na mesa.
- **Needs:** nickname ou social login, ficha com foto→token, PA corretos, popup de ficha na mesa.
- **Pain:** travas, regras erradas, mobile quebrado.

### Mestre

- **Needs:** campanha persistente, chat de campanha, convite duplo, controle de turno, monstro do JSON.
- **Pain:** sala some, jogador cai e trava combate.

### Visitante

- Entra só para **espectar** (stream, aprendiz).

### Administrador de conteúdo (Raul)

- Único aprovador livro → `sync:data`.

---

## User Stories & Requirements

### Epic 1 — Conta, auth e LGPD

**US-1.1** — Registro com e-mail, senha, **nickname único**, nome de exibição.

**US-1.2** — Login: e-mail **ou** nickname **ou** Google **ou** Discord.

**US-1.3** — Recuperação de senha por e-mail.

**US-1.4** — Política de privacidade + termos; aceite no registro ([PRIVACIDADE-LGPD.md](./PRIVACIDADE-LGPD.md)).

**US-1.5** — Exclusão/exportação de conta (LGPD).

**US-1.6** — Demo: visitantes podem virar **usuário padrão** rápido (conta leve) além de login completo.

*Recomendação técnica:* [Vercel + Clerk](https://vercel.com/marketplace/clerk) ou Auth.js v5 — OAuth Google/Discord + credentials + campo `nickname` único no Postgres.

---

### Epic 2 — Personagem (wizard completo)

**US-2.1** — Wizard **completíssimo**: raça, classe, subclasse, atributos, talentos, inventário, loadout (v4).

**US-2.2** — Upload de **imagem** com **recorte** (rosto + área do token).

**US-2.3** — Até **10 fichas** por usuário.

**US-2.4** — Persistência Neon; retrato em Blob ou base64 otimizado (decisão impl.).

**US-2.5** — Level-up; PA máx e acúmulo refletidos no token após sync.

---

### Epic 3 — Economia de PA (livro v4 + acúmulo)

**US-3.1** — PA base **5**; +1 PA máx nos níveis 5, 10, 15; talentos somam conforme Cap. 12.0.

**US-3.2** — Fim do turno: guardar **até 2 PA** não gastos para o próximo turno.

**US-3.3** — No turno: teto de **11 PA gastos** (total).

**US-3.4** — **Atordoado:** zera PA acumulados.

**US-3.5** — Guerreiro 1 PA/golpe; Afinidade Arcânica; talentos `pa-modifiers.json`.

**US-3.6** — Livro atualizado (Cap. 2.6, 3.1.1); VTT implementa acúmulo/teto/stun em `lib/combat/pa-economy.ts`, `pa-turn.ts`, `pa-token-state.ts`, handlers de turno.

**US-3.7** — UI de PA na mesa (`PaDotMeter`): pool visual **9** (`atual/9 · base 5`; Lobo Solitário `/11`).

**Acceptance:** zero discrepância livro ↔ VTT em casos de teste documentados; medidor e modal de turno refletem banco/descarte corretamente.

---

### Epic 4 — Mesa VTT (núcleo)

**US-4.1** — Grid célula, tokens, PA visível, FX de combate **legais** (manter/melhorar `CombatFxLayer`).

**US-4.2** — Movimento, ataque, habilidade, magia área, iniciativa, condições.

**US-4.3** — **Combate fechado:** reações, saves automáticos em **todas** magias aplicáveis, **todas classes** do livro.

**US-4.4** — Ficha em **popup** dentro do site (não só painel fixo).

**US-4.5** — Chat de **campanha** persistido (histórico ligado à sala/campanha).

**US-4.6** — Painel lateral da mesa (**rail**): abas Chat, Dados, Compêndio, Ficha, Invocar (mestre); scroll vertical único por aba; **sem** scroll horizontal em listas longas.

**US-4.7** — Compêndio na mesa via `CompendiumBrowser variant="rail"`: chips de pacote, busca, cards em linha (ícone + nome + tags), detalhe na base do painel.

**US-4.8** — Confirmação ao **passar turno** com cópia do token ativo; integração em barra flutuante e painel de iniciativa.

---

### Epic 5 — Campanha, convite, sync, reconexão

**US-5.1** — Criar sala; **invite code + link mágico**.

**US-5.2** — Neon: salas + campanhas sobrevivem restart.

**US-5.3** — Sync **&lt; 1 s ou sem travar** — ver recomendação SSE abaixo.

**US-5.4** — Jogador desconecta: **ficha permanece**; **mestre pode pilotar** o PC; **dono da ficha ou mestre** pode **delegar** controle a outro usuário autorizado.

**US-5.5** — Visitante: **somente visualização** — sem editar token/ficha, **sem escrever no chat**.

---

### Epic 6 — Conteúdo 100%

**US-6.1** — **100% bestiário** em `monstros.json` jogável no spawn.

**US-6.2** — **Todas classes** do livro com habilidades PA no compêndio.

**US-6.3** — Pipeline `sync:data` + aprovação só Raul.

---

### Epic 9 — Combate estilo jogo (alvo, PA, movimento, áreas) — §I12 expandido

Experiência **como jogo de tático**: motor em `lib/combat/*` já resolve proficiência, CA, vantagem/desvantagem, dano e parte de áreas (`burst`/`wall`). v1 exige **UX no mapa** + **PA legível** em **tudo** + **áreas do livro** no compêndio.

**Spec técnica:** [VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md)

#### US-9.1 — Ataque (alvo único)

As a **jogador**, I want **modo ataque → clicar inimigo no mapa**, so that **não dependa só do painel**.

- Alcance = `combatLoadout` → `rangeCells` pintado no célula grid.
- Hover no alvo: **Normal / Vantagem / Desvantagem** (`buildAttackModifiers`, `attackRollMode`) — sem rolar.
- Chip: ATK estimado vs CA, **PA efetivo** (`effectivePaCost` / `totalAttackPaCost`).
- Clique confirma → `POST combat/attack` → servidor rola e aplica PA.

#### US-9.2 — Movimento e PA

As a **jogador**, I want **ver PA de corrida antes de mover**, so that **caminhada (0 PA) vs corrida (+1 PA)** fique óbvio.

- Modos `move-walk` / `move-run` (`lib/vtt/movement.ts`).
- Hover célula: `+0 PA` ou `+1 PA (corrida)` + `3/6 célula` — usa `canMoveToken`.
- Célula inválido ou `pa < 1` quando precisa PA → feedback vermelho.
- Confirma → `POST tokens/move`.

**Hoje:** highlight de movimento existe; **falta chip PA** unificado.

#### US-9.3 — Habilidades (alvo + PA)

As a **jogador**, I want **escolher habilidade e ver alcance + PA + tipo de alvo**, so that **Investida, cura, golpe, etc. sigam o mesmo fluxo de jogo**.

- Lista do compêndio → `abilityFromEntry` + `effectivePaCost(actor, action)`.
- Alvo único: mesmo fluxo US-9.1 (`canAbilityTarget`).
- Self/aliado: clique em token aliado linkado.
- PA e restante no chip antes de `POST combat/ability`.

#### US-9.4 — Magias e habilidades de área (colocar no mapa)

As a **jogador**, I want **escolher centro (e direção se cone/linha) e ver a área antes de conjurar**, so that **Bola de Fogo, Muralha, Rugido, etc. batam com o livro**.

**Dados (livro → JSON):**

| `area.shape` | Livro | Parâmetros |
|--------------|-------|------------|
| `burst` | raio, esfera, “área X m” | `radiusCells` (= metros ÷ 1,5) |
| `wall` | muralha, parede | `cellCount` |
| `cone` | cone de frio, etc. | `lengthCells` + `direction` |
| `line` | raio, linha, ventania | `lengthCells` + `direction` |
| `cube` | cubo | `sizeCells` ou burst derivado |

- Preencher em `scripts/generate-compendium.mjs` + regenerar `magias.json` / `habilidades.json`.
- Habilidades de área do livro: bloco `system.tactical.area` ou `spell.area` espelhado.

**UX:**

1. Pintar alcance de conjuração (`rangeCells`).
2. Clique = centro da área; **2º clique** = direção (cone/linha).
3. Hover/click: preview células (`computeSpellAreaCells` → evoluir `lib/vtt/grid-area.ts`).
4. Listar tokens atingidos; preview save/ataque por alvo; **PA efetivo** no chip.
5. Confirmar → `POST combat/area`.

**Hoje:** `burst` + `wall` no motor; preview parcial em `useBattlefieldHighlights`; **sem cone/line**; muitas magias do livro sem `area` no JSON.

#### US-9.5 — PA unificado (todas ações)

Chip fixo na mesa:

```text
Ação: Golpe · PA 1→1 · Restam 5/6 · [Vantagem vs Goblin]
```

- Sempre `effectivePaCost` (talentos, Afinidade, Guerreiro).
- Movimento: regra Cap. 2.6 / 3.1.1 (0 PA caminhada, 1 PA corrida extra).
- Respeitar acúmulo/teto/stun quando implementado no motor (P3).

#### US-9.6 — Mobile

Ataque, movimento PA, área 2-toque e chips funcionam em touch.

**Estado atual:** `TokenActionPanel`, `useBattlefieldHighlights` (movimento + área burst parcial); gaps US-9.1–9.5.

**Fase:** **P5** (+ conteúdo área no `sync:data` em paralelo).

---

### Epic 7 — Mobile e navegadores

**US-7.1** — **Mobile completo:** mover token, atacar, chat, ficha popup responsivo.

**US-7.2** — **Todos navegadores** relevantes: Chrome, Firefox, Safari desktop + iOS/Android (test matrix no DoD).

---

### Epic 10 — UX produto e navegação (v2.2)

Objetivo: o site e a mesa devem ser **navegáveis e legíveis** sem parecer protótipo quebrado — referência Foundry (informação densa, painéis estáveis), identidade medieval Eldarin.

**US-10.1** — Navegação global: header sticky no site; na mesa, topbar com links **Mesas**, **Compêndios**, **Minhas mesas** + alternância de tema.

**US-10.2** — Landing e rotas principais (`/`, `/sistema`, `/biblioteca`, `/mesa`, `/entrar`) com hierarquia tipográfica (`display-xl`, `eyebrow`, `lead`) e CTAs para demo.

**US-10.3** — Painéis laterais: `min-width: 0`, `overflow-x: hidden`, listas flex **sem** `flex-shrink` em itens de lista (cards do compêndio mantêm altura natural).

**US-10.4** — Mapa: polígonos simétricos com contraste suficiente em tema escuro e claro (`--vtt-cell-stroke`, `--vtt-cell-fill`).

**US-10.5** — Controles de mesa: condições e chips com fonte legível (≥0.72rem), área de toque ≥44px em mobile (`max-width: 1100px`).

**Spec:** [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md)

**Estado (2026-06-04):** rail do compêndio, chat/dados/ficha scroll, medidor PA, modal de turno e célula mais visível — **implementados**; ficha popup (US-4.4) e chip PA unificado Epic 9 — **pendentes**.

---

### Epic 8 — Diferenciais Eldarin (pós-núcleo estável)

Ordem sugerida após Epic 1–7 estáveis:

| # | Feature |
|---|---------|
| 8.1 | Culinária / refeição → buff |
| 8.2 | Assimilação pós-combate |
| 8.3 | Loot ESP/MIN/TES integrado |
| 8.4 | Bioma / pressão ambiental |
| 8.5 | Névoa de guerra / LOS |

---

## Success Metrics

| Tipo | v2 (titular) |
|------|----------------|
| Quantitativo formal | **Não medir** no lançamento |
| Qualitativo | Beta ≥ 1 grupo aprova “regras batem” e “não trava” |
| Bugs PA / regras P0 | **Zero** na divulgação pública |
| Analytics | Opcional: Vercel Web Analytics ou Plausible + consentimento LGPD |

---

## Scope

### Definition of “v1 público” (gates do titular)

Todos obrigatórios antes de marketing amplo:

- [ ] Neon prod (salas + fichas + users)
- [ ] Auth prod (Google, Discord, e-mail, nickname, reset senha)
- [ ] Sync tempo real (sem travar)
- [ ] Convite código + link na UI mestre
- [ ] Wizard personagem + recorte token
- [ ] Combate fechado (classes todas, saves, reações)
- [ ] 100% bestiário spawnável
- [ ] Mobile completo + cross-browser
- [ ] LGPD: páginas + fluxo exclusão
- [ ] PA acúmulo/teto/stun no **livro e no motor**
- [ ] **Modo combate jogo** (Epic 9): ataque alvo + **PA movimento** + **PA habilidades/magias** + **áreas livro→mapa** (ver [VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md))

### Out of scope explícito

- App nativo store.
- Outros sistemas de RPG.
- Foundry como dependência runtime.
- WCAG AA completo (**depois**).

---

## Technical Considerations

### Stack (mantém)

Next.js 15, React 19, Vercel, Neon Postgres, `lib/` motor de regras.

### Recomendações viáveis (solo 30 h/sem + IA)

| Área | Opção recomendada | Por quê |
|------|-------------------|---------|
| **Auth** | **Clerk** (decisão v2.1 §I11) | Google + Discord + e-mail em dias, não semanas; UI login pronta; sync `userId` → Neon; ver abaixo |
| **Nickname** | Campo `nickname` UNIQUE no Postgres + login custom (Clerk webhook ou página pós-login) | Clerk não substitui nickname nativo — gravar em `eldarin_users` |
| **Sync** | **SSE** `GET /api/room/[id]/events` + `revision` | Funciona bem em Vercel Fluid Compute; mais simples que WS |
| **WS alternativo** | Ably/Pusher se SSE insuficiente | Custo $; só se SSE falhar em teste beta |
| **Imagens ficha** | **Vercel Blob** | Retrato + crop metadata; URL no token |
| **Crop UI** | `react-image-crop` ou cropper leve | Wizard ficha |
| **Analytics** | Vercel Web Analytics | Baixo esforço; banner LGPD |
| **Neon** | Criar projeto novo → `DATABASE_URL` → `npm run db:migrate` | Do zero conforme D14 |
| **Delegação token** | `token.controllerUserId`; quem pode setar: **owner do actor** ou **mestre** | §I7 |
| **Combate jogo** | `lib/combat/preview-attack.ts` (novo, puro) + hooks em `Battlefield` | Reutiliza `buildAttackModifiers`, `canAttackTarget` |

#### Auth — por que Clerk (e não Auth.js puro)

| Critério | Clerk | Auth.js v5 |
|----------|-------|------------|
| Google + Discord | Marketplace Vercel, minutos | Config manual OAuth apps |
| Tempo solo 30 h/sem | **Menor** | Maior (middleware, adapters, UI) |
| Custo | Free tier ~10k MAU; depois $ | Grátis |
| Nickname login | Custom: tabela Postgres + `signIn` alternativo ou username plugin | Total controle, mais código |
| LGPD | DPA Clerk + sua política | Menos terceiros |

**Implementação sugerida:** Clerk para identidade + sessão; tabela `eldarin_users` com `clerk_id`, `nickname`, `email`; rota `/api/auth/nickname-login` para quem prefere apelido+senha se mantiver credentials.

**Auth.js** só se quiser **zero** vendor auth ou custo Clerk inaceitável — adia v1 público ~2–4 semanas.

### Arquitetura (5 camadas)

Inalterada — ver [ELDARIN-SITE-JOGAVEL.md](./ELDARIN-SITE-JOGAVEL.md). Livro → `sync:data` → handlers → API → UI.

### PA motor (estado código v2.2)

| Regra | Arquivo / nota |
|-------|----------------|
| `bankedPa`, pool máx. 9, stun zera banco | `pa-turn.ts`, `pa-token-state.ts`, `combat-turn.ts` |
| Sync ficha não sobrescreve `pa` do token em combate | `lib/room/sync.ts` |
| UI medidor + modal turno | `PaDotMeter.tsx`, `EndTurnConfirmDialog.tsx` |
| Canalização magias (+PA → +d6) | `spell-channel.ts`, `generate-compendium.mjs` (10 magias) |

**Gap restante:** chip PA unificado Epic 9.5; preview PA no hover de movimento (US-9.2).

---

## Design & UX Requirements

| Item | Requisito |
|------|-----------|
| Referência visual | **Foundry** (densidade informação, painéis, não cópia literal) |
| Ficha na mesa | **Popup** modal/drawer no site |
| Painel lateral | Largura `min(380px, 34vw)`; abas uppercase; scroll fino tema ouro |
| Compêndio mesa | **Rail only** — proibido layout de página (grid 220px + `comp-grid` minmax 220px) no painel |
| FX combate | Manter e **elevar** qualidade (`CombatFxLayer`) |
| Acessibilidade | `:focus-visible` em links; WCAG AA completo — fase posterior |
| Erros PA | Mensagem clara da API (corpo JSON, não genérico) |
| Magias canalizáveis | Controle `SpellChannelControl` + `channelExtraPa` na API quando `channel: true` no JSON |

---

## Timeline & Milestones (sem data — ordem para 30 h/sem)

Estimativa **relativa** (não compromisso de calendário):

| Fase | Entrega | Horas ordem |
|------|---------|-------------|
| **P0** | Neon prod + migrate + health `db:true` | 1 |
| **P1** | Auth Clerk/Auth.js + nickname + reset + LGPD páginas | 2 |
| **P2** | SSE sync + convite UI + visitante read-only | 3 |
| **P3** | PA acúmulo/teto/stun no código + testes zero bug PA | 4 |
| **P4** | Wizard ficha + crop + Blob + 10 fichas | 5 |
| **P5** | Combate fechado + **Epic 9 modo jogo** + classes + saves 100% | 6 |
| **P6** | Bestiário 100% validado spawn | 7 |
| **P7** | Mobile completo + matrix navegadores | 8 |
| **P8** | Reconexão + delegação + mestre pilot | 9 |
| **P9** | **Beta fechado** (≥ 1 grupo) — validar combinado abaixo | 10 |
| **P10** | Epic 8 Eldarin (culinária → névoa) | 11+ |

**Público amplo (gratuito, qualquer conta):** só após **P0–P8 entregues** + **P9 aprovado**. P10 não bloqueia lançamento público.

---

## Fase P9 — Beta fechado (o que combinamos)

P9 **não é** desenvolvimento de feature nova. É **prova** de que tudo que o PRD v2.1 promete para v1 público funciona com **pelo menos um grupo real** (2–8 jogadores + 1 mestre), em **Vercel + Neon**, antes de divulgar Eldarin RPG para o mundo.

### Pré-requisitos (P0–P8 concluídos)

Nenhum teste de beta substitui gate de implementação. Antes de convidar o grupo, **todos** estes itens devem estar ✅ em staging/produção:

| Fase | Gate resumido |
|------|----------------|
| P0 | Neon prod, `db:migrate`, `/api/health` → `db: true` |
| P1 | Clerk (Google, Discord, e-mail), nickname, reset senha, `/privacidade` + aceite |
| P2 | SSE (ou fallback acordado), convite código + link, visitante só leitura **sem chat** |
| P3 | PA pool máx. 9, +5/turno, stun zera banco — livro = motor — ver [PRD-COMBATE-MESA-REFACTOR.md](./PRD-COMBATE-MESA-REFACTOR.md) |
| P4 | Wizard ficha completo, crop retrato→token, até **10 fichas/usuário** |
| P5 | Combate fechado + **Epic 9** (ataque no mapa, PA movimento/habilidades, áreas) |
| P6 | 100% bestiário spawnável |
| P7 | Mobile completo + Chrome/Firefox/Safari (desktop + iOS/Android) |
| P8 | Reconexão; mestre pilota PC offline; delegação **dono + mestre** |

Checklist técnico espelha [Scope v1 público](#definition-of-v1-público-gates-do-titular).

### Quem participa

| Papel | Quantidade |
|-------|------------|
| Grupo beta | **≥ 1** mesa completa |
| Jogadores por mesa | **2–8** |
| Mestre | 1 (pode ser Raul) |
| Admin plataforma | Raul (inicialmente só) |
| Público externo | **Não** — sem anúncio aberto durante P9 |

### Roteiro mínimo da sessão beta (1+ noite)

Cada grupo beta roda **pelo menos uma sessão de 30+ minutos** (ideal: combate + exploração):

1. Conta nova (ou seed) → login (Google/e-mail/nickname).
2. Criar ou abrir ficha (wizard + retrato se P4 ok).
3. Mestre cria sala → convite (código + link).
4. Jogadores entram (conta ou visitante **só ver**, se testar espectador).
5. Iniciativa → turnos → **caminhada 0 PA / corrida +1 PA** visível.
6. Ataque no mapa com preview vantagem/desvantagem; magia/habilidade com PA; **área** com preview de célula.
7. Spawn monstro do compêndio; dano e chat de combate.
8. **Fechar browser / outro dispositivo** → reentrar no dia seguinte: sala + ficha persistem.
9. (Opcional) jogador cai → mestre pilota PC; delegação de controle.

### Critérios de aprovação P9 (todos obrigatórios)

| # | Critério | Como validar |
|---|----------|--------------|
| B1 | Sessão **30+ min** sem perder sala/ficha | Mesma `roomId` após restart do container |
| B2 | **2+ browsers** na mesma sala, sync sem travar | Latência aceitável (&lt; 1 s ou “não trava”) |
| B3 | **Zero bug P0** de PA/regras na sessão | Nenhum “livro diz X, site fez Y” em combate |
| B4 | Guerreiro nv5+ **1 PA/golpe**; conjurador **Afinidade** ok | Caso de teste na mesa |
| B5 | Cap. 2.6 / 3.1 / 3.1.1 bate com UI (PA, movimento, área) | Olhar livro lado a lado |
| B6 | Grupo diz **“regras batem”** e **“não trava”** | Feedback oral ou formulário curto |
| B7 | Bugs encontrados **corrigidos** ou viram P0 explícito com data | Nada P0 aberto no go-live |

**Métricas formais:** não exigidas no P9 (combinado §G40). **Bugs PA:** tolerância **zero** no go-live (§G41).

### Saídas de P9

| Resultado | Próximo passo |
|-----------|----------------|
| **Aprovado** | Divulgação **v1 público gratuito** (Eldarin RPG); abrir registro amplo |
| **Reprovado** | Voltar à fase que falhou (P0–P8); **novo** ciclo P9 — sem marketing |
| **Aprovado com ressalvas** | Só itens **não-P0** podem ir para P10; P0 vão para hotfix antes de público |

### O que P9 **não** exige

- Culinária, assimilação, loot avançado, bioma, névoa (**P10**).
- WCAG AA.
- Analytics obrigatório (desejável se já estiver).
- Mais de um grupo beta (≥ 1 basta).

### Registro do beta (sugestão)

Arquivo `docs/BETA-P9-CHECKLIST.md` (criar na impl.): data, participantes, `roomId`, bugs, B1–B7 ✅/❌, assinatura “aprovado para público”.

---

## Risks & Mitigation

| Risco | Mitigação |
|-------|-----------|
| Escopo v1 gigante para 1 dev | P0–P8 implementam; **P9 valida**; não anunciar até P9 aprovado |
| Regras erradas | Livro primeiro; casos de teste PA; zero P0 |
| Custo Neon/Vercel | Free tier + monitor; Blob só imagens |
| SSE limites serverless | Fluid Compute; fallback poll |
| OAuth complexidade | Clerk marketplace |
| LGPD incompleto | Não go-live sem `/privacidade` + exclusão |

---

## Dependencies & Assumptions

- Vercel + Neon (novo projeto).
- Titular único aprova conteúdo.
- Beta ≥ 1 grupo disponível.
- Público BR PT-BR.
- Gratuito — sem receita modelada v2.

---

## Open Questions (técnicas restantes)

| # | Questão |
|---|---------|
| 1 | Blob vs Postgres bytea para retrato |
| 2 | SSE vs Ably se beta reportar lag &gt; 1s |
| 3 | % acerto no preview de ataque — regra Eldarin define fórmula? |

---

## Seção I — Revisão (aprovado 2026-06-02)

| # | Resultado |
|---|-----------|
| I1 | ✅ **Eldarin RPG** |
| I2 | ✅ Superar Roll20/Foundry — correto |
| I3 | ✅ Todos os gates v1 — faz sentido |
| I4 | ✅ Ordem P0→P10 |
| I5 | ✅ PA pool 9, +5/turno, stun zera — ver PRD combate |
| I6 | ✅ Mestre pilota PC offline |
| I7 | ✅ Delegação: **dono da ficha e mestre** |
| I8 | ✅ Visitante **só ver**, sem chat |
| I9 | ✅ **10 fichas por usuário** |
| I10 | ✅ Eldarin diferenciais após P9 |
| I11 | ✅ **Clerk** recomendado (ver tabela Auth acima) |
| I12 | ✅ **Epic 9** — combate jogo + **PA movimento/habilidades** + **áreas livro/JSON/mapa** (detalhe em [VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md)) |
| I13 | N/A — pergunta era “algo **a mais** no escopo ou **irreal**?”; titular não tinha corte extra → escopo v1 mantido com fases |

---

## Stakeholder Sign-Off

| Role | Status | Date |
|------|--------|------|
| Product (Raul) | **Approved v2.1** | 2026-06-02 |
| Beta grupo | Pendente P9 | |

---

## Appendix — Links

| Doc | Uso |
|-----|-----|
| [ELDARIN-SITE-JOGAVEL.md](./ELDARIN-SITE-JOGAVEL.md) | Camadas técnicas |
| [POSTGRES.md](./POSTGRES.md) | Neon setup |
| [PRIVACIDADE-LGPD.md](./PRIVACIDADE-LGPD.md) | LGPD |
| [LIVRO-DO-JOGADOR.md](../livros/LIVRO-DO-JOGADOR.md) | Regras PA |
| [API-SALA.md](./API-SALA.md) | Endpoints |
| [VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md) | PA, movimento, áreas (Epic 9) |
| [UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md) | Layout painel lateral + compêndio rail (Epic 10) |
| [BETA-P9-CHECKLIST.md](./BETA-P9-CHECKLIST.md) | Registro sessão beta P9 |

---

## Implementação recente (rastreio v2.2)

| Entrega | Status | Referência |
|---------|--------|------------|
| Compêndio rail + cards não encolhidos | ✅ | `CompendiumBrowser.tsx`, `compendium.css` |
| Passar turno + confirmação + permissões | ✅ | `EndTurnBar`, `TurnOrderPanel`, `combat-turn-access.ts` |
| Medidor PA 11 / base / banco | ✅ | `PaDotMeter.tsx` |
| Magias canalizáveis (motor + gerador) | 🟡 | `spell-channel.ts`; regerar `magias.json` com `sync:data` |
| Epic 9 modo jogo completo | 🟡 | Ver gaps US-9.1–9.5 no Epic 9 |

---

*PRD v2.2 — decisões D27–D32 (PA UI, turno, compêndio rail, canalização, UX); Epic 10 UX produto; v2.1 Approved mantido como base.*
