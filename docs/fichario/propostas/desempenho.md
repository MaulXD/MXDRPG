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

---

## P-12 pedidos repetidos

Medicao do Farejador na mesa parada. Quatro padroes confirmados no codigo. Nenhum codigo foi alterado.

### (a) `/api/auth/me` 2x ao recarregar `/mesa/[roomId]`

Dois clientes montam e buscam o proprio usuario de forma independente:

1. `components/friends/FriendsChatProvider.tsx:145` (effect em `:142-153`). Busca sempre, mesmo com `initialUserId` ja preenchido pelo layout (`app/layout.tsx:103`). O valor so inicializa o state em `:57`; o effect nao consulta essa prop.
2. `components/auth/HeaderUserMenu.tsx:40` (effect em `:33-48`). Na mesa, `SiteShell.tsx:170` renderiza `VttTopbarUserMenu`, que monta `<HeaderUserMenu />` sem `user` (`components/auth/VttTopbarUserMenu.tsx:7`). Sem `initialUser`, o effect busca. O usuario ja foi lido no servidor em `SiteHeaderWrapper.tsx:14-18`, mas esse dados nao chega a topbar VTT.

`NotificationsProvider.tsx:66-71` evita o pedido extra: pula o fetch quando `initialUserId` existe. E o padrao a seguir.

**Correcao minima:** em `FriendsChatProvider.tsx:142`, guardar o fetch com `if (initialUserId) { setReady(true); return; }`. Na topbar VTT, repassar o usuario ja materializado (via prop no `SiteShell`/`VttTopbarUserMenu`, ou contexto compartilhado) para que `HeaderUserMenu` receba `user`. Resultado: 0 pedidos de `/api/auth/me` na mesa com sessao valida.

### (b) `tor-characters` 2x ao abrir a Ficha

Duas rotas com `tor-characters` no nome, uma por componente:

1. `components/vtt/TorPlayableCharactersPanel.tsx:61` → GET `/api/tor-characters?adventureId=...`. Dispara no mount (`:72`) e a cada mudanca de `reloadKey` (`:76`), que sobe por `roomRevision` com debounce de 600 ms (`:42-48`) e por `TOR_CHARACTER_CHANGED_EVENT` (`:50-55`).
2. `components/vtt/TorCharacterSheetPopup.tsx:37` → GET `/api/tor-characters/{id}` via `load()`. Chamado em `:48` ao abrir e de novo em `:62` quando `roomRevision` muda (`:56-64`).

A duplicacao vem de duas fontes de atualizacao para o mesmo dado: revisao da sala e evento local. Um PATCH na ficha (`TorCharacterSheetPopup.tsx:72`) dispara `TOR_CHARACTER_CHANGED_EVENT` em `:81`, que recarrega a lista no painel `:52`, enquanto a revisao gerada pelo mesmo PATCH recarrega o popup `:62` e o painel `:46`.

**Correcao minima:** usar uma unica fonte de refresh. No popup, confiar so no `TOR_CHARACTER_CHANGED_EVENT` local (ou so na revisao), removendo um dos dois effects. No painel, aproveitar a lista ja carregada para popular o popup em vez de buscar o personagem de novo, ou deduzir o item aberto do estado local.

### (c) GET `/api/room/[roomId]` 2x ao mandar UMA mensagem no chat

Uma mensagem gera um POST e dois GETs da sala:

- `components/vtt/RoomChat.tsx:50` → `postRoomChat` (`hooks/useRoomSync.ts:1360-1381`) → POST `/api/room/${roomId}/chat` (`app/api/room/[roomId]/chat/route.ts:21`). O POST **ja devolve o snapshot completo**, nao um delta: `chat/route.ts:69,112,115` retornam `snapshot` de `addRoomChatMessage` (`lib/room/handlers/chat.ts:33-42`). `postRoomChat` tipa o retorno como `Promise<RoomSnapshot>` (`useRoomSync.ts:1380`). O valor e descartado em `RoomChat.tsx:50`.
- GET 1: `RoomChat.tsx:52` chama `onUpdate()`, que e `refresh` (`MesaRoomChatPanel.tsx:19,27`, via `MesaSyncProvider.tsx:127`). Faz GET `/api/room/${roomId}` em `useRoomSync.ts:240`.
- GET 2: o POST persiste e chama `notifyRoomUpdated` (`lib/room/internal/registry.ts:134`). O SSE emite `revision` (`app/api/room/[roomId]/events/route.ts:75-79`), o cliente recebe em `useRoomSync.ts:405-412` e chama `scheduleRefresh()`, gerando outro GET em `:240`.

O mecanismo de delta existe (`lib/room/room-delta.ts:86-109`, `chatAppend` em `:89-90`) e `isChatOnlyDelta` em `:34-44`, mas a rota de chat nao o usa.

**Correcao minima:** em `RoomChat.tsx:50`, guardar o snapshot devolvido (`const snap = await postRoomChat(...)`) e aplica-lo com `applyRoomResponse(snap)` em vez de chamar `onUpdate()` em `:52`. Isso elimina o GET 1 e atualiza `revisionRef` (`useRoomSync.ts:147`); o evento SSE chega com revisao ja conhecida e nao dispara o GET 2 (`:410`). Passar `applyRoomResponse` como prop a `RoomChat` (ja disponivel em `MesaRoomChatPanel.tsx` via `useMesaSyncActions`).

### (d) 'outros 10' pedidos por minuto com a mesa parada

Alem de `/api/friends/pulse` (4/min, P-01) e presenca (6/min), a mesa com GM faz 5 rotas de polling a 30 s cada, totalizando **10/min**. Para jogador sem permissao de mestre sao 6/min (as duas rotas de GM nao montam).

| Rota | Chamada | Intervalo |
|------|---------|-----------|
| `/api/notifications` | `components/notifications/NotificationsProvider.tsx:97` (`POLL_MS` em `:15`) | 30 s = 2/min |
| `/api/adventures/[id]/edit-requests` | `components/vtt/MesaEditRequestsBell.tsx:16` → `hooks/useSheetEditRequest.ts:64` | 30 s = 2/min |
| `/api/adventures/[id]/inventory-requests` | `MesaEditRequestsBell.tsx:17` → `hooks/useInventoryItemRequest.ts:70` | 30 s = 2/min |
| `/api/adventures/[id]/my-edit-requests` | `MesaPlayerEditRequestsBell.tsx:24` → `useSheetEditRequest.ts:95` | 30 s = 2/min |
| `/api/adventures/[id]/my-inventory-requests` | `MesaPlayerInventoryRequestsBell.tsx:23` → `useInventoryItemRequest.ts:104` | 30 s = 2/min |

Os tres bells estao montados na topbar da mesa em `components/vtt/mesa/MesaFoundryStageHeader.tsx:70-72`. Cada componente retorna `null` quando nao ha pendencias (`MesaEditRequestsBell.tsx:35`, `MesaPlayerEditRequestsBell.tsx:38`, `MesaPlayerInventoryRequestsBell.tsx:37`), mas os hooks ja registraram o `setInterval` antes do return, entao o polling continua com a lista vazia. Nenhum dos tres pausa quando a aba esta escondida, ao contrario do que P-01 fez em `FriendsChatProvider.tsx:154-173`.

`useRoomSync` nao acrescenta GET periodico com SSE ativo: o fallback para em `useRoomSync.ts:409`; heartbeat de presenca e desligado em `:480` e em `useRoomPresence.ts:113`. O tick de 5 s do SSE (`events/route.ts:82-93`) e servidor, nao pedido HTTP.

**Correcao minima:** passar `enabled` condicional aos hooks dos bells e aos de notificacao, pausando quando `document.visibilityState === "hidden"` (mesmo padrao de P-01). Os bells de solicitacao so precisam de polling enquanto ha pendencia visivel. Ganho maior: publicar essas mudancas pelo SSE da mesa, que ja entrega revisoes, eliminando as 5 rotas periodicas.

---

## P-22 sinos

Levantamento somente leitura em `D:/Cursor/RPG`, feito em 2026-11-21. Nenhum codigo foi alterado. Continuacao de P-12 (d), que mediu os 10 pedidos/min da mesa.

### (1) Quem monta os hooks na mesa

A topbar da mesa (`components/vtt/mesa/MesaFoundryStageHeader.tsx:70-72`) monta ate tres bells. O bell de mestre so aparece quando `isActualGm` e verdadeiro (`:70`), os dois bells de jogador aparecem para qualquer sessao (`:71-72`). `isActualGm` vem de `canManageRoom(room, user)` (`app/mesa/[roomId]/page.tsx:187`, `components/vtt/MesaWorkspace.tsx:153`), ou seja, admin ou dono da sala.

Mestre com sessao monta 4 consultas periodicas:

| Fonte | Chamador | Hook | Rota |
|---|---|---|---|
| `MesaEditRequestsBell` (`MesaFoundryStageHeader.tsx:70`) | `useGmEditRequests` (`MesaEditRequestsBell.tsx:16`) | `hooks/useSheetEditRequest.ts:37`, GET em `:48` | `/api/adventures/[id]/edit-requests` |
| `MesaEditRequestsBell` (mesmo local) | `useGmInventoryRequests` (`MesaEditRequestsBell.tsx:17`) | `hooks/useInventoryItemRequest.ts:43`, GET em `:56` | `/api/adventures/[id]/inventory-requests` |
| `MesaPlayerEditRequestsBell` (`MesaFoundryStageHeader.tsx:71`) | `usePlayerEditRequests` (`MesaPlayerEditRequestsBell.tsx:24`) | `hooks/useSheetEditRequest.ts:72`, GET em `:80` | `/api/adventures/[id]/my-edit-requests` |
| `MesaPlayerInventoryRequestsBell` (`MesaFoundryStageHeader.tsx:72`) | `usePlayerInventoryNotifications` (`MesaPlayerInventoryRequestsBell.tsx:23`) | `hooks/useInventoryItemRequest.ts:78`, GET em `:86` | `/api/adventures/[id]/my-inventory-requests` |

A quinta vem do provider global `NotificationsProvider`, montado em `app/layout.tsx:104`, que busca `/api/notifications` em `components/notifications/NotificationsProvider.tsx:51`. Nao e especifico da mesa.

Jogador sem `isActualGm` monta so os dois bells de jogador e o provider global, 3 consultas. Sem sessao, nenhum bell e o provider nao inicia o polling (`NotificationsProvider.tsx:95-96`).

Os tres bells retornam `null` quando nao ha pendencia (`MesaEditRequestsBell.tsx:35`, `MesaPlayerEditRequestsBell.tsx:38`, `MesaPlayerInventoryRequestsBell.tsx:37`), mas o hook continua montado e o intervalo ja foi registrado. Codigo atual usa `startVisiblePoll` (`hooks/usePollWhenVisible.ts:9-34`) nos 5 polling, entao a aba escondida pausa e faz uma leitura ao voltar. A medicao de 10/6 por minuto de P-12 (d) vale com aba visivel. Alem disso, `usePlayerInventoryNotifications` troca o intervalo de 30 s para 5 s quando ha item `pending` (`useInventoryItemRequest.ts:97,102`); o mesmo vale para o hook da ficha em `components/character/CharacterSheet.tsx:284`.

### (2) Retorno e permissao de cada rota

| Rota | Devolve | Permissao |
|---|---|---|
| `/api/notifications` | `{ items, count }` (`app/api/notifications/route.ts:33`). `items` e `NotificationItem` de 5 tipos (`lib/notifications/types.ts:1-6`): amizade, convite de mesa, edicao de ficha para GM, edicao de ficha para jogador, pedido de entrada. Agrega todas as aventuras do usuario, amigos e convites (`lib/notifications/store.ts:107-177`). Nao cobre inventario. | So login (`:15-18`); escopo ao proprio usuario via `listNotificationsForUser(accountUser.id)` (`:29`). |
| `/api/adventures/[id]/edit-requests` | `{ requests }` com `listPendingSheetEditRequests(adventureId)` mais `characterName` (`:23-38`). Filtro opcional `roomId` em `:22-26`. | `canManageAdventure` (`:18`): admin ou dono da aventura (`lib/auth/adventure-access.ts:21-28`). 401 sem sessao, 403 se nao mestre. |
| `/api/adventures/[id]/inventory-requests` | `{ requests }` com `listPendingInventoryRequestsForAdventure` mais `characterName` (`:26-41`), mesmo filtro `roomId` em `:25-29`. O PATCH `approve_all` esta em `:44-66`. | Mesma regra (`:21`, `:52`). |
| `/api/adventures/[id]/my-edit-requests` | `{ requests }` com `listActiveSheetEditRequestsForUser(adventureId, session.user.id)` mais `characterName` (`:21-29`). Inclui `pending`, `approved`, `rejected` (`lib/character/sheet-edit-request-store.ts:64-80`). | Login + aventura existente (404 em `:16-19`). Cada usuario ve so os proprios, por filtro em `:21`. |
| `/api/adventures/[id]/my-inventory-requests` | `{ requests }` com `listActiveInventoryRequestsForUser` mais `characterName` (`:21-29`), tambem `pending`, `approved`, `rejected` (`lib/character/inventory-item-request-store.ts:61-77`). | Mesma regra (`:11-19`, `:21`). |

Dois pontos a preservar. `pending` e a vista do mestre, so da aventura, com filtro de sala e ordem por criacao (`sheet-edit-request-store.ts:104-114`, `inventory-item-request-store.ts:49-59`); `active` e a vista do jogador, so dos proprios, com ate tres status e ordem por atualizacao. E `/api/notifications` e global, nao por aventura, e nao inclui inventario.

### (3) Proposta: `/api/adventures/[id]/pending-requests`

Um GET a cada 30 s no lugar dos 5, servido por um provider unico na mesa (por exemplo `MesaRequestsProvider`, montado uma vez em `MesaWorkspace` e consumido pelos tres bells e pelo sino global). Payload:

```
{
  "notifications": { "items": [], "count": 0 },
  "isGm": true,
  "gm": { "sheet": [], "inventory": [] },
  "mine": { "sheet": [], "inventory": [] }
}
```

Regras para manter quem ve o quê:

- `notifications`: copiar `{ items, count }` de `listNotificationsForUser`/`countNotificationsForUser` (`lib/notifications/store.ts:107-182`), com o mesmo escopo ao usuario. Continua global, com amigos, convites, outras aventuras e pedidos de entrada.
- `mine.sheet` e `mine.inventory`: `listActive*ForUser(adventureId, session.user.id)` mais `characterName`, iguais as duas rotas `my-*`. Preenchido para qualquer usuario logado, inclusive o mestre.
- `gm.sheet` e `gm.inventory`: `listPending*ForAdventure(adventureId)` mais `characterName`, com o mesmo filtro `roomId` da query. Preenchido so quando `canManageAdventure` for verdadeiro. Para os demais, `gm: null`, nunca 403, para nao quebrar os bells de jogador.
- `isGm`: mesmo resultado de `canManageAdventure` da rota, para o cliente decidir se monta o bell de mestre. Hoje o cliente usa `canManageRoom`, regra diferente (ver risco 2).

Pedidos/min, com aba visivel:

| Cenario | Hoje | Rota unica |
|---|---|---|
| Mestre, sem pendencia | 10/min (5 rotas x 2) | 2/min |
| Jogador, sem pendencia | 6/min (3 rotas x 2) | 2/min |
| Mestre, item de inventario pendente | 20/min (my-inventory a 5 s) | 12/min mantendo fast-poll, ou 2/min sem ele |
| Jogador, item de inventario pendente | 16/min | 12/min mantendo fast-poll, ou 2/min sem ele |
| Aba escondida | 0 | 0 |

Reducao no caso base: 80% para mestre e 67% para jogador. Com item pendente, a reducao e so 40% e 25% se o provider mantiver o fast-poll de 5 s; 90% e 88% se aceitar esperar ate 30 s. O trabalho no servidor nao cai na mesma proporcao, porque a rota unica continua executando as cinco consultas. O ganho e menos HTTP round-trips; para cortar SQL de verdade, o caminho e publicar essas mudancas pelo SSE da mesa, que ja entrega revisoes em `app/api/room/[roomId]/events/route.ts:75-79`.

### (4) Riscos

1. Difusao de dados. A rota passa a ser chamada por jogadores. Se `gm` for preenchido sem `canManageAdventure`, qualquer jogador ve todos os pedidos pendentes da aventura, com nome de personagem e de quem pediu. `gm` tem que comecar `null` e so ser preenchido apos a checagem no servidor.
2. Regras de papel divergentes. O bell de mestre e montado com `canManageRoom` (`app/mesa/[roomId]/page.tsx:187`, `lib/auth/room-access.ts:55-62`: admin ou dono da sala) e as rotas usam `canManageAdventure` (admin ou dono da aventura). Dono de sala e dono de aventura podem ser diferentes. Se cliente e servidor usarem regras distintas, o sino some ou aparece vazio. Escolher uma regra so.
3. Escopo de `/api/notifications`. E global (`lib/notifications/store.ts:107-177`). Coloca-lo dentro de `/api/adventures/[id]/...` cria acoplamento enganoso: abrir duas aventuras buscaria a mesma lista global duas vezes. Melhor manter o sino global como provider de app e unir so as 4 rotas da aventura, ou aceitar o `id` como filtro opcional.
4. Perda de granularidade. Hoje cada hook tem `enabled`, intervalo proprio e fast-poll por pendencia (`useInventoryItemRequest.ts:34,102`). Uma rota so impoe um intervalo unico; manter os 5 s exige que o provider exponha um flag de pendencia e dispare refresh extra. Cache HTTP separado por rota tambem deixa de existir.
5. Formato dos dados. `pending` e `active` tem status e ordenacao diferentes (`sheet-edit-request-store.ts:64-80` contra `:104-114`; `inventory-item-request-store.ts:49-59` contra `:61-77`). Os bells esperam `{ requests: [...] }` (`MesaEditRequestsBell.tsx:16-17`, `MesaPlayerEditRequestsBell.tsx:24`, `MesaPlayerInventoryRequestsBell.tsx:23`); trocar o formato sem adaptar os consumidores quebra os tres.
6. Escrita continua fora da rota. `approve_all` fica em `/inventory-requests` (`inventory-requests/route.ts:44-66`) e approve/reject/dismiss em `/api/characters/[id]/...` (`MesaEditRequestsBell.tsx:44,67`, `MesaPlayerEditRequestsBell.tsx:43`, `MesaPlayerInventoryRequestsBell.tsx:42`). A rota nova e so leitura; o provider precisa chamar seu `refresh` depois de cada acao, no lugar do `refreshAll()` de `MesaEditRequestsBell.tsx:37-39`.
7. Custo de servidor. A rota unica herda `force-dynamic` de `/api/notifications` (`notifications/route.ts:12`), `getSession` + `materializeSessionUser` + `getAdventure` por chamada, e continua varrendo todas as aventuras do usuario para montar as notificacoes (`notifications/store.ts:26-105`). Menos pedidos HTTP, mesma quantidade de SQL por tick.
