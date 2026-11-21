# Desempenho: levantamento P-03 (somente leitura)

Data: 2026-11-21. Base: codigo atual de `D:/Cursor/RPG`. Nenhum codigo foi alterado.

## Ordem de ganho (resumo)

| # | Achado | Custo estimado | Correcao |
|---|--------|----------------|----------|
| 1 | `/compendios` SSR com dados de todos os packs inline (5) | ~500 KB de HTML por request, sem cache | tornar estatico, buscar papel no cliente, dividir por pack |
| 2 | N+1 em convites e pedidos de amigo (2) | 2 + 2N SELECT por chamada, N ate 50 (ate ~102) | JOIN + `queryRowsByIds`, um select para ids |
| 3 | Presenca com `requireRoomView` duplicado e N+1 de clerk (2) | 2x autorizacao + 2N lookup + poll 10s por cliente | reutilizar `auth`, batch de clerk, SSE em vez de poll |
| 4 | Materializacao do usuario a cada pedido (1) | 1 SELECT por pedido (+3 se apelido nulo) | cache curto por id ou confiar no cookie |
| 5 | SSE consulta revisao no banco por cliente (2) | 1 SELECT/5s + 2 escritas/15s por cliente | compartilhar tick por sala, cache de revisao maior |
| 6 | `getRoom` chamado 2x e `getAdventure` por helper (2) | quente 1 a 4 SELECT; frio 1 SELECT com JSON inteiro | passar `room`/`adv` ja carregados |
| 7 | `ensureDbMigrations` por modulo de rota (2) | 7 UPDATE/CREATE na primeira chamada de cada rota | rodar so no migrate/deploy |
| 8 | `searchParams`/`cookies()` forcando SSR (4) | render completo por request | rota estatica + tabs no cliente |
| 9 | Middleware em toda requisicao (3) | CPU insignificante, 0 SQL | manter; apenas estreitar matcher |

---

## 1. Descoberta da sessao

**Nao ha consulta ao banco em `getSession`.** `lib/auth/session.ts:106-111` le o cookie `vinite_session` e chama `decode`. O cookie e JSON base64url + assinatura HMAC-SHA256 (`session.ts:9-31`, `session.ts:39-69`), verificado com `timingSafeEqual`. `normalizeUserRole` (`lib/auth/roles.ts:24-28`) e funcao pura. Custo: 1 leitura de cookie + 1 HMAC, **0 SQL**. Nao ha cache porque o payload e autocontido (id, email, nome, role).

O custo aparece logo depois, fora do `getSession`:

- `lib/auth/session-user.ts:45-132` (`materializeSessionUser`) e `session-user.ts:135-141` (`safeMaterializeSessionUser`) resolvem o usuario no banco.
- Caminho normal (`usr_`): `fetchUserByIdStrict` (`lib/db/users.ts:325-333`) = **1 SELECT** em `eldarin_users`. Sem cache: toda chamada repete a query.
- Se `nickname` esta vazio: `backfillDefaultNickname` (`lib/db/users.ts:473-479`) = geracao de apelido + UPDATE + `fetchUserById` = **ate 3 queries extras**.
- Sessao OAuth efemera: `ensureUserFromOAuth` (`session-user.ts:24-33`) = 2 a 3 queries + possivel UPDATE.
- Legado `clerk-*`: `fetchUserByClerkId` + `fetchUserByIdStrict` (`session-user.ts:118-124`) = **2 SELECT**.

**Correcao (ganho medio):** cache curto (30 a 60 s) por id em `fetchUserByIdStrict`, ou evitar materializar em leituras que so precisam do id/role do cookie. Nao ha N+1 nesse caminho.

---

## 2. Consultas por rota

### `/api/auth/me`
`app/api/auth/me/route.ts:6-10` -> `getSession` (0 SQL) + `safeMaterializeSessionUser` -> `fetchUserByIdStrict` = **1 SELECT**; **+3** se apelido nulo. Sem N+1. Correcao: mesmo cache do item 1.

### `/api/friends/messages/unread`
`app/api/friends/messages/unread/route.ts:10-17` -> `getSession` (0) + `ensureDbMigrations` (7 statements so na 1a chamada do modulo, ver item 7) + `countUnreadFriendMessages` = **1 SELECT COUNT** (`lib/db/friend-messages.ts:101-109`). Sem N+1. Correcao: drop `ensureDbMigrations` da rota.

### `/api/friends/invites`
`app/api/friends/invites/route.ts:9-14` -> `listReceivedMesaInvites` (`lib/friends/store.ts:467-498`):
- 1 SELECT em `eldarin_mesa_invites` (`lib/db/friends.ts:110-124`, LIMIT 50);
- por convite: `fetchUserById` (`store.ts:475`) + `getAdventure` (`store.ts:476`). `getAdventure` (`lib/adventure/store.ts:153-170`) faz 1 SELECT de `updated_at` mesmo com cache, e outro `fetchAdventure` se stale.

Total: **2 + 2N SELECT**, N ate 50 (ate ~102). **N+1 confirmado** em `store.ts:474-476`. Correcao: um `queryRowsByIds` para todos os `from_user_id` e um `fetchAdventuresByIds`; montar o resultado em memoria.

### `/api/friends/requests`
`app/api/friends/requests/route.ts:9-23` -> `getSession` + `ensureDbMigrations` +:
- `countOnly=1`: `countPendingIncomingFriendRequests` = **1 SELECT COUNT** (`lib/db/friend-requests.ts:92-106`). Sem N+1.
- padrao: `listFriendRequests` (`lib/friends/store.ts:162-187`) = 2 SELECT (incoming/outgoing, LIMIT 50 cada, `friend-requests.ts:65-89`) + por linha `rowToFriendRequest` (`store.ts:70-95`) com 2x `fetchUserById` = **2 + 2N SELECT** (ate ~102). **N+1 confirmado** em `store.ts:175-184`. Correcao: mesma do item anterior (batch de usuarios).

### `/api/room/[roomId]` GET
`app/api/room/[roomId]/route.ts:8-20` -> `requireRoomView` (`lib/auth/authorize-room-view.ts:16-45`) -> `getRoom` + `getSession` + helpers de acesso; depois `getRoom` de novo na linha 17.
- `getRoom` (`lib/room/internal/registry.ts:164-196`): quente = 0 ou 1 `fetchRoomRevision` por janela de 800 ms (`revision-cache.ts:8`, `db/rooms.ts:74-90`); frio = 1 `fetchRoom` com scene/actors/combat/chat inteiros (`db/rooms.ts:92-111`). A cada 60 s, `getAdventure` de sync de convite (`registry.ts:226-234`) = 1 SELECT.
- `isRoomMemberResolved` / `canViewRoomServer` / `shouldAutoJoinRoom` (`room-access-server.ts:24-54`, `adventure-room-access.ts:10-22`) podem chamar `getAdventure` = 1 SELECT cada, mais `fetchClerkIdForUser` (cache 60 s, `db/users.ts:335-354`).

Total quente: **~1 a 4 SELECT**; frio: +1 SELECT com JSON grande da sala. `resolveRoomSync` (`lib/room/sync-response.ts:40-60`) e todo em memoria, sem SQL. Sem N+1. Correcao: reutilizar o `room` retornado por `requireRoomView` em vez do 2o `getRoom`, e passar o `adventure` ja resolvido aos helpers.

### `/api/room/[roomId]/events` (SSE)
`app/api/room/[roomId]/events/route.ts:16-113`:
- conexao: mesmo `requireRoomView` (~1 a 4 SELECT) + `canTrackRoomPresence`; `touchRoomPresence` faz 1 UPSERT (throttled 15 s) + `pruneRoomPresenceDb` fire-and-forget (`lib/room/presence.ts:122-129`).
- a cada 5 s: `getRoomRevision` (`revision.ts:6-20`) = **1 SELECT** quando o cache de 800 ms vence; `tickRoomAutoPassThrottled` (`auto-pass-tick.ts:10-15`) so persiste se houver auto-passe vencido (`handlers/combat-turn.ts:264-269`), senao 0 SQL.
- a cada 15 s: 2x `touchRoomPresence` (1 escrita no maximo por throttle) + flush de eventos em memoria.

Total steady state: **~1 SELECT/5 s + 2 escritas/15 s por cliente conectado**. Sem N+1, mas escala linear com o numero de jogadores na mesa. Correcao: cache de revisao maior (ex.: 2 s) ou subscription via notifier (`events/route.ts:75-80`) para evitar o SELECT periodico; ja ha throttle de 2,5 s no auto-passe.

### Presenca (`hooks/useRoomPresence.ts` + `app/api/room/[roomId]/presence/route.ts`)
Cliente faz GET a cada **10 s** (`hooks/useRoomPresence.ts:19`, `:95`); heartbeat POST so sem EventSource (`:99-107`).
- `presence/route.ts:66` chama `requireRoomView`, e `presenceResponse` (`route.ts:34`) chama **de novo**: 2x `getRoom` + 2x helpers de acesso. `canTrackRoomPresence` tambem e chamado 2x (`route.ts:73` e `:41`).
- `touchRoomPresence` (`presence.ts:96-139`): 1 UPSERT no maximo a cada 15 s + prune.
- `buildEnrichedRoomPresence` (`lib/room/presence-enrich.ts:167-199`): `listRoomPresence` = 1 SELECT (`lib/db/room-presence.ts`), `fetchUserPresenceRows` = 1 SELECT em lote (`queryRowsByIds`, `presence-enrich.ts:86-94`); por membro, `isPresenceGmUser` (`presence-enrich.ts:142-164`) faz 2x `fetchClerkIdForUser` no caso `usr_` vs `usr_` -> **N+1** (cache de 60 s mitiga, `db/users.ts:338-340`). `profileForUserId` (`:102-140`) e fallback raro.

Total por poll: **~2x(1 a 4) + 2 SELECT + 2N lookup de clerk**, com N = jogadores online. Correcao: `presenceResponse` receber o `auth` ja calculado (elimina 1 autorizacao inteira); resolver os clerk ids em lote junto com `fetchUserPresenceRows`; substituir o poll de 10 s por eventos do SSE (o `GET /presence` ja faz touch quando SSE ativo).

### `ensureDbMigrations` (transversal)
`lib/db/ensure-migrations.ts:60-83` roda 7 UPDATE/CREATE (`ensure-migrations.ts:11-56`) na primeira chamada de cada modulo de rota, porque o flag `ensured` e por copia de modulo. Atinge unread, requests e `presence-enrich.ts:76`. Depois disso, 0 SQL. Correcao: executar so no `db:migrate`/entrypoint; remover as chamadas das rotas de leitura.

---

## 3. Middleware

`middleware.ts:59-63` roda em praticamente toda requisicao (matcher em `:65-69` inclui `/api` e todas as paginas nao-estaticas). Faz:
- `canonicalHostRedirect` (`:35-57`): le `AUTH_URL`, monta `new URL`, compara host; so redireciona apex <-> www em producao. 0 SQL.
- `applyMesaWatchCookie` (`:9-29`): regex no path, grava ou **apaga** o cookie `mesa_watch_<roomId>` em toda `/mesa/<id>`, mesmo sem `?watch=1`. 0 SQL.

Nao autentica, nao le sessao, nao toca no banco. Custo e CPU insignificante. Correcao: nenhuma urgente; se quiser reduzir, restringir o matcher para nao rodar em `/api/*` que nao seja de mesa (o cookie so importa em `/mesa/:id`).

---

## 4. Paginas dinamicas sem necessidade

- `/` (`app/page.tsx:117`) e `/privacidade` (`app/privacidade/page.tsx:8`): **ja sao estaticas**. Nada a fazer.
- `/compendios` (`app/compendios/page.tsx:10,14`), `/mundo` (`app/mundo/page.tsx:17,21`), `/sistema` (`app/sistema/page.tsx:23,313`): usam apenas `searchParams` para escolher a aba `?sistema=um-anel`. `searchParams` e API dinamica no Next 15, entao as 3 paginas renderizam no servidor a cada request. Em `/compendios` ha ainda `getSession()` (`components/compendium/CompendiumPage.tsx:25`), que torna a rota dinamica por `cookies()` mesmo sem `searchParams`. Correcao: ler o parametro no cliente (`useSearchParams` + Suspense) ou gerar variantes estaticas, e buscar o papel via `/api/auth/me` no cliente. `/sistema` nao chama `getSession`, entao so `searchParams` o torna dinamico.
- `/rpg/*`: `/rpg` (`app/rpg/page.tsx:4-5`) e apenas redirect estatico para `/mesas`. `/rpg/eldarin` e `/rpg/um-anel` tem `force-dynamic` nos layouts (`app/rpg/eldarin/layout.tsx:6`, `app/rpg/um-anel/layout.tsx:6`) por causa do `getSession()` + redirect (`:9-10`). Sao gates de login, dificeis de estatizar sem mover a checagem para o cliente, mas o custo e so 1 HMAC (0 SQL). `/compendios/[packId]` tambem e dinamico por `searchParams` + `getSession` (`app/compendios/[packId]/page.tsx:12,28`).

Ganho: medio em `/compendios` (composer com os dados, ver item 5); baixo nos demais.

---

## 5. Por que `/compendios` devolve ~500 KB de HTML

`components/compendium/CompendiumPage.tsx:24-45` roda no servidor: `getSession()` (papel) e `getPackEntries` para **todos** os packs visiveis (`:29-31`). O resultado `data` e passado como prop para `CompendiumBrowser`, que e client component (`components/compendium/CompendiumBrowser.tsx:1`, props em `:16-24`). O Next serializa esse objeto inteiro no payload RSC e ainda o usa para hidratacao, logo todo o conteudo vai inline no HTML.

`lib/compendium/registry.ts:2-23` importa os 6 JSON estaticamente. Tamanhos em `data/compendiums/`: `armas.json` 211 KB, `monstros.json` 450,8 KB, `equipamentos.json` 73,3 KB, `magias.json` 50,7 KB, `habilidades.json` 32,5 KB, `consumiveis.json` 10,2 KB (total 838,6 KB). Usuario comum recebe ~378 KB de entradas (sem monstros); admin recebe ~828 KB. Com o scaffolding do React chega ao ~500 KB observado (ou mais para admin). Nao e consulta ao banco: e custo de serializacao + download + parse no navegador em cada request, agravado pelo SSR do item 4.

Alem disso, `TorCompendiumPage` (`components/compendium/TorCompendiumPage.tsx:1`) e client component que importa no topo do modulo praticamente todo o conteudo do Um Anel (`:5-50`: adversarios, tesouro, tabelas de Coisas Sem Nome, marcos, pre-gerados). Mesmo com uma aba ativa so no cliente, o bundle JS inteiro desses dados e enviado ao navegador.

**Correcao (maior ganho):** pagina estatica; carregar `data` por pack sob demanda (`/api/compendium/[packId]` ou import dinamico por rota) em vez de todos de uma vez; mover o papel para o cliente via `/api/auth/me`; dividir `TorCompendiumPage` em chunk por categoria com `dynamic()`.
