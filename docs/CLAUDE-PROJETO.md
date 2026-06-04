# Guia completo do projeto Eldarin VTT (MXDRPG)

Documento de onboarding para **Claude** (ou outro assistente de código) trabalhar neste repositório com contexto correto, sem reinventar arquitetura nem violar decisões de produto.

**Como usar:** cole este arquivo (ou trechos) no system prompt / Project Knowledge do Claude, ou peça: *“Leia `docs/CLAUDE-PROJETO.md` antes de qualquer alteração.”*

---

## 1. O que é este produto

| Item | Valor |
|------|--------|
| **Nome** | Eldarin RPG — VTT web proprietário |
| **Pacote npm** | `eldarin-vtt` |
| **Produção** | https://mxdrpg.vercel.app |
| **Repositório** | https://github.com/MaulXD/MXDRPG.git |
| **Idioma** | PT-BR (UI, docs, livros) |
| **Sistema de regras** | **Eldarin v4** (hex, PA com acúmulo/teto, bestiário, classes do livro) |

**Missão:** ser o melhor lugar para jogar **Eldarin online** — não um VTT genérico (D&D, etc.). Regras do **livro mandam**; código e VTT corrigem para bater com o livro.

**Público:** grupos 2–8, presencial → online; mestre cria campanha; jogadores entram por convite.

**North Star (qualitativo):** sessão que *não trava* e *regras batem com o livro*. Zero tolerância a bugs P0 de PA/combate no lançamento.

---

## 2. O que NÃO é este repositório

| Pasta / URL | Status |
|-------------|--------|
| `archive/web/` | Legado React — **não editar** |
| `vinite/` | Módulo **Foundry** — referência de paridade UX, **não** runtime do produto |
| `drpg.vercel.app` | **Outro projeto** — não confundir com mxdrpg |
| `data/compendiums/*.json` | **Gerados** — não editar à mão (use `npm run sync:data`) |
| `livros/*.md` | Fonte de verdade das regras — editar aqui, depois sync |

---

## 3. Stack e deploy

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 15** (App Router), React 19 |
| Linguagem | TypeScript strict |
| Estilo | CSS em `app/globals.css` + `components/**/sheet.css` (sem Tailwind no core VTT) |
| Canvas VTT | **Three.js** (`lib/vtt/draw-battlefield.ts`, `hooks/vtt/useHexCanvas.ts`) |
| Auth produção | **Clerk** (`@clerk/nextjs`) + usuário espelhado em Postgres |
| Auth legado | Cookie `vinite_session` (e-mail/senha demo) |
| DB opcional | **Neon Postgres** via `DATABASE_URL` |
| Hosting | **Vercel** — Root Directory **vazio** (raiz do repo) |

### Comandos essenciais

```bash
npm ci
npm run dev              # http://localhost:3000
npm run dev:clean        # se CSS/HMR quebrar
npm run build
npm run lint
npm run sync:data        # livros → JSON/TS
npm run sync:data:check
npm run db:migrate       # precisa DATABASE_URL em .env.local
npm run test             # PA, movimento, hex path
```

### Variáveis de ambiente (resumo)

| Variável | Efeito |
|----------|--------|
| `DATABASE_URL` | Postgres: salas, usuários, personagens, aventuras |
| Clerk (`NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`) | Login social; ver `docs/P1-CLERK-SETUP.md` |
| Sem DB | Memória + seeds; perde estado no cold start serverless |

Saúde: `GET /api/health` → `{ ok, db, persistence }`.

---

## 4. Estrutura de pastas (mapa mental)

```
RPG/                          ← raiz = app Next.js (deploy Vercel)
├── app/                      → rotas App Router + Route Handlers (API)
├── components/               → UI React (character/, vtt/, adventure/)
├── lib/                      → domínio server-first ("server-only" onde aplicável)
├── hooks/                    → client hooks (useRoomSync, useHexCanvas, …)
├── data/                     → JSON gerados (compêndios, subclass-tracks)
├── livros/                   → regras Eldarin v4 (fonte)
├── scripts/                  → geradores + migrate DB + smoke tests
├── docs/                     → PRD, API, persistência, este guia
├── vinite/                   → Foundry (referência)
└── archive/web/              → legado (ignorar)
```

### `app/` — rotas principais

| Rota | Função |
|------|--------|
| `/` | Landing |
| `/painel` | Lobby: criar/entrar em **aventuras** |
| `/aventura/[adventureId]` | Hub da campanha (mesa, ficha, convite) |
| `/aventura/[id]/configurar` | Mestre: settings da mesa |
| `/aventura/[id]/personagem/novo` | Wizard de criação vinculado à aventura |
| `/mesa/[roomId]` | **VTT ao vivo** (hex, combate, chat) |
| `/mesa/demo` | Demo pública (visitante pode jogar PC demo) |
| `/personagem/[id]` | Ficha fora da mesa |
| `/personagem/novo` | Wizard global (legado) |
| `/biblioteca` | Compêndio leitura |
| `/entrar`, `/sign-in`, `/sign-up` | Auth |
| `/admin` | Admin plataforma |
| `/api/*` | REST + SSE |

Redirects legados: `/mesa/[id]/configurar` → `/aventura/.../configurar`, etc.

### `lib/` — módulos de domínio

| Módulo | Responsabilidade |
|--------|------------------|
| `lib/adventure/` | Campanha persistente (`eldarin_adventures`), convite, membros |
| `lib/room/` | Estado da mesa, handlers HTTP, sync atores↔fichas |
| `lib/character/` | Ficha, wizard, level-up, inventário, XP |
| `lib/combat/` | PA, ataque, magia, área, condições, preview |
| `lib/vtt/` | Hex, tokens, desenho canvas, movimento, fog of war |
| `lib/compendium/` | Registry de packs (armas, magias, monstros, …) |
| `lib/auth/` | Sessão, Clerk, permissões sala/aventura |
| `lib/db/` | Postgres client, CRUD rooms/users/characters/adventures |
| `lib/media/` | Retrato WebP client-side, `portraitFocus` (x, y, scale) |
| `lib/dice/` | Rolagens |

---

## 5. Modelo de domínio (conceitos obrigatórios)

### Hierarquia: Aventura → Mesa → Atores

```
Aventura (campaign)
  ├── ownerId (mestre da campanha)
  ├── inviteCode (único, 4–16 chars ou gerado)
  ├── memberIds[] (jogadores vinculados permanentemente — só cresce)
  ├── primaryRoomId (mesa 1:1 hoje)
  └── fichas CharacterSheet com adventureId

Mesa (RoomState)
  ├── adventureId
  ├── ownerId (mestre **desta sala** — poderes GM)
  ├── memberIds[] (sync com aventura ao entrar por convite)
  ├── scene (hex, tokens, fog)
  ├── actors: Record<actorId, RoomActor>  // RoomActor = ficha + revision
  ├── combat (ordem de turno, PA por token)
  ├── chat, pings, settings, revision
```

**Modelo Roll20 na conta:** papel global é só `admin` | `member`. Quem é **mestre** = `ownerId` da aventura/sala. Quem é **jogador** = `memberIds` após convite.

### Fluxos de convite

1. Mestre cria aventura no painel (`POST /api/adventures`) — pode definir `inviteCode` customizado.
2. Jogador entra com código (`POST /api/adventures/join`) → entra em `memberIds` **para sempre**.
3. Link mágico mesa: `/mesa/{roomId}?invite=CODE` → `joinRoomByInvite` → `joinAdventureByInvite`.
4. Visitante com `?invite=` vê mesa **sem** chat nem edição até fazer login e virar membro.

Arquivos-chave: `lib/adventure/store.ts`, `lib/adventure/invite-code.ts`, `lib/room/handlers/room-lifecycle.ts`, `lib/auth/adventure-access.ts`, `lib/auth/room-access.ts`.

### Ficha de personagem

- **1 ficha por jogador por aventura** (`MAX_CHARACTERS_PER_USER_PER_ADVENTURE = 1`).
- `adventureId` na ficha; legado `campaignRoomId` migrado em `normalizeCharacter`.
- Retrato: `portraitUrl` (WebP data URL), `portraitFocus` `{ x, y, scale? }`, `tokenImageUrl` gerado no browser.
- Na mesa, ator na sala espelha a ficha (`lib/room/adventure-actors.ts`, `lib/room/sync.ts`).

### Sala `demo`

- `roomId === "demo"` — sempre em memória, não persiste no DB.
- Visitante sem login pode jogar `DEMO_PLAYABLE_ACTOR_ID`.
- Não misturar regras de demo com salas reais nos handlers.

---

## 6. Autenticação e permissões

### Sessão

- `getSession()` em `lib/auth/session.ts`: Clerk primeiro, senão cookie legado.
- Tipos: `lib/auth/types.ts` — `SessionUser { id, email, name, role, nickname? }`.

### Papéis globais

| Role | Uso |
|------|-----|
| `admin` | Tudo + `/admin` |
| `member` | Painel, criar aventuras, jogar |

Não existe role global `mestre`/`jogador` — isso é **por sala/aventura**.

### Permissões de sala (`lib/auth/room-access.ts`)

| Função | Significado |
|--------|-------------|
| `canManageRoom` | Dono da sala ou admin — spawn, settings, combate GM |
| `canParticipateInRoom` | Membro — mover token, chat, editar própria ficha na mesa |
| `canViewRoom` | Membro, admin, demo, ou convite na URL |
| `isRoomVisitor` | Viu com convite mas ainda não é membro — sem chat |

Rotas API usam `lib/auth/authorize-room.ts` — sempre validar antes de mutar sala.

### Permissões de aventura (`lib/auth/adventure-access.ts`)

- `canManageAdventure` → owner ou admin.
- `isAdventureMember` → owner ou `memberIds`.

---

## 7. Tempo real e estado da mesa

### Snapshot

`GET /api/room/[roomId]` → `RoomSnapshot` (sem dados sensíveis de monstro para jogadores — ver `lib/room/snapshot-for-viewer.ts` + `RoomSettings`).

### SSE

`GET /api/room/[roomId]/events?since={revision}&invite=CODE`

Cliente: `hooks/useRoomSync.ts` — `EventSource`; fallback poll ~4s.

### Estado em memória

`globalThis.__eldarinRooms` — `lib/room/internal/registry.ts`.

Com DB: leitura/escrita Postgres + cache no Map. **Cold start Vercel** perde memória se não houver DB.

### Revisão

Toda mutação incrementa `room.revision`. Clientes aplicam patches via refresh ou SSE.

### Handlers (não duplicar lógica nas rotas)

Fachada: `lib/room/store.ts` re-exporta handlers em `lib/room/handlers/`:

| Handler | Ações |
|---------|--------|
| `room-lifecycle` | criar, convite, listar |
| `actors` | PATCH ator / level-up |
| `tokens` | mover, spawn monstro, place actor |
| `combat-*` | ataque, habilidade, área, iniciativa, next-turn |
| `chat` | mensagens |
| `scene`, `ping`, `settings` | mapa e preferências mestre |

Documentação HTTP: `docs/API-SALA.md`.

---

## 8. VTT e combate (onde mexer com cuidado)

### Mapa hex

- `lib/vtt/hex-math.ts`, `hex-grid.ts`, `hex-path.ts`, `hex-area.ts`
- Movimento consome PA: `lib/vtt/movement-pa.ts`
- Desenho: `lib/vtt/draw-battlefield.ts` + hooks em `hooks/vtt/`

### PA (pontos de ação) — regras críticas

- Base, acúmulo (até 2), teto **11 PA/turno**, Atordoado zera acúmulo.
- Implementação: `lib/combat/pa-economy.ts`, `pa-turn.ts`, `pa-token-state.ts`, `combat-token-pa.ts`
- UI mesa: medidor PA, `EndTurnBar`, confirmação ao passar turno.
- **Nunca** “simplificar” PA sem ler livro Cap. 2.6 / 3.1.1 e `docs/VTT-ACOES-PA-AREAS.md`.

### Combate estilo jogo

- Alvo por clique, preview vantagem/desvantagem (`lib/combat/action-preview.ts`).
- Ataque/magia/habilidade/área → rotas POST em `app/api/room/.../combat/`.
- Áreas: burst, cone, line, wall, cube — `computeAreaHexes`.

### Componentes UI mesa

| Componente | Papel |
|------------|--------|
| `components/vtt/MesaWorkspace.tsx` | Layout principal |
| `components/vtt/HexBattlefield.tsx` | Orquestra canvas |
| `components/vtt/TurnOrderPanel.tsx` | Ordem de turno |
| `components/vtt/RoomInviteBar.tsx` | Convite mestre |
| `components/vtt/RoomCharacterPrompt.tsx` | Vincular ficha à mesa |

UX produto: `docs/UX-MESA-E-RAIL.md` — compêndio na mesa é **rail vertical**, não grid da biblioteca.

---

## 9. Personagem e wizard

### Criação

- `components/character/wizard/CharacterCreationWizard.tsx`
- Draft: `lib/character/wizard-types.ts` → build: `lib/character/build-from-wizard.ts`
- Passo retrato: `WizardPortraitStep` + `PortraitEditorPanel` (zoom, capa, token).

### Ficha na UI

- `components/character/CharacterSheet.tsx`
- Capa horizontal: `CharacterSheetCover.tsx`
- Retrato editável: `PortraitFields` (na mesa) ou `CharacterPortraitFields` (PATCH `/api/characters/[id]`).

### Level-up e subclasse

- `lib/character/level-up.ts`, `SubclassTrackPanel`, trilhas em `data/character/subclass-tracks.json`.

### Limites

- Até **10 fichas** por usuário (global).
- **1 ficha por aventura** por jogador.

---

## 10. Compêndio e pipeline de dados

### Packs

`armas`, `habilidades`, `magias`, `equipamentos`, `monstros` — tipos em `lib/compendium/types.ts`, dados em `data/compendiums/*.json`.

### Gerar dados após editar livros

```bash
npm run sync:data
npm run sync:data:check
```

Fluxo completo: `docs/DADOS-E-REGRAS.md`.

### IDs

- `catalogId` nos JSON (MON-*, MAG-*, …) — **não mostrar na UI**.
- Classes/raças: `lib/character/canon-ids.ts` — import único.

### Monstros

Script de habilidades de assimilação: `scripts/sync-monster-assimilation-abilities.mjs` (incluído no sync).

---

## 11. Persistência Postgres

Tabelas (`scripts/db/schema.sql`):

| Tabela | Conteúdo |
|--------|----------|
| `eldarin_users` | Contas, Clerk, nickname |
| `eldarin_characters` | Fichas JSONB |
| `eldarin_adventures` | Campanhas + member_ids |
| `eldarin_rooms` | Estado completo da mesa |

Migrações adicionais: `scripts/db/migrations/`, `scripts/db/migrate-adventures.sql`, `migrate-room-settings.sql`.

Detalhes: `docs/PERSISTENCIA.md`, setup: `docs/P0-NEON-SETUP.md`.

---

## 12. Convenções de código para o assistente

### Faça

- Leia arquivos vizinhos antes de editar; mantenha estilo existente.
- Mutações de sala **só** via handlers + `persistRoom`.
- Regras de combate/PA **no servidor** (`lib/combat/`, handlers) — cliente só preview.
- Textos de UI em **PT-BR**.
- Imports com alias `@/` (tsconfig paths).
- Mudanças mínimas e focadas; não refatorar arquivos inteiros sem pedido.
- Após mudar `livros/`: rodar `sync:data` e `build`.
- `server-only` em módulos que acessam DB ou estado global de sala.

### Não faça

- Editar `archive/web/`, `data/compendiums/*.json` manualmente, ou deploy em subpasta errada.
- Criar papel global `mestre`/`jogador` — use owner/member por aventura/sala.
- Remover jogadores de `memberIds` (vínculo permanente).
- Commit/push sem o usuário pedir.
- Ampliar escopo (Tailwind migration, novo ORM, etc.) sem tarefa explícita.
- Ignorar `RoomSettings` ao expor HP de monstros a jogadores.

### Testes úteis antes de PR

```bash
npm run build
npm run lint
npm run test          # PA + movimento + hex
npm run sync:data:check   # se mexeu em livros/scripts
```

---

## 13. Tarefas comuns — onde ir no código

| Tarefa | Onde começar |
|--------|----------------|
| Novo campo na ficha | `lib/character/types.ts`, `normalize.ts`, wizard, API characters |
| Regra de combate/PA | `lib/combat/`, handler correspondente, testes em `scripts/verify-*.mjs` |
| UI da mesa | `components/vtt/`, `hooks/vtt/` |
| Convite / aventura | `lib/adventure/`, `components/adventure/AdventureLobby.tsx`, APIs adventures |
| Settings mesa (HP monstro, ping) | `lib/room/settings.ts`, `handlers/settings.ts`, página configurar |
| Novo monstro/magia no jogo | `livros/` → `sync:data` |
| Auth Clerk | `lib/auth/clerk-*.ts`, `middleware.ts`, `docs/P1-CLERK-SETUP.md` |
| Retrato / token | `lib/media/`, `PortraitEditorPanel.tsx`, `image-upload-client.ts` |
| Fog of war | `lib/vtt/fog-of-war.ts`, scene tokens |

---

## 14. Índice da documentação existente

| Documento | Conteúdo |
|-----------|----------|
| [README.md](../README.md) | Quick start, deploy |
| [PRODUTO.md](../PRODUTO.md) | Visão produto |
| [REFATORACAO.md](../REFATORACAO.md) | Plano de passos (0–9) |
| [ESTRUTURA-PROJETOS.md](../ESTRUTURA-PROJETOS.md) | Árvore resumida |
| [docs/PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md) | PRD v2.2 completo |
| [docs/DADOS-E-REGRAS.md](./DADOS-E-REGRAS.md) | Pipeline livros → JSON |
| [docs/API-SALA.md](./API-SALA.md) | API REST da sala |
| [docs/PERSISTENCIA.md](./PERSISTENCIA.md) | Postgres |
| [docs/P2-SSE-CONVITE.md](./P2-SSE-CONVITE.md) | SSE e visitante |
| [docs/VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md) | PA, áreas, turno |
| [docs/UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md) | UX mesa e compêndio |
| [docs/PARIDADE-FOUNDRY.md](./PARIDADE-FOUNDRY.md) | Checklist vs Foundry |
| [docs/P4-WIZARD.md](./P4-WIZARD.md) | Wizard personagem |
| [docs/P1-CLERK-SETUP.md](./P1-CLERK-SETUP.md) | Clerk |
| [docs/P9-READY.md](./P9-READY.md) | Checklist pré-beta |
| [FICHA_PERSONAGEM_ELDARIN_v4.md](../FICHA_PERSONAGEM_ELDARIN_v4.md) | Modelo de ficha |
| [livros/LIVRO-DO-JOGADOR.md](../livros/LIVRO-DO-JOGADOR.md) | Regras jogador |

---

## 15. Decisões de produto (resumo para não regressar)

| # | Decisão |
|---|---------|
| D2 | Melhor que Roll20/Foundry **para Eldarin** |
| D3 | Foundry só referência |
| D4 | Livro manda |
| D8 | Convite código + link |
| D10 | Wizard completo + recorte retrato → token |
| D11/D23 | Até 10 fichas por conta; 1 por aventura |
| D14 | PA: base 5, acúmulo ≤2, teto 11/turno |
| D22 | Visitante só visualiza, sem chat |
| D24–D27 | Combate por clique, PA visível, áreas padronizadas, passar turno com confirmação |
| Modelo conta | Uma conta = pode mestrear **suas** aventuras e jogar **outras** via convite |

---

## 16. Prompt sugerido para iniciar uma sessão Claude

Copie e adapte:

```
Você trabalha no repositório Eldarin VTT (MXDRPG), Next.js 15 + TypeScript, VTT hex Eldarin v4.

Regras:
1. Leia docs/CLAUDE-PROJETO.md e siga o modelo Aventura → Mesa → Atores.
2. Livro/regras em livros/; dados gerados com npm run sync:data.
3. Mestre = ownerId da sala/aventura; não crie roles globais mestre/jogador.
4. Mutações de sala via lib/room/handlers + persistRoom; PA/combate no servidor.
5. PT-BR na UI; mudanças mínimas; npm run build antes de concluir.
6. Não editar archive/web/, vinite/ como produto, nem JSON de compêndio à mão.

Tarefa: [descreva aqui]
```

---

## 17. Glossário rápido

| Termo | Significado no código |
|-------|---------------------|
| Aventura | Campanha persistente (`Adventure`) |
| Mesa / Sala | `RoomState` — sessão VTT ao vivo |
| Ator | Ficha instanciada na sala (`RoomActor`) |
| Token | Peça no mapa hex (`BattleToken`) |
| PA | Pontos de ação (combate) |
| Pack | Coleção do compêndio (ex.: `monstros`) |
| Convite | `inviteCode` — liga jogador à aventura e sala |
| Revision | Versão do estado da sala para sync |

---

*Última atualização do guia: 2026-06-02 — alinhado ao modelo Aventura, PortraitEditor, capa de ficha e Clerk/Postgres opcional.*
