# Histórico de sessões — Eldarin VTT (MXDRPG)

Documento vivo. **Atualizado a cada sessão de trabalho** (Cursor / Claude).  
Serve como continuidade de contexto caso o chat seja perdido.

Referências completas: [CLAUDE-PROJETO.md](./CLAUDE-PROJETO.md) · [CLAUDE-CODIGO-SEGURO.md](./CLAUDE-CODIGO-SEGURO.md)

---

## Padrão obrigatório — toda sessão

Ao concluir (ou pausar) um bloco de trabalho, **sempre** acrescentar uma entrada no [Log de sessões](#log-de-sessões) abaixo.

### Formato da entrada

```markdown
### AAAA-MM-DD — Título curto do que foi feito

**Pedido:** o que o usuário pediu (1–2 frases).

**Passo a passo:**
1. Diagnóstico — o que estava errado ou faltando
2. Decisão — abordagem escolhida e por quê
3. Implementação — mudanças concretas (rotas, libs, env, deploy…)
4. Validação — build, smoke, o que conferir em produção

**Arquivos tocados:**
- `caminho/arquivo.ts` — o que mudou em uma linha

**Commits / deploy:** hash ou “pendente local” (push só quando o usuário pedir).

**Como testar:** comandos ou URLs.
```

### Checklist rápido

- [ ] Entrada nova com data de hoje
- [ ] Passo a passo numerado (não só lista de arquivos)
- [ ] Tabela **Estado atual** atualizada se mudou auth, URL, deploy ou DB
- [ ] `npm run build` mencionado se houve alteração em `.ts` / `.tsx`

---

## Estado atual do produto

| Item | Status |
|------|--------|
| **URL produção** | https://www.mxdrpg.com.br |
| **Hosting** | Contabo — Docker + GHCR (`Dockerfile` + `docker-entrypoint.sh`) |
| **Branch principal** | `main` |
| **Marca / hub** | **MXDRPG** — landing e pós-login em `/mesas`; Eldarin é um RPG em `/rpg/eldarin` |
| **Auth** | OAuth nativo Google/Discord em `/entrar` (principal); Clerk opcional; demo `mestre`/`jogador` senha `123` |
| **DB** | MariaDB (`DATABASE_URL=mysql://…`) — em produção: SSL self-signed exige `MARIADB_SSL_REJECT_UNAUTHORIZED=0` ou `?sslaccept=accept_invalid_certs` |
| **Stack** | Next.js 15, React 19, TypeScript strict |
| **Rotas canônicas** | Login `/entrar` · Onboarding `/conta/bem-vindo` · Hub `/mesas` · Eldarin `/rpg/eldarin` |

---

## Resumo de funcionamento (para retomar sem contexto)

### Hierarquia de domínio

```
Aventura (campanha persistente)
  └── Mesa / Sala (RoomState — VTT ao vivo)
        └── Atores (fichas instanciadas na sala)
```

- **Mestre** = `ownerId` da aventura/sala — sem role global mestre/jogador.
- **Jogador** entra via `inviteCode`; passa a integrar `memberIds` para sempre (nunca removido).
- **Demo** = `roomId === "demo"`, sempre em memória, regras especiais — não misturar com salas reais.

### Regras de ouro (nunca violar)

1. PA/combate calculado **só no servidor** (`lib/combat/` + handlers) — cliente faz preview apenas.
2. Mutações de sala **só via** `lib/room/handlers/` + `persistRoom` — nunca mutar `room` direto na route.
3. `memberIds` **só cresce** — jogador nunca é removido da aventura.
4. `data/compendiums/*.json` são **gerados** — editar `livros/` e rodar `npm run sync:data`.
5. **Nunca** `title` nativo em HTML — usar `data-site-tip` / `.site-tooltip`.
6. Commit/push **só quando o usuário pedir**.

### Zonas de risco

| Zona | Arquivos | Regra |
|------|----------|-------|
| Vermelho | `lib/combat/`, `pa-*.ts`, `lib/auth/`, `middleware.ts`, `scripts/db/` | Não tocar sem pedido explícito |
| Amarelo | `MesaWorkspace.tsx`, `Battlefield.tsx`, `lib/adventure/`, `lib/room/settings.ts` | Ler vizinhos antes |
| Verde | `app/**/page.tsx`, `components/home/`, `docs/`, CSS de página | Relativamente seguro |

### Validação obrigatória

```bash
npm run build                 # sempre após TS/TSX
npm run lint                  # alterações em vários arquivos
npm run test                  # PA, movimento, grid
npm run sync:data:check       # após editar livros/
```

---

## Log de sessões

<!-- Ver "Padrão obrigatório" no topo: Pedido → Passo a passo → Arquivos → Commits → Como testar -->

---

### 2026-06-18 — Leitura inicial e criação do histórico

**Pedido:** estudar o documento completo do projeto e criar histórico vivo.

**O que foi feito:**
- Leitura completa de `docs/CLAUDE-PROJETO.md` e `docs/CLAUDE-CODIGO-SEGURO.md`.
- Criação deste arquivo `docs/HISTORICO.md`.

**Arquivos tocados:**
- `docs/HISTORICO.md` (criado)

**Nada alterado no código.**

---

### 2026-06-18 — Correção das regras de PA

**Pedido:** correção das regras de PA que estavam erradas na documentação.

**Regra correta:**
- Base: **5 PA/turno**
- Acúmulo: pode salvar até **5 PA** não usados entre turnos
- Pool total máxima: **9 PA** (não 11)
- Atordoado: zera o acúmulo

**Arquivos corrigidos:**
- `docs/CLAUDE-PROJETO.md` — seção 8 (PA) e seção 15 (D14)

**Nada alterado no código.**

---

### 2026-06-18 — Regras de PA por tipo de criatura

**Pedido:** complemento das regras de PA para monstros, minibosses e bosses.

**Regras adicionadas:**
- **Monstros:** 6 PA/turno, não acumulam entre turnos
- **Minibosses / Bosses:** acumulam PA até o máximo de **8 PA**

**Arquivos corrigidos:**
- `docs/CLAUDE-PROJETO.md` — seção 8 (PA) e seção 15 (D14)

**Nada alterado no código.**

---

### 2026-06-18 — Planejamento: refatoração do combate na mesa

**Pedido:** refatorar o sistema de combate da mesa VTT.

**Status:** PRD aprovado (`docs/PRD-COMBATE-MESA-REFACTOR.md`, decisões R1–R30). Implementação a iniciar.

**Regras completas de PA (consolidadas):**

| Quem | PA base/turno | Acúmulo | Pool máx |
|------|--------------|---------|---------|
| Jogador | +5/turno | até 5 PA | **9** (11 c/ talento Lobo Solitário) |
| Monstro | 6/turno | **não acumula** | 6 |
| Miniboss / Boss | — | sim | **8** |

**Custo de ações:**
| Ação | Custo |
|------|-------|
| Ataque básico | 2 PA |
| Ataque Extra (Guerreiro 5+) | 2 PA/golpe |
| Estribilho (magia nv.0) | 1 PA, máx 2 iguais/turno |
| Ação rápida (ex-bônus) | 1 PA |
| Segundo Fôlego | 1 PA, 1×/combate |
| Ajudar / Evadir / Disparada | 1 PA cada |
| Reação | 1 PA (débito se pool vazio → recupera 4 no próximo turno) |
| Movimento (1 bloco) | 1 PA → 6 m (4 células) |
| Correr | 2 PA → 12 m (8 células) |
| Magia / Habilidade | variável por compêndio |
| Falar / Olhar | **gratuito** |

**Fora de combate:** movimento livre, magias sem PA.

**Épicos P0 (prioridade máxima):**
- E1: PA v4 + Estribilho + ação rápida
- E2: Modo combate/exploração (GM toggle, `room.mode`)
- E3: Iniciativa (1d20+DES), d100 empate, entrada tardia, reações v1, débito PA
- E4: Morte (0 HP → inconsciente, 10 rodadas → morto), XP configurável, friendly fire confirm

**Já implementado (P5):** formas de área (burst/wall/cone/line/cube), action-preview, BattlefieldActionHud, highlights.

**Referências:** `docs/PRD-COMBATE-MESA-REFACTOR.md` · `docs/VTT-ACOES-PA-AREAS.md` · `docs/P5-COMBAT-UX.md`

---

### 2026-06-18 — Correção: grid do mapa é quadrado, não hexagonal

**Pedido:** confirmação de que o mapa usa grid quadrado.

**Regra:** grid **quadrado**, 1 célula = 1,5 m (já no PRD R28). Memória do projeto estava errada ("hexagonal").

**Arquivos corrigidos:**
- `memory/project_eldarin_vtt.md` — removida menção a "hex canvas" e "Grid hexagonal"

---

### 2026-06-18 — Correção: movimentação 6m/12m e confirmação grid quadrado (sem hex)

**Pedido:** remover toda referência a "hex", ajustar caminhada para 6m e corrida para 12m.

**Resultado do grep:** código já estava limpo (scripts de purge-hex já tinham sido rodados). Hex só aparecia em docs/HISTORICO.md (entradas de histórico — esperado) e PDFs intocáveis.

**Movimentação corrigida:**
- Caminhada: 1 PA → **6 m** (4 células) — era 9m
- Corrida: 2 PA → **12 m** (8 células) — era 18m
- 1 célula = 1,5 m (inalterado)

**Arquivos tocados:**
- `lib/vtt/movement.ts` — `BASE_MOVEMENT_METERS` 9 → 6; default `movementRunMax` 6 → 8 células; comentário corrigido
- `docs/HISTORICO.md` — tabela de movimentação
- `docs/CLAUDE-PROJETO.md` — seção PA e movimentação

**Como testar:** `npm run build` + `/mesa/demo` → mover token e verificar alcance.

---

### 2026-06-18 — Diagnóstico: estado atual do VTT (testes com Playwright)

**Pedido:** rodar o app, fazer testes e reportar resultados.

**Ambiente:** dev local sem DB (Neon ETIMEDOUT), sem Clerk keys — auth por cookie demo.

**Performance (dev mode):**
| Página | Status | Tempo |
|--------|--------|-------|
| Landing `/` | 200 ✅ | ~630ms |
| Mesa Demo `/mesa/demo` | 200 ✅ | ~630ms |
| Biblioteca `/biblioteca` | 200 ✅ | ~4.4s ⚠️ (compêndio pesado) |
| Painel `/painel` | redirect → /entrar | esperado sem auth |

**Testes unitários:** todos passando (31 testes sheet-pdf + 24 consumíveis + compêndios OK + 83 monstros spawnáveis).

**Problemas encontrados:**
1. `room.mode = undefined` — campo não existe no estado da sala (Epic E2 não implementado)
2. `tokens = 0` — atores demo existem (4 PCs) mas nenhum está posicionado no mapa
3. `paState = {}` — PA não inicializado nos atores
4. `character = {}` — dados de ficha não mesclados no ator demo (HP, atributos ausentes)
5. 13 erros 401 — Clerk chamadas falhando (esperado sem keys, mas polui console)
6. Sem mapa na demo — `mapImageUrl` vazio, grid vazio cinza

**APIs de combate (caminhos corretos):**
- `POST /api/room/[id]/combat/roll-initiative` — 401 (precisa ser GM)
- `POST /api/room/[id]/combat/next-turn` — 403 (precisa de auth)
- `POST /api/room/[id]/combat/gm` — 400 (endpoint existe, parâmetro errado)
- `POST /api/room/[id]/combat/attack` — existe ✅
- `POST /api/room/[id]/combat/ability` — existe ✅
- `POST /api/room/[id]/combat/area` — existe ✅

**Nada alterado no código nesta sessão.**

---

### 2026-06-18 — Decisões de UX da mesa (respostas do usuário)

**Decisões confirmadas:**
- Tokens não precisam de posição padrão na demo, mas posições devem ser **salvas e sincronizadas em tempo real** entre jogadores e mestre
- Sem mapa na demo por enquanto
- Pill "Aventura/Combate" só visível para o **mestre** — jogadores não veem o toggle
- Action ring **já existe** (clique direito no token da vez)
- **Clique esquerdo** no token deve abrir o action ring no **modo máximo** (não o menu de contexto)

---

### 2026-06-18 — Fix: clique esquerdo no token abre action ring

**Pedido:** clicar num token deve abrir o action ring no modo máximo (antes só abria no clique direito).

**O que mudou:**
- `hooks/vtt/useBattlefieldPointer.ts` — no handler `onPointerUp`, após selecionar o token via clique esquerdo, agora chama `onActionRingRequest` se o token puder abrir o ring (mesma lógica do clique direito / `onContextMenu`)
- Adicionado `canOpenActionRing`, `onActionRingRequest`, `onActionRingBlocked`, `tokenScreenCenter` às dependências do `useCallback`

**Regra:**
- Clique esquerdo em token → seleciona + abre action ring
- Clique direito em token → continua abrindo normalmente (onContextMenu)
- Em modo ataque/área → comportamento original preservado

**Validação:** `npm run build` ✅ (compiled in 23.9s, 0 errors)

**Como testar:** `/mesa/demo` → colocar um token no mapa → clicar nele com botão esquerdo → action ring deve aparecer centralizado no token.

---

### 2026-06-18 — Estudo de docs/COMBATE-MESA.md + correção MONSTER_PA_BOSS

**Pedido:** estudar `docs/COMBATE-MESA.md` (guia técnico completo do combate).

**O que aprendi (não estava na memória):**
- Três fases de PA: `exploration` (sem débito) → `combat_free` → `combat_turn`
- `room.mode` não é campo direto — fase é derivada de `settings.combatActive` + `combat.order`
- Auto-pass: 500ms no código vs 1,5s no PRD (lacuna conhecida)
- Reações v1: débito de PA existe no código mas **sem triggers** nas rotas ainda
- Entrada tardia: spawn entra na ordem imediatamente (não no fim da rodada como PRD diz)

**Correção feita:**
- `lib/combat/pa-economy.ts`: `MONSTER_PA_BOSS` 9 → **8** (alinhado com regra do usuário)

**Lacunas conhecidas (sem implementação):**
- Reações v1 (oportunidade, Escudo, Contramágica) — triggers ausentes nas rotas
- Entrada tardia na iniciativa (R20)
- Delay auto-pass 500ms ≠ 1,5s do PRD
- Surpresa — não implementada

**Arquivos tocados:**
- `lib/combat/pa-economy.ts` — `MONSTER_PA_BOSS` 9 → 8
- `docs/CLAUDE-PROJETO.md` — seção PA atualizada com fases e boss

**Validação:** `npm run build` ✅

---

### 2026-06-18 — Alinhamento docs + updates Claude (PA boss, movimento, mesa)

**Pedido:** alinhar `HISTORICO.md` e `COMBATE-MESA.md` com o código; commitar updates pendentes.

**O que mudou:**
- `docs/HISTORICO.md` — DB → MariaDB; ataque básico = 2 PA (código)
- `docs/COMBATE-MESA.md` — miniboss/boss: **8 PA** (`MONSTER_PA_BOSS`)
- Updates Claude já no working tree: clique esquerdo → action ring, movimento 6m/12m, `MONSTER_PA_BOSS=8`, guard Postgres no client MariaDB

**Arquivos no commit:**
- `docs/CLAUDE-PROJETO.md`, `docs/COMBATE-MESA.md`, `docs/HISTORICO.md`
- `hooks/vtt/useBattlefieldPointer.ts`
- `lib/combat/pa-economy.ts`, `lib/combat/combat-pa-engine.ts`
- `lib/vtt/movement.ts`, `lib/db/client-mariadb.ts`
- `scripts/install-wsl.ps1`

**Como testar:** `npm run build` · `/mesa/demo` → clique esquerdo no token abre action ring · `/api/health` → `persistence: mariadb` com `DATABASE_URL` mysql

---

### 2026-06-19 — Login quebrado com MariaDB inacessível

**Pedido:** login não funcionava em produção.

**Passo a passo:**
1. **Diagnóstico** — com `DATABASE_URL` definida mas MariaDB fora/SSL inválido, `resolveUserForLogin` só consultava o DB e não caía no registry demo (`mestre`/`jogador`).
2. **Decisão** — manter DB como fonte principal, mas **fallback** para registry local quando a query falha ou retorna vazio.
3. **Implementação** — `fetchUserByLogin` aceita apelido; helper `dbSqlReady()` (`lib/db/sql-ready.ts`) para saber se SQL está utilizável; fluxo de login com fallback explícito.
4. **Validação** — login demo e e-mail quando DB degradado.

**Arquivos tocados:**
- `lib/auth/user-store.ts`, `lib/db/sql-ready.ts`

**Commits:** `c9be247` (login fallback)

**Como testar:** sem DB → `/entrar` com `mestre`/`123`; com DB → usuário persistido.

---

### 2026-06-19 — OAuth Google/Discord em destaque + health

**Pedido:** confirmar OAuth nativo (sem Clerk) e melhorar UX/docs.

**Passo a passo:**
1. Botões Google/Discord no topo de `/entrar` (`OAuthSignInButtons`, `AuthTabs`).
2. `oauthSetupStatus()` em `/api/health` — `oauth.ready`, `oauth.missing`, flags por provedor.
3. Guia manual: `docs/P2-OAUTH-MANUAL.md` (credenciais Google Cloud, callbacks, env).

**Env necessária:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_URL`, `SESSION_SECRET`.

**Commits:** `5d33c0d`

**Como testar:** `/api/health` → `oauth.ready: true`; `/entrar` → botão Google.

---

### 2026-06-19 — Erro 500 após login (APIs + loop de rotas)

**Pedido:** site 500 depois do login Google.

**Passo a passo:**
1. **Diagnóstico** — APIs de amigos/aventuras sem try/catch quando MariaDB falha; possível loop `/eldarin` ↔ `/entrar/apelido`.
2. **Implementação** — `lib/db/safe-query.ts`; APIs degradam para listas vazias; `/eldarin` usa `dbNicknameFlowEnabled()` antes de forçar apelido.
3. **Validação** — login não derruba o app com `db: false`.

**Commits:** `521240f`

**Como testar:** login com `db: false` no health → `/mesas` carrega sem 500.

---

### 2026-06-19 — MariaDB SSL (Contabo)

**Pedido:** `db: false` em produção (`self-signed certificate in certificate chain`).

**Passo a passo:**
1. Cliente MariaDB aceita certificado self-signed via `MARIADB_SSL_REJECT_UNAUTHORIZED=0` ou `?sslaccept=accept_invalid_certs` na URL.
2. Health usa ping real para `persistentAccounts`.

**Commits:** `af674b7`

**Pendente no servidor:** setar env SSL + `npm run db:migrate` no container.

**Como testar:** `/api/health` → `db: true`, `persistentAccounts: true`.

---

### 2026-06-19 — Eldarin deixa de ser “o site” → hub MXDRPG

**Pedido:** Eldarin é RPG dentro do hub, não nome do site.

**Passo a passo:**
1. Mesas Eldarin: **`/rpg/eldarin`** (antes `/eldarin`).
2. Pós-login padrão: **`/mesas`** (hub de RPGs).
3. `/eldarin` legado → redirect para `/rpg/eldarin`.
4. Constantes em `lib/rpg/systems.ts`: `MESAS_HUB_PATH`, `ELDARIN_MESAS_PATH`, `rpgMesasPath()`.
5. `DEFAULT_POST_AUTH_PATH = /mesas` em `lib/auth/post-auth-redirect.ts`.

**Commits:** `ad76c51`

**Como testar:** login → `/mesas` → card Eldarin → `/rpg/eldarin`.

---

### 2026-06-19 — Ajuste de links do site

**Pedido:** unificar links para rotas canônicas do hub.

**Passo a passo:**
1. Criado `lib/site-paths.ts` — `ENTRAR_PATH`, re-export de paths do hub/Eldarin.
2. Substituído `/sign-in` → `/entrar` (home, header, footer, mesa, privacidade, conta, compêndios…).
3. Substituído `/painel` → `/mesas` (configurar aventura, personagem/novo, `PortalShell`).
4. Rotas legadas `/painel`, `/jogador`, `/mestre` redirecionam para `/mesas`.
5. Footer ganhou link **Mesas**; página `/sistema` separa hub e Eldarin.
6. `STATIC_TAB_TITLES` em `lib/site-metadata.ts` alinhado.

**Arquivos tocados (principal):**
- `lib/site-paths.ts` (novo)
- `components/SiteFooter.tsx`, `SiteHeaderWrapper.tsx`, `HeaderUserMenu.tsx`
- `app/page.tsx`, `app/sistema/page.tsx`, `app/privacidade/page.tsx`
- `app/painel/*`, `app/jogador/*`, `app/mestre/*`
- APIs login/register — mensagens com `/entrar`

**Commits:** pendente local (junto com fixes Docker/OAuth abaixo)

**Como testar:** navegar site logado/deslogado — nenhum link público deve apontar para `/sign-in` ou `/painel`.

---

### 2026-06-19 — Docker: cache de imagens Next.js

**Pedido:** erro `ENOENT mkdir '/app/.next/cache/images'` no container.

**Passo a passo:**
1. **Diagnóstico** — otimizador de imagens do Next precisa gravar em `.next/cache/images`; pasta não existia ou não era gravável no runtime.
2. **`docker-entrypoint.sh`** — cria `.next/cache/images` e `.next/cache/fetch-cache` antes de `npm start`.
3. **`Dockerfile`** — `mkdir -p` após `npm run build` + `ENTRYPOINT` do script.
4. **`DEPLOY.md`** — nota sobre volume `emptyDir` em `/app/.next/cache` se filesystem for read-only.

**Arquivos tocados:**
- `docker-entrypoint.sh` (novo), `Dockerfile`, `DEPLOY.md`

**Como testar:** rebuild imagem → abrir página com `next/image` → sem erro no log.

---

### 2026-06-19 — OAuth: “Sessão expirada” + 401 no console

**Pedido:** após Google, mensagem *Sessão OAuth expirada* e 401 em `/api/auth/me`, `/api/friends/*`.

**Passo a passo:**
1. **Diagnóstico** — cookie `eldarin_oauth` não voltava no callback (host `www` ≠ apex, ou `cookies().set()` não anexado ao redirect 302 no App Router).
2. **Cookies no redirect** — `applyOAuthStateCookie()` no início OAuth; `applySessionCookie()` no fim do callback (`completeOAuthLogin`).
3. **Host canônico** — `middleware.ts` redireciona apex ↔ `www` para o host de `AUTH_URL` (cookie é host-specific).
4. **`consumeOAuthState`** — falhas tipadas (`missing`, `expired`, `mismatch`) + log no servidor.
5. **Ruído no console** — `/api/auth/me` retorna `200` + `{ user: null }` quando deslogado (amigos ainda 401 — esperado).
6. **Health** — campo `authOrigin` para conferir `AUTH_URL` em produção.

**Arquivos tocados:**
- `lib/auth/oauth/state.ts`, `lib/auth/oauth/complete-login.ts`
- `lib/auth/session.ts` — `buildSessionCookie`, `applySessionCookie`
- `app/api/auth/oauth/[provider]/route.ts`, `callback/route.ts`
- `app/api/auth/me/route.ts`, `app/api/health/route.ts`
- `middleware.ts`, `DEPLOY.md`

**Checklist produção:**
- `AUTH_URL=https://www.mxdrpg.com.br` (mesmo host que o usuário abre)
- Callback Google = `https://www.mxdrpg.com.br/api/auth/oauth/google/callback`
- `SESSION_SECRET` estável (não rotacionar no meio do fluxo)

**Commits:** pendente local

**Como testar:** `/entrar` → Google → cair em `/mesas` ou `/entrar/apelido` sem `error=oauth_state`; `/api/health` → `authOrigin` correto.

---

### 2026-06-19 — Padrão de histórico passo a passo

**Pedido:** melhorar o arquivo de atualizações e **sempre** documentar assim.

**Passo a passo:**
1. Seção **Padrão obrigatório — toda sessão** no topo deste arquivo (formato + checklist).
2. Tabela **Estado atual** atualizada (MXDRPG hub, OAuth, rotas canônicas, Docker).
3. Entradas retroativas da sessão 2026-06-19 com passo a passo numerado.

**Arquivos tocados:**
- `docs/HISTORICO.md`

**Como testar:** ao fim de cada chat, verificar se há entrada nova com data, passos e “como testar”.

---

### 2026-06-19 — Onboarding de perfil no primeiro acesso

**Pedido:** após criar conta/login, no primeiro acesso ir para perfil: apelido obrigatório + foto (Google, sugerida pelo apelido ou upload).

**Passo a passo:**
1. **Diagnóstico** — fluxo antigo só pedia apelido em `/entrar/apelido`, sem escolha de avatar no mesmo passo.
2. **Decisão** — página única de onboarding em `/conta/bem-vindo`; após salvar, redireciona para `/mesas` (ou destino pedido).
3. **Implementação:**
   - `ProfileOnboardingForm` — apelido + 3 opções de foto: Google, avatar sugerido (DiceBear por apelido), upload/URL.
   - `POST /api/auth/onboarding` — salva apelido + avatar e atualiza sessão numa chamada.
   - `avatarSource: generated` em `user-avatar.ts` — URL derivada do apelido em runtime.
   - `postAuthRedirect` → `/conta/bem-vindo` quando sem apelido (MariaDB ativo).
   - `/entrar/apelido` legado → redirect para `/conta/bem-vindo`.
   - `/conta` — `AvatarProfileForm` ganhou opção “Avatar sugerido”.
4. **Validação** — `npm run build` ✅.

**Arquivos tocados:**
- `app/conta/bem-vindo/page.tsx`, `components/auth/ProfileOnboardingForm.tsx`
- `app/api/auth/onboarding/route.ts`, `lib/auth/profile-onboarding.ts`
- `lib/avatar/nickname-avatar.ts`, `lib/db/user-avatar.ts`, `lib/auth/post-auth-redirect.ts`
- `app/entrar/apelido/page.tsx` (legado), `components/auth/AvatarProfileForm.tsx`

**Como testar:**
1. Login Google (conta nova ou sem apelido) → deve abrir `/conta/bem-vindo`.
2. Digitar apelido → preview do avatar sugerido atualiza.
3. Escolher Google / sugerido / upload → **Continuar** → `/mesas`.
4. Editar depois em `/conta`.

**Commits:** pendente local

---

### 2026-06-19 — Fix: “Conta não encontrada” ao salvar apelido (OAuth)

**Pedido:** screenshot em `/entrar/apelido` — erro ao salvar apelido; 400 em `/api/auth/nickname`; 500 em `/api/notifications`; regex inválido no `pattern` do input.

**Passo a passo:**
1. **Diagnóstico** — login Google com DB falhando deixava sessão com id efêmero `google-…` / `discord-…`. `materializeSessionUser` não criava linha em `eldarin_users`; `setUserNickname` falhava com “Conta não encontrada”.
2. **Decisão** — ao materializar sessão OAuth, chamar `ensureUserFromOAuth` em modo **strict** (erro claro se DB cair, sem fallback silencioso).
3. **Implementação:**
   - `lib/auth/oauth-session-id.ts` — parse de ids `google-*` / `discord-*`.
   - `materializeSessionUser` — cria/recupera usuário OAuth no MariaDB; fallback por e-mail para `usr_*` órfão.
   - `POST /api/auth/nickname` — `createSession` após salvar (cookie passa a `usr_*`).
   - `/api/notifications` — `safeDbRead` (sem 500 quando DB falha).
   - `pattern` do apelido: `[a-zA-Z0-9_\-]{3,24}` (hífen escapado — Chrome `/v` quebrava `[a-zA-Z0-9_-]*`).
4. **Validação** — `npm run build` ✅.

**Arquivos tocados:**
- `lib/auth/session-user.ts`, `lib/auth/oauth-session-id.ts`, `lib/db/users.ts`
- `app/api/auth/nickname/route.ts`, `app/api/notifications/route.ts`
- `components/auth/NicknameForm.tsx`, `ProfileOnboardingForm.tsx`, `RegisterForm.tsx`

**Produção ainda precisa:** `db: true` no health (SSL MariaDB) + deploy com `/conta/bem-vindo`.

**Como testar:** login Google → salvar apelido → sem “Conta não encontrada”; cookie atualizado; `/api/notifications` retorna `{ items: [], count: 0 }` se DB off.

**Commits:** `2e78ac0` (bundle anterior)

---

### 2026-06-19 — Fix reforçado: apelido após OAuth (sessão órfã)

**Pedido:** ainda “Conta não encontrada” ao salvar apelido (ex.: MaulXD).

**Passo a passo:**
1. **Diagnóstico** — `fetchUserById` usava `safeDbRead` e devolvia `null` em falha SSL; `usr_*` órfão caía sem recriar usuário OAuth; cookie sem `oauthProvider`/`oauthSubject`.
2. **Decisão** — priorizar identidade OAuth na materialização; gravar provider/subject na sessão; leitura strict antes de UPDATE.
3. **Implementação:**
   - `SessionUser` + cookie: `oauthProvider`, `oauthSubject`.
   - `oauthIdentityFromSession()` — id efêmero ou campos da sessão.
   - `materializeSessionUser` — OAuth primeiro; sem retorno silencioso de id inválido.
   - `fetchUserByIdStrict` + `setUserNickname` usa leitura direta (erro real do MariaDB).
4. **Validação** — `npm run build` ✅.

**Como testar:** **Sair** → entrar de novo com Google → `/conta/bem-vindo` → salvar apelido. Exige `db: true` no health.

**Commits:** pendente local

---

<!--
### AAAA-MM-DD — Título

**Pedido:** …

**Passo a passo:**
1. …

**Arquivos tocados:**
- `caminho/arquivo.ts`

**Commits / deploy:** …

**Como testar:** …
-->
