# Guia completo do projeto Eldarin VTT (MXDRPG)

Documento de onboarding para **Claude** (ou outro assistente de código) trabalhar neste repositório com contexto correto, sem reinventar arquitetura nem violar decisões de produto.

**Como usar:** cole este arquivo (ou trechos) no system prompt / Project Knowledge do Claude, ou peça: *"Leia `docs/CLAUDE-PROJETO.md` e `docs/CLAUDE-CODIGO-SEGURO.md` antes de qualquer alteração."*

> **Edição segura:** regras práticas, zonas de risco e checklist → **[CLAUDE-CODIGO-SEGURO.md](./CLAUDE-CODIGO-SEGURO.md)**

> **Andamento atual:** [docs/fichario/00-indice-e-andamento.md](./fichario/00-indice-e-andamento.md).

---

## 1. O que é este produto

| Item | Valor |
|------|--------|
| **Nome** | Eldarin RPG: VTT web proprietário |
| **Pacote npm** | `eldarin-vtt` |
| **Produção** | https://www.mxdrpg.com.br |
| **Repositório** | https://github.com/MaulXD/MXDRPG.git |
| **Idioma** | PT-BR (UI, docs, livros) |
| **Sistemas** | **Eldarin v4** (grid quadrado, PA com acúmulo/teto, bestiário, classes do livro) e **Um Anel** (2ª edição, módulo separado) |

**Missão:** ser o melhor lugar para jogar **Eldarin online** e, no módulo próprio, **O Um Anel**. Não é um VTT genérico. Regras do **livro mandam**; código e VTT corrigem para bater com o livro.

**Público:** grupos 2–8, presencial → online; mestre cria campanha; jogadores entram por convite.

**North Star (qualitativo):** sessão que *não trava* e *regras batem com o livro*. Zero tolerância a bugs P0 de PA/combate no lançamento.

### Um Anel (segundo sistema)

- Fonte de regras: `livros/um-anel/` (capítulos em PT-BR, compêndio e aventuras).
- Regras e dados: `lib/character/um-anel/`, `lib/combat/um-anel/`, `data/compendiums/um-anel/` (gerado por `scripts/gen-um-anel.mjs`, incluído no `sync:data`).
- Servidor: handlers `lib/room/handlers/tor-*.ts`, APIs `app/api/tor-characters/` e `app/api/room/[roomId]/tor-*`.
- UI: `components/vtt/Tor*.tsx`, `components/character/sheet/TorCharacterSheetView.tsx`, `components/character/wizard/TorCharacterCreationWizard.tsx`.
- Persistência própria: `lib/db/um-anel-characters.ts`, tabela `um_anel_characters`. Limite global de fichas: `MAX_TOR_CHARACTERS_PER_USER = 10`.
- Rotas: `/rpg/um-anel` e as variantes `?sistema=um-anel` em `/compendios`, `/mundo` e `/sistema`. A mesa é a mesma do Eldarin (`/mesa/[roomId]`), com grid quadrado e atores do sistema escolhido.
- Testes: `npm run test:um-anel`, que também faz parte de `npm test`.

---

## 2. O que NÃO é este repositório

| Pasta / URL | Status |
|-------------|--------|
| `archive/web/` | Legado React: **não editar** |
| `vinite/` | Módulo **Foundry**: referência de paridade UX, **não** runtime do produto |
| `scripts/db/schema.sql` | Schema antigo, sintaxe Postgres; quem aplica schema é `scripts/db/migrate.mjs`, com `schema.mariadb.sql` |
| `data/compendiums/*.json` | **Gerados**: não editar à mão (use `npm run sync:data`) |
| `livros/*.md`, `livros/um-anel/*.md` | Fonte de verdade das regras: editar aqui, depois sync |

---

## 3. Stack e deploy

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 15** (App Router), React 19 |
| Linguagem | TypeScript strict (`tsconfig.json`) |
| Estilo | CSS global em `app/globals.css` e folhas por componente (sem Tailwind no core VTT) |
| Canvas VTT | **Three.js** e `@3d-dice/dice-box` (`lib/vtt/draw-battlefield.ts`, `hooks/vtt/useGridCanvas.ts`) |
| Auth | **Própria**: cookie `vinite_session` assinado com HMAC-SHA256, OAuth manual Google/Discord e e-mail/senha com `bcryptjs`. Sem Clerk |
| Banco | **MariaDB** via `mysql2` (`lib/db/`), URL `mysql://` ou `mariadb://` |
| Hosting | **Docker** → imagem no **GHCR** → deploy em **Contabo** (Kubernetes), domínio **www.mxdrpg.com.br** |

### Comandos essenciais

```bash
npm ci
npm run dev              # http://localhost:3000
npm run dev:clean        # se CSS/HMR quebrar
npm run build
npm run sync:data        # livros → JSON/TS (inclui o Um Anel)
npm run sync:data:check
npm run db:migrate       # precisa DATABASE_URL MariaDB em .env.local
npm test                 # PA, grid, rotas, auth, Um Anel, dados
npm run test:um-anel     # só a bateria do Um Anel
```

`npm run lint` existe no `package.json`, mas o projeto não tem ESLint configurado. O CI não roda lint.

### Variáveis de ambiente (resumo)

| Variável | Efeito |
|----------|--------|
| `DATABASE_URL` | URL MariaDB (`mysql://` ou `mariadb://`). Sem ela, `persistenceLabel()` devolve `"memory"`; URL `postgresql://` é recusada por `lib/db/enabled.ts` |
| `SESSION_SECRET` ou `OAUTH_STATE_SECRET` | Segredo do HMAC do cookie (mínimo 16 caracteres) |
| `AUTH_URL` ou `NEXT_PUBLIC_APP_URL` | Origem pública dos callbacks OAuth e host canônico no middleware |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login com Google |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Login com Discord |
| `ELDARIN_DISABLE_DB` | `1` desliga o banco mesmo com URL configurada |

Saúde: `GET /api/health` → `{ ok, db, persistence, auth, oauth, ... }`.

### CI e imagem

- `.github/workflows/ci.yml`: em push/PR para `main`, roda `npm ci`, `npm run build` e `npm test` (Node 24).
- Job `data-sync`: só quando mudam `livros/`, geradores ou compêndios. Roda `sync:data`, `sync:data:check` e falha se o JSON gerado divergir do commitado.
- `Dockerfile`: `node:26-alpine3.23`, `npm ci`, `COPY . .`, `npm run build`, `npm start`. `docker-entrypoint.sh` aponta o cache do Next para `/tmp`.
- `.github/workflows/build-image.yml`: publica `ghcr.io/maulxd/mxdrpg` e chama webhook que reinicia o deployment na Contabo. Não há Vercel no projeto.

---

## 4. Estrutura de pastas (mapa mental)

```
RPG/                          ← raiz = app Next.js (deploy Docker / Contabo)
├── app/                      → rotas App Router + Route Handlers (API)
├── components/               → UI React (character/, vtt/, adventure/)
├── lib/                      → domínio server-first ("server-only" onde aplicável)
├── hooks/                    → client hooks (useRoomSync, useGridCanvas, …)
├── data/                     → JSON gerados (compêndios, subclass-tracks)
├── livros/                   → regras Eldarin v4 e Um Anel (fonte)
├── scripts/                  → geradores + migrate DB + smoke tests
├── docs/                     → PRD, API, persistência, fichario, este guia
├── vinite/                   → Foundry (referência)
└── archive/web/              → legado (ignorar)
```

### `app/`: rotas principais

| Rota | Função |
|------|--------|
| `/` | Landing |
| `/rpg`, `/rpg/eldarin`, `/rpg/um-anel`, `/eldarin`, `/sistema` | Hub e seletor de sistema |
| `/painel`, `/mestre`, `/jogador` | Lobby de aventuras e painéis por papel |
| `/aventura/[adventureId]` | Hub da campanha (mesa, ficha, convite) |
| `/aventura/[id]/configurar` | Mestre: settings da mesa |
| `/aventura/[id]/personagem/novo` | Wizard de criação vinculado à aventura |
| `/mesa`, `/mesas` | Lista de mesas |
| `/mesa/[roomId]` | **VTT ao vivo** (grid, combate, chat) |
| `/mesa/[roomId]/configurar`, `/mesa/[roomId]/personagem/novo` | Config e criação de ficha na mesa |
| `/personagem/novo`, `/personagem/[id]`, `/personagem/[id]/editar` | Fichas |
| `/biblioteca`, `/biblioteca/[packId]`, `/compendios`, `/compendios/[packId]`, `/mundo` | Compêndio e mundo |
| `/entrar`, `/entrar/apelido`, `/entrar/recuperar`, `/conta`, `/conta/bem-vindo`, `/privacidade` | Entrada, conta e privacidade |
| `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` | Legado: redirecionam para `/entrar` |
| `/amigos`, `/admin`, `/admin/mesas` | Social e administração |
| `/aplicativo`, `/download`, `/download/guia` | Aplicativo e download |
| `/api/*` | REST + SSE |

`middleware.ts` **não** autentica: só ajusta apex ↔ www conforme `AUTH_URL` em produção e grava/apaga o cookie de assistir mesa (`?watch=1`). Proteção de rota fica nas páginas e handlers.

### `lib/`: módulos de domínio

| Módulo | Responsabilidade |
|--------|------------------|
| `lib/adventure/` | Campanha persistente (`eldarin_adventures`), convite, membros |
| `lib/room/` | Estado da mesa, handlers HTTP, sync atores↔fichas (inclui `handlers/tor-*.ts`) |
| `lib/character/` | Ficha, wizard, level-up, inventário, XP; regras do Um Anel em `um-anel/` |
| `lib/combat/` | PA, ataque, magia, área, condições, preview; motores do Um Anel em `um-anel/` |
| `lib/vtt/` | Célula, tokens, desenho canvas, movimento, fog of war |
| `lib/compendium/` | Registry de packs (armas, magias, monstros, …) |
| `lib/auth/` | Sessão HMAC, OAuth manual, senha, apelido, permissões sala/aventura |
| `lib/db/` | Cliente MariaDB (`mysql2`) e repositórios por tabela |
| `lib/media/` | Retrato WebP client-side, `portraitFocus` (x, y, scale) |
| `lib/bestiary/`, `lib/culinary/`, `lib/friends/`, `lib/notifications/` | Bestiário, culinária, amigos e notificações |
| `lib/dice/` | Rolagens |

---

## 5. Modelo de domínio (conceitos obrigatórios)

### Hierarquia: Aventura → Mesa → Atores

```
Aventura (campaign)
  ├── ownerId (mestre da campanha)
  ├── inviteCode (único, 4–16 chars ou gerado)
  ├── memberIds[] (jogadores vinculados permanentemente: só cresce)
  ├── rpgSystemId (eldarin ou um-anel)
  ├── primaryRoomId (mesa 1:1 hoje)
  └── fichas CharacterSheet com adventureId

Mesa (RoomState)
  ├── adventureId
  ├── ownerId (mestre **desta sala**: poderes GM)
  ├── memberIds[] (sync com aventura ao entrar por convite)
  ├── scene (células, tokens, fog)
  ├── actors: Record<actorId, RoomActor>  // RoomActor = ficha + revision
  ├── combat (ordem de turno, PA por token)
  ├── chat, pings, settings, revision
```

**Modelo Roll20 na conta:** papel global é só `admin` | `member`. Quem é **mestre** = `ownerId` da aventura/sala. Quem é **jogador** = `memberIds` após convite.

### Fluxos de convite

1. Mestre cria aventura no painel (`POST /api/adventures`): pode definir `inviteCode` customizado.
2. Jogador entra com código (`POST /api/adventures/join`) → entra em `memberIds` **para sempre**.
3. Link mágico mesa: `/mesa/{roomId}?invite=CODE` → `joinRoomByInvite` → `joinAdventureByInvite`.
4. Visitante com `?invite=` vê mesa **sem** chat nem edição até fazer login e virar membro.

Arquivos-chave: `lib/adventure/store.ts`, `lib/adventure/invite-code.ts`, `lib/room/handlers/room-lifecycle.ts`, `lib/auth/adventure-access.ts`, `lib/auth/room-access.ts`.

### Ficha de personagem

- **3 fichas por jogador por aventura** (`MAX_CHARACTERS_PER_USER_PER_ADVENTURE = 3` em `lib/character/adventure-bind.ts`).
- **10 fichas por usuário no total** (`MAX_CHARACTERS_PER_USER = 10` em `lib/character/characters.ts`).
- `adventureId` na ficha; legado `campaignRoomId` migrado em `normalizeCharacter`.
- Retrato: `portraitUrl` (WebP data URL), `portraitFocus` `{ x, y, scale? }`, `tokenImageUrl` gerado no browser.
- Na mesa, ator na sala espelha a ficha (`lib/room/adventure-actors.ts`, `lib/room/sync.ts`).
- Fichas do Um Anel usam tabela e repositório próprios (`um_anel_characters`, `lib/db/um-anel-characters.ts`).

---

## 6. Autenticação e permissões

### Sessão

- `getSession()` em `lib/auth/session.ts` lê o cookie `vinite_session`: JSON em base64url mais assinatura HMAC-SHA256 (`SESSION_SECRET` ou `OAUTH_STATE_SECRET`).
- Cookie sem assinatura é recusado. `httpOnly`, `sameSite: lax`, `secure` em produção, validade de 7 dias.
- Tipos: `lib/auth/types.ts`: `SessionUser { id, email, name, nickname?, role, avatarUrl?, oauthProvider?, oauthSubject?, clerkId? }`. O campo `clerkId` é **legado**, usado só para reconciliar aliases `clerk-*` em `memberIds`. Não há provedor Clerk.

### Login

- **OAuth manual** Google e Discord: `lib/auth/oauth-config.ts`, `lib/auth/oauth/providers.ts`, rotas `/api/auth/oauth/[provider]` e `/api/auth/oauth/[provider]/callback`.
- **E-mail/senha**: `lib/auth/password.ts` (`bcryptjs`, 10 rounds), rotas `/api/auth/login` e `/api/auth/register`.
- Recuperação por CPF parcial e data de nascimento: `lib/auth/password-recover.ts`, rotas `/api/auth/recover-password` e `/api/auth/recovery-identity`.
- `/entrar`, `/entrar/apelido`, `/entrar/recuperar` são as telas atuais. `/sign-in` e `/sign-up` só redirecionam.

### Papéis globais

| Role | Uso |
|------|-----|
| `admin` | Tudo + `/admin` |
| `member` | Painel, criar aventuras, jogar |

Não existe role global `mestre`/`jogador`: isso é **por sala/aventura**.

### Permissões de sala (`lib/auth/room-access.ts`)

| Função | Significado |
|--------|-------------|
| `canManageRoom` | Dono da sala ou admin: spawn, settings, combate GM |
| `canParticipateInRoom` | Membro: mover token, chat, editar própria ficha na mesa |
| `canViewRoom` | Membro, admin, ou convite na URL |
| `isRoomVisitor` | Viu com convite mas ainda não é membro: sem chat |

Rotas API usam `lib/auth/authorize-room.ts`: sempre validar antes de mutar sala.

### Permissões de aventura (`lib/auth/adventure-access.ts`)

- `canManageAdventure` → owner ou admin.
- `isAdventureMember` → owner ou `memberIds`.

---

## 7. Tempo real e estado da mesa

### Snapshot

`GET /api/room/[roomId]` → `RoomSnapshot` (sem dados sensíveis de monstro para jogadores: ver `lib/room/snapshot-for-viewer.ts` + `RoomSettings`).

### SSE

`GET /api/room/[roomId]/events?since={revision}&invite=CODE`

Cliente: `hooks/useRoomSync.ts`: `EventSource`; fallback poll ~4s.

### Estado em memória

`globalThis.__eldarinRooms`: `lib/room/internal/registry.ts`.

Com `DATABASE_URL` MariaDB: leitura/escrita no banco e cache no Map. Sem DB: `persistence: "memory"`; restart do container perde estado.

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
| `tor-*` | postura, sombra, jornada, fadiga, conselho e demais ações do Um Anel |
| `chat` | mensagens |
| `scene`, `ping`, `settings` | mapa e preferências mestre |

Documentação HTTP: `docs/API-SALA.md` (cobre parte das rotas; para a lista completa, leia `app/api/`).

---

## 8. VTT e combate (onde mexer com cuidado)

### Mapa grid quadrado

- `lib/vtt/grid-math.ts`, `grid-cells.ts`, `grid-path.ts`, `grid-area.ts`
- 1 célula = 1,5 m (`METERS_PER_CELL` em `lib/vtt/movement.ts`). Não existe hex no runtime.
- Movimento consome PA: `lib/vtt/movement-pa.ts`
- Desenho: `lib/vtt/draw-battlefield.ts` + hooks em `hooks/vtt/`

### PA (pontos de ação): regras críticas

- **Jogadores:** base 5 PA/turno, acúmulo de até 5 PA não usados, pool total máxima **9 PA**, Atordoado zera acúmulo.
- **Monstros comuns:** 6 PA/turno, **não acumulam** (pool = recuperação).
- **Minibosses / Bosses:** acumulam até **8 PA** (`MONSTER_PA_BOSS = 8` em `lib/combat/pa-economy.ts`).
- **Movimento:** 1 PA → 6 m (4 células); corrida 2 PA → 12 m (8 células). 1 célula = 1,5 m.
- **Fases de PA:** `exploration` (PA visual, sem débito) → `combat_free` (PA real, sem fila) → `combat_turn` (PA real + turno ativo). Controlado por `settings.combatActive` + `combat.order`.
- Implementação: `lib/combat/pa-economy.ts`, `pa-turn.ts`, `pa-token-state.ts`, `combat-token-pa.ts`
- UI mesa: medidor PA, `EndTurnBar`, confirmação ao passar turno.
- **Nunca** “simplificar” PA sem ler livro Cap. 2.6 / 3.1.1 e `docs/VTT-ACOES-PA-AREAS.md`.

### Combate estilo jogo

- Alvo por clique, preview vantagem/desvantagem (`lib/combat/action-preview.ts`).
- Ataque/magia/habilidade/área → rotas POST em `app/api/room/.../combat/`.
- Áreas: burst, cone, line, wall, cube: `computeAreaCells`.
- No Um Anel, as ações passam pelos motores de `lib/combat/um-anel/` e handlers `tor-*`, não pela economia de PA do Eldarin.

### Componentes UI mesa

| Componente | Papel |
|------------|--------|
| `components/vtt/MesaWorkspace.tsx` | Layout principal |
| `components/vtt/Battlefield.tsx` | Orquestra canvas |
| `components/vtt/TurnOrderPanel.tsx` | Ordem de turno |
| `components/vtt/RoomInviteBar.tsx` | Convite mestre |
| `components/vtt/PlayableCharactersPanel.tsx` | Personagens jogáveis na mesa |
| `components/vtt/MesaCharacterWizardPopup.tsx` | Wizard de ficha dentro da mesa |

UX produto: `docs/UX-MESA-E-RAIL.md`: compêndio na mesa é **rail vertical**, não grade da biblioteca.

---

## 9. Personagem e wizard

### Criação

- `components/character/wizard/CharacterCreationWizard.tsx`
- Draft: `lib/character/wizard-types.ts` → build: `lib/character/build-from-wizard.ts`
- Passo retrato: `WizardPortraitStep` + `PortraitEditorPanel` (zoom, capa, token).
- Um Anel: `components/character/wizard/TorCharacterCreationWizard.tsx` e visualização em `components/character/sheet/TorCharacterSheetView.tsx`.

### Ficha na UI

- `components/character/CharacterSheet.tsx`
- Capa horizontal: `CharacterSheetCover.tsx`
- Retrato editável: `PortraitEditorFields` / `PortraitEditorPanel` (também na mesa).

### Level-up e subclasse

- `lib/character/level-up.ts`, `SubclassTrackPanel`, trilhas em `data/character/subclass-tracks.json`.

### Limites

- Até **10 fichas** por usuário, global (`MAX_CHARACTERS_PER_USER`).
- Até **3 fichas** por jogador por aventura (`MAX_CHARACTERS_PER_USER_PER_ADVENTURE`).

---

## 10. Compêndio e pipeline de dados

### Packs

`armas`, `habilidades`, `magias`, `equipamentos`, `monstros`: tipos em `lib/compendium/types.ts`, dados em `data/compendiums/*.json`. O Um Anel tem packs próprios em `data/compendiums/um-anel/`, gerados por `scripts/gen-um-anel.mjs`.

### Gerar dados após editar livros

```bash
npm run sync:data
npm run sync:data:check
```

Fluxo completo: `docs/DADOS-E-REGRAS.md`.

### IDs

- `catalogId` nos JSON (MON-*, MAG-*, …): **não mostrar na UI**.
- Classes/raças: `lib/character/canon-ids.ts`: import único.

### Monstros

Script de habilidades de assimilação: `scripts/sync-monster-assimilation-abilities.mjs` (incluído no sync).

---

## 11. Persistência MariaDB

`DATABASE_URL` aceita `mysql://` ou `mariadb://`. `lib/db/client.ts` só chama `getMariaSql()` de `lib/db/client-mariadb.ts`. URL `postgresql://` é recusada por `lib/db/enabled.ts` e por `scripts/db/migrate.mjs`.

Tabelas (`scripts/db/schema.mariadb.sql`):

| Tabela | Conteúdo |
|--------|----------|
| `eldarin_users` | Contas, apelido, OAuth, avatar (`clerk_id` segue como coluna legada) |
| `eldarin_characters` | Fichas Eldarin em JSON |
| `um_anel_characters` | Fichas do Um Anel em JSON |
| `eldarin_adventures` | Campanhas, membros, `rpg_system` |
| `eldarin_rooms` | Estado completo da mesa (cena, atores, combate, chat, settings) |
| `eldarin_player_bestiary` | Bestiário do jogador |
| `eldarin_room_presence` | Presença na sala |
| `eldarin_sheet_edit_requests` | Pedidos de edição de ficha |
| `eldarin_user_friends`, `eldarin_friend_requests`, `eldarin_friend_messages` | Amigos, pedidos e mensagens |
| `eldarin_mesa_invites` | Convites de mesa |
| `eldarin_adventure_join_tokens`, `eldarin_adventure_join_requests` | Tokens e pedidos de entrada |
| `eldarin_inventory_item_requests` | Pedidos de item de inventário |

`npm run db:migrate` aplica `scripts/db/schema.mariadb.sql` e seeds. Há migrações numeradas em `scripts/db/migrations/`, `migrate-adventures.sql` e `migrate-room-settings.sql` versionados. Patches idempotentes em runtime ficam em `lib/db/ensure-migrations.ts`.

Detalhes: `docs/PERSISTENCIA.md`, deploy: `DEPLOY.md`.

---

## 12. Convenções de código para o assistente

### Faça

- Leia arquivos vizinhos antes de editar; mantenha estilo existente.
- Mutações de sala **só** via handlers + `persistRoom`.
- Regras de combate/PA **no servidor** (`lib/combat/`, handlers): cliente só preview.
- No Um Anel, regras em `lib/combat/um-anel/` e `lib/character/um-anel/`; nada de PA do Eldarin.
- Textos de UI em **PT-BR**.
- Imports com alias `@/` (tsconfig paths).
- Mudanças mínimas e focadas; não refatorar arquivos inteiros sem pedido.
- Após mudar `livros/`: rodar `sync:data` e `build`.
- `server-only` em módulos que acessam DB ou estado global de sala.

### Não faça

- Editar `archive/web/`, `data/compendiums/*.json` manualmente, ou deploy em subpasta errada.
- Criar papel global `mestre`/`jogador`: use owner/member por aventura/sala.
- Remover jogadores de `memberIds` (vínculo permanente).
- Trocar MariaDB por Postgres/Neon, auth própria por Clerk ou Docker/Contabo por Vercel sem decisão explícita.
- Usar grid hex: o runtime é quadrado.
- Commit/push sem o usuário pedir.
- Ampliar escopo (novo ORM, novo framework de UI, etc.) sem tarefa explícita.
- Ignorar `RoomSettings` ao expor HP de monstros a jogadores.

### Testes úteis antes de PR

```bash
npm run build
npm test              # PA, grid, auth, rotas, Um Anel e dados
npm run sync:data:check   # se mexeu em livros/scripts
```

---

## 13. Tarefas comuns: onde ir no código

| Tarefa | Onde começar |
|--------|----------------|
| Novo campo na ficha | `lib/character/types.ts`, `normalize.ts`, wizard, API characters |
| Regra de combate/PA | `lib/combat/`, handler correspondente, testes em `scripts/verify-*.mjs` |
| Regra do Um Anel | `lib/character/um-anel/`, `lib/combat/um-anel/`, `lib/room/handlers/tor-*.ts`, `livros/um-anel/` |
| UI da mesa | `components/vtt/`, `hooks/vtt/` |
| Convite / aventura | `lib/adventure/`, `components/adventure/AdventureLobby.tsx`, APIs adventures |
| Settings mesa (HP monstro, ping) | `lib/room/settings.ts`, `handlers/settings.ts`, página configurar |
| Novo monstro/magia no jogo | `livros/` → `sync:data` |
| Auth, sessão, OAuth | `lib/auth/session.ts`, `lib/auth/oauth/`, `app/api/auth/`, `middleware.ts` (sem autenticação) |
| Banco / query | `lib/db/`, `scripts/db/schema.mariadb.sql` |
| Retrato / token | `lib/media/`, `components/character/PortraitEditorPanel.tsx`, `image-upload-client.ts` |
| Fog of war | `lib/vtt/fog-of-war.ts`, scene tokens |

---

## 14. Índice da documentação existente

| Documento | Conteúdo |
|-----------|----------|
| [README.md](../README.md) | Quick start, deploy |
| [PRODUTO.md](../PRODUTO.md) | Visão produto |
| [ESTRUTURA-PROJETOS.md](../ESTRUTURA-PROJETOS.md) | Árvore resumida |
| [DEPLOY.md](../DEPLOY.md) | Deploy Docker/GHCR na Contabo |
| [docs/PRD-ELDARIN-VTT.md](./PRD-ELDARIN-VTT.md) | PRD do Eldarin |
| [docs/PRD-MESA-UM-ANEL.md](./PRD-MESA-UM-ANEL.md) | PRD do Um Anel |
| [docs/DADOS-E-REGRAS.md](./DADOS-E-REGRAS.md) | Pipeline livros → JSON |
| [docs/API-SALA.md](./API-SALA.md) | API REST da sala |
| [docs/PERSISTENCIA.md](./PERSISTENCIA.md) | MariaDB e persistência |
| [docs/P2-OAUTH-MANUAL.md](./P2-OAUTH-MANUAL.md) | OAuth Google/Discord próprio |
| [docs/P2-SSE-CONVITE.md](./P2-SSE-CONVITE.md) | SSE e visitante |
| [docs/VTT-ACOES-PA-AREAS.md](./VTT-ACOES-PA-AREAS.md) | PA, áreas, turno |
| [docs/UX-MESA-E-RAIL.md](./UX-MESA-E-RAIL.md) | UX mesa e compêndio |
| [docs/PARIDADE-FOUNDRY.md](./PARIDADE-FOUNDRY.md) | Checklist vs Foundry |
| [docs/P4-WIZARD.md](./P4-WIZARD.md) | Wizard personagem |
| [docs/AUDITORIA-ELDARIN-2026-08.md](./AUDITORIA-ELDARIN-2026-08.md) | Backlog da auditoria |
| [docs/HISTORICO.md](./HISTORICO.md) | Histórico de decisões e sessões |
| [docs/fichario/00-indice-e-andamento.md](./fichario/00-indice-e-andamento.md) | Andamento atual |
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
| D11/D23 | Até 10 fichas por conta; 3 por aventura no Eldarin |
| D14 | PA jogadores: base 5, acúmulo até 5, pool máx 9: Monstros: 6 PA sem acúmulo: Miniboss/Boss: acúmulo até 8 |
| D22 | Visitante só visualiza, sem chat |
| D24–D27 | Combate por clique, PA visível, áreas padronizadas, passar turno com confirmação |
| Infra | MariaDB via `mysql2`, auth própria (cookie HMAC + OAuth + senha), Docker/GHCR na Contabo |
| Sistemas | Eldarin e Um Anel coexistem; grid quadrado para os dois |
| Modelo conta | Uma conta = pode mestrear **suas** aventuras e jogar **outras** via convite |

---

## 16. Prompt sugerido para iniciar uma sessão Claude

Copie e adapte:

```
Você trabalha no repositório Eldarin VTT (MXDRPG), Next.js 15 + TypeScript, VTT de grid quadrado.
Há dois sistemas: Eldarin v4 e Um Anel (lib/character/um-anel, lib/combat/um-anel, livros/um-anel).

Regras:
1. Leia docs/CLAUDE-PROJETO.md e siga o modelo Aventura → Mesa → Atores.
2. Livro/regras em livros/; dados gerados com npm run sync:data.
3. Mestre = ownerId da sala/aventura; não crie roles globais mestre/jogador.
4. Mutações de sala via lib/room/handlers + persistRoom; PA/combate no servidor.
5. Banco é MariaDB (mysql2). Auth é própria: cookie HMAC, OAuth Google/Discord, bcryptjs.
6. PT-BR na UI; mudanças mínimas; npm run build e npm test antes de concluir.
7. Não editar archive/web/, vinite/ como produto, nem JSON de compêndio à mão.

Tarefa: [descreva aqui]
```

---

## 17. Glossário rápido

| Termo | Significado no código |
|-------|---------------------|
| Aventura | Campanha persistente (`Adventure`) |
| Mesa / Sala | `RoomState`: sessão VTT ao vivo |
| Ator | Ficha instanciada na sala (`RoomActor`) |
| Token | Peça no mapa quadrado (`BattleToken`) |
| PA | Pontos de ação (combate Eldarin) |
| Pack | Coleção do compêndio (ex.: `monstros`) |
| Convite | `inviteCode`: liga jogador à aventura e sala |
| Revision | Versão do estado da sala para sync |
| Um Anel | Segundo sistema: ficha, motores e handlers `tor-*`, livros em `livros/um-anel/` |
| `vinite_session` | Cookie de sessão assinado com HMAC-SHA256 |

---

*Última atualização do guia: 2026-11-20: alinhado ao código atual: MariaDB via mysql2, OAuth próprio Google/Discord com cookie HMAC, Docker/GHCR na Contabo, grid quadrado, módulo Um Anel e CI com build + test.*
