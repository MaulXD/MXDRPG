# Um Anel: por que `syncAdventureActorsForRoom` não leva fichas para a mesa

Investigação somente leitura. Nenhum código, JSON, livro ou dados alterados.

## 1. O sync de atores é Eldarin, por construção

- `lib/room/adventure-actors.ts:2-12` importa apenas `listCharactersForUserInAdventure`, `resolveCharacter`, `saveCharacter`, `normalizeCharacter` e `CharacterSheet`. Não importa `TorCharacter` nem nenhum módulo de `um-anel`.
- `lib/room/adventure-actors.ts:193-196` obtém as fichas com `listCharactersForUserInAdventure(userId, adventureId)`, ou seja, o repositório Eldarin.
- `lib/room/adventure-actors.ts:174` itera `Object.entries(room.actors)`. O resultado só é gravado em `room.actors[sheet.id]` (`:204`). O sync não cria token em `room.scene.tokens`.
- `lib/room/types.ts:16-21`: `RoomActor = CharacterSheet & { revision: number; ... }`. O único campo do Um Anel em `RoomState` é `torSession?` (`:45-50`). Não existe "ator Um Anel" em `room.actors`.
- `lib/vtt/types.ts:130`: `torCharacterId` é "FK pra `um_anel_characters`, nunca pra `room.actors`".
- O endpoint `/api/room/[roomId]/sync-actors` chama exatamente essa função (`app/api/room/[roomId]/sync-actors/route.ts:26`). Rodar o sync numa mesa do Um Anel não traz nenhuma ficha do Um Anel.

Conclusão: não é defeito de execução nem de permissão. O sync cobre um tipo de ficha que o Um Anel não usa. Ficha do Um Anel nunca entra em `room.actors`.

## 2. Existe caminho separado, e o jogador consegue colocar a ficha na mesa

O Um Anel tem painel e endpoint próprios. A ficha entra na mesa como token em `room.scene.tokens`, não como ator.

- `components/vtt/TorPlayableCharactersPanel.tsx:36-55` lista fichas via `GET /api/tor-characters?adventureId=...`.
- `components/vtt/TorPlayableCharactersPanel.tsx:125-134` tem o botão "Colocar no mapa"; `:101-108` faz drag da cartão para o mapa.
- O painel é montado apenas em mesa do Um Anel: `components/vtt/mesa/MesaFoundryDockRail.tsx:185-189` (dock) e `components/vtt/mesa/MesaFoundryFloatingWindows.tsx:225-230` (janela flutuante), ambos com `rpgSystemId === "um-anel"`.
- `hooks/useRoomSync.ts:1201-1218` faz `POST /api/room/${roomId}/tokens/place-tor-character` ao clicar/drag.
- `app/api/room/[roomId]/tokens/place-tor-character/route.ts:30-40` resolve a ficha, valida `canPlaceTorCharacterOnBoard` e chama `placeRoomTorCharacterOnCell`.
- `lib/room/handlers/tor-tokens.ts:21-31` permite dono da ficha ou Mestre; `:45-47` exige `sheet.adventureId === room.adventureId`.
- `lib/room/handlers/tor-tokens.ts:49-59` move o token existente (mantém o token, só muda `axial`); `:61-77` cria token novo se não existe.
- `lib/vtt/tor-player-token.ts:21-61` monta o token com `linked: true` (`:40`), sem `actorId`, `vida = sheet.endurance.value` (`:41`), `vidaMax = sheet.endurance.max` (`:42`) e `torCombat.torCharacterId = sheet.id` (`:48`).
- `components/vtt/Battlefield.tsx:851` habilita o drop com `allowTorCharacterDrop: canEdit && rpgSystemId === "um-anel"`; `hooks/vtt/useMonsterSpawnDrop.ts:134,190` consome o payload.

Conclusão: o jogador **consegue** colocar a ficha na mesa, mas por outro caminho. O que não existe é automação: nenhum sync em background coloca a ficha do Um Anel no mapa sozinha. Sem clicar em "Colocar no mapa" ou arrastar, a ficha fica só na lista/popup.

## 3. O que acontece com Resistência, Esperança e Sombra ao recarregar

### Resistência (vida do token)

- `lib/vtt/types.ts:126`: os campos genéricos `vida`/`vidaMax`/`defeated` do token representam a Resistência no Um Anel.
- Cada ação de combate altera o token e chama `persistRoom`: ataque em `lib/room/handlers/tor-combat-attack.ts:590,670`, perigo em `lib/room/handlers/tor-hazard.ts:119-130`.
- Ao carregar a sala, `lib/room/internal/registry.ts:200` aplica `normalizeSceneTokens`. `lib/vtt/scene-normalize.ts:33-43` devolve `{ ...token, ... }`, preservando `vida` e `torCombat`. Não há reconstrução do token a partir da ficha na recarga.
- `lib/room/sync.ts:21-24`: `syncLinkedTokens` só processa token com `token.linked && token.actorId`. Token do Um Anel tem `linked: true`, mas **não tem `actorId`** (`lib/vtt/tor-player-token.ts:30-48`), então é ignorado. A vida do token não é sobrescrita pela ficha.
- Recolocar o mesmo personagem também não reconstrói: `lib/room/handlers/tor-tokens.ts:49-58` apenas reposiciona o token existente. Só se o token tiver sido removido é que `createTorPlayerTokenFromCharacter` (`:61`) volta a ler `sheet.endurance.value`.

### Esperança e Sombra

- Não existem campos `hope`/`shadow` em `TorCombatTokenFields` (`lib/vtt/types.ts:128-239`; busca por `hope|shadow|fellowship|treasure|injury|fatigue` no arquivo não retorna match). Elas vivem só na ficha `um_anel_characters`.
- `lib/character/um-anel/characters.ts:100-154` (`patchTorCharacterResources`) grava `endurance.value`, `hope.value`, `shadow`, `shadowScars`, `fatigue`, `treasure`, `fellowship`, `injury` e `conditions.wounded`, e salva via `saveTorCharacter` (`:153`, `:156-173`).
- O ataque desconta Esperança da ficha em `lib/room/handlers/tor-combat-attack.ts:613-619`; Sombra é decidida pelo Mestre em `lib/room/handlers/tor-shadow.ts:127` (com `persistRoom` em `:138`); Fadiga em `lib/room/handlers/tor-fatigue.ts`; recuperação em `lib/room/handlers/tor-recovery.ts:176-180`.
- A popup lê a ficha do servidor a cada abertura: `components/vtt/TorCharacterSheetPopup.tsx:33-48`. Portanto Esperança e Sombra sobrevivem à recarga **porque estão na ficha**, não no token.

### Risco real (divergência, não perda no token)

- `patchTorCharacterResources` é best-effort nos handlers: `lib/room/handlers/tor-combat-attack.ts:595-618` e `lib/room/handlers/tor-hazard.ts:134-140` capturam erro e só fazem `console.error`. Se falhar (sem permissão, problema de gravação), o token/mapa muda mas a ficha não. Ao recarregar a popup, aparece o valor antigo da ficha. Não é o B1, mas é inconsistência entre mapa e ficha.

## 4. O problema B1 vale para o Um Anel?

Não, no mecanismo. Com correção de identificador: **B1 é `31841ac`** ("fix(eldarin): dano, cura e PA de combate sumiam ao recarregar a mesa (B1)"). `d798002` é outro fix, de token voltando à célula antiga ao mover, não B1.

- O B1 vinha de `syncAdventureActorsForRoom` trocar `room.actors[id]` pela ficha do banco, e `syncLinkedTokens` reescrever a vida do token a partir do ator (`docs/fichario/02-bugs-e-decisoes.md:74-80`).
- A correção é `keepRoomVitals` em `lib/room/actor-vitals.ts:21-37`, preservando `resources.vida` e `resources.pontosAcao` da sala, aplicada em `lib/room/adventure-actors.ts:203`.
- Esse caminho exige `room.actors` e token com `actorId`. O Um Anel não tem nenhum dos dois (`lib/room/types.ts:16-21`, `lib/vtt/types.ts:130`, `lib/vtt/tor-player-token.ts:30-48`). Logo o dano do B1 não se aplica: a Resistência do token não é reescrita no load nem no sync de atores.
- Ressalva: se um dia o Um Anel for migrado para `room.actors`/`actorId`, o B1 voltaria a valer e `keepRoomVitals` precisaria ser estendido a `endurance`/`hope`/`shadow`. Hoje isso não existe.

## O que falta e o tamanho

1. **Se a meta é só "o jogador conseguir colocar a ficha na mesa": falta nada de código.** Já existe painel, botão, drag e endpoint. O que falta é saber que o caminho é esse (fora do sync automático). Tamanho: zero de código, apenas comunicação/documentação.
2. **Se a meta é "o sync automático trazer a ficha do Um Anel": falta integração.** Seria preciso estender/criar um sync ao lado de `lib/room/adventure-actors.ts:165`, usando `listTorCharactersForAdventure` (já existente, ver `app/api/tor-characters/route.ts:2,26`) e `createTorPlayerTokenFromCharacter` (`lib/vtt/tor-player-token.ts:21`), com: filtro por `adventureId`, reaproveitamento do token existente (`lib/room/handlers/tor-tokens.ts:49`) para não duplicar, escolha de célula de spawn, e decisão de quem dispara (choque com a ação manual do jogador). Tamanho: médio (módulo novo ou extensão de ~40-80 linhas + decisão de produto sobre spawn e duplicidade). Risco: duplicar token ou reposicionar token que o jogador moveu.
3. **Consistência mapa × ficha:** hoje `patchTorCharacterResources` falha silenciosamente. Tamanho: pequeno se for só logar/avisar; médio se for virar retry/fila. Esperança e Sombra não precisam de campo no token para sobreviver à recarga, pois já persistem na ficha.
