# 04 — Mapa do código, Um Anel, branches e documentação

Levantamento de leitura feito em 2026-11-20 no repositório `D:\Cursor\RPG`, branch `fix/login-google-e-responsivo-um-anel` (commit `21e78a6`, árvore limpa). Nada foi alterado no repositório. Onde a informação não foi conferida no código, está marcado "não confirmado".

---

## BLOCO A — O que existe hoje no código

### A.1 Rotas de página (`app/**/page.tsx`): 39 páginas, 12 layouts

| Área | Qtde | Rotas |
|------|------|-------|
| Entrada e conta | 8 | `/entrar`, `/entrar/apelido`, `/entrar/recuperar`, `/conta`, `/conta/bem-vindo`, `/privacidade`, `/sign-in/[[...]]`, `/sign-up/[[...]]` (as duas últimas são legado: só redirecionam para `/entrar`) |
| Hub e sistemas | 6 | `/`, `/rpg`, `/rpg/eldarin`, `/rpg/um-anel`, `/eldarin`, `/sistema` |
| Mesa (VTT) | 5 | `/mesa`, `/mesas`, `/mesa/[roomId]`, `/mesa/[roomId]/configurar`, `/mesa/[roomId]/personagem/novo` |
| Aventura | 3 | `/aventura/[adventureId]`, `.../configurar`, `.../personagem/novo` |
| Personagem | 3 | `/personagem/novo`, `/personagem/[id]`, `/personagem/[id]/editar` |
| Conteúdo | 5 | `/biblioteca`, `/biblioteca/[packId]`, `/compendios`, `/compendios/[packId]`, `/mundo` |
| Painéis por papel | 5 | `/painel`, `/mestre`, `/jogador`, `/admin`, `/admin/mesas` |
| Social | 1 | `/amigos` |
| Aplicativo / download | 3 | `/aplicativo`, `/download`, `/download/guia` |

### A.2 Route Handlers (`app/api/**/route.ts`): 100 arquivos

| Área | Qtde | O que cobre |
|------|------|-------------|
| `room/[roomId]/*` | 42 | Estado da sala, cena, eventos (SSE), chat, presença, ping, settings, sync de atores; combate (ataque, habilidade, área, consumo, iniciativa, próximo turno, gm); tokens (mover, reposicionar, spawn, delegar); ferramentas do mestre; culinária. Destes, 13 são do Um Anel (`tor-*`, `tokens/place-tor-character`, `tokens/spawn-tor-adversary`) |
| `adventures/*` | 13 | CRUD de aventura, membros, pedidos de entrada, tokens de convite, pedidos de edição de ficha e de inventário |
| `auth/*` | 11 | login, logout, register, me, account, nickname, onboarding, recuperar senha, identidade de recuperação, OAuth (início e callback por provedor) |
| `friends/*` | 11 | amigos, convites, pedidos, mensagens e não lidas |
| `characters/*` | 9 | CRUD de ficha Eldarin, level-up, transferência, pedidos de edição e de inventário |
| `adventure/[id]/*` | 3 | bestiário do jogador e conhecimento de monstro |
| `admin/*` | 2 | aventuras e membros (admin) |
| `campaigns/*` | 2 | campanhas (rota antiga; uso atual não confirmado) |
| `tor-characters/*` | 2 | CRUD de ficha do Um Anel |
| outros | 5 | `health`, `compendium`, `notifications`, `bugs/report`, `users/[userId]` |

### A.3 `lib/` — 412 arquivos

| Subpasta | Arquivos | Papel |
|----------|----------|-------|
| `character/` | 82 | Regras de ficha Eldarin (classes, trilhas, loot, ids canônicos) e, em `character/um-anel/` (23), dados e regras do Um Anel |
| `vtt/` | 77 | Lógica do tabuleiro: grid, tokens, spawn, arrastar, monstros, efeitos, dados 3D |
| `room/` | 75 | Estado da sala no servidor, persistência e handlers de ação (15 handlers tocam o Um Anel) |
| `combat/` | 67 | Motor de combate Eldarin (PA, ataque, áreas) e `combat/um-anel/` (16 motores do Um Anel) |
| `auth/` | 35 | Sessão por cookie assinado, OAuth manual, permissões de sala/aventura, apelido, recuperação de senha |
| `db/` | 28 | Cliente MariaDB (`mysql2`) e repositórios por tabela |
| `adventure/` | 8 | Modelo e store de aventura |
| `bestiary/` | 6 | Bestiário e conhecimento de monstro do jogador |
| `media/` | 6 | Imagens (upload, conversão) |
| `compendium/` | 5 | Leitura dos compêndios gerados |
| `culinary/` | 5 | Culinária e assimilação |
| raiz de `lib/` | 5 | Utilitários soltos (metadata do site etc.) |
| `friends/`, `notifications/` | 2 + 2 | Amigos e notificações |
| `admin/`, `avatar/`, `bugs/`, `dice/`, `env/`, `moderation/`, `rpg/`, `ui/`, `world/` | 1 cada | Módulos de um arquivo (papel inferido pelo nome; não lidos um a um) |

### A.4 `components/` — 316 arquivos

| Subpasta | Arquivos | Papel |
|----------|----------|-------|
| `vtt/` | 146 | Mesa: campo de batalha, HUD de combate, janelas estilo Foundry, painéis do mestre, 13 painéis `Tor*` do Um Anel |
| `character/` | 63 | Ficha, wizard de criação, PDF, retrato (Eldarin e Um Anel) |
| `auth/` | 17 | Telas e formulários de login, apelido, recuperação |
| `ui/` | 14 | Componentes genéricos |
| `backgrounds/`, `friends/` | 12 + 12 | Fundos animados; amigos e chat |
| `compendium/` | 10 | Compêndio Eldarin e `TorCompendiumPage` |
| raiz | 10 | Componentes soltos |
| `adventure/` | 6 | Telas de aventura |
| `world/` | 5 | Página de mundo (inclui `TorWorldLore`) |
| `portal/`, `pwa/`, `rpg/` | 4 cada | Portal, PWA, seletor de sistema |
| `notifications/` | 3 | Sino e lista |
| `brand/` | 2 | Marca |
| `admin/`, `campaign/`, `home/`, `nav/` | 1 cada | — |

### A.5 `hooks/` — 29 arquivos

| Subpasta | Arquivos | Papel |
|----------|----------|-------|
| `vtt/` | 20 | Store da mesa (`mesa-room-store`, `useMesaRoomSlice`), canvas do grid, ponteiro, fila de FX, janelas Foundry, fluxo de turno |
| raiz | 9 | Hooks gerais do site |

### A.6 Banco de dados — o que é verdade hoje

| Pergunta | Resposta conferida no código |
|----------|------------------------------|
| Qual banco o código usa | **MariaDB/MySQL, exclusivo.** `lib/db/client.ts` só chama `getMariaSql()` de `lib/db/client-mariadb.ts`, que importa `mysql2/promise` |
| E Postgres/Neon | **Rejeitado em tempo de execução.** `lib/db/enabled.ts` devolve erro se `DATABASE_URL` começar com `postgres://` ("legado. MXDRPG usa MariaDB"); `scripts/db/migrate.mjs` aborta com "Postgres não é suportado" |
| Sem `DATABASE_URL` | App roda em memória + arquivos locais (`persistenceLabel()` devolve `"memory"`) |
| O que `npm run db:migrate` aplica | Só `scripts/db/schema.mariadb.sql` + seeds. **Nenhum script lê `scripts/db/migrations/*.sql`** (busca por `migrations/` em `.mjs/.ts/.sh/.yml` não achou consumidor) |
| Patches em runtime | `lib/db/ensure-migrations.ts` aplica alguns UPDATEs idempotentes e cria `eldarin_room_presence` se faltar |

Tabelas definidas em `scripts/db/schema.mariadb.sql` (15):

| Tabela | Conteúdo |
|--------|----------|
| `eldarin_users` | Contas, apelido, OAuth, avatar (coluna `clerk_id` ainda existe como legado) |
| `eldarin_characters` | Fichas Eldarin (JSON) |
| `um_anel_characters` | Fichas do Um Anel (JSON), tabela separada |
| `eldarin_adventures` | Aventuras, membros, `rpg_system` |
| `eldarin_rooms` | Salas: cena, atores, combate, chat, settings (JSON) |
| `eldarin_player_bestiary` | Bestiário do jogador |
| `eldarin_room_presence` | Presença na sala |
| `eldarin_sheet_edit_requests` | Pedidos de edição de ficha |
| `eldarin_user_friends`, `eldarin_friend_requests`, `eldarin_friend_messages` | Amigos, pedidos e mensagens |
| `eldarin_mesa_invites` | Convites de mesa |
| `eldarin_adventure_join_tokens`, `eldarin_adventure_join_requests` | Mesa fechada: tokens e pedidos de entrada |
| `eldarin_inventory_item_requests` | Pedidos de item de inventário |

Arquivos de migração: 19 em `scripts/db/migrations/` (001 a 019), mais `migrate-adventures.sql` e `migrate-room-settings.sql` soltos.

Pontos de atenção (fatos, sem julgamento):

| Fato | Onde |
|------|------|
| `scripts/db/schema.sql` é o schema **Postgres** antigo (cabeçalho "schema Postgres (Neon / local)", 9 ocorrências de sintaxe Postgres, só 5 tabelas) e continua versionado | `scripts/db/schema.sql` |
| `docker-compose.local.yml` monta justamente esse `schema.sql` como script de init do **MariaDB** | `docker-compose.local.yml` linha do volume `01-schema.sql`. Se o init falha ou não na prática: não confirmado (não executei) |
| Várias migrações numeradas usam sintaxe Postgres (ex.: `001` tem `ALTER COLUMN ... DROP NOT NULL`) e a primeira se chama `001_auth_clerk_nickname.sql` | `scripts/db/migrations/` |

### A.7 Autenticação — o que é verdade hoje

| Pergunta | Resposta conferida no código |
|----------|------------------------------|
| Clerk está em uso? | **Não.** Não há `@clerk/*` no `package.json` nem import de Clerk em `app/`, `lib/`, `components/`, `hooks/`, `middleware.ts`. O que sobra é o campo legado `clerkId`/`clerk_id` em tipos e na tabela de usuários, e a função `fetchUserByClerkId` |
| Como é a sessão | Cookie `vinite_session` = JSON em base64url + assinatura HMAC-SHA256 com `SESSION_SECRET` (ou `OAUTH_STATE_SECRET`); httpOnly, 7 dias. Cookie sem assinatura é recusado (`lib/auth/session.ts`) |
| Login social | OAuth manual, escrito à mão, para **Google e Discord** (`lib/auth/oauth-config.ts`, `lib/auth/oauth/providers.ts`, rotas `/api/auth/oauth/[provider]` e `/callback`) |
| Login por senha | E-mail/senha com `bcryptjs` (`/api/auth/login`, `/api/auth/register`); recuperação por CPF parcial + data de nascimento (`lib/auth/password-recover.ts`) |
| Contas demo | `DEPLOY.md` e `HISTORICO.md` citam `mestre`/`jogador` senha `123`; se estão ativas em produção: não confirmado |
| `middleware.ts` | **Não faz autenticação.** Só (1) redireciona apex <-> www para o host de `AUTH_URL` em produção e (2) grava/apaga o cookie de "assistir mesa" (`?watch=1`). A proteção de rota é feita dentro das páginas e handlers |
| `/sign-in`, `/sign-up` | Páginas-legado que redirecionam para `/entrar` |

### A.8 CI e deploy

| Item | O que faz |
|------|-----------|
| `.github/workflows/ci.yml` | Em push/PR para `main`: job `build` (`npm ci` + `npm run build`, Node 24) e job `data-sync` (só se mudar `livros/**`, geradores ou compêndios: roda `sync:data`, `sync:data:check` e falha se o JSON gerado divergir do commitado). **Não roda `npm test` nem lint** |
| `.github/workflows/build-image.yml` | Em push para `main`: constrói a imagem Docker, publica em `ghcr.io/maulxd/mxdrpg` (tags `main` e `sha-<curto>`) e chama um webhook (`workflows.psychomantys.xyz`, namespace `raul`, deployment `mxdrpg`) que reinicia o deployment com a imagem do SHA |
| `.github/workflows/release-mestre.yml` | Em tag `v*-mestre` ou release: compila o "Assistente do Mestre" (Go, `cmd/mestre`) para Windows, macOS e Linux e anexa à release |
| `Dockerfile` | `node:26-alpine3.23`, `npm ci`, `COPY . .`, `npm run build`, `npm start`. Sem multi-stage. `.dockerignore` exclui `docs/`, `.env*`, `.git*`, `node_modules/`; **não exclui `livros/`** |
| `docker-entrypoint.sh` | Aponta `.next/cache` para `/tmp` (cluster com filesystem somente leitura) |
| `docker-compose.homolog.yml` | Só MariaDB 11.4 local para testes |
| `docker-compose.local.yml` | MariaDB + app (build local) + ngrok: mestre hospedando no próprio PC |
| `docker-compose.mestre.yml` | Igual, mas com a imagem pronta do GHCR (usado pelo Assistente do Mestre) |
| `DEPLOY.md` | Produção em `www.mxdrpg.com.br`, Contabo, cluster Kubernetes (`kubectl -n raul`), MariaDB, OAuth manual. Bate com os workflows. Única sobra: a última linha ainda chama o link de `docs/P0-NEON-SETUP.md` de "Gate Postgres" |
| Vercel | Nenhum `vercel.json` versionado; `.vercel/` está no `.gitignore`. Resta só `scripts/replace-vercel-docs.mjs` |

Diferença de versão de Node: `engines` pede `>=20`, o CI usa 24, a imagem usa 26.

---

## BLOCO B — Segundo sistema "Um Anel"

### B.1 Onde vive

| Camada | Local | Volume |
|--------|-------|--------|
| Dados e regras de personagem | `lib/character/um-anel/` | 23 arquivos (~223 KB) |
| Motores de jogo | `lib/combat/um-anel/` | 16 arquivos |
| Handlers de servidor | `lib/room/handlers/tor-*.ts` | 13 arquivos |
| Rotas de API | `app/api/room/[roomId]/tor-*`, `tokens/place-tor-character`, `tokens/spawn-tor-adversary`, `app/api/tor-characters/` | 15 rotas |
| Persistência | `lib/db/um-anel-characters.ts`, tabela `um_anel_characters`, migração 019 | — |
| UI de mesa | `components/vtt/Tor*.tsx` | 13 componentes |
| UI de ficha | `components/character/sheet/TorCharacterSheetView.tsx`, `wizard/TorCharacterCreationWizard.tsx`, `TorSheetPdfDocument.tsx` | — |
| Compêndio e mundo | `components/compendium/TorCompendiumPage.tsx`, `components/world/TorWorldLore.tsx`, `/compendios?sistema=um-anel`, `/mundo?sistema=um-anel`, `/sistema?sistema=um-anel`, `/rpg/um-anel` | — |
| Livro (fonte) | `livros/um-anel/` | 30 arquivos, ~19.300 linhas |
| Dados gerados | `data/compendiums/um-anel/*.json` (gerados por `scripts/gen-um-anel.mjs`) | 7 packs, 148 entradas |
| Testes | `scripts/verify-um-anel-*.mjs` | 30 scripts, todos em `npm test` e `npm run test:um-anel` |

Quase tudo isso está **só na branch atual**. Na `main` o Um Anel tem 62 arquivos (fases 1 a 4 do PRD v1.0: ficha, wizard, compêndio, ataque tático com `resolve-attack.ts` e `vitals.ts`, 4 componentes `Tor*`). Os outros 14 motores, 9 painéis e os 17 arquivos novos de `livros/um-anel/` vieram nos 68 commits da branch.

### B.2 Estado por recurso (PRD v1.0 + v2.0, decisões D13 a D33)

| Recurso | Estado | Onde / observação |
|---------|--------|-------------------|
| Ficha: criação por wizard | pronto | `TorCharacterCreationWizard.tsx`, `build-from-wizard.ts` (já na main) |
| Ficha: visual, recursos, rolagem pela perícia | pronto | `TorCharacterSheetView.tsx`, `TorCharacterSheetPopup.tsx` |
| Ficha: retrato e token | pronto | via `/api/tor-characters/[id]` |
| Ficha: exportar PDF (D32) | parcial | `TorSheetPdfDocument.tsx` + botão existem. Se segue o layout do PDF oficial `ficha-editavel-o-um-anel.pdf`, como o PRD pede: não confirmado |
| Dados: Proeza (d12) + Sucesso (d6) | pronto | `lib/character/um-anel/dice.ts` |
| Dados 3D com Olho de Sauron e tengwa (D19) | pronto | commit `d4b95af`, `components/vtt/DiceWebGL.tsx` |
| Posturas de combate (D17, D26) | pronto | `stances.ts`, rota `tor-stance`; postura é estado do token, não posição |
| Ferimentos e severidade (D18) | pronto | `resolve-attack.ts` (grave conta dias), `vitals.ts`, rota `tor-recovery` |
| Dano Especial, Tarefas de Combate, Empurrão, engajamento | pronto | `special-damage.ts`, `combat-tasks.ts`, `push.ts`, `round-effects.ts` |
| Ódio/Resolução e Habilidades Sinistras (D20) | pronto | commit `532298b` |
| Sombra, Miséria, Acesso de Loucura (D27) | pronto | `shadow.ts`, `TorShadowPanel.tsx`, rota `tor-shadow` |
| Fadiga e Carga (D25) | pronto | `fatigue.ts`, `computeLoad` em `rules.ts`, rota `tor-fatigue` |
| Jornada: papéis, marcha, eventos, diário (D23, D24) | pronto | `journey.ts`, `TorJourneyPanel.tsx` (formulário) |
| Jornada: mapa interativo clicável (D21) | falta | O painel é só formulário; o próprio código comenta que Áreas Perigosas "não estão no mapa" |
| Conselho (D28) | pronto | `council.ts`, `TorCouncilPanel.tsx` |
| Fase de Companhia, avanço, Yule, calendário, Patrono (D29) | pronto | `progression.ts`, `session-state.ts`, `TorFellowshipPanel.tsx`, `TorAdvancePanel.tsx` |
| Olho de Mordor, Fontes de Dano, Elmo removível | pronto | `eye.ts`, `hazards.ts`, `gear-in-combat.ts` e painéis (não estavam no PRD; entraram na branch) |
| Bestiário (D20) | pronto | `adversaries.ts`, 31 entradas, auditado campo a campo (commit `2157d14`); arrastar para o mapa em `lib/vtt/tor-spawn-drag-ui.ts` |
| Gerador de Coisas Sem Nome | parcial | Tabelas em `nameless-things.ts`, aparecem só no compêndio. Geração jogável na mesa (D20): não encontrada |
| Compêndio: 10 categorias (D30) | pronto | `TorCompendiumPage.tsx` tem 11 categorias |
| Pipeline livro -> JSON (D13, D15) | parcial | `gen-um-anel.mjs` gera os 7 packs a partir de `livros/um-anel/compendio/*.md`. Os dados de personagem, bestiário, tesouro etc. continuam transcritos à mão em TypeScript |
| Tradução dos 13 capítulos (D14) | pronto | Commit `ce0436a` "13/13 capítulos em PT-BR"; `verify-um-anel-traducao-completa.mjs` no `npm test`. O apêndice do PRD ainda diz "extração bruta (não traduzida)" |
| Aventuras do Starter Set (D31) | parcial | Convertidas em texto: `livros/um-anel/14-aventuras-starter-set.md`. Sem módulo jogável na mesa |
| Tales from Wilderland (D31) | parcial | 7 de 7 aventuras convertidas para 2ª edição em `livros/um-anel/15` a `21`. Só Markdown; nenhum componente ou rota carrega aventura na mesa |
| Darkening of Mirkwood (D31) | parcial | 7 anos de 30 (`22` e `23`); faltam 2954 a 2977 |
| Leitor de capítulos no site (D33) | falta | Não existe rota que sirva `livros/um-anel/*.md`; `/biblioteca` não tem ramo para o Um Anel |
| Validação em mesa real | falta | `HISTORICO.md`: "Nada foi testado em dispositivo real nem em mesa. Toda a validação é estática" |

### B.3 Livros comerciais e traduções — fatos para a decisão de direitos autorais

| Fato | Evidência |
|------|-----------|
| O repositório no GitHub é **público** | `gh repo view` -> `visibility: PUBLIC` (`MaulXD/MXDRPG`) |
| `the one ring/` (12 PDFs + 1 PNG de capa, 83 MB) **não está versionada** | `git ls-files "the one ring"` = 0; `.gitignore` linha 42 (`/the one ring/`) cobre |
| `.tmp-traducao/` (2 arquivos: caps. 03 e 08, 244 KB) **não está versionada** | `git ls-files .tmp-traducao` = 0; `.gitignore` linha 46 cobre |
| O `.dockerignore` **não** lista essas duas pastas | Numa imagem construída no GitHub Actions elas não entram (não estão no checkout). Num `docker compose -f docker-compose.local.yml up --build` feito nesta máquina, `COPY . .` as copiaria para a imagem local |
| O texto dos livros **está versionado** em `livros/um-anel/` | Na `main`: 13 arquivos, dos quais 12 são o texto original em inglês extraído do PDF (cabeçalho "Conteúdo original em inglês — aguardando tradução"). Na branch atual: 30 arquivos, ~19.300 linhas, em PT-BR |
| É texto corrido, não resumo | Amostra do cap. 03: parágrafos de regras e a epígrafe do livro, na `main` em inglês e na branch traduzidos frase a frase |
| As aventuras de *Tales from Wilderland* e *Darkening of Mirkwood* também estão versionadas (só na branch) | `livros/um-anel/15` a `23`; o cabeçalho cita os PDFs "por Mateus Soares" (tradução de terceiro) como origem |
| A branch já foi enviada ao GitHub | `origin/fix/login-google-e-responsivo-um-anel` = `21e78a6`, igual à local |
| O `.gitignore` registra isso como decisão do dono | Comentário: "O conteúdo extraído/transcrito em livros/um-anel/*.md é versionado à parte, por decisão do usuário" |
| Os capítulos **não são servidos pelo site** | Nenhum código de `app/`, `lib/`, `components/` lê `livros/` em runtime (as menções são comentários de procedência). Mas `livros/` vai dentro da imagem Docker |
| Regras, tabelas e estatísticas **são servidas publicamente** | `/compendios?sistema=um-anel` não exige login na página; mostra dados de `lib/character/um-anel/*.ts` e `data/compendiums/um-anel/*.json` (culturas, virtudes, bestiário, tesouro, pré-gerados, jornada, sombra etc.), ambos versionados |
| Os 2 rascunhos de `.tmp-traducao/` diferem dos capítulos versionados de mesmo nome | `cmp` acusa diferença, mesmo número de linhas (1159 e 1780) |
| Capa | `public/brand/rpg/um-anel-cover.webp` é versionada e servida. Se deriva de `the one ring/capatheonering.png`: não confirmado |
| O próprio PRD registra o risco | D33: leitor de capítulos público "é redistribuição" e foi rebaixado a acesso restrito (que ainda não foi construído) |

---

## BLOCO C — Branches e documentação

### C.1 Branches

`main` local e `origin/main` estão iguais (`be69f6f`, 2026-07-31). `gh` está autenticado como MaulXD.

| Branch | Último commit | À frente / atrás da main | O que traz | Incorporada? |
|--------|---------------|--------------------------|------------|--------------|
| `main` | `be69f6f` 2026-07-31 — cookie de sessão assinado e apelido genérico | — | Linha principal, 459 commits | — |
| `fix/login-google-e-responsivo-um-anel` (local = remota) | `21e78a6` 2026-08-13 — registra três bugs de mesa | **68 à frente, 0 atrás** | Ver C.2 | **Não. Sem PR aberto** |
| `fix/mesa-performance-delays` (local = remota) | `ddd42a1` 2026-06-26 — timings dos dados | 0 à frente, 61 atrás | Ajustes de latência/tempo dos dados | Sim (é ancestral da main). O PR #4 consta como FECHADO, não mesclado: o conteúdo entrou por outro caminho |
| `cursor/dice-box-combat` (local) | `cccda62` 2026-06-21 | 0 à frente, 98 atrás | Dados 3D dice-box no combate | Sim (PR #3 MERGED) |
| `cursor/gm-tools-tab-icons` (local) | `39b175d` 2026-06-20 | 0 à frente, 130 atrás | Ícones nas abas do menu do mestre | Sim (ancestral da main; sem PR próprio) |
| `cursor/mesa-turn-hud-portraits` (local) | `1094d42` 2026-06-08 | 0 à frente, 350 atrás | HUD de turno com retratos, chips na ficha | Sim (PR #2 MERGED) |
| `origin/cursor/dice-box-combat` | `d20ee50` 2026-06-21 | 361 à frente, 459 atrás (sem ancestral comum) | Mesmo conteúdo da local (árvore idêntica) | Conteúdo sim; ver nota |
| `origin/cursor/gm-tools-tab-icons` | `6a63dc5` 2026-06-20 | 329 à frente, 459 atrás (sem ancestral comum) | Idem | Conteúdo sim; ver nota |
| `origin/cursor/mesa-turn-hud-portraits` | `02c88bc` 2026-06-08 | 109 à frente, 459 atrás (sem ancestral comum) | Idem | Conteúdo sim; ver nota |
| `origin/feature/build` (só remota) | `3cbfc9e` 2026-06-04 — "New build for docker" (Psycho Mantys) | 11 à frente, 448 atrás | Dockerfile e build de imagem | Sim: PR #1 MERGED e `git cherry` marca os 11 commits como já presentes na main por conteúdo |

Nota sobre as três `origin/cursor/*`: elas não têm nenhum commit em comum com a `main` atual, mas apontam para árvores de arquivos idênticas às das branches locais de mesmo nome, que são ancestrais da main. Ou seja, o histórico da main foi reescrito em algum momento e essas três referências remotas guardam o histórico antigo. Não há trabalho perdido nelas. O motivo da reescrita: não confirmado.

Pull requests (`gh pr list --state all`): #1 feature/build MERGED (2026-06-04), #2 mesa-turn-hud-portraits MERGED (06-07), #3 dice-box-combat MERGED (06-21), #4 mesa-performance-delays CLOSED (06-25). **Nenhum PR aberto.**

### C.2 O que a branch atual tem que a main não tem

68 commits, de 2026-08-04 a 2026-08-13; 233 arquivos, +49.308 / -5.396 linhas.

| Grupo | Commits | Conteúdo |
|-------|---------|----------|
| Login e responsivo (o nome da branch) | 2 | `e705994` sessão do Google caía por revalidar no banco a cada requisição; `8d971dc` escala única de breakpoints PC/tablet/celular |
| Um Anel — motores e mesa | ~40 | Pipeline de compêndio, posturas, Sombra, Jornada, Conselho, Fase de Companhia, progressão, Ódio, Dano Especial, Tarefas de Combate, Empurrão, Esperança, Apoio, Malfeitoria, engajamento, descanso, Fadiga, Fontes de Dano, Olho de Mordor, Elmo, dados 3D, PDF da ficha, correções de regra |
| Um Anel — livros | ~16 | Tradução dos 13 capítulos, Starter Set, 7 aventuras de Wilderland, 2 blocos de Mirkwood, tabela de conversão da 1ª edição |
| Eldarin — correções | 5 | Política de privacidade que não ia ao ar e nome real vazando (`b238e22`); `/personagem` caindo em 404 após login (`4804a7f`); texto de mantenedor na UI e compêndio (`8600304`); personagem criado na mesa não aparecia sem recarregar (`152d6d3`) |
| Documentação | 2 | `docs/AUDITORIA-ELDARIN-2026-08.md` e registro dos três bugs de mesa |

Como o deploy só dispara em push na `main`, nada disso está em produção: a produção roda o commit de 2026-07-31. O CI também não rodou nesta branch (só roda em push/PR para `main`).

### C.3 Documentos — 41 em `docs/` + 6 na raiz

Situação avaliada contra o código da branch atual. Para os documentos marcados com (*) só o cabeçalho e as menções de stack foram lidos; o corpo não foi conferido linha a linha.

| Documento | Assunto | Última alteração | Situação | Motivo |
|-----------|---------|------------------|----------|--------|
| `AGENTS.md` | Ponteiro para o guia de agentes | 2026-06-04 | atual | Só remete ao guia; mas o guia apontado está desatualizado e ele não cita o Um Anel |
| `README.md` | Visão geral e comandos | 2026-06-22 | desatualizado | Stack correta (Docker, Contabo, MariaDB), mas descreve só o Eldarin |
| `DEPLOY.md` | Pipeline de deploy | 2026-06-19 | atual | Bate com workflows e código; sobra só o rótulo "Gate Postgres" na última linha |
| `PRODUTO.md` | O que é o produto | 2026-06-17 | contradiz o código | Diz "Postgres opcional" e "Auth: demo cookie hoje"; código é MariaDB e OAuth + senha |
| `ESTRUTURA-PROJETOS.md` | Mapa de pastas | 2026-06-17 | contradiz o código | Última linha: "Auth atual: Clerk + demo. Persistência: Postgres" |
| `FICHA_PERSONAGEM_ELDARIN_v4.md` | Layout da ficha Eldarin | 2026-06-14 | não confirmado (*) | Não comparado com a ficha atual |
| `docs/CLAUDE-PROJETO.md` | Guia principal para agentes | 2026-07-24 | contradiz o código | 16 menções a Clerk e 10 a Postgres/Neon; cita `lib/auth/clerk-*.ts` (não existe), `getSession` "Clerk primeiro", link para `P1-CLERK-SETUP.md` e `REFATORACAO.md` (não existem); rodapé "última atualização 2026-06-02"; zero menção ao Um Anel |
| `docs/CLAUDE-CODIGO-SEGURO.md` | Checklist para editar sem quebrar | 2026-07-24 | desatualizado (*) | Manda ler o guia acima; ainda cita Clerk e Postgres; não cobre o Um Anel |
| `docs/HISTORICO.md` | Log de sessões (6.699 linhas) | 2026-08-13 | atual | É a fonte mais fiel (declara MariaDB, OAuth "sem Clerk", Contabo). Um resíduo: a tabela de estado diz que Eldarin é o "único sistema ativo" |
| `docs/PRD-ELDARIN-VTT.md` | PRD do Eldarin v2.3 | 2026-06-18 | contradiz o código | Cabeçalho diz Contabo, mas o corpo recomenda "Vercel + Clerk", lista stack "Vercel, Neon Postgres", Vercel Blob e Vercel Analytics (12 menções a Vercel, 25 a Neon/Postgres) |
| `docs/PRD-MESA-UM-ANEL.md` | PRD do Um Anel v1.0 + v2.0 | 2026-08-04 | desatualizado | Parou em 08-04: marca tradução (fase B), ficha/PDF (I) e aventuras (J) como pendentes e diz que Jornada, Conselho e Progressão "faltam UI", tudo já entregue na branch; a seção v1.0 ainda lista posturas e jornada como "não implementado" e fala em "mapa hex" (a própria v2.0 corrige) |
| `docs/AUDITORIA-ELDARIN-2026-08.md` | Backlog priorizado da auditoria de 08-08 | 2026-08-13 | atual (*) | Mais recente; 64 achados, 54 abertos segundo o próprio texto |
| `docs/PRIVACIDADE-LGPD.md` | Texto de referência da política | 2026-08-08 | atual | Avisa que o que vai ao ar é `app/privacidade/conteudo.tsx` (duplicado intencional) |
| `docs/DESIGN-ATUAL.md` | Sistema visual "v3" | 2026-08-04 | não confirmado (*) | Título diz v3 mas remete à v4; alterado na branch pelo refactor de responsivo |
| `docs/DESIGN-ELDARIN-V4.md` | Molduras, HUD, chips v4 | 2026-06-07 | não confirmado (*) | Complemento do anterior; não comparado com o CSS |
| `docs/DESIGN-ELDARIN-V5-CORES.md` | Paleta v5 | 2026-06-17 | não confirmado (*) | Se os tokens foram aplicados em `globals.css`: não conferido |
| `docs/REDESIGN-2026.md` | Brief de redesign | 2026-06-20 | não confirmado (*) | Brief; quanto foi executado não foi conferido |
| `docs/COMBATE-MESA.md` | Guia técnico do combate Eldarin | 2026-07-24 | não confirmado (*) | Gerado por varredura do código em julho; não reconferido |
| `docs/PRD-COMBATE-MESA-REFACTOR.md` | PRD da refatoração de combate | 2026-06-18 | não confirmado (*) | Documento de intenção; o guia acima é o estado real |
| `docs/VTT-ACOES-PA-AREAS.md` | Spec de PA, movimento e áreas | 2026-06-18 | não confirmado (*) | — |
| `docs/GRID-MIGRATION.md` | Migração de hex para grid quadrado | 2026-06-17 | atual | Código confirma: sem hex em `lib/vtt`; sobram só os scripts `purge-hex-*.mjs` |
| `docs/PERSISTENCIA.md` | Como persistir | 2026-07-24 | atual | MariaDB, `mysql://`; bate com `lib/db/` |
| `docs/POSTGRES.md` | Setup de banco | 2026-07-24 | duplicado de outro | O conteúdo é sobre MariaDB e diz que Postgres não é suportado; o nome do arquivo engana e ele repete `PERSISTENCIA.md` |
| `docs/P0-NEON-SETUP.md` | Gate P0 de banco | 2026-07-24 | contradiz o código | Manda criar projeto no Neon e copiar URL `postgresql://`, que o código recusa; no mesmo arquivo o objetivo é `persistence: "mariadb"` |
| `docs/A1-NEON-SMOKE.md` | Gate A1 de persistência | 2026-07-24 | contradiz o código | Checklist pede connection string Neon; cita Clerk como próximo passo e link morto |
| `docs/P9-READY.md` | Gate pré-beta | 2026-06-18 | contradiz o código | Fala em "Neon/postgres" como passo futuro e em Clerk |
| `docs/BETA-P9-CHECKLIST.md` | Checklist de sessão beta | 2026-06-17 | não confirmado (*) | Formulário em branco |
| `docs/HOMOLOG.md` | Ambiente local com MariaDB | 2026-07-24 | atual | Bate com `docker-compose.homolog.yml` e scripts `homolog:*` |
| `docs/HOSTING-LOCAL.md` | Mestre hospedando no PC | 2026-06-27 | não confirmado | `scripts/local/setup.*` existem; mas o compose usado monta o `schema.sql` de Postgres no MariaDB (ver A.6) |
| `docs/INFRA-BR-AVALIACAO.md` | Avaliação de infra no Brasil | 2026-06-21 | atual (*) | Descreve Contabo + Docker + MariaDB |
| `docs/MESA-ARQUITETURA.md` | Arquitetura de sync | 2026-06-21 | atual (*) | Arquivos citados (`mesa-room-store.ts`, `useMesaRoomSlice.ts`) existem |
| `docs/MESA-SYNC-INCREMENTAL.md` | Sync incremental | 2026-06-21 | não confirmado (*) | — |
| `docs/MESA-LATENCIA-FASES.md` | Plano de latência | 2026-06-21 | não confirmado (*) | — |
| `docs/API-SALA.md` | API da sala | 2026-07-24 | contradiz o código | "Salas persistem em Postgres"; cobre poucas das 42 rotas de sala e nenhuma `tor-*` |
| `docs/P2-OAUTH-MANUAL.md` | OAuth Google/Discord | 2026-06-19 | atual | "Caminho oficial, sem Clerk"; bate com `lib/auth/oauth*` |
| `docs/P2-SSE-CONVITE.md` | SSE, convite, visitante | 2026-06-04 | não confirmado (*) | — |
| `docs/P4-WIZARD.md` | Wizard de personagem | 2026-06-04 | não confirmado (*) | — |
| `docs/P5-COMBAT-UX.md` | UX de combate | 2026-06-17 | não confirmado (*) | — |
| `docs/P6-BESTIARIO.md` | Bestiário spawnável | 2026-06-17 | não confirmado (*) | — |
| `docs/P8-PILOTO-TOKEN.md` | Controle de token | 2026-07-24 | não confirmado (*) | — |
| `docs/P9-INVENTARIO-5-PASSOS.md` | Inventário e consumíveis | 2026-06-17 | não confirmado (*) | Uma menção a Clerk |
| `docs/CULINARIA-VTT.md` | Culinária e assimilação | 2026-06-11 | não confirmado (*) | — |
| `docs/DADOS-E-REGRAS.md` | Pipeline livros -> dados | 2026-06-04 | desatualizado | Não cita `gen-um-anel.mjs`, que já faz parte de `sync:data`; link morto para `REFATORACAO.md` |
| `docs/ELDARIN-SITE-JOGAVEL.md` | Roteiro técnico do VTT | 2026-06-17 | contradiz o código | Propõe "Neon Postgres ou Vercel KV" como store; link morto para `REFATORACAO.md` |
| `docs/CONTEXTO-SESSAO-ATUAL.md` | Contexto para retomar sessão | 2026-06-20 | desatualizado | Diz que a branch ativa é `cursor/dice-box-combat` com PR #3 aberto; o PR foi mesclado em 06-21 |
| `docs/PARIDADE-FOUNDRY.md` | Checklist de paridade com Foundry | 2026-06-17 | não confirmado (*) | — |
| `docs/UX-MESA-E-RAIL.md` | UX do rail da mesa | 2026-06-17 | não confirmado (*) | — |

### C.4 Contradições concretas entre documentação e código

| Tema | O que a documentação diz | O que o código faz | Onde está o erro |
|------|--------------------------|--------------------|------------------|
| Autenticação | "Auth produção: Clerk (`@clerk/nextjs`)"; `getSession` usa "Clerk primeiro"; existe `lib/auth/clerk-*.ts` | Sem dependência nem import de Clerk; cookie HMAC próprio + OAuth manual Google/Discord + senha | `docs/CLAUDE-PROJETO.md`, `ESTRUTURA-PROJETOS.md`, `docs/PRD-ELDARIN-VTT.md`, `docs/A1-NEON-SMOKE.md`, `docs/P9-READY.md` |
| Banco | Neon Postgres, URL `postgresql://`, "Postgres client" em `lib/db/` | MariaDB via `mysql2`; URL Postgres é recusada com mensagem de erro | `docs/CLAUDE-PROJETO.md`, `PRODUTO.md`, `ESTRUTURA-PROJETOS.md`, `docs/P0-NEON-SETUP.md`, `docs/A1-NEON-SMOKE.md`, `docs/API-SALA.md`, `docs/PRD-ELDARIN-VTT.md` |
| Banco (dentro do código) | — | `scripts/db/schema.sql` (Postgres) ainda versionado e montado no MariaDB por `docker-compose.local.yml`; 19 migrações numeradas que nenhum script aplica | `scripts/db/`, `docker-compose.local.yml` |
| Hospedagem | Stack "Vercel, Neon"; Vercel Blob, Vercel Analytics, "Vercel Fluid Compute" | Docker -> GHCR -> webhook -> Kubernetes na Contabo; sem `vercel.json` | `docs/PRD-ELDARIN-VTT.md` (corpo), `docs/ELDARIN-SITE-JOGAVEL.md` |
| Mapa | "mapa hex/grid", "mapa hex existente" | Grid quadrado; hex foi removido (`docs/GRID-MIGRATION.md`) | `docs/PRD-MESA-UM-ANEL.md` D1 e US-6.4 (corrigido pela nota da v2.0), entradas antigas do `HISTORICO.md` |
| Middleware | "Auth Clerk: `middleware.ts`" | O middleware não autentica; só host canônico e cookie de assistir mesa | `docs/CLAUDE-PROJETO.md` |
| Sistemas do hub | Guia, README e AGENTS descrevem só o Eldarin; `HISTORICO.md` diz "único sistema ativo" | Há um segundo sistema completo (Um Anel) com tabela, rotas e UI próprias | `AGENTS.md`, `README.md`, `docs/CLAUDE-PROJETO.md`, `docs/HISTORICO.md` (tabela de estado) |
| Estado do Um Anel | Posturas, Jornada, Conselho "não implementado"; tradução pendente; "extração bruta (não traduzida)" | Tudo implementado e traduzido na branch | `docs/PRD-MESA-UM-ANEL.md` |
| Links mortos | `docs/P1-CLERK-SETUP.md`, `REFATORACAO.md` | Arquivos não existem | `docs/CLAUDE-PROJETO.md`, `docs/A1-NEON-SMOKE.md`, `docs/P0-NEON-SETUP.md`, `docs/DADOS-E-REGRAS.md`, `docs/ELDARIN-SITE-JOGAVEL.md` |
| Testes no CI | `HISTORICO.md` cita "3007 asserções verdes" | O CI não executa `npm test`; a contagem vem de execução local e não foi reexecutada neste levantamento | `.github/workflows/ci.yml` |

Observação para quem usa agentes de IA no projeto: o `AGENTS.md` manda ler `docs/CLAUDE-PROJETO.md` antes de qualquer implementação, e esse é justamente o documento com mais contradições (Clerk, Postgres, arquivos que não existem). O `HISTORICO.md` e o `DEPLOY.md` são hoje as referências que batem com o código.
