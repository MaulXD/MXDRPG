# Auditoria de permissão das rotas API

Gerado em 21/11/2026. Escopo: todos os `app/api/**/route.ts`, todos os métodos exportados (GET, POST, PATCH, PUT, DELETE). Auditoria somente leitura; nenhum código alterado.

## Resumo

- Total de arquivos de rota: **100**
- Total de métodos/handlers: **119**
- Total de ALERTAS: **1**

## Caso solicitado: token PATCH

`app/api/room/[roomId]/tokens/[tokenId]/route.ts` PATCH: exige sessão via `getSession()`; sem sessão retorna `401` (`{ error: "Faça login" }`) antes de qualquer mutação. Com sessão, mestre usa `canApplyTokenConditions`; não-mestre só pode mexer em aparência própria (`imageUrl`, `imageFocus`, `nameplateMode`) e passa por `canMoveToken`. **Sem sessão não há escrita.**

## Tabelas por pasta

### `app/api/admin/adventures/[adventureId]/members`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`requireRole`) | 401/403 (throw/catch) | requireRole | não |  |
| `route.ts` | PATCH | sim (`requireRole`) | 401/403 (throw/catch) | requireRole | não |  |

### `app/api/admin/adventures`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`requireRole`) | 401/403 (throw/catch) | requireRole | não |  |

### `app/api/adventure/[adventureId]/monster-knowledge`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | canManageRoom, isGm/admin helper | não |  |

### `app/api/adventure/[adventureId]/my-bestiary`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/adventure/[adventureId]/player-bestiary`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | canManageRoom | não |  |

### `app/api/adventures/[adventureId]/edit-requests`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | canManageAdventure | não |  |

### `app/api/adventures/[adventureId]/inventory-requests`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | canManageAdventure | não |  |
| `route.ts` | PATCH | sim (`getSession`) | 401 | canManageAdventure | não |  |

### `app/api/adventures/[adventureId]/join-request`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/adventures/[adventureId]/join-requests/[id]/approve`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/adventures/[adventureId]/join-requests/[id]/reject`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/adventures/[adventureId]/join-requests`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | canManageAdventure | não |  |

### `app/api/adventures/[adventureId]/join-tokens`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | canManageAdventure | sim |  |

### `app/api/adventures/[adventureId]/members`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | isAdventureMember | não |  |

### `app/api/adventures/[adventureId]/my-edit-requests`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/adventures/[adventureId]/my-inventory-requests`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/adventures/[adventureId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | DELETE | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/adventures/join`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | ownerId check | sim |  |

### `app/api/adventures`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/auth/account`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | sim (`getSession`) | 401 | nenhuma detectada | sim |  |
| `route.ts` | DELETE | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/auth/login`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | não | - | admin role | sim |  |

### `app/api/auth/logout`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | não | - | nenhuma detectada | sim |  |

### `app/api/auth/me`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | erro (status não literal detectado) | nenhuma detectada | não |  |

### `app/api/auth/nickname`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/auth/oauth/[provider]/callback`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | não | - | nenhuma detectada | não |  |

### `app/api/auth/oauth/[provider]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | não | - | nenhuma detectada | sim |  |

### `app/api/auth/onboarding`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/auth/recover-password`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | não | - | nenhuma detectada | não |  |

### `app/api/auth/recovery-identity`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/auth/register`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | não | - | nenhuma detectada | sim |  |

### `app/api/bugs/report`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | nenhuma detectada | sim | ALERTA: grava sem exigir sessão (endpoint público; validar rate-limit/anti-spam) |

### `app/api/campaigns/join`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | ownerId check | sim |  |

### `app/api/campaigns`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/characters/[id]/edit-request/[requestId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | sim (`getSession`) | 401 | canManageAdventure | não |  |

### `app/api/characters/[id]/edit-request`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/characters/[id]/edit-save`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/characters/[id]/inventory-request/[requestId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | sim (`getSession`) | 401 | canManageAdventure | não |  |

### `app/api/characters/[id]/inventory-request`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | canManageAdventure | sim |  |

### `app/api/characters/[id]/level-up`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/characters/[id]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | canEditCharacterWithGrant (dono/grant/admin) | não |  |
| `route.ts` | PATCH | sim (`getSession`) | 401 | canEditCharacterWithGrant ou canEditCharacterPortrait; ownerInventoryAdditionBlocked | sim |  |
| `route.ts` | DELETE | sim (`getSession`) | 401 | deleteCharacterSheet (confirma nome + permissão interna) | sim |  |

### `app/api/characters/[id]/transfer`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | canManageRoom | não |  |

### `app/api/characters`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/compendium`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | canManageRoom | não |  |

### `app/api/friends/[friendId]/messages/read`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/friends/[friendId]/messages`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends/[friendId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | DELETE | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/friends/invite`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends/invites/[inviteId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | DELETE | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends/invites`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends/messages/unread`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends/requests/[requestId]/accept`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends/requests/[requestId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | DELETE | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends/requests`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/friends`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/health`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | não | - | nenhuma detectada | não |  |

### `app/api/notifications`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/actors/[actorId]/level-up`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | canEditRoomActor | sim |  |

### `app/api/room/[roomId]/actors/[actorId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | não | - | nenhuma detectada | não |  |
| `route.ts` | PATCH | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | canPatchRoomActorLoadout, canEditRoomActor | sim |  |

### `app/api/room/[roomId]/chat`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | canChatInRoomSession | sim |  |

### `app/api/room/[roomId]/combat/ability`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | assertTokenControl, canBypassCombatTurn | não |  |

### `app/api/room/[roomId]/combat/area`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | assertTokenControl, canBypassCombatTurn | não |  |

### `app/api/room/[roomId]/combat/attack`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | canManageRoom, assertTokenControl, canBypassCombatTurn | não |  |

### `app/api/room/[roomId]/combat/consume`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | assertTokenControl, canBypassCombatTurn | não |  |

### `app/api/room/[roomId]/combat/gm`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomManage`) | 401/403 via helper | requireRoomManage | não |  |

### `app/api/room/[roomId]/combat/next-turn`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | isRoomMember | não |  |

### `app/api/room/[roomId]/combat/roll-initiative`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomManage`) | 401/403 via helper | requireRoomManage | não |  |

### `app/api/room/[roomId]/culinary/meal`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | canParticipateInRoom | não |  |

### `app/api/room/[roomId]/events`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`requireRoomView`) | 401/403 via helper | requireRoomView | sim |  |

### `app/api/room/[roomId]/gm/actor-progress`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | canParticipateInRoom | não |  |

### `app/api/room/[roomId]/gm/creations/[id]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | sim (`requireRoomManage`) | 401/403 via helper | requireRoomManage | sim |  |
| `route.ts` | DELETE | sim (`requireRoomManage`) | 401/403 via helper | requireRoomManage | sim |  |

### `app/api/room/[roomId]/gm/creations`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomManage`) | 401/403 via helper | requireRoomManage | sim |  |

### `app/api/room/[roomId]/gm/saving-throw`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomView`) | 401/403 via helper | canManageRoom, requireRoomView | não |  |

### `app/api/room/[roomId]/ping`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | nenhuma detectada | sim |  |

### `app/api/room/[roomId]/presence`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`requireRoomView`) | 401/403 via helper | requireRoomView | não |  |
| `route.ts` | POST | sim (`requireRoomView`) | 401/403 via helper | requireRoomView | não |  |

### `app/api/room/[roomId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`requireRoomView`) | 401/403 via helper | requireRoomView | não |  |

### `app/api/room/[roomId]/scene`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | nenhuma detectada | sim |  |

### `app/api/room/[roomId]/settings`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | sim (`requireRoomManage`) | 401/403 via helper | requireRoomManage | sim |  |

### `app/api/room/[roomId]/sync-actors`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomView`) | 401/403 via helper | requireRoomView, isRoomMember | não |  |

### `app/api/room/[roomId]/tokens/[tokenId]/delegate`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | canManageRoom, canParticipateInRoomSession, canParticipateInRoom, characterOwnedBySessionUser, memberIdsHasUser, isGm/admin helper | sim |  |

### `app/api/room/[roomId]/tokens/[tokenId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | sim (`getSession`) | 401 | canMoveToken, canApplyTokenConditions, isGm/admin helper | sim |  |
| `route.ts` | DELETE | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | canRemoveTokenFromBoard | sim |  |

### `app/api/room/[roomId]/tokens/move`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | canParticipateInRoomSession, canParticipateInRoom, canMoveToken, canBypassCombatTurn | sim |  |

### `app/api/room/[roomId]/tokens/place-actor`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | canManageRoom, canPlaceRoomActorOnBoard | não |  |

### `app/api/room/[roomId]/tokens/place-tor-character`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | parcial (`getSession`; fluxo pode continuar sem sessão) | depende do fluxo | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tokens/reposition`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomMember`) | 401/403 via helper | canManageRoom, requireRoomMember | sim |  |

### `app/api/room/[roomId]/tokens/spawn-gm`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomSpawn`) | 403/404 via helper; sala demo pode aceitar usuário nulo | requireRoomSpawn | não |  |

### `app/api/room/[roomId]/tokens/spawn-tor-adversary`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomSpawn`) | 403/404 via helper; sala demo pode aceitar usuário nulo | requireRoomSpawn | não |  |

### `app/api/room/[roomId]/tokens/spawn`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`requireRoomSpawn`) | 403/404 via helper; sala demo pode aceitar usuário nulo | requireRoomSpawn | não |  |

### `app/api/room/[roomId]/tor-advance`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-eye`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-fatigue`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-hazard`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-helm`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-push`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-recovery`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-session`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | PATCH | sim (`requireRoomManage`) | 401/403 via helper | requireRoomManage | sim |  |

### `app/api/room/[roomId]/tor-shadow`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/room/[roomId]/tor-stance`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/room/[roomId]/tor-task`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | não |  |

### `app/api/tor-characters/[id]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |
| `route.ts` | PATCH | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/tor-characters`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | isAdventureMember | não |  |
| `route.ts` | POST | sim (`getSession`) | 401 | nenhuma detectada | sim |  |

### `app/api/users/[userId]`

| Rota | Método | Sessão | Sem sessão | Permissão | Grava | ALERTA |
|---|---|---|---|---|---|---|
| `route.ts` | GET | sim (`getSession`) | 401 | nenhuma detectada | não |  |

## ALERTAS (somente)

- `app/api/bugs/report/route.ts:9` (POST) — grava sem exigir sessão (endpoint público; validar rate-limit/anti-spam)

## Observações

- "Permissão" lista checks detectados por inspeção estática; ausência no relatório não prova ausência real, e presença não prova cobertura completa do recurso.
- "Grava" é heurística baseada em chamadas comuns (Prisma/DB/fs/store/sessão/revalidate). Rotas com efeitos indiretos podem exigir leitura manual.
- Endpoints públicos intencionais (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/health`) podem gravar estado esperado (sessão/cadastro/migração) sem sessão prévia; não foram marcados como ALERTA, mas permanecem listados nas tabelas.
